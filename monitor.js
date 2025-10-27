const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// === CONFIGURATION ===
const CONFIG = [
  {
    url: 'https://www.quintoandar.com.br/alugar/imovel/leblon-rio-de-janeiro-rj-brasil/de-500-a-3500-reais/apartamento/kitnet/1-quartos',
    label: 'Leblon',
    minCount: 5 // doit trouver 5 occurrences ou plus
  },
  {
    url: 'https://www.quintoandar.com.br/alugar/imovel/ilha-dos-caicaras-lagoa-rio-de-janeiro-rj-brasil/de-500-a-3500-reais/apartamento/kitnet/1-quartos',
    label: 'Ilha dos Caiçaras',
    minCount: 1 // doit trouver au moins 1 occurrence
  }
];

const CHECK_INTERVAL = 60000; // 1 minute
const RETRY_DELAY = 1500;
const MAX_RETRIES = 2;
const SEARCH_PHRASE = 'cozy__cardrow-container';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// === TELEGRAM ===
let bot = null;
if (TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
}

async function sendTelegramNotification(message) {
  if (!bot || !TELEGRAM_CHAT_ID) {
    console.log('⚠️ Telegram non configuré. Message aurait été :', message);
    return;
  }
  try {
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);
    console.log('📱 Notification Telegram envoyée');
  } catch (error) {
    console.error('❌ Erreur Telegram :', error.message);
  }
}

// === ÉTAT ===
const urlStates = {};
CONFIG.forEach(site => {
  urlStates[site.url] = { lastAboveThreshold: null, lastChecked: null, lastCount: 0 };
});

// === COMPTE LES OCCURRENCES ===
function countOccurrences(html, phrase) {
  const matches = html.match(new RegExp(phrase, 'g'));
  return matches ? matches.length : 0;
}

// === CHECK INDIVIDUEL ===
async function checkURL(site) {
  const { url, label, minCount } = site;
  let success = false;
  let count = 0;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔍 [${label}] Tentative ${attempt} sur ${url}`);
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 25000
      });
      const html = response.data.toLowerCase();
      count = countOccurrences(html, SEARCH_PHRASE);
      success = true;
      break;
    } catch (error) {
      console.error(`⚠️ [${label}] Erreur tentative ${attempt}: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Nouvelle tentative dans ${RETRY_DELAY / 1000}s...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
      }
    }
  }

  const state = urlStates[url];
  if (!success) {
    await sendTelegramNotification(`🚨 Impossible de vérifier ${label} après ${MAX_RETRIES} tentatives.\n${url}`);
    return;
  }

  const aboveThreshold = count >= minCount;
  console.log(`[monitor] ${count} occurrence(s) trouvée(s) sur ${label} (${aboveThreshold ? 'SEUIL ATTEINT ✅' : 'sous le seuil ❌'})`);

  // si l’état a changé
  if (state.lastAboveThreshold !== aboveThreshold) {
    if (aboveThreshold) {
      await sendTelegramNotification(
        `🏠 Alerte ${label} (${count} annonces détectées, seuil = ${minCount})\n${url}`
      );
    } else {
      await sendTelegramNotification(`📉 ${label}: le nombre d'annonces est retombé à ${count} (${minCount} requis)\n${url}`);
    }
    state.lastAboveThreshold = aboveThreshold;
  }

  state.lastChecked = new Date().toISOString();
  state.lastCount = count;
}

// === CHECK GLOBAL ===
async function checkAllURLs() {
  console.log(`\n📅 ${new Date().toISOString()} - Début du cycle`);
  for (const site of CONFIG) {
    await checkURL(site);
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('✅ Cycle terminé\n');
}

// === DÉMARRAGE ===
async function startMonitoring() {
  console.log('🚀 Démarrage du moniteur Render');
  console.log(`🔍 Mot-clé : "${SEARCH_PHRASE}"`);
  console.log(`⏰ Intervalle : ${CHECK_INTERVAL / 1000}s`);
  console.log(`📱 Notifications Telegram : ${bot ? 'activées' : 'désactivées'}`);

  if (bot && TELEGRAM_CHAT_ID) {
    await sendTelegramNotification('🤖 Moniteur Render démarré (avec seuils personnalisés).');
  }

  await checkAllURLs();
  setInterval(checkAllURLs, CHECK_INTERVAL);
}

// === ROUTE MANUELLE ===
app.get('/run', async (req, res) => {
  console.log('🌐 Route /run déclenchée');
  await checkAllURLs();
  res.send('✅ Vérification manuelle terminée');
});

// === ARRÊT PROPRE ===
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du moniteur...');
  if (bot && TELEGRAM_CHAT_ID) {
    await sendTelegramNotification('🛑 Moniteur Render arrêté.');
  }
  process.exit(0);
});

// === SERVEUR EXPRESS ===
app.listen(3000, () => console.log('🚀 Serveur Express lancé sur le port 3000'));
startMonitoring().catch(err => {
  console.error('💥 Échec du démarrage :', err);
  process.exit(1);
});
