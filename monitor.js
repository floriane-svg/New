const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Configuration
const URLS = [
  'https://www.quintoandar.com.br/alugar/imovel/leblon-rio-de-janeiro-rj-brasil/de-500-a-3500-reais/apartamento/kitnet/1-quartos',
  'https://www.quintoandar.com.br/alugar/imovel/ilha-dos-caicaras-lagoa-rio-de-janeiro-rj-brasil/de-500-a-3500-reais/apartamento/kitnet/1-quartos'
];

const CHECK_INTERVAL = 60000; // 1 minute
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

let bot = null;
if (TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
}

const urlStates = {};
URLS.forEach(url => {
  urlStates[url] = {
    lastPhraseFound: null,
    lastChecked: null
  };
});

async function sendTelegramNotification(message) {
  if (!bot || !TELEGRAM_CHAT_ID) {
    console.log('⚠️ Telegram not configured. Message would have been:', message);
    return;
  }

  try {
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);
    console.log('📱 Telegram notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending Telegram notification:', error.message);
  }
}

async function checkURL(url) {
  try {
    console.log(`🔍 Checking: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 30000
    });

    const html = response.data.toLowerCase();
    const hasApartmentCard = html.includes('cozy__cardrow-container');

    const state = urlStates[url];
    const currentTime = new Date().toISOString();

    if (state.lastPhraseFound !== hasApartmentCard) {
      if (hasApartmentCard) {
        console.log('✅ APARTMENTS AVAILABLE! (card found)');
        if (state.lastPhraseFound === false) {
          await sendTelegramNotification(`🎉 GREAT NEWS! New apartments are now available!\n\nURL: ${url}`);
        }
      } else {
        console.log('❌ No apartments available (card not found)');
        if (state.lastPhraseFound === true) {
          await sendTelegramNotification(`🏠 QuintoAndar Update: Apartments are no longer available.\n\nURL: ${url}`);
        }
      }
      state.lastPhraseFound = hasApartmentCard;
    } else {
      console.log(`ℹ️ Status unchanged: ${hasApartmentCard ? 'Apartments available' : 'No apartments'}`);
    }

    state.lastChecked = currentTime;
  } catch (error) {
    console.error(`❌ Error checking ${url}:`, error.message);
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      await sendTelegramNotification(`⚠️ Error monitoring QuintoAndar: ${error.message}\n\nURL: ${url}`);
    }
  }
}

async function checkAllURLs() {
  console.log(`\n📅 ${new Date().toISOString()} - Starting check cycle`);
  for (const url of URLS) {
    await checkURL(url);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log('✅ Check cycle completed\n');
}

async function startMonitoring() {
  console.log('🚀 Starting QuintoAndar Monitor...');
  console.log(`📍 Monitoring ${URLS.length} URLs every ${CHECK_INTERVAL / 1000} seconds`);
  console.log(`🔍 Looking for apartment card: "cozy__cardrow-container"`);

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    console.log('📱 Telegram notifications: ENABLED');
    await sendTelegramNotification('🤖 QuintoAndar Monitor started! I will notify you when apartments become available.');
  } else {
    console.log('📱 Telegram notifications: DISABLED');
  }

  await checkAllURLs();
  setInterval(checkAllURLs, CHECK_INTERVAL);
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down QuintoAndar Monitor...');
  if (bot && TELEGRAM_CHAT_ID) {
    await sendTelegramNotification('🛑 QuintoAndar Monitor stopped.');
  }
  process.exit(0);
});

// 🔥 Route déclenchable via navigateur ou cron-job.org
app.get('/run', async (req, res) => {
  console.log('🌐 Route /run déclenchée');
  await checkAllURLs();
  res.send('✅ Vérification manuelle terminée');
});

// 🚀 Lancer le serveur Express
app.listen(3000, () => {
  console.log('🚀 Serveur Express lancé sur le port 3000');
});

// 🔁 Démarrer le monitoring automatique
startMonitoring().catch(error => {
  console.error('💥 Failed to start monitor:', error);
  process.exit(1);
});
