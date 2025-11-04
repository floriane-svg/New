# QuintoAndar Monitor

## Vue d'ensemble
Système de monitoring automatique pour surveiller les annonces QuintoAndar toutes les minutes. Envoie des alertes Telegram lorsque le nombre d'annonces dépasse les seuils configurés.

## Architecture
- **Backend**: Node.js + Express
- **Scheduling**: node-cron (vérifications toutes les minutes)
- **HTTP Client**: axios avec retry et timeout
- **HTML Parsing**: cheerio pour validation
- **Alertes**: Telegram Bot API

## Fichiers Principaux
- `index.js`: Serveur Express + cron job
- `monitor.js`: Logique de monitoring et détection
- `config.js`: Configuration des URLs et seuils (MODIFIER ICI)
- `.env`: Variables d'environnement (tokens Telegram)

## URLs Surveillées
1. Ilha dos Caiçaras - Seuil: ≥1 annonce
2. Leblon - Seuil: ≥5 annonces

## Mot-clé Recherché
`Cozy__CardRow-Container` (insensible à la casse)

## Déploiement
Conçu pour être déployé sur Render (fichier `render.yaml` inclus).

## Dernières Modifications
- 2025-11-04: Création initiale du système de monitoring
- Détection ultra-robuste avec 4 tentatives maximum
- Validation de la complétude de la page HTML
- Rotation des User-Agents pour éviter les blocages
- Double vérification du comptage (split + regex)
