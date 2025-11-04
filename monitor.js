const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config');

class Monitor {
  constructor(telegramToken, telegramChatId) {
    this.telegramToken = telegramToken;
    this.telegramChatId = telegramChatId;
    this.telegramApi = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  }

  getRandomUserAgent() {
    return config.userAgents[Math.floor(Math.random() * config.userAgents.length)];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  async fetchPageWithRetry(url, retryCount = 0) {
    const userAgent = this.getRandomUserAgent();
    
    try {
      this.log(`Tentative ${retryCount + 1} de récupération de ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: config.monitoring.requestTimeout,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 300
      });

      const html = response.data;
      const htmlSize = html.length;
      
      this.log(`Page récupérée: ${htmlSize} caractères (${(htmlSize / 1024).toFixed(2)} KB)`);

      const $ = cheerio.load(html);
      const hasHtmlTag = $('html').length > 0;
      const hasBodyTag = $('body').length > 0;
      
      if (!hasHtmlTag || !hasBodyTag || htmlSize < 1000) {
        this.log(`⚠️ Page incomplète détectée - HTML: ${hasHtmlTag}, BODY: ${hasBodyTag}, Taille: ${htmlSize}`, 'warn');
        throw new Error('Page HTML incomplète ou trop petite');
      }

      this.log('✓ Page complète validée avec succès');
      return html;

    } catch (error) {
      this.log(`Erreur lors de la récupération (tentative ${retryCount + 1}): ${error.message}`, 'error');
      
      if (retryCount < config.monitoring.maxRetries) {
        const delay = config.monitoring.retryDelays[retryCount];
        this.log(`⏳ Nouvelle tentative dans ${delay}ms...`);
        await this.sleep(delay);
        return this.fetchPageWithRetry(url, retryCount + 1);
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
        const html = await this.fetchPageWithRetry(url, 0);
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
      `✅ Service démarré avec succès\n` +
      `⏱ Surveillance: Toutes les ${config.monitoring.intervalMinutes} minute(s)\n\n` +
      `📍 <b>URLs surveillées:</b>\n` +
      config.urls.map((u, i) => 
        `${i + 1}. ${u.name} (seuil: ≥${u.threshold})`
      ).join('\n') + 
      `\n\n🔍 Mot-clé: "${config.keyword}"`;
    
    await this.sendTelegramMessage(message);
  }

  async runMonitoring() {
    this.log('\n' + '█'.repeat(60));
    this.log('🏠 DÉMARRAGE DU MONITORING QUINTOANDAR');
    this.log('█'.repeat(60) + '\n');

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

    this.log('\n' + '█'.repeat(60));
    this.log('✅ MONITORING TERMINÉ');
    this.log('█'.repeat(60) + '\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = Monitor;
