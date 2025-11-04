# QuintoAndar Monitor

## Vue d'ensemble
Système de monitoring pour surveiller les annonces QuintoAndar. Déclenché par un cron externe toutes les minutes. Envoie des alertes Telegram lorsque le nombre d'annonces dépasse les seuils configurés.

## Architecture
- **Backend**: Node.js + Express
- **Scheduling**: Cron externe (appelle `/run`)
- **HTTP Client**: axios avec retry et timeout
- **HTML Parsing**: cheerio pour validation
- **Alertes**: Telegram Bot API

## Fichiers Principaux
- `index.js`: Serveur Express avec endpoint `/run`
- `monitor.js`: Logique de monitoring et détection ultra-robuste
- `config.js`: Configuration des URLs et seuils (👈 MODIFIER ICI)
- `render.yaml`: Configuration pour déploiement Render
- `UTILISATION_CRON_EXTERNE.md`: Guide complet pour le cron externe

## URLs Surveillées
1. Ilha dos Caiçaras - Seuil: ≥1 annonce
2. Leblon - Seuil: ≥5 annonces

## Mot-clé Recherché
`Cozy__CardRow-Container` (insensible à la casse)

## Déploiement
- Conçu pour Render (plan gratuit)
- Réveillé par cron externe : https://new-ywzk.onrender.com/run
- Services recommandés : cron-job.org, UptimeRobot, Easycron

## Endpoints
- `GET /` - Statut du service
- `GET /health` - Health check
- `GET /run` - Déclenche la vérification (appelé par cron externe)
- `GET /check-now` - Vérification manuelle

## Dernières Modifications
- 2025-11-04: Création initiale du système de monitoring
- 2025-11-04: Adaptation pour cron externe Render (plan gratuit)
  - Suppression du cron interne
  - Ajout de l'endpoint `/run`
  - Optimisation pour réveil/endormissement Render
- Détection ultra-robuste avec 4 tentatives maximum
- Rotation des User-Agents à chaque tentative
- Validation de la complétude de la page HTML
- Double vérification du comptage (split + regex)
