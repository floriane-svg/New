const axios = require('axios');
const puppeteer = require('puppeteer');
const config = require('./config');

class Monitor {
  constructor(telegramToken, telegramChatId) {
    this.telegramToken = telegramToken;
    this.telegramChatId = telegramChatId;
    this.telegramApi = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    this.browser = null;
  }

  getRandomUserAgent() {
    return config.userAgents[Math.floor(Math.random() * config.userAgents.length)];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  async initBrowser() {
    if (this.browser) {
      return this.browser;
    }

    try {
      this.log('🌐 Initialisation du navigateur Puppeteer...');
      
      const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ];

      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                             process.env.CHROME_BIN || 
                             undefined;

      this.browser = await puppeteer.launch({
        headless: 'new',
        args: args,
        executablePath: executablePath
      });

      this.log('✅ Navigateur initialisé avec succès');
      return this.browser;
    } catch (error) {
      this.log(`❌ Erreur lors de l'initialisation du navigateur: ${error.message}`, 'error');
      throw error;
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.log('🔒 Navigateur fermé');
    }
  }

  async fetchPageWithPuppeteer(url, retryCount = 0) {
    const userAgent = this.getRandomUserAgent();
    let page = null;

    try {
      this.log(`Tentative ${retryCount + 1} avec Puppeteer sur ${url}`);
      this.log(`User-Agent: ${userAgent.substring(0, 50)}...`);

      const browser = await this.initBrowser();
      page = await browser.newPage();

      await page.setUserAgent(userAgent);
      
      await page.setViewport({ width: 1920, height: 1080 });

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      this.log('📡 Chargement de la page...');
      
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: config.monitoring.requestTimeout
      });

      this.log('⏳ Attente du chargement des annonces...');
      
      try {
        await page.waitForSelector('[class*="CardRow"]', { 
          timeout: 5000 
        });
        this.log('✅ Sélecteur CardRow détecté');
      } catch (e) {
        this.log('⚠️ Sélecteur CardRow non trouvé, continuation quand même', 'warn');
      }

      await page.waitForTimeout(2000);

      const html = await page.content();
      const htmlSize = html.length;
      
      this.log(`Page récupérée: ${htmlSize} caractères (${(htmlSize / 1024).toFixed(2)} KB)`);

      if (htmlSize < 10000) {
        throw new Error('Page HTML trop petite, probablement incomplète');
      }

      await page.close();
      
