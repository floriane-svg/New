require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const Monitor = require('./monitor');

const PORT = process.env.PORT || 5000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ ERREUR: TELEGRAM_TOKEN et TELEGRAM_CHAT_ID doivent être définis dans les variables d\'environnement');
  process.exit(1);
}

const app = express();
const monitor = new Monitor(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID);

let isMonitoring = false;
let lastCheckTime = null;
let checksCount = 0;

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'QuintoAndar Monitor',
    lastCheck: lastCheckTime,
    totalChecks: checksCount,
    isMonitoring: isMonitoring,
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/check-now', async (req, res) => {
  if (isMonitoring) {
    return res.status(429).json({ 
      error: 'Une vérification est déjà en cours',
      lastCheck: lastCheckTime
    });
  }

  res.json({ 
    message: 'Vérification manuelle démarrée',
    timestamp: new Date().toISOString()
  });

  runMonitoringTask();
});

async function runMonitoringTask() {
  if (isMonitoring) {
    monitor.log('⏭️ Vérification ignorée - Une vérification est déjà en cours', 'warn');
    return;
  }

  isMonitoring = true;
  
  try {
    await monitor.runMonitoring();
    lastCheckTime = new Date().toISOString();
    checksCount++;
  } catch (error) {
    monitor.log(`❌ Erreur lors du monitoring: ${error.message}`, 'error');
  } finally {
    isMonitoring = false;
  }
}

cron.schedule('* * * * *', () => {
  monitor.log('⏰ Cron job déclenché - Démarrage de la vérification programmée');
  runMonitoringTask();
});

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log('\n' + '█'.repeat(60));
  console.log('🚀 QUINTOANDAR MONITOR - DÉMARRAGE');
  console.log('█'.repeat(60));
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`⏰ Surveillance: Toutes les minutes`);
  console.log(`🔍 Mot-clé surveillé: "${require('./config').keyword}"`);
  console.log('█'.repeat(60) + '\n');

  await monitor.sendStartupNotification();
  
  monitor.log('⏳ Première vérification dans 10 secondes...');
  setTimeout(() => {
    runMonitoringTask();
  }, 10000);
});

process.on('SIGTERM', () => {
  monitor.log('📴 Signal SIGTERM reçu - Arrêt gracieux du serveur...');
  server.close(() => {
    monitor.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  monitor.log('📴 Signal SIGINT reçu - Arrêt gracieux du serveur...');
  server.close(() => {
    monitor.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});
