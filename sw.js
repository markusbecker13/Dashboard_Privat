// Service Worker – macht die App installierbar (Homescreen-Icon), zeigt seit
// Session 37 Push-Erinnerungen an und hält seit Session 86 die App-Dateien
// (Seite, Skripte, Stile, Schriften, Icons) für den Start ohne Netz bereit.
// Die Daten selbst (Aufrufe an Supabase) werden NICHT zwischengespeichert,
// sie kommen immer live. Für die Notfallkarte ohne Netz legt die App selbst
// eine Kopie im Gerätespeicher ab (siehe app.js, „Notfallordner“).

const CACHE = "dashboard-app-v1";
const VORAB = ["index.html", "app.js?v=86", "style.css?v=83", "lernhilfe.css?v=84", "qrcode.js?v=1", "farbschema.js", "manifest.json", "icons/icon-192.png"];
// Nach so vielen Millisekunden ohne Antwort gilt die Zwischenkopie (nur wenn es eine gibt)
const NETZ_GEDULD_MS = 5000;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      const c = await caches.open(CACHE);
      // Einzeln, damit eine fehlende Datei nicht alles verhindert
      await Promise.all(VORAB.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})));
    } catch (_e) { /* ohne Zwischenspeicher läuft die App wie bisher */ }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const namen = await caches.keys();
      await Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
    } catch (_e) { /* egal */ }
    await self.clients.claim();
  })());
});

// Schlüssel im Zwischenspeicher: Seitenaufrufe immer unter index.html (ohne ?code=…/?tab=…)
function schluessel(req) {
  if (req.mode === "navigate") return new URL("index.html", self.registration.scope).href;
  return req.url;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, Google, Wetter: unberührt
  if (req.headers.has("range")) return;            // Teilabrufe (z. B. Medien) unberührt

  event.respondWith((async () => {
    const key = schluessel(req);
    const netz = fetch(req).then(async (res) => {
      if (res && res.ok && res.type === "basic") {
        try {
          const c = await caches.open(CACHE);
          // Frühere Fassung derselben Datei (anderes ?v=) entfernen
          if (req.mode !== "navigate") {
            for (const k of await c.keys()) {
              const ku = new URL(k.url);
              if (ku.pathname === url.pathname && k.url !== key) await c.delete(k);
            }
          }
          await c.put(key, res.clone());
        } catch (_e) { /* Zwischenspeicher voll oder gesperrt */ }
      }
      return res;
    });
    netz.catch(() => {}); // Fehler wird unten behandelt; hier nur keine unbehandelte Ablehnung melden
    // Netz zuerst; fällt es aus (oder antwortet zu langsam), kommt die Zwischenkopie
    const kopie = async () => {
      const c = await caches.open(CACHE);
      return (await c.match(key)) || (req.mode === "navigate" ? await c.match(new URL("index.html", self.registration.scope).href) : undefined);
    };
    try {
      const gespeichert = await kopie();
      if (!gespeichert) return await netz;
      const frist = new Promise((_ok, nein) => setTimeout(() => nein(new Error("langsam")), NETZ_GEDULD_MS));
      return await Promise.race([netz, frist]);
    } catch (_e) {
      const k = await kopie();
      if (k) return k;
      return await netz; // keine Kopie: Fehler wie bisher durchreichen
    }
  })());
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