      this.log('✓ Page complète récupérée avec succès');
      return html;

    } catch (error) {
      if (page) {
        await page.close().catch(() => {});
      }

      this.log(`Erreur lors de la récupération (tentative ${retryCount + 1}): ${error.message}`, 'error');
      
      if (retryCount < config.monitoring.maxRetries) {
        const delay = config.monitoring.retryDelays[retryCount];
        this.log(`⏳ Nouvelle tentative dans ${delay}ms...`);
        await this.sleep(delay);
        return this.fetchPageWithPuppeteer(url, retryCount + 1);
      }
      
      throw new Error(`Échec après ${config.monitoring.maxRetries + 1} tentatives: ${error.message}`);
    }
  }

  countKeywordOccurrences(html, keyword) {
    const lowerHtml = html.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    
    const countBySplit = lowerHtml.split(lowerKeyword).length - 1;
    
    const regex = new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = html.match(regex);
    const countByRegex = matches ? matches.length : 0;
    
    this.log(`Méthode split: ${countBySplit} occurrences | Méthode regex: ${countByRegex} occurrences`);
    
    const finalCount = Math.max(countBySplit, countByRegex);
    
    if (countBySplit !== countByRegex) {
      this.log(`⚠️ Divergence détectée - Utilisation du maximum: ${finalCount}`, 'warn');
    }
    
    return finalCount;
  }

  async checkUrlWithRetries(urlConfig) {
    const { name, url, threshold } = urlConfig;
    
    this.log(`\n${'='.repeat(60)}`);
    this.log(`🔍 Vérification: ${name}`);
    this.log(`URL: ${url}`);
    this.log(`Seuil d'alerte: ${threshold}`);
    this.log(`${'='.repeat(60)}\n`);

    let lastCount = 0;
    let attempts = 0;
    const maxAttempts = config.monitoring.maxRetries + 1;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const html = await this.fetchPageWithPuppeteer(url, 0);
        const count = this.countKeywordOccurrences(html, config.keyword);
        
        this.log(`📊 Résultat tentative ${attempts}: ${count} occurrence(s) de "${config.keyword}"`);
        
        if (count > 0) {
          this.log(`✅ Mot-clé détecté avec succès!`);
          return count;
        }
        
        lastCount = count;
        
        if (attempts < maxAttempts) {
          const delay = config.monitoring.retryDelays[attempts - 1] || 5000;
          this.log(`⚠️ 0 occurrence trouvée - Nouvelle vérification dans ${delay}ms...`, 'warn');
          await this.sleep(delay);
        }
        
      } catch (error) {
        this.log(`❌ Erreur lors de la tentative ${attempts}: ${error.message}`, 'error');
        
        if (attempts < maxAttempts) {
          const delay = config.monitoring.retryDelays[attempts - 1] || 5000;
          await this.sleep(delay);
        }
      }
    }

    this.log(`ℹ️ Résultat final après ${maxAttempts} tentatives: ${lastCount} occurrence(s)`, 'info');
    return lastCount;
  }

  async sendTelegramMessage(text) {
    try {
      await axios.post(this.telegramApi, {
        chat_id: this.telegramChatId,
        text: text,
        parse_mode: 'HTML'
      });
      this.log('✉️ Message Telegram envoyé avec succès');
      return true;
    } catch (error) {
      this.log(`❌ Erreur lors de l'envoi du message Telegram: ${error.message}`, 'error');
      return false;
    }
  }

  async sendStartupNotification() {
    const message = `🚀 <b>QuintoAndar Monitor - Démarrage</b>\n\n` +
      `✅ Service démarré avec succès (Puppeteer)\n` +
      `⏱ Déclenché par cron externe sur /run\n\n` +
      `📍 <b>URLs surveillées:</b>\n` +
      config.urls.map((u, i) => 
        `${i + 1}. ${u.name} (seuil: ≥${u.threshold})`
      ).join('\n') + 
      `\n\n🔍 Mot-clé: "${config.keyword}"`;
    
    await this.sendTelegramMessage(message);
  }

  async runMonitoring() {
    this.log('\n' + '█'.repeat(60));
    this.log('🏠 DÉMARRAGE DU MONITORING QUINTOANDAR (PUPPETEER)');
    this.log('█'.repeat(60) + '\n');

    try {
      await this.initBrowser();

      for (const urlConfig of config.urls) {
        try {
          const count = await this.checkUrlWithRetries(urlConfig);
          
          if (count >= urlConfig.threshold) {
            const message = `🏠 <b>ALERTE ${urlConfig.name}</b>\n\n` +
              `📊 <b>${count}</b> annonce(s) détectée(s)\n` +
              `⚠️ Seuil dépassé (≥${urlConfig.threshold})\n\n` +
              `🔗 <a href="${urlConfig.url}">Voir les annonces</a>`;
            
            await this.sendTelegramMessage(message);
          } else {
            this.log(`ℹ️ Pas d'alerte pour ${urlConfig.name} (${count} < ${urlConfig.threshold})`);
          }
          
        } catch (error) {
          this.log(`❌ Erreur critique pour ${urlConfig.name}: ${error.message}`, 'error');
        }

        await this.sleep(2000);
      }
    } finally {
      await this.closeBrowser();
    }

    this.log('\n' + '█'.repeat(60));
    this.log('✅ MONITORING TERMINÉ');
    this.log('█'.repeat(60) + '\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = Monitor;
