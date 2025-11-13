# 🚀 Guide de Déploiement sur Render (avec Puppeteer)

## ⚡ Pourquoi Puppeteer ?

Ce système utilise **Puppeteer** (navigateur Chrome headless) pour :
- ✅ Charger le JavaScript complet de la page
- ✅ Détecter les nouvelles annonces **instantanément**
- ✅ Voir exactement ce qu'un utilisateur réel verrait
- ✅ Pas de délai de détection

## Étapes Rapides

### 1. Créer un Web Service sur Render

1. Allez sur [render.com](https://render.com) et connectez-vous
2. Cliquez sur "New +" → "Web Service"
3. Connectez votre repository GitHub
4. Sélectionnez ce projet

### 2. Configuration du Service

Utilisez ces paramètres :

- **Name**: `quintoandar-monitor` (ou votre choix)
- **Region**: Oregon (US West) ou votre préférence
- **Branch**: `main`
- **Build Command**: `npm install && npx puppeteer browsers install chrome`
- **Start Command**: `npm start`
- **Instance Type**: Free (ou Starter pour plus de fiabilité)

### 3. Variables d'Environnement

Ajoutez ces variables dans l'onglet "Environment" :

| Clé | Valeur |
|-----|--------|
| `TELEGRAM_TOKEN` | Votre token de bot (ex: 123456789:ABCdef...) |
| `TELEGRAM_CHAT_ID` | Votre chat ID (ex: 123456789) |
| `PORT` | 10000 |
| `PUPPETEER_CACHE_DIR` | /opt/render/.cache/puppeteer |

⚠️ **Important** : Ne partagez jamais ces tokens publiquement !

### 4. Configurer le Cron Externe

⚠️ **Important** : Le plan gratuit de Render met votre service en veille après 15 minutes d'inactivité. Pour le réveiller automatiquement toutes les minutes, vous devez configurer un cron externe.

**Services de cron gratuits recommandés :**
- [cron-job.org](https://cron-job.org) (gratuit, fiable)
- [Easycron](https://www.easycron.com/) (gratuit)
- [UptimeRobot](https://uptimerobot.com/) (gratuit)

**Configuration du cron :**
1. Inscrivez-vous sur un de ces services
2. Créez une nouvelle tâche/job
3. URL à appeler : `https://votre-service.onrender.com/run`
4. Intervalle : **Toutes les minutes** (ou selon vos besoins)
5. Méthode : GET

**Exemple avec cron-job.org :**
- Title: QuintoAndar Monitor
- URL: `https://new-ywzk.onrender.com/run`
- Schedule: `* * * * *` (toutes les minutes)
- Enabled: Yes

### 5. Déployer

Cliquez sur "Create Web Service". Render va :
1. Installer les dépendances
2. Démarrer votre application
3. Vous envoyer une notification Telegram de démarrage
4. Attendre les appels du cron externe sur `/run` pour effectuer les vérifications

## ✅ Vérification

Une fois déployé, vous devriez :
- Recevoir une notification Telegram de démarrage
- Voir l'URL de votre service (ex: `https://quintoandar-monitor.onrender.com`)
- Pouvoir visiter `/health` pour vérifier le statut

## 📊 Surveillance

- **Logs** : Consultez les logs dans le dashboard Render
- **Health Check** : Render vérifie automatiquement `/health`
- **Cron externe** : Appelle `/run` pour déclencher les vérifications
- **Alertes** : Vous recevrez des messages Telegram quand les seuils sont dépassés

## 🔄 Fonctionnement

1. Le cron externe appelle `https://votre-service.onrender.com/run` toutes les minutes
2. Render réveille le service (s'il était endormi)
3. Le service vérifie les 2 URLs avec retries
4. Si le nombre d'annonces dépasse les seuils, vous recevez un message Telegram
5. Le service se rendort après 15 min d'inactivité (plan gratuit)

## ⚙️ Modifier les Seuils

Pour changer les seuils d'alerte :

1. Éditez `config.js` dans votre repository
2. Modifiez les valeurs `threshold`:
   ```javascript
   {
     name: 'Ilha dos Caiçaras',
     threshold: 1  // ← Changez ici
   },
   {
     name: 'Leblon',
     threshold: 5  // ← Changez ici
   }
   ```
3. Commit et push les changements
4. Render redéploiera automatiquement

## 🔧 Dépannage

**Pas de notification de démarrage ?**
- Vérifiez les tokens Telegram dans les variables d'environnement
- Consultez les logs Render pour voir les erreurs

**Le service s'arrête ?**
- Le plan Free de Render s'arrête après 15 min d'inactivité
- Le health check le réveillera automatiquement
- Utilisez un plan payant pour une surveillance 24/7

**Pas d'alertes ?**
- Consultez les logs pour voir les comptages
- Le système fait 4 tentatives avant d'abandonner
- Vérifiez que les URLs sont correctes

## 📞 Support

Pour toute question, consultez les logs détaillés dans le dashboard Render.
