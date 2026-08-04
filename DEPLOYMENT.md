# Déployer Sitenrp avec Cloudflare Workers + D1

## 🚀 Configuration rapide

### 1. **Récupérer l'ID de ta D1**
```bash
wrangler d1 list
```
Tu verras quelque chose comme :
```
┌───────────┬────────────────────────────┐
│ name      │ id                         │
├───────────┼────────────────────────────┤
│ sitenrp   │ xxxxxxxx-xxxx-xxxx-xxxx-xx │
└───────────┴────────────────────────────┘
```

### 2. **Mettre à jour `wrangler.toml`**
Remplace `database_id` par l'ID de ta D1 :
```toml
[[d1_databases]]
binding = "DB"
database_name = "sitenrp"
database_id = "METS_TON_ID_ICI"
```

### 3. **Déployer le Worker**
```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

### 4. **Récupérer l'URL du Worker**
Après le déploiement, tu verras :
```
✨ Deployed to https://sitenrp-worker.username.workers.dev
```

### 5. **Mettre à jour `app.js`**
Au début du fichier `app.js`, remplace :
```javascript
const API_BASE = 'https://YOUR_WORKER_URL.workers.dev/api';
```

Par ton URL :
```javascript
const API_BASE = 'https://sitenrp-worker.username.workers.dev/api';
```

### 6. **Déployer Pages**
Push sur GitHub et Cloudflare Pages déploiera automatiquement !

## ✅ C'est fait !

Maintenant :
- ✅ Les utilisateurs se créent dans **D1**
- ✅ Les rapports se sauvegardent dans **D1**
- ✅ **Tous les utilisateurs voient les mêmes données**
- ✅ Pas de serveur à maintenir

## 🔧 Troubleshooting

### Erreur "Database not found"
- Vérifier l'ID de ta D1 dans `wrangler.toml`
- Relancer : `wrangler deploy`

### Endpoint 404
- Vérifier que `API_BASE` dans `app.js` est correct
- Vérifier que le Worker est déployé

### Les données ne se sauvegardent pas
- Ouvrir la console du navigateur (F12)
- Vérifier les erreurs réseau
