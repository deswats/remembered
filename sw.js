// Remembered Service Worker v3.11 — remembered.asia
var CACHE_NAME = 'remembered-v14';
var OFFLINE_URL = '/';
var ASSETS = ['/', '/index.html'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(c){return c.addAll(ASSETS).catch(function(){});})
      .then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET')return;
  if(e.request.url.includes('supabase.co'))return;
  if(e.request.url.startsWith('chrome-extension://'))return;
  if(e.request.url.startsWith('blob:'))return;

  // HTML/navigation requests: ALWAYS go to network first, never serve stale HTML
  if(e.request.mode==='navigate' || e.request.url.endsWith('.html') || e.request.url.endsWith('/')){
    e.respondWith(
      fetch(e.request, {cache:'no-store'}).then(function(res){
        if(res && res.status===200){
          var clone=res.clone();
          caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
        }
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(cached){
          return cached || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // Other assets: network first, cache fallback
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && res.status===200){
        var clone=res.clone();
        caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
      }
      return res;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
