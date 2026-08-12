// Minimaler Service Worker – sorgt nur dafür, dass die App als PWA
// installierbar ist (Homescreen-Icon). Kein echtes Offline-Caching
// der Aufgaben-Daten, da die immer live von Supabase kommen sollen.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Einfach durchreichen – kein Caching der API-Aufrufe
});
