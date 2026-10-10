/* KM Studio - service worker
   Cache della shell: sito e app si aprono anche senza rete.
   Cambia CACHE a ogni pubblicazione per forzare l'aggiornamento. */
const CACHE = "km-studio-v12";
const SHELL = ["/", "/index.html", "/app.html", "/manifest.webmanifest", "/favicon.svg",
  "/favicon-32.png", "/assets/icon-192.png", "/assets/icon-512.png", "/assets/apple-touch-icon.png",
  "/assets/js/gsap.min.js", "/assets/js/ScrollTrigger.min.js", "/assets/js/lenis.min.js", "/assets/img/kone.webp",
  "/assets/img/logo-km.webp", "/assets/img/logo-km-720.webp", "/assets/img/logo-km-160.webp"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k =>
    Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
/* sito o app? /app e /coach aprono l'app, il resto il sito */
const pageFor = url => {
  const p = new URL(url).pathname;
  if (/^\/(app|coach)(\/|\.html)?/.test(p)) return "/app.html";
  if (p === "/" || p === "/index.html") return "/index.html";
  return p; /* pagine SEO (es. /massaggi-milano/): ognuna in cache con il suo indirizzo */
};
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  if (r.mode === "navigate") {
    const key = pageFor(r.url);
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key).then(hit => hit || caches.match("/index.html"))));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok && new URL(r.url).origin === location.origin) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(r, copy));
    }
    return res;
  }).catch(() => hit)));
});
