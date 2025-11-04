# QuintoAndar Monitor

Système de surveillance automatique pour les annonces QuintoAndar avec alertes Telegram.

## 🎯 Fonctionnalités

- ✅ Endpoint `/run` pour déclenchement par cron externe
- ✅ Détection ultra-robuste du mot-clé avec multiples retries
- ✅ Extraction complète du code source HTML
- ✅ Rotation de User-Agents pour éviter les blocages
- ✅ Seuils d'alerte configurables
- ✅ Notifications Telegram au démarrage et lors des alertes
- ✅ Health check pour Render
- ✅ Compatible avec le plan gratuit de Render (réveillé par cron externe)

## 🚀 Déploiement sur Render

### 1. Créer un nouveau Web Service sur Render

1. Connectez votre repository GitHub à Render
2. Créez un nouveau "Web Service"
3. Configurez:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Oregon (US West) ou votre préférence
   - **Instance Type**: Free ou Starter

### 2. Configurer les variables d'environnement

Dans les paramètres de votre service Render, ajoutez:

- `TELEGRAM_TOKEN`: Votre token de bot Telegram
- `TELEGRAM_CHAT_ID`: Votre ID de chat Telegram
- `PORT`: 10000 (défini automatiquement par Render)

### 3. Obtenir vos identifiants Telegram

#### Token du Bot:
1. Parlez à [@BotFather](https://t.me/botfather) sur Telegram
2. Tapez `/newbot` et suivez les instructions
3. Copiez le token fourni

#### Chat ID:
1. Parlez à [@userinfobot](https://t.me/userinfobot) sur Telegram
2. Il vous donnera votre Chat ID

### 4. Configurer le Cron Externe

Pour réveiller votre service Render gratuit et déclencher les vérifications:

1. Utilisez un service de cron gratuit comme [cron-job.org](https://cron-job.org) ou [Easycron](https://www.easycron.com/)
2. Configurez une tâche pour appeler votre URL toutes les minutes:
   - URL: `https://votre-service.onrender.com/run`
   - Intervalle: Toutes les minutes
3. Le service se réveillera et effectuera la vérification à chaque appel

### 5. Déployer

Une fois configuré, Render déploiera automatiquement votre application.

## ⚙️ Configuration des Seuils

Pour modifier les seuils d'alerte, éditez le fichier `config.js`:

\`\`\`javascript
urls: [
  {
    name: 'Ilha dos Caiçaras',
    url: '...',
    threshold: 1  // ← Modifier ici
  },
  {
    name: 'Leblon',
    url: '...',
    threshold: 5  // ← Modifier ici
  }
]
\`\`\`

## 🔍 Endpoints Disponibles

- `GET /` - Statut du service
- `GET /health` - Health check pour Render
- `GET /run` - Endpoint pour cron externe (déclenche la vérification)
- `GET /check-now` - Déclencher une vérification manuelle

## 📊 Logs

Le système affiche des logs détaillés:
- Taille de chaque page téléchargée
- Nombre d'occurrences trouvées
- Statut de chaque tentative
- Messages Telegram envoyés

## 🛠️ Développement Local

\`\`\`bash
# Installer les dépendances
npm install

# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos tokens
nano .env

# Démarrer
npm start
\`\`\`

## 📝 Notes

- Le service est réveillé par un **cron externe** qui appelle `/run`
- Chaque vérification peut faire jusqu'à 4 tentatives pour garantir la détection
- Les User-Agents sont changés aléatoirement à chaque tentative pour éviter les blocages
- La page HTML est validée pour s'assurer qu'elle est complète
- Le mot-clé est recherché de manière insensible à la casse
- Compatible avec le plan gratuit de Render (qui s'endort après 15 min d'inactivité)

## 🔧 Dépannage

Si vous ne recevez pas d'alertes:
1. Vérifiez les logs dans Render
2. Testez manuellement avec `GET /check-now`
3. Vérifiez que les tokens Telegram sont corrects
4. Assurez-vous que le bot peut vous envoyer des messages

## 📄 Licence

ISC
