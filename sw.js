// Service Worker – macht die App installierbar (Homescreen-Icon) und
// zeigt seit Session 37 Push-Erinnerungen an. Kein Offline-Caching der
// Daten, die kommen immer live von Supabase.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Einfach durchreichen – kein Caching der API-Aufrufe
});

// Push-Nachricht anzeigen. Inhalt kommt verschlüsselt von der Edge
// Function: { titel, text, tag, tab }
self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (_e) {
    d = { titel: "Dashboard", text: event.data ? event.data.text() : "" };
  }
  const optionen = {
    body: d.text || "",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    data: { tab: d.tab || "heute" },
  };
  // gleiche Erinnerung ersetzt die alte statt sich zu stapeln
  if (d.tag) { optionen.tag = d.tag; optionen.renotify = true; }
  event.waitUntil(self.registration.showNotification(d.titel || "Dashboard", optionen));
});

// Antippen: offene App nach vorne holen und den passenden Reiter zeigen,
// sonst die App neu öffnen
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const tab = (event.notification.data && event.notification.data.tab) || "heute";
  const ziel = new URL("index.html?tab=" + encodeURIComponent(tab), self.registration.scope).href;
  event.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of fenster) {
      if (c.url.startsWith(self.registration.scope) && "focus" in c) {
        c.postMessage({ typ: "push-tab", tab });
        return c.focus();
      }
    }
    return self.clients.openWindow(ziel);
  })());
});
