const C="jayhl-v2";
const CORE=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("jayhl-")&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin!==location.origin)return; // Bybit podatki vedno sveži, nikoli iz cache
  if(r.mode==="navigate"){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put("index.html",cp));return res;}).catch(()=>caches.match("index.html")));return;}
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;})));});
// Klik na obvestilo: odpri (ali pokaži) Jay HL Screener
self.addEventListener("notificationclick",e=>{e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{for(const c of cs){if(c.url.includes("/jay/")&&"focus" in c)return c.focus();}return self.clients.openWindow("./");}));});
