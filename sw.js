// IOTEK — service worker : l'application s'ouvre même sans Internet
// v5 : pré-cache de tous les fichiers locaux (dont la traduction mado-i18n-v9.js et materiel.html),
//      filtrage des réponses valides, fallback correct par type de requête,
//      et nettoyage automatique des anciens caches pour éviter les versions périmées.
const C='iotek-v5',A=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','mado-i18n-v9.js','materiel.html'];
const EXT_RX=/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/;
// Pré-cache : un échec sur une ressource ne doit pas faire échouer toute l'installation.
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.allSettled(A.map(a=>c.add(a)))).then(()=>self.skipWaiting()));
});
// Mise à jour : supprime tous les caches des anciennes versions dès l'activation.
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  // Fichiers de l'app : réseau d'abord (les mises à jour arrivent vite), cache en secours.
  if(u.origin===location.origin){
    e.respondWith(
      fetch(e.request)
        .then(r=>{
          // On ne met en cache que les réponses valides (jamais les erreurs 404/5xx).
          if(r&&r.ok&&r.type==='basic'){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}
          return r;
        })
        .catch(()=>caches.match(e.request).then(m=>{
          if(m)return m;
          // La page d'accueil est le seul fallback valide pour une navigation.
          if(e.request.mode==='navigate')return caches.match('./');
          return Response.error();
        }))
    );
    return;
  }
  // Polices et bibliothèques CDN : cache d'abord, réseau en secours.
  if(EXT_RX.test(u.host)){
    e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{
      if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}
      return r;
    })));
    return;
  }
  // Supabase (données, photos) : jamais mis en cache ici.
});
