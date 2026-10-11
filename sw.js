// IOTEK — service worker : l'application s'ouvre même sans Internet
const C='iotek-v3',A=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin===location.origin){
    // fichiers de l'app : réseau d'abord (les mises à jour arrivent vite), cache en secours
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('./'))));
    return;
  }
  if(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(u.host)){
    e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r})));
  }
  // Supabase (données, photos) : jamais mis en cache ici
});
