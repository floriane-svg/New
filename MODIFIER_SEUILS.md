# 📝 Comment Modifier les Seuils d'Alerte

## Fichier à Éditer : `config.js`

Pour changer les seuils d'alerte, éditez uniquement le fichier **`config.js`**.

## Instructions Simples

1. **Ouvrez le fichier `config.js`**

2. **Trouvez la section `urls`** (lignes 2-14) :

```javascript
urls: [
  {
    name: 'Ilha dos Caiçaras',
    url: '...',
    threshold: 1     // ← MODIFIER ICI
  },
  {
    name: 'Leblon',
    url: '...',
    threshold: 5     // ← MODIFIER ICI
  }
]
```

3. **Changez les valeurs `threshold`** :
   - `threshold: 1` = alerte à partir de 1 annonce
   - `threshold: 5` = alerte à partir de 5 annonces
   - etc.

4. **Sauvegardez le fichier**

5. **Sur Render** : Le redéploiement sera automatique après le push Git

6. **Sur Replit** : Redémarrez le workflow pour appliquer les changements

## Exemples

### Exemple 1 : Être alerté dès la première annonce partout
```javascript
{
  name: 'Ilha dos Caiçaras',
  threshold: 1
},
{
  name: 'Leblon',
  threshold: 1
}
```

### Exemple 2 : Être plus sélectif
```javascript
{
  name: 'Ilha dos Caiçaras',
  threshold: 3
},
{
  name: 'Leblon',
  threshold: 10
}
```

### Exemple 3 : Ne surveiller que Ilha dos Caiçaras
```javascript
{
  name: 'Ilha dos Caiçaras',
  threshold: 1
},
{
  name: 'Leblon',
  threshold: 999   // Jamais d'alerte
}
```

## Autres Paramètres Modifiables

Dans le même fichier `config.js`, vous pouvez aussi modifier :

### Fréquence des vérifications
```javascript
monitoring: {
  intervalMinutes: 1,    // ← Changer en 5 pour toutes les 5 minutes
  maxRetries: 3,         // Nombre de tentatives si 0 trouvé
  // ...
}
```

### Le mot-clé recherché
```javascript
keyword: 'Cozy__CardRow-Container',   // ← Modifier ici
```

## ⚠️ Important

- **Ne modifiez pas** les URLs sauf si QuintoAndar change sa structure
- **Respectez la syntaxe** : virgules, guillemets, accolades
- **Testez** après modification pour vérifier que tout fonctionne

## 🔍 Vérifier les Changements

Après modification, consultez les logs pour voir :
- Les nouveaux seuils appliqués
- Le nombre d'occurrences détectées
- Les alertes envoyées ou non selon les seuils
