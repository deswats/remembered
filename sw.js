// Remembered Service Worker v2.0 — remembered.asia
var CACHE_NAME = 'remembered-v2';
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
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET')return;
  if(e.request.url.includes('supabase.co'))return;
  if(e.request.url.startsWith('chrome-extension://'))return;
  if(e.request.url.startsWith('blob:'))return;
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res&&res.status===200){
        var clone=res.clone();
        caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(cached){
        if(cached)return cached;
        if(e.request.mode==='navigate')return caches.match(OFFLINE_URL);
      });
    })
  );
});
