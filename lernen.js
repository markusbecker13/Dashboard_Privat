// ============================================================
// Kinderseite der Lernhilfe (seit Session 82, Etappe 3) – lernen.html
// Spricht nur mit der Edge Function lernen-api (nicht mit dem Dashboard).
// Anmeldung: QR-Schlüssel aus dem #-Teil der Adresse, danach im Gerät
// gemerkt (localStorage „lern-zugang“) und aus der Adresse entfernt.
// Bewertet wird auf dem Server; die Seite kennt die Lösung erst nach
// der Antwort. Gebaut wird nur mit DOM-Methoden (kein innerHTML), damit
// Texte aus Übungen nie als HTML ausgeführt werden.
// ============================================================
"use strict";
(() => {
  const API = "https://juxoxltaeugsmtvirfcm.supabase.co/functions/v1/lernen-api";
  const ZUGANG = "lern-zugang";   // localStorage: QR-Schlüssel dieses Geräts
  const LAUF = "lern-lauf";       // sessionStorage: laufende Übung (Neu laden mitten drin)
  const FARBEN = { rot: "#d64545", orange: "#d9731f", gelb: "#c99700", gruen: "#2f9e6f",
    tuerkis: "#1a9aa0", blau: "#2a5bd7", lila: "#8b5fd9", pink: "#d6457f" };
  const STERNE_JE_STICKER = 3;   // wie in lernen-api
  const LOB = ["Super!", "Klasse!", "Toll gemacht!", "Richtig!", "Prima!", "Stark!"];
  const app = document.getElementById("app");

  // ---------- Speicher (kann im privaten Modus fehlen) ----------
  function lies(ort, k) { try { return window[ort].getItem(k); } catch (_e) { return null; } }
  function schreib(ort, k, v) { try { if (v === null) window[ort].removeItem(k); else window[ort].setItem(k, v); } catch (_e) { /* egal */ } }

  let schluessel = null;
  let uebersicht = null;   // Antwort von „uebersicht“
  let fachWahl = null;     // gewähltes Fach (id) oder null
  let lauf = null;         // laufende Übung
  let neuZeichnen = () => {};

  // ---------- Schlüssel aus der Adresse holen ----------
  function zugangAusAdresse() {
    const m = /(?:^#|&)z=([A-Za-z0-9_-]{43})(?:&|$)/.exec(location.hash || "");
    if (m) {
      schluessel = m[1];
      schreib("localStorage", ZUGANG, m[1]);
      // Neuer Schlüssel = evtl. anderes Kind: alte laufende Übung vergessen
      schreib("sessionStorage", LAUF, null);
    }
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    if (!schluessel) schluessel = lies("localStorage", ZUGANG);
  }
  function zugangVergessen() {
    schluessel = null;
    schreib("localStorage", ZUGANG, null);
    schreib("sessionStorage", LAUF, null);
  }

  // ---------- Server ----------
  async function api(action, daten = {}) {
    let res;
    try {
      res = await fetch(API, {
        method: "POST", cache: "no-store", referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, schluessel, ...daten }),
      });
    } catch (_e) {
      const f = new Error("Keine Verbindung. Ist das Internet an?");
      f.netz = true;
      throw f;
    }
    let d = {};
    try { d = await res.json(); } catch (_e) { /* leer */ }
    if (!res.ok) {
      const f = new Error(d.error || "Da ist etwas schiefgegangen. Bitte gleich noch einmal probieren.");
      f.status = res.status;
      if (d.abgemeldet) { f.abgemeldet = true; zugangVergessen(); }
      throw f;
    }
    return d;
  }

  // ---------- DOM-Helfer ----------
  function h(tag, props, ...kinder) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "farbe") el.style.setProperty("--fach", v);
        else if (k === "vars") for (const [vk, vv] of Object.entries(v)) el.style.setProperty(vk, vv);
        else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : String(v));
      }
    }
    for (const c of kinder.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : String(c));
    }
    return el;
  }
  function zeige(...knoten) {
    if ("speechSynthesis" in window) { try { speechSynthesis.cancel(); } catch (_e) { /* egal */ } }
    app.replaceChildren(...knoten.flat().filter(Boolean));
    window.scrollTo(0, 0);
    const titel = app.querySelector("h1, h2");
    if (titel) { titel.setAttribute("tabindex", "-1"); titel.focus({ preventScroll: true }); }
  }
  const fachFarbe = (fach) => FARBEN[fach && fach.farbe] || FARBEN.blau;
  const fachVon = (id) => ((uebersicht && uebersicht.faecher) || []).find((f) => f.id === id) || null;
  const istEnglisch = (fach) => /englisch|english/i.test((fach && fach.name) || "");
  const zufall = (liste) => liste[Math.floor(Math.random() * liste.length)];
  const sterneText = (n, max = 3) => "★".repeat(n) + "☆".repeat(Math.max(0, max - n));

  // ---------- Vorlesen: nur Stimmen, die auf dem Gerät laufen ----------
  // Online-Stimmen (localService = false) würden den Text an einen fremden
  // Dienst schicken – die nehmen wir nicht. Gibt es keine Gerätestimme,
  // erscheint kein Vorlese-Knopf.
  let stimmen = [];
  function stimmenLaden() {
    if (!("speechSynthesis" in window)) return;
    const vorher = stimmen.length;
    try { stimmen = speechSynthesis.getVoices().filter((s) => s.localService); } catch (_e) { stimmen = []; }
    if (stimmen.length !== vorher) neuZeichnen();
  }
  function stimme(sprache) {
    const passend = stimmen.filter((s) => (s.lang || "").toLowerCase().replace("_", "-").startsWith(sprache));
    return passend.find((s) => s.default) || passend[0] || null;
  }
  const kannVorlesen = () => !!stimme("de");
  // teile: [[text, sprache], …]
  function vorlesen(teile, knopf) {
    if (!("speechSynthesis" in window)) return;
    if (knopf && knopf.classList.contains("spricht")) { speechSynthesis.cancel(); return; }
    speechSynthesis.cancel();
    const liste = teile.filter(([t]) => t && String(t).trim());
    liste.forEach(([text, sprache], i) => {
      const s = stimme(sprache) || stimme("de");
      if (!s) return;
      const u = new SpeechSynthesisUtterance(String(text));
      u.voice = s; u.lang = s.lang; u.rate = 0.9;
      if (knopf && i === 0) u.onstart = () => knopf.classList.add("spricht");
      if (knopf && i === liste.length - 1) { u.onend = u.onerror = () => knopf.classList.remove("spricht"); }
      speechSynthesis.speak(u);
    });
  }
  function vorleseKnopf(teile) {
    if (!kannVorlesen()) return null;
    const k = h("button", { type: "button", class: "lk-vorlesen", "aria-label": "Vorlesen", title: "Vorlesen" }, "🔊");
    k.addEventListener("click", () => vorlesen(typeof teile === "function" ? teile() : teile, k));
    return k;
  }

  // ---------- Bildschirme ----------
  function zeigeKeinZugang(text) {
    neuZeichnen = () => zeigeKeinZugang(text);
    zeige(h("div", { class: "lk-leer" },
      h("span", { class: "lk-leer-symbol", "aria-hidden": "true" }, "🔑"),
      h("h1", { class: "lk-start-titel", text: "Hier fehlt dein Zugang" }),
      h("p", { text: text || "Bitte den QR-Code noch einmal scannen." })));
  }

  function zeigeFehler(e, nochmal) {
    if (e && e.abgemeldet) { zeigeKeinZugang(e.message); return; }
    neuZeichnen = () => zeigeFehler(e, nochmal);
    zeige(h("div", { class: "lk-leer" },
      h("span", { class: "lk-leer-symbol", "aria-hidden": "true" }, e && e.netz ? "📡" : "🙈"),
      h("h1", { text: "Ups!" }),
      h("p", { text: (e && e.message) || "Da ist etwas schiefgegangen." }),
      h("button", { type: "button", class: "lk-knopf", onclick: nochmal }, "Nochmal versuchen")));
  }

  async function ladeUebersicht(danach) {
    neuZeichnen = () => {};
    app.replaceChildren(h("p", { class: "lk-laden", text: "Einen Moment …" }));
    try {
      uebersicht = await api("uebersicht");
    } catch (e) {
      zeigeFehler(e, () => ladeUebersicht(danach));
      return;
    }
    if (fachWahl && !fachVon(fachWahl)) fachWahl = null;
    if (typeof danach === "function") danach();
    else zeigeUebersicht();
  }

  function uebungenVon(fachId) {
    return uebersicht.uebungen.filter((u) => u.fach_id === fachId).sort((a, b) => {
      // Fällige zuerst (früheste oben), dann neue, dann zuletzt freigegebene
      const fa = a.faellig_am && !a.durchlaeufe ? a.faellig_am : "9999", fb = b.faellig_am && !b.durchlaeufe ? b.faellig_am : "9999";
      if (fa !== fb) return fa < fb ? -1 : 1;
      if (a.neu !== b.neu) return a.neu ? -1 : 1;
      return String(b.freigegeben_am || "").localeCompare(String(a.freigegeben_am || ""));
    });
  }

  function faelligText(datum) {
    const d = new Date(datum + "T12:00:00");
    if (isNaN(d)) return null;
    const heute = new Date(); heute.setHours(12, 0, 0, 0);
    const tage = Math.round((d - heute) / 86400000);
    if (tage < 0) return "📅 schon fällig";
    if (tage === 0) return "📅 bis heute";
    if (tage === 1) return "📅 bis morgen";
    if (tage < 7) return "📅 bis " + d.toLocaleDateString("de-DE", { weekday: "long" });
    return "📅 bis " + d.toLocaleDateString("de-DE", { day: "numeric", month: "numeric" });
  }

  function zeigeUebersicht() {
    neuZeichnen = zeigeUebersicht;
    const kind = uebersicht.kind || {};
    const faecher = (uebersicht.faecher || []).filter((f) => uebersicht.uebungen.some((u) => u.fach_id === f.id));
    if (faecher.length === 1) fachWahl = faecher[0].id;
    if (fachWahl) { zeigeFach(fachWahl, faecher.length > 1); return; }

    const kopf = h("header", { class: "lk-kopf" },
      h("span", { class: "lk-kopf-symbol", "aria-hidden": "true" }, kind.symbol || "🙂"),
      h("h1", { text: `Hallo ${kind.pseudonym || ""}!`.replace(" !", "!") }),
      sternKnopf());
    if (!faecher.length) {
      zeige(kopf, h("div", { class: "lk-leer" },
        h("span", { class: "lk-leer-symbol", "aria-hidden": "true" }, "🌈"),
        h("p", { text: "Gerade gibt es keine Übungen für dich. Schau später wieder vorbei!" }),
        h("button", { type: "button", class: "lk-knopf leise", onclick: () => ladeUebersicht() }, "🔄 Nachschauen")));
      return;
    }
    const kacheln = faecher.map((f) => {
      const liste = uebersicht.uebungen.filter((u) => u.fach_id === f.id);
      const neu = liste.filter((u) => u.neu).length;
      return h("button", { type: "button", class: "lk-fach", farbe: fachFarbe(f), onclick: () => { fachWahl = f.id; zeigeUebersicht(); } },
        neu ? h("span", { class: "lk-fach-neu" }, `${neu} neu`) : null,
        h("span", { class: "lk-fach-symbol", "aria-hidden": "true" }, f.symbol || "📚"),
        h("span", { class: "lk-fach-name", text: f.name }),
        h("span", { class: "lk-fach-info", text: liste.length === 1 ? "1 Übung" : `${liste.length} Übungen` }));
    });
    zeige(kopf, h("p", { class: "lk-text", text: "Was möchtest du üben?" }), h("div", { class: "lk-faecher" }, kacheln), albumKnopf());
  }

  // ---------- Sammelalbum (seit Session 83) ----------
  function sternKnopf() {
    const n = uebersicht.sterne_gesamt || 0;
    const zurueck = neuZeichnen;
    return h("button", { type: "button", class: "lk-sterne-zahl", title: "Mein Album", "aria-label": `${n} Sterne – Album öffnen`, onclick: () => zeigeAlbum(zurueck) }, "⭐ ", String(n));
  }
  function albumKnopf() {
    const al = uebersicht.album;
    if (!al) return null;
    const zurueck = neuZeichnen;
    return h("button", { type: "button", class: "lk-knopf leise breit lk-album-knopf", onclick: () => zeigeAlbum(zurueck) },
      "📒 Mein Album", h("span", { class: "lk-leise", text: ` · ${al.sticker_gesamt} Sticker` }));
  }
  function zeigeAlbum(zurueck) {
    neuZeichnen = () => zeigeAlbum(zurueck);
    const al = uebersicht.album || { faecher: [], abzeichen: [], sticker_gesamt: 0 };
    const zurueckZu = typeof zurueck === "function" ? zurueck : zeigeUebersicht;
    const karten = al.faecher.map((f) => {
      const aktuell = f.sets[f.sets.length - 1];
      const voll = f.sets.slice(0, -1);
      const punkte = STERNE_JE_STICKER - f.bis_naechster;
      return h("section", { class: "lk-album-fach", farbe: fachFarbe(f) },
        h("div", { class: "lk-album-kopf" },
          h("h2", null, f.symbol ? f.symbol + " " : "", f.name),
          h("span", { class: "lk-album-zahl", text: `⭐ ${f.sterne}` })),
        h("p", { class: "lk-album-set", text: `Set „${aktuell.name}“ · ${aktuell.frei} von ${aktuell.sticker.length}` }),
        h("div", { class: "lk-sticker-raster" }, aktuell.sticker.map((st, i) => i < aktuell.frei
          ? h("span", { class: "lk-sticker", text: st })
          : h("span", { class: "lk-sticker zu", "aria-label": "noch nicht gesammelt" }, "?"))),
        h("div", { class: "lk-naechster" },
          h("span", { class: "lk-punkte", "aria-hidden": "true" }, [0, 1, 2].map((i) => h("span", { class: i < punkte ? "an" : "" }))),
          h("span", { text: f.bis_naechster === 1 ? "Noch 1 ⭐ bis zum nächsten Sticker" : `Noch ${f.bis_naechster} ⭐ bis zum nächsten Sticker` })),
        voll.length ? h("details", { class: "lk-voll" },
          h("summary", { text: voll.length === 1 ? "1 volles Set 🎉" : `${voll.length} volle Sets 🎉` }),
          voll.map((v) => h("p", { class: "lk-voll-set" }, h("strong", { text: v.name + ": " }), v.sticker.join(" ")))) : null);
    });
    const erreicht = al.abzeichen.filter((a) => a.erreicht).length;
    zeige(
      h("div", { class: "lk-leiste" },
        h("button", { type: "button", class: "lk-zurueck", onclick: zurueckZu }, "‹ Zurück"),
        h("h1", null, "📒 Mein Album")),
      h("p", { class: "lk-text", text: "Für je 3 Sterne in einem Fach bekommst du einen Sticker. Wenn du eine Übung wiederholst, zählt deine beste Runde." }),
      karten.length ? karten : h("p", { class: "lk-leise", text: "Noch keine Fächer – sobald es Übungen gibt, geht’s los." }),
      h("h2", { class: "lk-abz-titel", text: `Abzeichen · ${erreicht} von ${al.abzeichen.length}` }),
      h("div", { class: "lk-abzeichen" }, al.abzeichen.map((a) => h("div", { class: "lk-abz" + (a.erreicht ? "" : " zu") },
        h("span", { class: "lk-abz-symbol", "aria-hidden": "true", text: a.symbol }),
        h("span", { class: "lk-abz-name", text: a.name }),
        a.erreicht ? h("span", { class: "lk-nur-vorleser", text: "geschafft" }) : (a.hinweis ? h("span", { class: "lk-abz-hinweis", text: a.hinweis }) : null)))));
  }

  function zeigeFach(fachId, mitZurueck) {
    neuZeichnen = () => zeigeFach(fachId, mitZurueck);
    const fach = fachVon(fachId);
    const kind = uebersicht.kind || {};
    const karten = uebungenVon(fachId).map((u) => {
      const faellig = u.faellig_am && !u.durchlaeufe ? faelligText(u.faellig_am) : null;
      return h("button", { type: "button", class: "lk-uebung", farbe: fachFarbe(fach), onclick: () => zeigeStart(u) },
        h("span", { class: "lk-uebung-text" },
          h("span", { class: "lk-uebung-titel", text: u.titel }),
          h("span", { class: "lk-uebung-meta" },
            u.neu ? h("span", { class: "lk-marke neu" }, "Neu") : null,
            faellig ? h("span", { class: "lk-marke faellig", text: faellig }) : null,
            h("span", { text: [u.thema, u.anzahl_aufgaben === 1 ? "1 Aufgabe" : `${u.anzahl_aufgaben} Aufgaben`].filter(Boolean).join(" · ") }))),
        u.durchlaeufe ? h("span", { class: "lk-uebung-sterne", "aria-label": `Beste Runde: ${u.beste_sterne} von 3 Sternen` }, sterneText(u.beste_sterne)) : null,
        h("span", { class: "lk-pfeil", "aria-hidden": "true" }, "›"));
    });
    zeige(
      h("div", { class: "lk-leiste", farbe: fachFarbe(fach) },
        mitZurueck ? h("button", { type: "button", class: "lk-zurueck", onclick: () => { fachWahl = null; zeigeUebersicht(); } }, "‹ Fächer") : h("span", { class: "lk-kopf-symbol", "aria-hidden": "true" }, kind.symbol || "🙂"),
        h("h1", null, (fach && fach.symbol ? fach.symbol + " " : ""), (fach && fach.name) || "Übungen"),
        sternKnopf()),
      h("div", { class: "lk-uebungen" }, karten),
      albumKnopf(),
      h("button", { type: "button", class: "lk-knopf leise breit lk-nachschauen", onclick: () => ladeUebersicht() }, "🔄 Nachschauen, ob es Neues gibt"));
  }

  function zeigeStart(u, fehler) {
    neuZeichnen = () => zeigeStart(u, fehler);
    const fach = fachVon(u.fach_id);
    const losKnopf = h("button", { type: "button", class: "lk-knopf breit" }, "Los geht’s! 🚀");
    losKnopf.addEventListener("click", () => starten(u, losKnopf));
    zeige(h("div", { class: "lk-start", farbe: fachFarbe(fach) },
      h("div", { class: "lk-leiste" }, h("button", { type: "button", class: "lk-zurueck", onclick: zeigeUebersicht }, "‹ Zurück")),
      h("div", { class: "lk-start-symbol", "aria-hidden": "true" }, (fach && fach.symbol) || "📚"),
      h("h1", { text: u.titel }),
      h("p", { class: "lk-leise", text: u.anzahl_aufgaben === 1 ? "1 Aufgabe" : `${u.anzahl_aufgaben} Aufgaben` }),
      u.einleitung ? h("div", { class: "lk-einleitung" }, h("p", { text: u.einleitung }), vorleseKnopf([[u.einleitung, "de"]])) : null,
      fehler ? h("div", { class: "lk-fehler", role: "alert", text: fehler }) : null,
      losKnopf));
  }

  async function starten(u, knopf) {
    knopf.disabled = true;
    knopf.textContent = "Einen Moment …";
    let d;
    try {
      d = await api("start", { uebung_id: u.id });
    } catch (e) {
      if (e.abgemeldet) { zeigeKeinZugang(e.message); return; }
      zeigeStart(u, e.message);
      return;
    }
    lauf = {
      did: d.durchlauf_id, uebung: u, titel: d.titel, aufgaben: d.aufgaben || [],
      pos: 0, versuch: 1, ergebnisse: [],
    };
    laufMerken();
    zeigeAufgabe();
  }

  function laufMerken() { schreib("sessionStorage", LAUF, lauf ? JSON.stringify(lauf) : null); }

  // ---------- Eine Aufgabe ----------
  // Zustand der aktuellen Aufgabe (nicht gespeichert – beim Neuladen beginnt
  // die Aufgabe leer, der Versuch bleibt)
  let az = null;

  function aufgabeZustandNeu(a) {
    const z = { start: Date.now(), gesperrt: false, rueck: null, markierung: null, falschGewaehlt: new Set() };
    if (a.typ === "auswahl") z.wahl = null;
    if (a.typ === "eingabe") z.werte = (a.teile || []).filter((t) => t.luecke !== undefined).map(() => "");
    if (a.typ === "zuordnen") { z.plaetze = a.links.map(() => null); z.aktiv = 0; }
    if (a.typ === "sortieren") z.plaetze = a.teile.map(() => null);
    return z;
  }

  function zeigeAufgabe() {
    const a = lauf.aufgaben[lauf.pos];
    if (!a) { abschliessen(); return; }
    if (!az || az.id !== a.id) { az = aufgabeZustandNeu(a); az.id = a.id; }
    neuZeichnen = zeigeAufgabe;
    const fach = fachVon(lauf.uebung.fach_id);
    const englisch = istEnglisch(fach);
    const n = lauf.aufgaben.length;

    const schliessen = h("button", { type: "button", class: "lk-schliessen", "aria-label": "Aufhören", title: "Aufhören" }, "✕");
    const kopf = h("div", { class: "lk-lauf-kopf" },
      schliessen,
      h("div", { class: "lk-balken", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(n), "aria-valuenow": String(lauf.pos), "aria-label": "Fortschritt" },
        h("span", { vars: { width: `${Math.round((lauf.pos / n) * 100)}%` } })),
      h("span", { class: "lk-zaehler", text: `${lauf.pos + 1} / ${n}` }));
    const unten = h("div");
    schliessen.addEventListener("click", () => aufhoerenFragen(unten));

    const frageKarte = h("div", { class: "lk-frage-karte" },
      a.emoji ? h("span", { class: "lk-frage-emoji", "aria-hidden": "true", text: a.emoji }) : null,
      a.bild_url ? h("img", { class: "lk-frage-bild", src: a.bild_url, alt: "" }) : null,
      h("div", { class: "lk-frage-zeile" },
        h("p", { class: "lk-frage", id: "lk-frage", text: a.frage }),
        vorleseKnopf(() => vorleseTeile(a, englisch))));

    const bereich = h("div", { class: "lk-bereich" });
    zeichneBereich(a, bereich);

    zeige(h("div", { farbe: fachFarbe(fach) }, kopf, frageKarte, bereich, unten));
    // Erste Lücke gleich bereit (ohne die Seite zu verschieben)
    if (a.typ === "eingabe" && !az.rueck) {
      const erste = bereich.querySelector("input:not([readonly])");
      if (erste && window.matchMedia("(hover: hover)").matches) erste.focus({ preventScroll: true });
    }
  }

  function vorleseTeile(a, englisch) {
    const teile = [[a.frage, "de"]];
    const fremd = englisch ? "en" : "de";
    if (a.typ === "auswahl") a.optionen.forEach((o) => teile.push([o.text, fremd]));
    if (a.typ === "eingabe") teile.push([a.teile.map((t) => (t.luecke !== undefined ? " … " : t.text)).join(""), fremd]);
    if (a.typ === "zuordnen") { a.links.forEach((x) => teile.push([x.text, fremd])); a.rechts.forEach((x) => teile.push([x.text, fremd])); }
    if (a.typ === "sortieren") a.teile.forEach((x) => teile.push([x.text, fremd]));
    return teile;
  }

  function fertigAusgefuellt(a) {
    if (a.typ === "auswahl") return az.wahl !== null;
    if (a.typ === "eingabe") return az.werte.every((w) => w.trim() !== "");
    return az.plaetze.every((p) => p !== null);
  }

  function zeichneBereich(a, bereich) {
    const fertig = !!(az.rueck && az.rueck.fertig);
    const gesperrt = fertig || az.gesperrt;
    const teile = [];
    if (a.typ === "auswahl") teile.push(bereichAuswahl(a, bereich, gesperrt));
    if (a.typ === "eingabe") teile.push(bereichEingabe(a, bereich, gesperrt));
    if (a.typ === "zuordnen") teile.push(...bereichZuordnen(a, bereich, gesperrt));
    if (a.typ === "sortieren") teile.push(...bereichSortieren(a, bereich, gesperrt));

    if (az.rueck) teile.push(rueckmeldung(a));
    if (!fertig) {
      const pruefen = h("button", { type: "button", class: "lk-knopf breit", disabled: !fertigAusgefuellt(a) || az.gesperrt },
        az.gesperrt ? "Ich schaue nach …" : (lauf.versuch === 2 ? "Nochmal prüfen ✓" : "Fertig ✓"));
      pruefen.addEventListener("click", () => pruefe(a, bereich));
      teile.push(h("div", { class: "lk-aktion" }, pruefen));
    }
    bereich.replaceChildren(...teile.filter(Boolean));
  }
  // Nur den Prüfen-Knopf an/aus, ohne neu zu zeichnen (Tippen in Lücken)
  function pruefKnopfAktualisieren(a, bereich) {
    const k = bereich.querySelector(".lk-aktion .lk-knopf");
    if (k) k.disabled = !fertigAusgefuellt(a) || az.gesperrt;
  }

  // --- Auswahl ---
  function bereichAuswahl(a, bereich, gesperrt) {
    const loesung = az.rueck && az.rueck.fertig ? az.rueck.loesung : null;
    return h("div", { class: "lk-optionen", role: "group", "aria-labelledby": "lk-frage" }, a.optionen.map((o) => {
      let klasse = "lk-option";
      if (loesung) {
        if (o.id === loesung.wahl) klasse += " richtig";
        else if (az.falschGewaehlt.has(o.id) || o.id === az.wahl) klasse += " falsch";
        else klasse += " weg";
      } else if (az.falschGewaehlt.has(o.id)) klasse += " falsch weg";
      else if (o.id === az.wahl) klasse += " gewaehlt";
      const aus = gesperrt || az.falschGewaehlt.has(o.id);
      const k = h("button", { type: "button", class: klasse, disabled: aus, "aria-pressed": String(o.id === az.wahl) },
        o.emoji ? h("span", { class: "lk-option-emoji", "aria-hidden": "true", text: o.emoji }) : null,
        h("span", { class: "lk-option-text", text: o.text }));
      if (!aus) k.addEventListener("click", () => { az.wahl = o.id; zeichneBereich(a, bereich); });
      return k;
    }));
  }

  // --- Lücken ---
  function nurRechnen(a) {
    // Steht im Text nur Rechnen (Ziffern, Zeichen)? Dann Zahlentastatur
    const text = a.teile.filter((t) => t.text !== undefined).map((t) => t.text).join("");
    return /\d/.test(text) && /^[\d\s+\-−–·×x*:÷/=().,?!]*$/i.test(text);
  }
  function bereichEingabe(a, bereich, gesperrt) {
    const fertig = az.rueck && az.rueck.fertig;
    const loesung = fertig ? az.rueck.loesung : null;
    const mark = az.markierung;
    const zahlen = nurRechnen(a);
    let nr = 0;
    const satz = a.teile.map((t) => {
      if (t.luecke === undefined) return h("span", { text: t.text });
      const i = nr++;
      if (loesung) {
        const ok = mark ? mark[i] : false;
        return ok
          ? h("span", { class: "lk-loesung-wort", text: az.werte[i] })
          : h("span", { class: "lk-loesung-wort war-falsch", "aria-label": `richtig ist: ${loesung.luecken[i]}`, text: loesung.luecken[i] });
      }
      const fest = gesperrt || (mark && mark[i]);
      const feld = h("input", {
        class: "lk-luecke" + (mark ? (mark[i] ? " richtig" : " falsch") : ""), type: "text", value: az.werte[i],
        "aria-label": `Lücke ${i + 1}`, autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false",
        enterkeyhint: "next", inputmode: zahlen ? "decimal" : null, readonly: fest, maxlength: "60",
        vars: { "--breite": String(t.breite || 6) },
      });
      feld.value = az.werte[i];
      feld.addEventListener("input", () => {
        az.werte[i] = feld.value;
        feld.classList.remove("falsch");
        pruefKnopfAktualisieren(a, bereich);
      });
      feld.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const felder = [...bereich.querySelectorAll("input.lk-luecke:not([readonly])")];
        const weiter = felder[felder.indexOf(feld) + 1];
        if (weiter) weiter.focus();
        else if (fertigAusgefuellt(a)) pruefe(a, bereich);
      });
      return feld;
    });
    return h("div", { class: "lk-lueckentext" }, satz);
  }

  // --- Zuordnen: Zeile wählen, dann rechts ein Teil antippen ---
  function bereichZuordnen(a, bereich, gesperrt) {
    const fertig = az.rueck && az.rueck.fertig;
    const mark = az.markierung;
    const textRechts = (id) => (a.rechts.find((r) => r.id === id) || {}).text || "";
    const paare = h("div", { class: "lk-paare" }, a.links.map((l, i) => {
      let platzInhalt, klasse = "lk-platz";
      if (fertig) {
        const ok = mark ? mark[i] : false;
        klasse += ok ? " richtig" : " falsch";
        // Lösung: links nr gehört zu rechts id nr
        platzInhalt = ok ? textRechts(az.plaetze[i]) : `✔ ${textRechts(az.rueck.loesung.zuordnung[i])}`;
      } else if (az.plaetze[i] !== null) {
        klasse += " belegt" + (mark && mark[i] ? " richtig" : "");
        platzInhalt = textRechts(az.plaetze[i]);
      } else {
        klasse += i === az.aktiv ? " aktiv" : "";
        platzInhalt = h("span", { class: "lk-platz-leer" }, i === az.aktiv ? "hier hinein" : "?");
      }
      const fest = gesperrt || (mark && mark[i] && az.plaetze[i] !== null);
      const platz = h("button", { type: "button", class: klasse, disabled: fest, "aria-label": `Partner für ${l.text}` }, platzInhalt);
      if (!fest) {
        platz.addEventListener("click", () => {
          // Belegt: Teil zurück in den Vorrat; immer: diese Zeile wird aktiv
          az.plaetze[i] = null;
          az.aktiv = i;
          zeichneBereich(a, bereich);
        });
      }
      return h("div", { class: "lk-paar" },
        h("div", { class: "lk-paar-links", text: l.text }),
        h("span", { class: "lk-paar-pfeil", "aria-hidden": "true" }, "→"),
        platz);
    }));
    if (fertig) return [paare];
    const frei = a.rechts.filter((r) => !az.plaetze.includes(r.id));
    const vorrat = h("div", { class: "lk-vorrat" }, frei.length ? frei.map((r) => {
      const k = h("button", { type: "button", class: "lk-teil", disabled: gesperrt, text: r.text });
      k.addEventListener("click", () => {
        let ziel = az.plaetze[az.aktiv] === null ? az.aktiv : az.plaetze.indexOf(null);
        if (ziel < 0) return;
        az.plaetze[ziel] = r.id;
        const naechster = az.plaetze.findIndex((p, j) => p === null && j > ziel);
        az.aktiv = naechster >= 0 ? naechster : az.plaetze.indexOf(null);
        zeichneBereich(a, bereich);
      });
      return k;
    }) : h("span", { class: "lk-vorrat-leer" }, "Alles verteilt 👍"));
    return [paare, h("p", { class: "lk-vorrat-titel", text: "Tippe auf das passende Teil:" }), vorrat];
  }

  // --- Sortieren: Teile der Reihe nach antippen ---
  function bereichSortieren(a, bereich, gesperrt) {
    const fertig = az.rueck && az.rueck.fertig;
    const mark = az.markierung;
    const textVon = (id) => (a.teile.find((t) => t.id === id) || {}).text || "";
    if (fertig) {
      const loesungText = az.rueck.loesung.reihenfolge.map((id) => textVon(id));
      // Die Seite kennt die Teile nur gemischt – die Lösung kommt als Liste der ursprünglichen Nummern
      return [h("div", { class: "lk-reihe" }, az.plaetze.map((id, pos) =>
        h("span", { class: "lk-platz " + (mark && mark[pos] ? "richtig" : "falsch"), text: loesungText[pos] })))];
    }
    const reihe = h("div", { class: "lk-reihe", "aria-label": "Deine Reihenfolge" }, az.plaetze.map((id, pos) => {
      if (id === null) return h("span", { class: "lk-platz" + (pos === az.plaetze.indexOf(null) ? " aktiv" : "") }, h("span", { class: "lk-platz-leer" }, String(pos + 1)));
      const fest = gesperrt || (mark && mark[pos]);
      const k = h("button", { type: "button", class: "lk-platz belegt" + (mark && mark[pos] ? " richtig" : ""), disabled: fest, text: textVon(id), "aria-label": `${textVon(id)} – zurücklegen` });
      if (!fest) k.addEventListener("click", () => { az.plaetze[pos] = null; zeichneBereich(a, bereich); });
      return k;
    }));
    const frei = a.teile.filter((t) => !az.plaetze.includes(t.id));
    const vorrat = h("div", { class: "lk-vorrat" }, frei.length ? frei.map((t) => {
      const k = h("button", { type: "button", class: "lk-teil", disabled: gesperrt, text: t.text });
      k.addEventListener("click", () => {
        const ziel = az.plaetze.indexOf(null);
        if (ziel < 0) return;
        az.plaetze[ziel] = t.id;
        zeichneBereich(a, bereich);
      });
      return k;
    }) : h("span", { class: "lk-vorrat-leer" }, "Alles eingeordnet 👍"));
    return [reihe, h("p", { class: "lk-vorrat-titel", text: "Tippe die Teile in der richtigen Reihenfolge an:" }), vorrat];
  }

  function antwortVon(a) {
    if (a.typ === "auswahl") return { wahl: az.wahl };
    if (a.typ === "eingabe") return { luecken: az.werte.map((w) => w.trim()) };
    if (a.typ === "zuordnen") return { zuordnung: az.plaetze };
    return { reihenfolge: az.plaetze };
  }

  async function pruefe(a, bereich) {
    if (az.gesperrt || !fertigAusgefuellt(a)) return;
    az.gesperrt = true;
    az.fehler = null;
    zeichneBereich(a, bereich);
    let r;
    try {
      r = await api("antwort", { durchlauf_id: lauf.did, aufgabe_id: a.id, versuch: lauf.versuch, antwort: antwortVon(a), dauer_ms: Date.now() - az.start });
    } catch (e) {
      az.gesperrt = false;
      if (e.abgemeldet) { lauf = null; zeigeKeinZugang(e.message); return; }
      if (e.status === 409) {
        // Schon beantwortet (z. B. nach Neuladen) oder Übung schon fertig: weiter
        if (/fertig/i.test(e.message)) { lauf = null; laufMerken(); ladeUebersicht(); return; }
        weiter();
        return;
      }
      az.fehler = e.message;
      zeichneBereich(a, bereich);
      zeigeFehlerHinweis(bereich, e.message);
      return;
    }
    az.gesperrt = false;
    const fertig = !r.nochmal;
    az.markierung = Array.isArray(r.markierung) ? r.markierung : null;
    if (a.typ === "auswahl" && !r.richtig) az.falschGewaehlt.add(az.wahl);
    if (fertig) {
      lauf.ergebnisse.push({ id: a.id, richtig: r.richtig, versuch: lauf.versuch });
      az.rueck = { fertig: true, richtig: r.richtig, loesung: r.loesung || {}, erklaerung: r.erklaerung || null };
    } else {
      // Zweiter Versuch: Falsches leeren, Richtiges bleibt stehen (und ist fest)
      lauf.versuch = 2;
      az.start = Date.now();
      az.rueck = { fertig: false };
      if (a.typ === "auswahl") az.wahl = null;
      if (a.typ === "zuordnen" || a.typ === "sortieren") {
        az.plaetze = az.plaetze.map((p, i) => (az.markierung && az.markierung[i] ? p : null));
        az.aktiv = Math.max(0, az.plaetze.indexOf(null));
      }
    }
    laufMerken();
    zeichneBereich(a, bereich);
    const rueck = bereich.querySelector(".lk-rueck");
    if (rueck) rueck.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function zeigeFehlerHinweis(bereich, text) {
    bereich.append(h("div", { class: "lk-fehler", role: "alert", text }));
  }

  function rueckmeldung(a) {
    const r = az.rueck;
    if (!r.fertig) {
      return h("div", { class: "lk-rueck nochmal", role: "status" },
        h("p", { class: "lk-rueck-titel" }, h("span", null, "Fast! Schau noch mal genau hin 🔍")),
        h("p", { text: a.typ === "auswahl" ? "Probier eine andere Antwort." : (a.typ === "eingabe" ? "Die roten Lücken stimmen noch nicht." : "Die grünen Teile stimmen schon. Versuch den Rest noch einmal.") }));
    }
    const letzte = lauf.pos >= lauf.aufgaben.length - 1;
    const weiterKnopf = h("button", { type: "button", class: "lk-knopf breit" + (r.richtig ? " ok" : "") }, letzte ? "Zum Ergebnis 🏁" : "Weiter →");
    weiterKnopf.addEventListener("click", weiter);
    setTimeout(() => weiterKnopf.focus({ preventScroll: true }), 50);
    const titel = r.richtig ? (lauf.versuch === 2 ? "Jetzt stimmt’s! 👍" : `${zufall(LOB)} 🎉`) : "So ist es richtig:";
    const kinder = [h("p", { class: "lk-rueck-titel" }, h("span", { text: titel }))];
    if (!r.richtig) {
      if (a.typ === "auswahl") {
        const o = a.optionen.find((x) => x.id === r.loesung.wahl);
        if (o) kinder.push(h("p", { text: `${o.emoji ? o.emoji + " " : ""}${o.text}` }));
      }
      if (a.typ === "zuordnen") {
        kinder.push(h("ul", { class: "lk-loesung-liste" }, a.links.map((l, i) =>
          h("li", { text: `${l.text} → ${(a.rechts.find((x) => x.id === r.loesung.zuordnung[i]) || {}).text || ""}` }))));
      }
      if (a.typ === "eingabe") kinder.push(h("p", { text: "Die gelben Wörter sind die richtigen." }));
      if (a.typ === "sortieren") kinder.push(h("p", { text: "Oben steht jetzt die richtige Reihenfolge." }));
    }
    if (r.erklaerung) {
      kinder.push(h("div", { class: "lk-erklaerung" },
        h("span", { "aria-hidden": "true" }, "💡"),
        h("p", { text: r.erklaerung }),
        vorleseKnopf([[r.erklaerung, "de"]])));
    }
    kinder.push(weiterKnopf);
    return h("div", { class: "lk-rueck " + (r.richtig ? "richtig" : "loesung"), role: "status" }, kinder);
  }

  function weiter() {
    lauf.pos++;
    lauf.versuch = 1;
    az = null;
    laufMerken();
    if (lauf.pos >= lauf.aufgaben.length) abschliessen();
    else zeigeAufgabe();
  }

  function aufhoerenFragen(ort) {
    if (ort.querySelector(".lk-frage-box")) return;
    const box = h("div", { class: "lk-frage-box", role: "alertdialog", "aria-label": "Aufhören?" },
      h("p", { text: "Möchtest du wirklich aufhören? Dann zählt diese Runde nicht." }),
      h("div", { class: "lk-ende-knoepfe" },
        h("button", { type: "button", class: "lk-knopf", onclick: () => box.remove() }, "Weiter üben"),
        h("button", { type: "button", class: "lk-knopf leise", onclick: () => { lauf = null; az = null; laufMerken(); ladeUebersicht(); } }, "Aufhören")));
    ort.append(box);
    box.scrollIntoView({ block: "nearest", behavior: "smooth" });
    box.querySelector("button").focus({ preventScroll: true });
  }

  // ---------- Ende ----------
  async function abschliessen() {
    neuZeichnen = () => {};
    app.replaceChildren(h("p", { class: "lk-laden", text: "Ich zähle deine Sterne …" }));
    let r;
    try {
      r = await api("abschluss", { durchlauf_id: lauf.did });
    } catch (e) {
      if (e.abgemeldet) { lauf = null; zeigeKeinZugang(e.message); return; }
      if (e.status === 409) { lauf = null; laufMerken(); ladeUebersicht(); return; }
      zeigeFehler(e, abschliessen);
      return;
    }
    const u = lauf.uebung;
    lauf = null; az = null;
    laufMerken();
    zeigeEnde(u, r);
  }

  function zeigeEnde(u, r) {
    neuZeichnen = () => zeigeEnde(u, r);
    const fach = fachVon(u.fach_id);
    const titel = r.sterne >= 3 ? "Super gemacht!" : r.sterne === 2 ? "Gut gemacht!" : "Geschafft!";
    const dazu = Math.max(0, (r.sterne_gesamt || 0) - (r.sterne_gesamt_vorher || 0));
    const nochmal = h("button", { type: "button", class: "lk-knopf leise breit" }, "🔁 Nochmal üben");
    nochmal.addEventListener("click", () => zeigeStart(u));
    zeige(h("div", { class: "lk-ende", farbe: fachFarbe(fach) },
      h("h1", { text: titel }),
      h("div", { class: "lk-ende-sterne", role: "img", "aria-label": `${r.sterne} von 3 Sternen` },
        [1, 2, 3].map((i) => h("span", { class: i <= r.sterne ? "" : "leer" }, "⭐"))),
      h("p", { text: `${r.richtig_erster} von ${r.anzahl} gleich beim ersten Mal richtig` + (r.richtig_zweiter ? `, ${r.richtig_zweiter} beim zweiten Mal.` : ".") }),
      h("div", { class: "lk-ende-sammlung" }, "⭐ ", `${r.sterne_gesamt} Sterne gesammelt`, dazu ? ` (+${dazu})` : ""),
      neuesImAlbum(r),
      h("div", { class: "lk-ende-knoepfe" },
        h("button", { type: "button", class: "lk-knopf breit", onclick: () => ladeUebersicht() }, "Zu den Übungen"),
        (r.neue_sticker || []).length || (r.neue_abzeichen || []).length
          ? h("button", { type: "button", class: "lk-knopf leise breit", onclick: () => ladeUebersicht(() => zeigeAlbum()) }, "📒 Zum Album") : null,
        r.sterne < 3 ? nochmal : null)));
  }
  function neuesImAlbum(r) {
    const sticker = r.neue_sticker || [], abz = r.neue_abzeichen || [];
    if (!sticker.length && !abz.length) return null;
    const zeigen = sticker.slice(0, 6);
    return h("div", { class: "lk-neu-album", role: "status" },
      sticker.length ? h("p", { class: "lk-neu-titel", text: sticker.length === 1 ? "Neuer Sticker!" : `${sticker.length} neue Sticker!` }) : null,
      sticker.length ? h("div", { class: "lk-neu-sticker" }, zeigen.map((x) => h("span", { text: x.emoji, title: x.fach })),
        sticker.length > 6 ? h("span", { class: "lk-leise", text: `+${sticker.length - 6}` }) : null) : null,
      abz.map((a) => h("p", { class: "lk-neu-abz" }, h("span", { "aria-hidden": "true", text: a.symbol + " " }), "Neues Abzeichen: ", h("strong", { text: a.name }))));
  }

  // ---------- Start ----------
  function laufWiederherstellen() {
    const roh = lies("sessionStorage", LAUF);
    if (!roh) return false;
    try {
      const l = JSON.parse(roh);
      if (!l || !l.did || !Array.isArray(l.aufgaben) || !l.uebung) return false;
      lauf = l;
      return true;
    } catch (_e) { return false; }
  }

  async function los() {
    zugangAusAdresse();
    if ("speechSynthesis" in window && !los.stimmenAn) {
      los.stimmenAn = true;
      stimmenLaden();
      try { speechSynthesis.addEventListener("voiceschanged", stimmenLaden); } catch (_e) { speechSynthesis.onvoiceschanged = stimmenLaden; }
    }
    if (!schluessel) { zeigeKeinZugang(); return; }
    if (laufWiederherstellen()) {
      // Neu geladen mitten in einer Übung: Übersicht holen (für Fächer/Farben), dann weiter
      try { uebersicht = await api("uebersicht"); } catch (e) { zeigeFehler(e, () => location.reload()); return; }
      zeigeAufgabe();
      return;
    }
    ladeUebersicht();
  }
  los();
  // Seite schon offen und der QR-Link wird noch einmal geöffnet: dann ändert
  // sich nur der #-Teil, ohne Neuladen – Schlüssel trotzdem übernehmen
  window.addEventListener("hashchange", () => {
    if (/(?:^#|&)z=/.test(location.hash || "")) { lauf = null; az = null; fachWahl = null; los(); }
  });
})();
