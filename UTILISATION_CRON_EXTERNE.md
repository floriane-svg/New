# 🔄 Configuration du Cron Externe pour Render

## Pourquoi un cron externe ?

Le plan **gratuit de Render** met automatiquement votre service en veille après **15 minutes** d'inactivité. Un cron externe réveille votre service toutes les minutes en appelant l'endpoint `/run`.

## ⚙️ Configuration Rapide

Votre URL Render : `https://new-ywzk.onrender.com/run`

### 1️⃣ Utiliser cron-job.org (Recommandé)

**C'est gratuit et très simple :**

1. Allez sur [cron-job.org](https://cron-job.org)
2. Créez un compte gratuit
3. Cliquez sur **"Create cronjob"**
4. Configurez :
   - **Title**: QuintoAndar Monitor
   - **URL**: `https://new-ywzk.onrender.com/run`
   - **Schedule**:
     - Every: `1` minute
     - Ou pattern: `* * * * *`
   - **Save**

✅ C'est tout ! Votre service sera appelé toutes les minutes.

### 2️⃣ Utiliser UptimeRobot

1. Allez sur [UptimeRobot](https://uptimerobot.com/)
2. Créez un compte gratuit
3. Cliquez sur **"Add New Monitor"**
4. Configurez :
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: QuintoAndar Monitor
   - **URL**: `https://new-ywzk.onrender.com/run`
   - **Monitoring Interval**: 5 minutes (gratuit) ou 1 minute (plan payant)
   - **Monitor Timeout**: 30 secondes

### 3️⃣ Utiliser Easycron

1. Allez sur [Easycron](https://www.easycron.com/)
2. Créez un compte gratuit
3. Cliquez sur **"Create Cron Job"**
4. Configurez :
   - **URL**: `https://new-ywzk.onrender.com/run`
   - **Cron Expression**: `* * * * *`
   - **Name**: QuintoAndar Monitor

## 📊 Vérification

Après configuration, vous pouvez vérifier que tout fonctionne :

### Dans les logs Render :
```
🔍 Vérification: Ilha dos Caiçaras
📊 Résultat tentative 1: X occurrence(s)
✅ Mot-clé détecté avec succès!
```

### Via l'endpoint status :
Visitez : `https://new-ywzk.onrender.com/`

Vous verrez :
```json
{
  "status": "running",
  "service": "QuintoAndar Monitor",
  "lastCheck": "2025-11-04T22:26:44.326Z",
  "totalChecks": 15,
  "isMonitoring": false,
  "uptime": 3600
}
```

## 🎯 Fonctionnement

```
┌──────────────┐
│ Cron externe │  Toutes les minutes
│  (cron-job)  │──────────────┐
└──────────────┘              │
                              ▼
┌──────────────────────────────────────┐
│  Render (plan gratuit)               │
│  https://new-ywzk.onrender.com/run   │
│                                      │
│  1. Se réveille (si endormi)         │
│  2. Vérifie les 2 URLs QuintoAndar   │
│  3. Compte les occurrences (4 retry) │
│  4. Envoie alerte si seuil dépassé   │
│  5. Se rendort après 15 min          │
└──────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────┐
│          Telegram                    │
│  Alertes uniquement si :             │
│  - Ilha dos Caiçaras ≥ 1 annonce     │
│  - Leblon ≥ 5 annonces               │
└──────────────────────────────────────┘
```

## ⚡ Conseils

1. **Vérifiez les logs** : Les premiers jours, consultez régulièrement les logs Render pour vous assurer que tout fonctionne

2. **Notifications Telegram** :
   - Vous recevrez une notification au démarrage du service
   - Puis uniquement quand les seuils sont dépassés

3. **Ajustez la fréquence** :
   - Toutes les minutes = surveillance maximale (recommandé)
   - Toutes les 5 minutes = économie de ressources
   - Toutes les 10 minutes = surveillance légère

4. **Surveillez votre quota** : Le plan gratuit de Render a des limites mensuelles. Si vous dépassez, le service s'arrêtera jusqu'au mois prochain.

## 🔧 Dépannage

**Le service ne se réveille pas ?**
- Vérifiez que l'URL du cron est correcte
- Consultez les logs du cron pour voir s'il appelle bien l'endpoint
- Vérifiez que Render n'a pas désactivé votre service

**Pas d'alertes Telegram ?**
- Les seuils ne sont peut-être pas atteints
- Vérifiez les logs Render pour voir les comptages
- Testez manuellement : `curl https://new-ywzk.onrender.com/run`

**Trop de requêtes ?**
- Réduisez la fréquence du cron (toutes les 5 min au lieu de 1 min)
- Vérifiez que le cron n'est pas configuré en double

## 📞 Support

Pour toute question, consultez les logs détaillés dans :
- Dashboard Render : Section "Logs"
- Service cron : Historique des appels
- Telegram : Historique des messages du bot
