// ==========================================================
  // WICHTIG: Diese URL nach dem Deployment der Edge Function
  // aus dem Supabase-Dashboard eintragen (siehe SETUP.md).
  // Beispiel: https://xxxxxxxx.supabase.co/functions/v1/aufgaben-api
  // ==========================================================
  const API_URL = "https://juxoxltaeugsmtvirfcm.supabase.co/functions/v1/bright-endpoint";

  // Name für den Gruß („Moin Markus.“) – nur hier ändern.
  // Leer lassen ("") ergibt einfach „Moin.“
  const ANZEIGE_NAME = "Markus";
  const GRUSS = ANZEIGE_NAME ? `Moin ${ANZEIGE_NAME}.` : "Moin.";
  (() => {
    const w = document.querySelector("#bereich-screen .willkommen-titel");
    if (w) { w.textContent = GRUSS; w.append(document.createElement("br"), "Wohin heute?"); }
    const h = document.getElementById("heute-gruss");
    if (h) h.textContent = GRUSS;
  })();

  let token = localStorage.getItem("aufgaben-token") || "";
  let projekte = [];
  let aufgaben = [];
  let termine = [];
  let notizen = [];
  let links = [];
  let reflexionen = [];
  let einkaufsliste = [];
  let verlauf = [];
  let ziele = [];
  let zielSchritte = [];
  let planTyp = "woche";
  let planAnker = new Date();
  let zielExpandiert = new Set();
  let calMonat = new Date(); // aktuell angezeigter Monat im Kalender
  let calAusgewaehlterTag = null; // "YYYY-MM-DD" oder null
  let blockzeiten = [];
  let tagesrahmen = [];
  let fixkosten = [];
  let sonderausgaben = [];
  let buchungen = [];
  let finanzEinstellungen = [];
  let kategorieRegeln = null; // Kategorie-Regeln (seit Session 36); null = SQL/index.ts fehlt
  let finRegelnOffen = false;
  let einheiten = null; // Einheiten planen (seit Session 37); null = SQL/index.ts fehlt
  let einheitBausteine = [];
  let einheitOffenId = null; // geöffnete Einheit im Reiter Einheiten
  let sparziele = null; // Sparziele (seit Session 37); null = SQL/index.ts fehlt // Block „Kategorie-Regeln“ in Buchungen aufgeklappt
  let finTyp = "fixkosten"; // "fixkosten" | "sonderausgaben"
  let finBearbeitetesFixkosten = null; // id oder null
  let finBearbeiteteSonderausgabe = null; // id oder null
  let finBearbeiteteBuchung = null; // id oder null
  let buchungTypAusgewaehlt = "ausgabe"; // "ausgabe" | "einnahme"
  let buchungKategorieAusgewaehlt = "Lebensmittel";
  const FIN_KAT_AUSGABE = ["Lebensmittel", "Tanken", "Hygiene", "Haus", "Sonstiges"];
  const FIN_KAT_EINNAHME = ["Gehalt", "Rückerstattung", "Geschenk", "Sonstiges"];
  let finBuchMonat = new Date().getMonth() + 1;
  let finBuchJahr = new Date().getFullYear();
  let finUebJahr = new Date().getFullYear();
  let finUebersichtDaten = null; // Cache der letzten API-Antwort
  const CSV_DATUM_SPALTEN = ["Buchungstag", "Valuta", "Datum", "Valutadatum"];
  const CSV_BETRAG_SPALTEN = ["Betrag", "Umsatz", "Betrag (EUR)"];
  const CSV_PARTNER_SPALTEN = ["Zahler/Empfänger", "Auftraggeber/Empfänger", "Empfänger/Zahlungspflichtiger", "Name Zahlungsbeteiligter"];
  const CSV_ZWECK_SPALTEN = ["Verwendungszweck", "Buchungstext"];
  const FIN_MONATE = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"];
  const FIN_MONATSNAMEN_KURZ = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  let ogsIdeen = [];
  let ogsInventar = [];
  let ogsProjekte = [];
  let ogsProjektDateien = [];
  let spiele = [];
  let spieleDateien = [];
  let tabEinstellungen = [];
  let verleih = [];
  let training = [];
  let trainingUebungen = [];
  let trainingEinstellungen = [];
  let trainingsplaene = [];
  let trainingsplanUebungen = [];
  let trainingStammdaten = [];
  let stammdatenBearbeitenId = null;
  let trainingBildUrls = {}; // stammdaten-id -> { url, ablauf }
  let uebungGruppenOffen = new Set(); // aufgeklappte Kategorie-Gruppen in "Übungen verwalten"
  let uebungKategorieVorschlaege = null; // Vorschau-Liste für "Kategorien vorschlagen" (null = keine Vorschau aktiv)
  let uebungKategorieNeuManuell = false; // true, sobald die Kategorie beim Anlegen von Hand geändert wurde
  let intervallTimer = [];
  let timerBearbeitenId = null;
  let timerSession = null; // laufender Timer im Fokus-Modus
  let zielEvents = [];
  let rezepte = [];
  // Raumplanung (seit Session 29)
  let raeume = [];
  let raumVermietungen = [];
  let raumMailEmpfaenger = [];
  // Schlüsselverwaltung (seit Session 32)
  let schluesselListe = [];
  let schluesselZugaenge = [];
  let schluesselAusgaben = []; // Ausgabeprotokolle ohne Unterschriftsbilder (seit Session 33)
  let mailEingerichtet = false;
  let zielEventBearbeitenId = null;
  let auswertungJahr = new Date().getFullYear();
  let aktiverBereich = localStorage.getItem("aktiver-bereich") || "privat";
  let aktiverTab = null; // Schlüssel des gerade angezeigten Reiters (view-*), für den Zurück-Button

  const VIEW_ELEMENTE = {
    heute: "view-heute", frei: "view-frei", aufgaben: "view-aufgaben", kalender: "view-kalender",
    planung: "view-planung", finanzen: "view-finanzen", notizen: "view-notizen", links: "view-links",
    reflexion: "view-reflexion", spiele: "view-spiele", einheiten: "view-einheiten", einkauf: "view-einkauf", export: "view-export",
    verlauf: "view-verlauf", anleitung: "view-anleitung", ogsideen: "view-ogs-ideen",
    ogsinventar: "view-ogs-inventar", ogsprojekte: "view-ogs-projekte", verleih: "view-verleih",
    reiterverwaltung: "view-reiter-verwaltung", training: "view-training", raumplanung: "view-raumplanung",
    rezepte: "view-rezepte", ernaehrung: "view-ernaehrung", schluessel: "view-schluessel",
  };

  // Welche Reiter es grundsätzlich gibt – jetzt in allen drei Bereichen
  // gleich, die tatsächliche Sichtbarkeit steuert allein tab_einstellungen
  // (mit STANDARD_SICHTBAR als Vorbelegung, siehe unten).
  const ALLE_REITER = [
    ["heute", "Start"], ["frei", "Frei"], ["aufgaben", "Aufgaben"], ["kalender", "Kalender"],
    ["planung", "Planung"], ["finanzen", "Finanzen"], ["notizen", "Notizen"], ["links", "Links"],
    ["reflexion", "Reflexion"], ["spiele", "Spiele"], ["einheiten", "Einheiten"], ["einkauf", "Einkauf"], ["export", "Export"],
    ["verlauf", "Verlauf"], ["anleitung", "Anleitung"], ["ogsideen", "Ideen"],
    ["ogsinventar", "Inventar"], ["ogsprojekte", "Projekte"], ["verleih", "Verleih"],
    ["training", "Training"], ["rezepte", "Rezepte"], ["ernaehrung", "Ernährung"],
    ["raumplanung", "Raumplanung"], ["schluessel", "Schlüssel"],
  ];
  // Reiter mit persönlichen Gesundheitsdaten gibt es nur in Privat – sie
  // tauchen in der Reiter-Verwaltung der anderen Bereiche gar nicht auf.
  const NUR_PRIVAT_REITER = ["ernaehrung"];
  const REITER_OHNE_PRIVATE = ALLE_REITER.filter(([k]) => !NUR_PRIVAT_REITER.includes(k));
  const BEREICH_TABS = { privat: ALLE_REITER, ogs: REITER_OHNE_PRIVATE, awo: REITER_OHNE_PRIVATE, business: REITER_OHNE_PRIVATE };
  const BEREICH_TITEL_VERWALTUNG = { privat: `${ic("haus")} Privat`, ogs: `${ic("schule")} OGS Rapunzel`, awo: `${ic("personen")} AWO OV Liblar`, business: `${ic("tasse")} Business` };

  // Vorbelegung, solange in tab_einstellungen noch kein expliziter Eintrag
  // existiert – entspricht dem bisherigen Standardverhalten, damit sich
  // ohne aktives Umschalten nichts an der gewohnten Ansicht ändert.
  const STANDARD_SICHTBAR = {
    privat: ["heute", "frei", "aufgaben", "kalender", "planung", "finanzen", "notizen", "links",
      "reflexion", "spiele", "einheiten", "einkauf", "export", "verlauf", "anleitung", "training", "rezepte", "ernaehrung"],
    ogs: ["heute", "aufgaben", "kalender", "notizen", "verlauf", "anleitung",
      "ogsideen", "ogsinventar", "ogsprojekte", "verleih", "einheiten"],
    awo: ["heute", "aufgaben", "kalender", "notizen", "verlauf", "anleitung", "ogsideen", "raumplanung", "schluessel"],
    business: ["heute", "aufgaben", "kalender", "notizen", "links", "verlauf", "anleitung", "ogsideen"],
  };

  // Prüft, ob ein Reiter im Bereich sichtbar ist (Nutzereinstellung, sonst Standardliste; manche nur privat)
  function reiterIstSichtbar(bereich, schluessel) {
    if (NUR_PRIVAT_REITER.includes(schluessel) && bereich !== "privat") return false;
    const eintrag = tabEinstellungen.find((e) => e.bereich === bereich && e.tab_id === schluessel);
    if (eintrag) return eintrag.sichtbar !== false;
    return (STANDARD_SICHTBAR[bereich] || []).includes(schluessel);
  }

  // Themen (Hauptkategorien) je Bereich – bilden die Leiste unten, ihre
  // Reiter die Reiter-Leiste oben. "arbeit" trägt bewusst das Label des
  // aktiven Bereichs.

  function hauptkategorien() {
    return [
      { schluessel: "heute", label: "Heute", tabs: ["heute"] },
      { schluessel: "planen", label: "Planen", tabs: ["aufgaben", "kalender", "frei", "planung", "finanzen"] },
      { schluessel: "sammeln", label: "Sammeln", tabs: ["notizen", "links", "reflexion", "spiele", "einheiten", "einkauf", "rezepte", "training", "ernaehrung"] },
      { schluessel: "arbeit", label: BEREICH_NAME[aktiverBereich] || "Weitere", tabs: ["ogsideen", "ogsinventar", "ogsprojekte", "verleih", "raumplanung", "schluessel"] },
      { schluessel: "verwalten", label: "Verwalten", tabs: ["export", "verlauf", "anleitung"] },
    ];
  }

  // Liefert die im aktiven Bereich sichtbaren Reiter einer Themengruppe
  function sichtbareTabsInGruppe(gruppe) {
    return gruppe.tabs.filter((schluessel) => reiterIstSichtbar(aktiverBereich, schluessel));
  }

  // Findet die Themengruppe, zu der ein Reiter gehört
  function gruppeVonTab(schluessel) {
    return hauptkategorien().find((g) => g.tabs.includes(schluessel));
  }

  let wetterOrt = localStorage.getItem("wetter-ort") || "Erftstadt";
  let wetterDaten = null; // letzte erfolgreiche Antwort vom Server
  let wetterAusblickOffen = false; // 5-Tage-Ausblick auf dem Start-Screen aufgeklappt?
  // Zeitleiste auf dem Start-Screen: welche Tagesgruppen sind aufgeklappt?
  // Schlüssel: "heute", ISO-Datum eines überfälligen Tags oder "aelter".
  // Standard: nur "Heute" offen. Gilt bis zum Neuladen der App.
  const zlGruppenOffen = new Set(["heute"]);
  let wetterLetzterAbruf = 0; // Timestamp (ms), für einfaches Caching
  const WETTER_CACHE_MS = 30 * 60 * 1000; // 30 Minuten

  // Zentraler POST-Aufruf an die Edge Function mit Token und aktivem Bereich; behandelt 401/429/Fehler
  async function api(action, extra = {}) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // aktiver_bereich: ordnet Verlauf-Einträge dem gerade aktiven Bereich zu
      body: JSON.stringify({ action, token, aktiver_bereich: aktiverBereich, ...extra }),
    });
    if (res.status === 401) {
      localStorage.removeItem("aufgaben-token");
      token = "";
      zeigeLogin("Bitte erneut anmelden.");
      throw new Error("unauthorized");
    }
    if (res.status === 429) {
      const daten = await res.json().catch(() => ({}));
      zeigeLogin(daten.error || "Zu viele Fehlversuche. Bitte kurz warten.");
      throw new Error("rate-limited");
    }
    if (!res.ok) {
      const daten = await res.json().catch(() => ({}));
      throw new Error(daten.error || "Serverfehler");
    }
    return res.json();
  }

  // ==========================================================
  // Farbwelt je Bereich: setzt data-bereich am <html>-Element (die
  // Farben stehen als Variablen in style.css), die Statusleisten-Farbe
  // und ggf. das Bereichs-Logo in der Kopfzeile. Neues Logo = Datei
  // unter icons/ ablegen und hier eintragen.
  // ==========================================================
  const BEREICH_FARBWELT = ["privat", "ogs", "awo", "business"];
  const BEREICH_THEME_FARBE = { neutral: "#1b1b1b", privat: "#10233f", ogs: "#1e3a5c", awo: "#3b1215", business: "#1e3a5f" };
  const BEREICH_LOGO = {
    privat: { src: "icons/privat.png", alt: "Privat" },
    ogs: { src: "icons/rapunzel.png", alt: "Rapunzel Kinderhaus e.V." },
    awo: { src: "icons/awo-liblar.png", alt: "AWO Ortsverein Liblar-Köttingen e.V." },
    business: { src: "icons/zwischenkaffeeundchaos-herz.png", alt: "zwischenkaffeeundchaos" },
  };

  // Setzt Farbwelt, Statusleisten-Farbe und Logo/Namen in der Kopfzeile passend zum Bereich
  function farbweltAnwenden(bereich) {
    const welt = BEREICH_FARBWELT.includes(bereich) ? bereich : "neutral";
    document.documentElement.dataset.bereich = welt;
    statusleisteFaerben();
    const logo = document.getElementById("topbar-logo");
    const name = document.getElementById("brand-name");
    const eintrag = BEREICH_LOGO[welt];
    if (logo) {
      if (eintrag) {
        logo.src = eintrag.src;
        logo.alt = eintrag.alt;
      } else {
        logo.removeAttribute("src");
        logo.alt = "";
      }
      logo.classList.toggle("hidden", !eintrag);
    }
    // Mit Logo ersetzt das Logo den Dashboard-Namen in der Kopfzeile
    if (name) name.classList.toggle("hidden", !!eintrag);
  }

  // Statusleiste (theme-color): hell in der dunklen Leistenfarbe des Bereichs,
  // im Dunkelmodus in der Hintergrundfarbe – beides aus style.css gelesen
  function statusleisteFaerben() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const welt = document.documentElement.dataset.bereich || "neutral";
    let farbe = BEREICH_THEME_FARBE[welt] || BEREICH_THEME_FARBE.neutral;
    if (document.documentElement.dataset.schema === "dunkel") {
      farbe = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || farbe;
    }
    meta.setAttribute("content", farbe);
  }

  // ==========================================================
  // Darstellung Hell/Dunkel (seit Session 34, Redesign Etappe 4).
  // farbschema.js setzt data-schema schon im <head>; hier die Auswahl im
  // ⋮-Menü und das Mitgehen, wenn das Gerät bei „Auto“ umschaltet.
  // ==========================================================
  function farbschemaWahl() {
    let wahl = "auto";
    try { wahl = localStorage.getItem("farbschema") || "auto"; } catch (e) { /* privater Modus */ }
    return ["auto", "hell", "dunkel"].includes(wahl) ? wahl : "auto";
  }
  const dunkelAbfrage = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  // Setzt data-schema nach Auswahl (Auto = Gerät) und markiert die Knöpfe im Menü
  function farbschemaAnwenden() {
    const wahl = farbschemaWahl();
    const dunkel = wahl === "dunkel" || (wahl === "auto" && !!dunkelAbfrage && dunkelAbfrage.matches);
    document.documentElement.dataset.schema = dunkel ? "dunkel" : "hell";
    document.querySelectorAll(".menu-schema-knopf").forEach((k) => {
      const an = k.dataset.schemaWahl === wahl;
      k.classList.toggle("aktiv", an);
      k.setAttribute("aria-pressed", String(an));
    });
    statusleisteFaerben();
  }
  window.farbschemaSetzen = function(wahl) {
    try { localStorage.setItem("farbschema", wahl); } catch (e) { /* privater Modus */ }
    farbschemaAnwenden();
  };
  document.querySelectorAll(".menu-schema-knopf").forEach((k) => {
    k.addEventListener("click", (e) => { e.stopPropagation(); window.farbschemaSetzen(k.dataset.schemaWahl); });
  });
  if (dunkelAbfrage) {
    const mitgehen = () => { if (farbschemaWahl() === "auto") farbschemaAnwenden(); };
    if (dunkelAbfrage.addEventListener) dunkelAbfrage.addEventListener("change", mitgehen);
    else if (dunkelAbfrage.addListener) dunkelAbfrage.addListener(mitgehen);
  }
  farbschemaAnwenden();

  // Zeigt das heutige Datum ausgeschrieben auf der Willkommensseite an
  function willkommenDatumAnzeigen() {
    const el = document.getElementById("willkommen-datum");
    if (el) el.textContent = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  }

  // Zeigt den Login-Screen (neutrale Farbwelt) mit optionaler Fehlermeldung
  function zeigeLogin(fehler) {
    farbweltAnwenden("neutral");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("bereich-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("login-error").textContent = fehler || "";
  }

  // Zeigt die Bereichsauswahl (Willkommensseite) und blendet Login und App aus
  function zeigeBereichAuswahl() {
    farbweltAnwenden("neutral");
    willkommenDatumAnzeigen();
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("bereich-screen").classList.remove("hidden");
  }

  // Blendet die App ein, setzt Name, Untertitel und Farbwelt des aktiven Bereichs
  function zeigeApp() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("bereich-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    dashboardNameAnzeigen();
    untertitelAnzeigen();
    farbweltAnwenden(aktiverBereich);
  }

  // ==========================================================
  // Navigation: Leiste unten (Themen) + Reiter-Leiste oben (Reiter im
  // aktuellen Thema). Ersetzt die frühere Kachel-Navigation
  // Bereich -> Thema -> Reiter. Die Bereichswahl läuft über den
  // Bereichs-Knopf oben links (bzw. ⋮-Menü).
  // ==========================================================
  // Linien-Icon aus dem Sprite in index.html (seit Session 35, Icons Etappe A).
  // Rein dekorativ (aria-hidden) – die Beschriftung kommt vom Knopf (aria-label oder Text).
  function ic(name, klasse = "") {
    return `<svg class="ic${klasse ? " " + klasse : ""}" aria-hidden="true" focusable="false"><use href="#ic-${name}"></use></svg>`;
  }
  const SVG_ATTR = 'width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const NAV_ICON = {
    heute: `<svg ${SVG_ATTR}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    planen: `<svg ${SVG_ATTR}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
    sammeln: `<svg ${SVG_ATTR}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`,
    arbeit: `<svg ${SVG_ATTR}><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/></svg>`,
    verwalten: `<svg ${SVG_ATTR}><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>`,
  };
  const BEREICH_KNOPF_TEXT = { privat: "Privat", ogs: "OGS", awo: "AWO", business: "Business", verwaltung: "Verwaltung" };

  // Liefert die Themengruppen, die im aktiven Bereich mindestens einen sichtbaren Reiter haben
  function sichtbareGruppen() {
    return hauptkategorien().filter((g) => sichtbareTabsInGruppe(g).length > 0);
  }

  // Zuletzt geöffneter Reiter je Bereich + Thema, damit ein Tipp auf ein
  // Thema dort weitermacht, wo du zuletzt warst.
  function letzterReiterSchluessel(gruppe) {
    return `letzter-reiter-${aktiverBereich}-${gruppe}`;
  }

  // Ermittelt den Start-Reiter: "heute", sonst den ersten sichtbaren Reiter
  function ersterSichtbarerReiter() {
    if (reiterIstSichtbar(aktiverBereich, "heute")) return "heute";
    const gruppe = sichtbareGruppen()[0];
    return gruppe ? sichtbareTabsInGruppe(gruppe)[0] : "heute";
  }

  // Öffnet eine Themengruppe beim zuletzt gemerkten oder ersten sichtbaren Reiter
  window.gruppeOeffnen = function(schluessel) {
    const gruppe = hauptkategorien().find((g) => g.schluessel === schluessel);
    if (!gruppe) return;
    const sichtbar = sichtbareTabsInGruppe(gruppe);
    if (sichtbar.length === 0) return;
    const gemerkt = localStorage.getItem(letzterReiterSchluessel(schluessel));
    tabWechseln(sichtbar.includes(gemerkt) ? gemerkt : sichtbar[0]);
  };

  // ==========================================================
  // Bereichsumschalter oben links (seit Session 34): vier Punkte in den
  // Bereichsfarben, der aktive Bereich ist beschriftet. Ein Tipp wechselt
  // direkt den Bereich – ohne Umweg über die Willkommensseite. Die Farben
  // sind fest (nicht aus der Farbwelt), damit jeder Punkt in jedem Bereich
  // gleich aussieht. Weiße Schrift auf allen vier Farben: Kontrast 5,1–5,9:1.
  // ==========================================================
  const BEREICH_UMSCHALTER = [
    { bereich: "privat", name: "Privat", lang: "Privat", farbe: "#2a5bd7", ring: "#2a5bd7" },
    { bereich: "ogs", name: "OGS", lang: "OGS Rapunzel", farbe: "#1872b8", ring: "#ffcc00" },
    { bereich: "awo", name: "AWO", lang: "AWO OV Liblar", farbe: "#c8102e", ring: "#c8102e" },
    { bereich: "business", name: "Business", lang: "Business (zwischenkaffeeundchaos)", farbe: "#c2410c", ring: "#c2410c" },
  ];

  // Zeichnet den Bereichsumschalter in der Kopfzeile neu (aktiver Bereich mit Namen)
  function renderBereichUmschalter() {
    const el = document.getElementById("bereich-umschalter");
    if (!el) return;
    el.innerHTML = BEREICH_UMSCHALTER.map((b) => {
      const aktiv = b.bereich === aktiverBereich;
      const titel = aktiv ? `${b.lang} – zum Start` : `Zu ${b.lang} wechseln`;
      return `<button type="button" class="bu-knopf${aktiv ? " aktiv" : ""}" style="--bu-farbe:${b.farbe}; --bu-ring:${b.ring};"
        onclick="bereichDirektWechseln('${b.bereich}')" title="${escapeHtml(titel)}" aria-label="${escapeHtml(titel)}"${aktiv ? ' aria-current="true"' : ""}>
        <span class="bu-punkt" aria-hidden="true"></span>${aktiv ? `<span class="bu-name">${escapeHtml(b.name)}</span>` : ""}
      </button>`;
    }).join("");
  }

  // Wechselt per Umschalter den Bereich; ein Tipp auf den aktiven Bereich führt zu seinem Start
  window.bereichDirektWechseln = function(bereich) {
    if (bereich === aktiverBereich) {
      tabWechseln(ersterSichtbarerReiter());
      return;
    }
    window.bereichAuswaehlen(bereich);
  };

  // Öffnet die App direkt im zuletzt genutzten Bereich (Verwaltung zählt nicht, dann Privat)
  function appImLetztenBereichOeffnen() {
    const gemerkt = localStorage.getItem("aktiver-bereich");
    const bereich = BEREICH_FARBWELT.includes(gemerkt) ? gemerkt : "privat";
    zeigeApp();
    window.bereichAuswaehlen(bereich);
  }

  // Rendert untere Themenleiste und obere Reiter-Leiste; in der Verwaltung ohne Navigation
  function renderNavigation() {
    renderBereichUmschalter();
    renderMenuVerwalten();

    const nav = document.getElementById("bottom-nav");
    const leiste = document.getElementById("reiter-leiste");
    const main = document.querySelector("#app main");
    if (!nav || !leiste) return;

    // Verwaltung hat nur einen Reiter – keine Navigation nötig
    if (aktiverBereich === "verwaltung") {
      nav.classList.add("hidden");
      leiste.classList.add("hidden");
      if (main) main.classList.remove("mit-nav");
      return;
    }
    nav.classList.remove("hidden");
    if (main) main.classList.add("mit-nav");

    const aktiveGruppe = gruppeVonTab(aktiverTab);
    // „Verwalten“ steht seit Etappe 3 im ⋮-Menü; sein Platz geht an „+“ in der Mitte
    const gruppen = sichtbareGruppen().filter((g) => g.schluessel !== "verwalten");
    const knoepfe = gruppen.map((g) => {
      const aktiv = aktiveGruppe && aktiveGruppe.schluessel === g.schluessel;
      return `<button class="bottom-nav-btn${aktiv ? " aktiv" : ""}" onclick="gruppeOeffnen('${g.schluessel}')"
        aria-label="${escapeHtml(g.label)}" title="${escapeHtml(g.label)}"${aktiv ? ' aria-current="page"' : ""}>
        ${NAV_ICON[g.schluessel] || NAV_ICON.verwalten}${aktiv ? `<span class="bottom-nav-label">${escapeHtml(g.label)}</span>` : ""}
      </button>`;
    });
    const plus = `<button class="bottom-nav-plus" id="btn-schnell" onclick="schnellOeffnen()" aria-label="Schnell erfassen" title="Schnell erfassen" aria-haspopup="dialog">${SCHNELL_PLUS_ICON}</button>`;
    knoepfe.splice(Math.ceil(knoepfe.length / 2), 0, plus);
    nav.innerHTML = knoepfe.join("");

    const reiter = aktiveGruppe ? sichtbareTabsInGruppe(aktiveGruppe) : [];
    if (reiter.length > 1) {
      leiste.classList.remove("hidden");
      leiste.innerHTML = reiter.map((schluessel) => {
        const eintrag = ALLE_REITER.find(([s]) => s === schluessel);
        const label = eintrag ? eintrag[1] : schluessel;
        const aktiv = schluessel === aktiverTab;
        return `<button class="reiter-chip${aktiv ? " aktiv" : ""}" onclick="tabWechseln('${schluessel}')"${aktiv ? ' aria-current="page"' : ""}>${escapeHtml(label)}</button>`;
      }).join("");
      const aktivChip = leiste.querySelector(".reiter-chip.aktiv");
      if (aktivChip) aktivChip.scrollIntoView({ block: "nearest", inline: "nearest" });
    } else {
      leiste.classList.add("hidden");
      leiste.innerHTML = "";
    }
  }

  // Wechselt den aktiven Bereich, schließt offene Rezept-Zustände und rendert alles neu
  window.bereichAuswaehlen = function(bereich) {
    aktiverBereich = bereich;
    localStorage.setItem("aktiver-bereich", bereich);
    farbweltAnwenden(bereich);
    // Offenes Rezept-Formular gehört zum alten Bereich – schließen
    rezeptFormId = null;
    rezeptOffenId = null;
    rezeptEinkaufId = null;
    rezeptEinkaufAuswahl = new Set();
    if (kochmodus) window.kochmodusSchliessen();
    rezeptFormRendern();
    bereichAnwenden();
    render();
    renderNotizen();
    renderKalender();
    renderHeute();
    renderOgsIdeen();
    renderReiterVerwaltung();
    if (bereich === "verwaltung") {
      tabWechseln("reiterverwaltung");
    } else {
      tabWechseln(ersterSichtbarerReiter());
    }
  };

  // ==========================================================
  // Einheiten planen (seit Session 37, Etappe 4): Spiele aus der Kartei und
  // eigene Programmpunkte zu einem Ablauf mit Zeiten zusammenstellen,
  // Materialliste zum Abhaken, Drucken, Kopieren, nach der Einheit
  // Reflexion und Spiele bewerten. Daten: einheiten, einheit_bausteine.
  // ==========================================================
  function einheitenAktuell() {
    return (einheiten || []).filter((e) => bereichVon(e) === aktiverBereich);
  }
  function einheitBausteineVon(id) {
    return einheitBausteine.filter((b) => String(b.einheit_id) === String(id)).sort((a, b) => a.position - b.position);
  }
  function spielVon(id) {
    return spiele.find((s) => String(s.id) === String(id));
  }
  function bausteinTitel(b) {
    const s = b.spiel_id && spielVon(b.spiel_id);
    if (s) return s.titel;
    return b.titel || (b.spiel_id ? "Spiel (gelöscht)" : "Programmpunkt");
  }
  // Erste Zahl aus dem Dauer-Text eines Spiels („10–15 Min.“ → 10), sonst 15
  function spielDauerMinuten(s) {
    const m = String((s && s.dauer) || "").match(/\d+/);
    return m ? Math.min(600, Number(m[0])) : 15;
  }
  function uhrPlus(hhmm, minuten) {
    const [h, m] = String(hhmm).slice(0, 5).split(":").map(Number);
    const ges = ((h * 60 + m + minuten) % 1440 + 1440) % 1440;
    return `${String(Math.floor(ges / 60)).padStart(2, "0")}:${String(ges % 60).padStart(2, "0")}`;
  }
  function minutenText(min) {
    if (min < 60) return `${min} Min.`;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
  }
  // Materialliste: Material der Spiele (an Komma, Semikolon, Zeilenumbruch getrennt) plus eigene Punkte
  function einheitMaterial(e) {
    const map = new Map();
    einheitBausteineVon(e.id).forEach((b) => {
      const s = b.spiel_id && spielVon(b.spiel_id);
      if (!s || !s.material) return;
      String(s.material).split(/[,;\n]/).map((x) => x.trim()).filter(Boolean).forEach((x) => {
        const k = x.toLowerCase();
        const v = map.get(k) || { text: x, quellen: [], extra: false };
        if (!v.quellen.includes(s.titel)) v.quellen.push(s.titel);
        map.set(k, v);
      });
    });
    (e.material_extra || []).forEach((x) => {
      const k = String(x).toLowerCase();
      if (map.has(k)) map.get(k).extra = true;
      else map.set(k, { text: x, quellen: [], extra: true });
    });
    const erledigt = new Set((e.material_erledigt || []).map((x) => String(x).toLowerCase()));
    return [...map.entries()].map(([key, v]) => ({ ...v, key, erledigt: erledigt.has(key) }));
  }
  function einheitDatumText(e) {
    if (!e.datum) return "ohne Datum";
    return `${RUECK_WOCHENTAG[new Date(e.datum + "T00:00:00").getDay()]} ${datumDE(e.datum)}${e.uhrzeit ? " · " + String(e.uhrzeit).slice(0, 5) : ""}`;
  }

  function renderEinheiten() {
    const el = document.getElementById("einheiten-bereich");
    if (!el) return;
    if (einheiten === null) {
      el.innerHTML = `<p class="empty-text">Für Einheiten bitte zuerst <code>einheiten_setup.sql</code> in Supabase ausführen und die neue <code>index.ts</code> einspielen.</p>`;
      return;
    }
    const offen = einheitOffenId && einheitenAktuell().find((e) => String(e.id) === String(einheitOffenId));
    if (offen) { el.innerHTML = einheitDetailHtml(offen); einheitDetailBinden(offen); return; }
    einheitOffenId = null;
    const heute = heuteISO();
    const liste = einheitenAktuell();
    const geplant = liste.filter((e) => e.status !== "durchgefuehrt")
      .sort((a, b) => (a.datum ? 0 : 1) - (b.datum ? 0 : 1) || String(a.datum || "").localeCompare(String(b.datum || "")) || a.titel.localeCompare(b.titel, "de"));
    const fertig = liste.filter((e) => e.status === "durchgefuehrt").sort((a, b) => String(b.datum || "").localeCompare(String(a.datum || "")));
    const karte = (e) => {
      const bs = einheitBausteineVon(e.id);
      const dauer = bs.reduce((s, b) => s + (Number(b.dauer_min) || 0), 0);
      const mat = einheitMaterial(e);
      const meta = [einheitDatumText(e), e.ort, e.gruppe].filter(Boolean).map(escapeHtml).join(" · ");
      const vorbei = e.status !== "durchgefuehrt" && e.datum && e.datum < heute;
      return `<button type="button" class="einheit-karte" onclick="einheitOeffnen('${escapeAttr(String(e.id))}')">
          <span class="einheit-karte-titel">${escapeHtml(e.titel)}${vorbei ? ` <span class="badge overdue">vorbei</span>` : ""}</span>
          <span class="notiz-meta">${meta}</span>
          <span class="notiz-meta">${bs.length} ${bs.length === 1 ? "Baustein" : "Bausteine"}${dauer ? ` · ${minutenText(dauer)}` : ""}${mat.length ? ` · Material ${mat.filter((m) => m.erledigt).length}/${mat.length}` : ""}</span>
        </button>`;
    };
    el.innerHTML = (geplant.length || fertig.length ? "" : `<p class="empty-text">Noch keine Einheit. Mit „+ Neue Einheit“ anlegen und dann Spiele aus der Kartei und eigene Programmpunkte zu einem Ablauf zusammenstellen.</p>`) +
      (geplant.length ? `<div class="schnell-label">Geplant</div><div class="einheit-liste">${geplant.map(karte).join("")}</div>` : "") +
      (fertig.length ? `<details class="anleitung-abschnitt einheit-fertig"><summary>Durchgeführt (${fertig.length})</summary><div class="anleitung-text"><div class="einheit-liste">${fertig.map(karte).join("")}</div></div></details>` : "");
  }

  function einheitDetailHtml(e) {
    const bs = einheitBausteineVon(e.id);
    const start = e.uhrzeit ? String(e.uhrzeit).slice(0, 5) : null;
    let lauf = 0;
    const zeilen = bs.map((b, i) => {
      const s = b.spiel_id && spielVon(b.spiel_id);
      const zeit = start ? uhrPlus(start, lauf) : `+${Math.floor(lauf / 60)}:${String(lauf % 60).padStart(2, "0")}`;
      lauf += Number(b.dauer_min) || 0;
      const meta = [];
      if (s && s.kategorie) meta.push(escapeHtml(s.kategorie));
      if (s && Number(s.bewertung)) meta.push("★".repeat(Number(s.bewertung)));
      if (!s && !b.spiel_id) meta.push("eigener Punkt");
      const id = escapeAttr(String(b.id));
      return `<div class="einheit-baustein" data-id="${id}">
          <span class="eb-zeit">${zeit}</span>
          <div class="eb-info">
            <button type="button" class="eb-titel" onclick="blattOeffnen('baustein','${id}')">${escapeHtml(bausteinTitel(b))}</button>
            ${meta.length ? `<span class="notiz-meta">${meta.join(" · ")}</span>` : ""}
            ${b.notiz ? `<span class="eb-notiz">${escapeHtml(b.notiz)}</span>` : ""}
          </div>
          <label class="eb-dauer"><input type="number" min="0" max="600" inputmode="numeric" value="${Number(b.dauer_min) || 0}" data-baustein="${id}" aria-label="Dauer ${escapeAttr(bausteinTitel(b))} in Minuten"><span>Min.</span></label>
          <div class="eb-knoepfe">
            <button type="button" class="task-edit-btn" onclick="bausteinSchieben('${id}', -1)" ${i === 0 ? "disabled" : ""} aria-label="Nach oben">↑</button>
            <button type="button" class="task-edit-btn" onclick="bausteinSchieben('${id}', 1)" ${i === bs.length - 1 ? "disabled" : ""} aria-label="Nach unten">↓</button>
            <button type="button" class="task-delete" onclick="bausteinEntfernen('${id}')" aria-label="Entfernen">${ic("x")}</button>
          </div>
        </div>`;
    }).join("");
    const ende = start ? ` · bis ca. ${uhrPlus(start, lauf)}` : "";
    const mat = einheitMaterial(e);
    const eid = escapeAttr(String(e.id));
    const matHtml = mat.map((m) => `
        <label class="einheit-material${m.erledigt ? " erledigt" : ""}">
          <input type="checkbox" data-material="${escapeAttr(m.key)}"${m.erledigt ? " checked" : ""}>
          <span class="em-text">${escapeHtml(m.text)}${m.quellen.length ? `<span class="notiz-meta">${escapeHtml(m.quellen.join(", "))}</span>` : ""}</span>
          ${m.extra && !m.quellen.length ? `<button type="button" class="task-delete" onclick="event.preventDefault(); einheitMaterialEntfernen('${escapeAttr(m.key)}')" aria-label="${escapeAttr(m.text)} entfernen">${ic("x")}</button>` : ""}
        </label>`).join("");
    const spieleDrin = [...new Map(bs.filter((b) => b.spiel_id && spielVon(b.spiel_id)).map((b) => [String(b.spiel_id), spielVon(b.spiel_id)])).values()];
    const reflSicht = reiterIstSichtbar(aktiverBereich, "reflexion");
    const fertig = e.status === "durchgefuehrt";
    const sterne = spieleDrin.length ? `<div class="einheit-sterne">${spieleDrin.map((s) => `<div class="einheit-stern-zeile"><span>${escapeHtml(s.titel)}</span>${spielSterne(s)}</div>`).join("")}</div>` : "";
    const nachher = fertig
      ? `<p class="rueck-satz">${ic("ok-kreis")} Durchgeführt${e.reflexion ? ":" : "."}</p>${e.reflexion ? `<p class="einheit-reflexion">${escapeHtml(e.reflexion)}</p>` : ""}
         ${spieleDrin.length ? `<div class="schnell-label">Spiele bewerten</div>${sterne}` : ""}
         <button type="button" class="btn-secondary" onclick="einheitAbschliessen('${eid}', 'geplant')">Wieder auf „geplant“</button>`
      : `<textarea id="einheit-refl" class="schnell-notiz" rows="3" placeholder="Wie lief es? Was würdest du nächstes Mal anders machen?"></textarea>
         ${reflSicht ? `<label class="fin-prognose-haken"><input type="checkbox" id="einheit-refl-auch" checked> auch als Reflexion speichern</label>` : ""}
         ${spieleDrin.length ? `<div class="schnell-label">Spiele bewerten</div>${sterne}` : ""}
         <button type="button" class="btn-primary" onclick="einheitAbschliessen('${eid}', 'durchgefuehrt')">Als durchgeführt speichern</button>`;
    return `
      <button type="button" class="link-btn einheit-zurueck" onclick="einheitSchliessen()">${ic("zurueck")}<span>Alle Einheiten</span></button>
      <div class="einheit-kopf">
        <h2>${escapeHtml(e.titel)}${fertig ? ` <span class="badge">durchgeführt</span>` : ""}</h2>
        <p class="notiz-meta">${[einheitDatumText(e), e.ort, e.gruppe].filter(Boolean).map(escapeHtml).join(" · ")}</p>
        ${e.ziel ? `<p class="einheit-ziel"><strong>Ziel:</strong> ${escapeHtml(e.ziel)}</p>` : ""}
        ${e.notiz ? `<p class="notiz-meta">${escapeHtml(e.notiz)}</p>` : ""}
        <div class="row einheit-aktionen">
          <button type="button" class="btn-secondary" onclick="blattOeffnen('einheit','${eid}')">${ic("stift")}Bearbeiten</button>
          <button type="button" class="btn-secondary" onclick="einheitKopieren('${eid}')">${ic("kopieren")}Kopieren</button>
          <button type="button" class="btn-secondary" onclick="einheitDrucken('${eid}')">${ic("drucken")}Drucken</button>
        </div>
      </div>
      <section class="einheit-block">
        <h3>Ablauf</h3>
        ${zeilen || `<p class="notiz-meta">Noch leer – füge Spiele aus der Kartei oder eigene Programmpunkte hinzu.</p>`}
        ${bs.length ? `<p class="einheit-summe">Gesamt ${minutenText(lauf)}${ende}</p>` : ""}
        <div class="row einheit-aktionen">
          <button type="button" class="btn-primary" onclick="einheitSpielAuswahl('${eid}')">${ic("plus")}Spiel aus der Kartei</button>
          <button type="button" class="btn-secondary" onclick="blattNeu('baustein', { einheit_id: '${eid}', dauer_min: 10 })">${ic("plus")}Eigener Punkt</button>
        </div>
      </section>
      <section class="einheit-block">
        <h3>Material${mat.length ? ` <span class="such-gruppe-zahl">${mat.filter((m) => m.erledigt).length}/${mat.length}</span>` : ""}</h3>
        ${matHtml || `<p class="notiz-meta">Kommt automatisch aus dem Material der Spiele – oder hier ergänzen.</p>`}
        <div class="row einheit-material-neu">
          <input type="text" id="einheit-material-neu" placeholder="z. B. Erste-Hilfe-Set, Getränke" maxlength="80" autocomplete="off">
          <button type="button" class="btn-secondary" onclick="einheitMaterialHinzu('${eid}')">${ic("plus")}Material</button>
        </div>
      </section>
      <section class="einheit-block">
        <h3>Nach der Einheit</h3>
        ${nachher}
      </section>`;
  }

  // Dauer ändern (beim Verlassen des Feldes) und Material abhaken
  function einheitDetailBinden(e) {
    document.querySelectorAll("#einheiten-bereich [data-baustein]").forEach((feld) => {
      feld.addEventListener("change", async () => {
        const b = einheitBausteine.find((x) => String(x.id) === feld.dataset.baustein);
        if (!b) return;
        const wert = Math.max(0, Math.min(600, Math.round(Number(feld.value) || 0)));
        b.dauer_min = wert;
        renderEinheiten();
        try { await api("baustein_aktualisieren", { id: b.id, dauer_min: wert }); }
        catch (err) { alert("Dauer nicht gespeichert: " + (err.message || "Fehler")); await ladeDaten(); }
      });
    });
    document.querySelectorAll("#einheiten-bereich [data-material]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const liste = new Set((e.material_erledigt || []).map((x) => String(x).toLowerCase()));
        if (cb.checked) liste.add(cb.dataset.material); else liste.delete(cb.dataset.material);
        e.material_erledigt = [...liste];
        renderEinheiten();
        api("einheit_material", { id: e.id, material_erledigt: e.material_erledigt })
          .catch((err) => alert("Nicht gespeichert: " + (err.message || "Fehler")));
      });
    });
    const neu = document.getElementById("einheit-material-neu");
    if (neu) neu.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.isComposing) { ev.preventDefault(); window.einheitMaterialHinzu(String(e.id)); } });
  }

  window.einheitNeu = function() {
    if (einheiten === null) {
      alert("Für Einheiten bitte zuerst einheiten_setup.sql in Supabase ausführen und die neue index.ts einspielen.");
      return;
    }
    window.blattNeu("einheit", {});
  };
  window.einheitOeffnen = function(id) {
    einheitOffenId = id;
    renderEinheiten();
    window.scrollTo(0, 0);
  };
  window.einheitSchliessen = function() {
    einheitOffenId = null;
    renderEinheiten();
  };
  window.bausteinSchieben = async function(id, richtung) {
    const b = einheitBausteine.find((x) => String(x.id) === String(id));
    if (!b) return;
    const liste = einheitBausteineVon(b.einheit_id);
    const i = liste.indexOf(b), j = i + richtung;
    if (j < 0 || j >= liste.length) return;
    [liste[i], liste[j]] = [liste[j], liste[i]];
    liste.forEach((x, k) => { x.position = k; });
    renderEinheiten();
    try { await api("bausteine_reihenfolge", { einheit_id: b.einheit_id, ids: liste.map((x) => x.id) }); }
    catch (err) { alert("Reihenfolge nicht gespeichert: " + (err.message || "Fehler")); await ladeDaten(); }
  };
  window.bausteinEntfernen = async function(id) {
    const b = einheitBausteine.find((x) => String(x.id) === String(id));
    if (!b || !confirm(`„${bausteinTitel(b)}“ aus dem Ablauf entfernen?`)) return;
    await api("baustein_loeschen", { id });
    await ladeDaten();
  };
  window.einheitMaterialHinzu = async function(id) {
    const e = (einheiten || []).find((x) => String(x.id) === String(id));
    const feld = document.getElementById("einheit-material-neu");
    const text = feld ? feld.value.trim() : "";
    if (!e || !text) return;
    e.material_extra = [...(e.material_extra || []), text];
    renderEinheiten();
    const neu = document.getElementById("einheit-material-neu");
    if (neu) neu.focus();
    try { await api("einheit_material", { id: e.id, material_extra: e.material_extra }); }
    catch (err) { alert("Nicht gespeichert: " + (err.message || "Fehler")); await ladeDaten(); }
  };
  window.einheitMaterialEntfernen = async function(key) {
    const e = (einheiten || []).find((x) => String(x.id) === String(einheitOffenId));
    if (!e) return;
    e.material_extra = (e.material_extra || []).filter((x) => String(x).toLowerCase() !== key);
    e.material_erledigt = (e.material_erledigt || []).filter((x) => String(x).toLowerCase() !== key);
    renderEinheiten();
    try { await api("einheit_material", { id: e.id, material_extra: e.material_extra, material_erledigt: e.material_erledigt }); }
    catch (err) { alert("Nicht gespeichert: " + (err.message || "Fehler")); await ladeDaten(); }
  };
  window.einheitKopieren = async function(id) {
    const erg = await api("einheit_kopieren", { id });
    if (erg && erg.id) einheitOffenId = erg.id;
    await ladeDaten();
    hinweisZeigen("Kopie angelegt – Datum eintragen über „Bearbeiten“");
  };
  window.einheitAbschliessen = async function(id, status) {
    const e = (einheiten || []).find((x) => String(x.id) === String(id));
    if (!e) return;
    const feld = document.getElementById("einheit-refl");
    const text = feld ? feld.value.trim() : (e.reflexion || "");
    const auch = document.getElementById("einheit-refl-auch");
    await api("einheit_abschliessen", { id, status, reflexion: status === "durchgefuehrt" ? text : e.reflexion });
    if (status === "durchgefuehrt" && text && auch && auch.checked) {
      const heute = heuteISO();
      const datum = e.datum && e.datum <= heute ? e.datum : heute;
      await api("reflexion_hinzufuegen", { text: `Einheit „${e.titel}“: ${text}`, datum, bereich: aktiverBereich });
    }
    await ladeDaten();
    hinweisZeigen(status === "durchgefuehrt" ? "Einheit als durchgeführt gespeichert" : "Wieder geplant");
  };

  // Auswahl aus der Spielekartei (eigenes Blatt, bleibt für mehrere Spiele offen)
  let einheitAuswahlId = null;
  window.einheitSpielAuswahl = function(id) {
    einheitAuswahlId = id;
    const dlg = document.getElementById("einheit-spiel-dialog");
    if (!dlg) return;
    document.getElementById("einheit-spiel-suche").value = "";
    document.getElementById("einheit-spiel-status").textContent = "";
    einheitSpielListe();
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
    document.getElementById("einheit-spiel-suche").focus();
  };
  window.einheitSpielAuswahlSchliessen = function() {
    const dlg = document.getElementById("einheit-spiel-dialog");
    if (dlg && dlg.open && typeof dlg.close === "function") dlg.close(); else if (dlg) dlg.removeAttribute("open");
  };
  function einheitSpielListe() {
    const box = document.getElementById("einheit-spiel-liste");
    const eingabe = document.getElementById("einheit-spiel-suche").value;
    const woerter = suchNorm(eingabe).split(/\s+/).filter(Boolean);
    const drin = new Set(einheitBausteineVon(einheitAuswahlId).map((b) => String(b.spiel_id)));
    const liste = spiele.filter((s) => {
      const text = suchNorm([s.titel, s.kategorie, s.beschreibung, s.material].join(" "));
      return woerter.every((w) => text.includes(w));
    }).sort((a, b) => (Number(b.bewertung) || 0) - (Number(a.bewertung) || 0) || String(a.titel).localeCompare(String(b.titel), "de"));
    if (!spiele.length) { box.innerHTML = `<p class="empty-text">Die Spielekartei ist noch leer.</p>`; return; }
    if (!liste.length) { box.innerHTML = `<p class="empty-text">Kein Spiel gefunden.</p>`; return; }
    box.innerHTML = liste.slice(0, 60).map((s) => {
      const meta = [s.kategorie, s.dauer, s.altersgruppe, Number(s.bewertung) ? "★".repeat(Number(s.bewertung)) : ""].filter(Boolean).map(escapeHtml).join(" · ");
      return `<button type="button" class="such-treffer" onclick="einheitSpielNehmen('${escapeAttr(String(s.id))}')">
          <span class="such-titel">${drin.has(String(s.id)) ? "✓ " : ""}${suchMarkieren(s.titel, woerter, 90)}</span>
          ${meta ? `<span class="notiz-meta such-meta">${meta}</span>` : ""}
          ${s.material ? `<span class="such-auszug">${ic("werkzeug")} ${escapeHtml(s.material)}</span>` : ""}
        </button>`;
    }).join("") + (liste.length > 60 ? `<p class="notiz-meta">${liste.length - 60} weitere – Suchbegriff eingrenzen.</p>` : "");
  }
  window.einheitSpielNehmen = async function(spielId) {
    const s = spielVon(spielId);
    if (!s || !einheitAuswahlId) return;
    const status = document.getElementById("einheit-spiel-status");
    status.textContent = "Füge hinzu …";
    try {
      await api("baustein_hinzufuegen", { einheit_id: einheitAuswahlId, spiel_id: s.id, dauer_min: spielDauerMinuten(s) });
    } catch (err) {
      status.textContent = "Nicht hinzugefügt: " + (err.message || "Fehler");
      return;
    }
    await ladeDaten();
    status.textContent = `„${s.titel}“ hinzugefügt (${spielDauerMinuten(s)} Min.) – weitere antippen oder schließen.`;
    einheitSpielListe();
  };
  (function einheitAuswahlEinrichten() {
    const dlg = document.getElementById("einheit-spiel-dialog");
    const feld = document.getElementById("einheit-spiel-suche");
    if (!dlg || !feld) return;
    feld.addEventListener("input", einheitSpielListe);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) window.einheitSpielAuswahlSchliessen(); });
  })();

  // Ablaufplan drucken (Druckdialog, dort auch „Als PDF speichern“)
  window.einheitDrucken = function(id) {
    const e = (einheiten || []).find((x) => String(x.id) === String(id));
    if (!e) return;
    const bs = einheitBausteineVon(e.id);
    const start = e.uhrzeit ? String(e.uhrzeit).slice(0, 5) : null;
    let lauf = 0;
    const zellen = "border:1px solid #999; padding:5px 7px; vertical-align:top; font-size:10.5pt;";
    const zeilen = bs.map((b) => {
      const s = b.spiel_id && spielVon(b.spiel_id);
      const zeit = start ? uhrPlus(start, lauf) : `+${lauf} Min.`;
      lauf += Number(b.dauer_min) || 0;
      const info = [s && s.material ? "Material: " + s.material : "", b.notiz || "", s && s.beschreibung ? s.beschreibung.slice(0, 300) + (s.beschreibung.length > 300 ? " …" : "") : ""].filter(Boolean);
      return `<tr><td style="${zellen} white-space:nowrap;">${zeit}</td><td style="${zellen} white-space:nowrap;">${Number(b.dauer_min) || 0} Min.</td>
        <td style="${zellen}"><strong>${escapeHtml(bausteinTitel(b))}</strong>${info.map((x) => `<div style="margin-top:3px; color:#333;">${escapeHtml(x)}</div>`).join("")}</td></tr>`;
    }).join("");
    const mat = einheitMaterial(e);
    htmlDrucken(`<div style="font-family: Arial, sans-serif; color:#000; max-width:180mm;">
      <h1 style="font-size:17pt; margin:0 0 4px;">${escapeHtml(e.titel)}</h1>
      <p style="margin:0 0 8px; font-size:10.5pt;">${[einheitDatumText(e), e.ort, e.gruppe].filter(Boolean).map(escapeHtml).join(" · ")}</p>
      ${e.ziel ? `<p style="margin:0 0 10px; font-size:10.5pt;"><strong>Ziel:</strong> ${escapeHtml(e.ziel)}</p>` : ""}
      <table style="border-collapse:collapse; width:100%; margin-top:6px;">
        <thead><tr><th style="${zellen} text-align:left;">Zeit</th><th style="${zellen} text-align:left;">Dauer</th><th style="${zellen} text-align:left;">Programmpunkt</th></tr></thead>
        <tbody>${zeilen || `<tr><td colspan="3" style="${zellen}">–</td></tr>`}</tbody>
      </table>
      <p style="font-size:10.5pt; margin:6px 0 14px;">Gesamt: ${minutenText(lauf)}${start ? ` · bis ca. ${uhrPlus(start, lauf)}` : ""}</p>
      ${mat.length ? `<h2 style="font-size:13pt; margin:10px 0 4px;">Material</h2><ul style="list-style:none; padding:0; margin:0; columns:2; font-size:10.5pt;">${mat.map((m) => `<li style="margin:2px 0;">${m.erledigt ? "☑" : "☐"} ${escapeHtml(m.text)}</li>`).join("")}</ul>` : ""}
      ${e.notiz ? `<h2 style="font-size:13pt; margin:14px 0 4px;">Notiz</h2><p style="font-size:10.5pt; white-space:pre-wrap;">${escapeHtml(e.notiz)}</p>` : ""}
    </div>`);
  };

  // ==========================================================
  // Wochenrückblick (seit Session 37, Etappe 3): Blatt über ⋮-Menü und
  // Karte auf dem Start-Screen (Fr–Mo). Rechnet nur im Browser mit den
  // geladenen Daten des aktiven Bereichs. Abschnitte nur für eingeblendete
  // Reiter. Erledigt-Zeitpunkt: aufgaben.erledigt_am (seit Session 37).
  // ==========================================================
  let rueckWoche = null; // Montag (ISO) der angezeigten Woche
  const RUECK_WOCHENTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  // Fr–So: die laufende Woche, Mo–Do: die Woche davor
  function rueckStandardWoche() {
    const heute = heuteISO();
    const tag = new Date(heute + "T00:00:00").getDay();
    const mo = wochenstartISO(heute);
    return tag === 5 || tag === 6 || tag === 0 ? mo : addTage(mo, -7);
  }
  function kalenderwoche(iso) {
    const d = new Date(iso + "T00:00:00");
    const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const tag = u.getUTCDay() || 7;
    u.setUTCDate(u.getUTCDate() + 4 - tag);
    const jahr = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
    return Math.ceil(((u - jahr) / 86400000 + 1) / 7);
  }
  function rueckTag(iso) {
    return `${RUECK_WOCHENTAG[new Date(iso + "T00:00:00").getDay()]} ${formatDatumKurz(iso)}`;
  }

  // Alle Zahlen einer Woche (Montag mo) für den aktiven Bereich – ohne DOM
  function rueckDaten(mo) {
    const so = addTage(mo, 6);
    const nMo = addTage(mo, 7), nSo = addTage(mo, 13);
    const inWoche = (d) => !!d && d >= mo && d <= so;
    const inNaechster = (d) => !!d && d >= nMo && d <= nSo;
    const b = aktiverBereich;
    const sicht = (tab) => reiterIstSichtbar(b, tab);
    const meine = (liste) => (liste || []).filter((x) => bereichVon(x) === b);
    const nachZeit = (a, c) => String(a.datum || "").localeCompare(String(c.datum || "")) || String(a.uhrzeit || "").localeCompare(String(c.uhrzeit || ""));

    const aufg = meine(aufgaben);
    const erledigtAmBekannt = aufg.length === 0 || aufg.some((a) => Object.prototype.hasOwnProperty.call(a, "erledigt_am"));
    const erledigt = aufg.filter((a) => a.erledigt && a.erledigt_am && inWoche(datumLokalISO(new Date(a.erledigt_am))))
      .sort((a, c) => String(a.erledigt_am).localeCompare(String(c.erledigt_am)));
    const liegen = aufg.filter((a) => !a.erledigt && a.faellig_am && a.faellig_am <= so)
      .sort((a, c) => a.faellig_am.localeCompare(c.faellig_am));
    const termineWoche = sicht("kalender") ? meine(termine).filter((x) => inWoche(x.datum)).sort(nachZeit) : null;

    let train = null;
    if (sicht("training")) {
      const liste = meine(training).filter((x) => inWoche(x.datum));
      train = { anzahl: liste.length, minuten: liste.reduce((s, x) => s + (Number(x.dauer_minuten) || 0), 0),
        ziel: trainingWochenziel(""), sportarten: [...new Set(liste.map((x) => x.sportart).filter(Boolean))] };
    }

    let geld = null;
    if (sicht("finanzen")) {
      const buch = meine(buchungen).filter((x) => x.typ !== "einnahme");
      const woche = buch.filter((x) => inWoche(x.datum));
      const summe = woche.reduce((s, x) => s + finZahl(x.betrag), 0);
      const kats = new Map();
      woche.forEach((x) => kats.set(x.kategorie || "Sonstiges", (kats.get(x.kategorie || "Sonstiges") || 0) + finZahl(x.betrag)));
      // Vergleich: Ø der bis zu 12 Wochen davor, sobald Buchungen so weit zurückreichen (mind. 4 Wochen)
      const erste = buch.reduce((m, x) => (!m || x.datum < m ? x.datum : m), null);
      let schnitt = null;
      if (erste) {
        const ab = Math.max(0, Math.ceil((new Date(mo + "T00:00:00") - new Date(wochenstartISO(erste) + "T00:00:00")) / (7 * 86400000)));
        const wochen = Math.min(12, ab);
        if (wochen >= 4) {
          const von = addTage(mo, -7 * wochen);
          schnitt = buch.filter((x) => x.datum >= von && x.datum < mo).reduce((s, x) => s + finZahl(x.betrag), 0) / wochen;
        }
      }
      geld = { summe, anzahl: woche.length, schnitt, top: [...kats.entries()].sort((a, c) => c[1] - a[1]).slice(0, 3) };
    }

    const wochenziele = b === "privat" && sicht("planung")
      ? ziele.filter((z) => z.zeitraum_typ === "woche" && z.zeitraum_start === mo).map((z) => {
        const schritte = zielSchritte.filter((s) => s.ziel_id === z.id);
        return { z, gesamt: schritte.length, fertig: schritte.filter((s) => s.erledigt).length };
      })
      : null;
    const refl = sicht("reflexion") ? meine(reflexionen).filter((x) => inWoche(x.datum)).sort((a, c) => String(a.datum).localeCompare(String(c.datum))) : null;

    const naechste = {
      termine: sicht("kalender") ? meine(termine).filter((x) => inNaechster(x.datum)).sort(nachZeit) : [],
      aufgaben: aufg.filter((a) => !a.erledigt && inNaechster(a.faellig_am)).sort((a, c) => a.faellig_am.localeCompare(c.faellig_am)),
      vermietungen: sicht("raumplanung") ? meine(raumVermietungen).filter((v) => inNaechster(v.datum)).sort(nachZeit) : [],
      rueckgaben: sicht("schluessel") ? meine(schluesselAusgaben).filter((a) => !a.zurueck_am && inNaechster(a.rueckgabe_bis)) : [],
      einheiten: sicht("einheiten") ? meine(einheiten || []).filter((e) => e.status !== "durchgefuehrt" && inNaechster(e.datum)).sort(nachZeit) : [],
    };
    return { mo, so, nMo, nSo, erledigtAmBekannt, erledigt, liegen, termineWoche, train, geld, wochenziele, refl, naechste };
  }

  function rueckListe(eintraege, zeile, max = 8) {
    if (!eintraege.length) return "";
    const zeigen = eintraege.slice(0, max).map(zeile).join("");
    const rest = eintraege.length > max ? `<li class="rueck-mehr notiz-meta">+ ${eintraege.length - max} weitere</li>` : "";
    return `<ul class="rueck-liste">${zeigen}${rest}</ul>`;
  }

  function rueckRendern() {
    const box = document.getElementById("rueck-inhalt");
    if (!box) return;
    const d = rueckDaten(rueckWoche);
    const heute = heuteISO();
    const istAktuell = rueckWoche === wochenstartISO(heute);
    const titel = `KW ${kalenderwoche(d.mo)} · ${formatDatumKurz(d.mo)}–${formatDatumKurz(d.so)}${istAktuell ? " · diese Woche" : ""}`;
    const zielMontag = d.nMo > heute ? d.nMo : heute;
    const zielText = zielMontag === heute ? "heute" : rueckTag(zielMontag);

    const fazit = [];
    if (d.erledigtAmBekannt) fazit.push(`<span class="rueck-zahl"><strong>${d.erledigt.length}</strong> erledigt</span>`);
    fazit.push(`<span class="rueck-zahl${d.liegen.length ? " warn" : ""}"><strong>${d.liegen.length}</strong> liegen geblieben</span>`);
    if (d.termineWoche) fazit.push(`<span class="rueck-zahl"><strong>${d.termineWoche.length}</strong> ${d.termineWoche.length === 1 ? "Termin" : "Termine"}</span>`);
    if (d.train) fazit.push(`<span class="rueck-zahl"><strong>${d.train.anzahl}</strong> ${d.train.anzahl === 1 ? "Training" : "Trainings"}</span>`);

    const bloecke = [];
    // Erledigt
    bloecke.push(`<section class="rueck-block"><h3>${ic("ok-kreis")} Erledigt</h3>` + (d.erledigtAmBekannt
      ? (d.erledigt.length
        ? rueckListe(d.erledigt, (a) => `<li><span class="rueck-text">${escapeHtml(a.titel)}</span><span class="notiz-meta">${rueckTag(datumLokalISO(new Date(a.erledigt_am)))}</span></li>`)
        : `<p class="notiz-meta">In dieser Woche wurde keine Aufgabe abgehakt.</p>`)
      : `<p class="notiz-meta">Für diese Liste bitte <code>aufgaben_erledigt_am_setup.sql</code> ausführen und die neue <code>index.ts</code> einspielen – gezählt wird ab dann.</p>`) + `</section>`);
    // Liegen geblieben
    if (d.liegen.length) {
      bloecke.push(`<section class="rueck-block"><h3>${ic("warnung")} Liegen geblieben</h3>
        <p class="notiz-meta" style="margin-top:0;">Offen und bis ${formatDatumKurz(d.so)} fällig.</p>` +
        rueckListe(d.liegen, (a) => `<li><button type="button" class="rueck-eintrag" onclick="rueckOeffnen('aufgabe','${escapeAttr(String(a.id))}')"><span class="rueck-text">${escapeHtml(a.titel)}</span><span class="notiz-meta">fällig ${formatDatumKurz(a.faellig_am)}</span></button>
          <button type="button" class="btn-secondary rueck-schieben" onclick="rueckVerschieben(['${escapeAttr(String(a.id))}'])" aria-label="${escapeAttr(a.titel)} auf ${escapeAttr(zielText)} verschieben">→ ${zielMontag === heute ? "heute" : RUECK_WOCHENTAG[1]}</button></li>`, 12) +
        `<button type="button" class="btn-secondary" onclick="rueckVerschieben(null)">${ic("wiederholen")}Alle ${d.liegen.length} auf ${escapeHtml(zielText)}</button></section>`);
    }
    // Termine
    if (d.termineWoche && d.termineWoche.length) {
      bloecke.push(`<section class="rueck-block"><h3>${ic("kalender")} Termine</h3>` +
        rueckListe(d.termineWoche, (x) => `<li><span class="rueck-text">${escapeHtml(x.titel)}</span><span class="notiz-meta">${rueckTag(x.datum)}${x.uhrzeit ? " · " + String(x.uhrzeit).slice(0, 5) : ""}</span></li>`) + `</section>`);
    }
    // Training
    if (d.train) {
      const ziel = d.train.ziel;
      const erreicht = ziel && d.train.anzahl >= ziel;
      bloecke.push(`<section class="rueck-block"><h3>${ic("aktivitaet")} Training</h3>
        <p class="rueck-satz">${d.train.anzahl ? `${d.train.anzahl} ${d.train.anzahl === 1 ? "Training" : "Trainings"}${d.train.minuten ? `, zusammen ${d.train.minuten} Minuten` : ""}${d.train.sportarten.length ? ` (${escapeHtml(d.train.sportarten.join(", "))})` : ""}.` : "Kein Training eingetragen."}
        ${ziel ? (erreicht ? ` Wochenziel ${ziel} erreicht ✓` : ` Wochenziel: ${ziel}.`) : ""}</p></section>`);
    }
    // Geld
    if (d.geld) {
      let satz;
      if (!d.geld.anzahl) satz = "Keine Ausgaben gebucht – kommen die Buchungen per CSV-Import, fehlen sie hier evtl. noch.";
      else {
        satz = `Ausgaben ${finEuro(d.geld.summe)} (${d.geld.anzahl} ${d.geld.anzahl === 1 ? "Buchung" : "Buchungen"})`;
        if (d.geld.schnitt !== null) {
          const diff = d.geld.summe - d.geld.schnitt;
          satz += Math.abs(diff) < Math.max(10, d.geld.schnitt * 0.1)
            ? ` – etwa wie im Schnitt (${finEuro(d.geld.schnitt)} pro Woche).`
            : ` – ${finEuro(Math.abs(diff))} ${diff > 0 ? "mehr" : "weniger"} als im Schnitt (${finEuro(d.geld.schnitt)} pro Woche).`;
        } else satz += ".";
      }
      const top = d.geld.top.length ? `<p class="notiz-meta">Am meisten: ${d.geld.top.map(([k, v]) => `${escapeHtml(k)} ${finEuro(v)}`).join(" · ")}</p>` : "";
      bloecke.push(`<section class="rueck-block"><h3>${ic("statistik")} Geld</h3><p class="rueck-satz">${satz}</p>${top}</section>`);
    }
    // Wochenziele
    if (d.wochenziele && d.wochenziele.length) {
      bloecke.push(`<section class="rueck-block"><h3>${ic("pokal")} Wochenziele</h3>` +
        rueckListe(d.wochenziele, (w) => `<li><span class="rueck-text">${escapeHtml(w.z.titel)}</span><span class="notiz-meta">${w.gesamt ? `${w.fertig} / ${w.gesamt} Schritte${w.fertig === w.gesamt ? " ✓" : ""}` : "ohne Schritte"}</span></li>`) + `</section>`);
    }
    // Reflexion
    if (d.refl) {
      const datum = d.so < heute ? d.so : heute;
      bloecke.push(`<section class="rueck-block"><h3>${ic("stift")} Reflexion</h3>` +
        (d.refl.length ? rueckListe(d.refl, (r) => `<li class="rueck-refl"><span class="notiz-meta">${rueckTag(r.datum)}</span><span class="rueck-text">${escapeHtml(String(r.text || "").slice(0, 160))}${String(r.text || "").length > 160 ? "…" : ""}</span></li>`, 3) : "") +
        `<div class="schnell-chips rueck-impulse" role="group" aria-label="Impulse">
          ${["Was lief gut?", "Was war schwierig?", "Was nehme ich mit?", "Was lasse ich nächste Woche weg?"].map((f) =>
            `<button type="button" class="schnell-chip" onclick="rueckImpuls(this)">${escapeHtml(f)}</button>`).join("")}
        </div>
        <textarea id="rueck-refl-text" class="schnell-notiz" rows="4" placeholder="Wie war die Woche?"></textarea>
        <button type="button" class="btn-secondary" id="rueck-refl-speichern" onclick="rueckReflexionSpeichern('${datum}')">Als Reflexion speichern (${formatDatumKurz(datum)})</button>
        </section>`);
    }
    // Nächste Woche
    const n = d.naechste;
    const nTeile = [];
    if (n.termine.length) nTeile.push(`<h4>Termine</h4>` + rueckListe(n.termine, (x) => `<li><span class="rueck-text">${escapeHtml(x.titel)}</span><span class="notiz-meta">${rueckTag(x.datum)}${x.uhrzeit ? " · " + String(x.uhrzeit).slice(0, 5) : ""}</span></li>`));
    if (n.aufgaben.length) nTeile.push(`<h4>Fällige Aufgaben</h4>` + rueckListe(n.aufgaben, (a) => `<li><span class="rueck-text">${escapeHtml(a.titel)}</span><span class="notiz-meta">${rueckTag(a.faellig_am)}</span></li>`));
    if (n.vermietungen.length) nTeile.push(`<h4>Vermietungen</h4>` + rueckListe(n.vermietungen, (v) => `<li><span class="rueck-text">${escapeHtml(v.mieter || "Vermietung")}</span><span class="notiz-meta">${rueckTag(v.datum)}</span></li>`));
    if (n.einheiten.length) nTeile.push(`<h4>Einheiten</h4>` + rueckListe(n.einheiten, (e) => `<li><span class="rueck-text">${escapeHtml(e.titel)}</span><span class="notiz-meta">${rueckTag(e.datum)}${e.uhrzeit ? " · " + String(e.uhrzeit).slice(0, 5) : ""}</span></li>`));
    if (n.rueckgaben.length) nTeile.push(`<h4>Schlüssel-Rückgaben</h4>` + rueckListe(n.rueckgaben, (a) => `<li><span class="rueck-text">${escapeHtml(a.inhaber || "Schlüssel")}</span><span class="notiz-meta">bis ${rueckTag(a.rueckgabe_bis)}</span></li>`));
    bloecke.push(`<section class="rueck-block"><h3>${ic("weiter")} Nächste Woche · ${formatDatumKurz(d.nMo)}–${formatDatumKurz(d.nSo)}</h3>` +
      (nTeile.length ? nTeile.join("") : `<p class="notiz-meta">Noch nichts eingetragen.</p>`) + `</section>`);

    box.innerHTML = `
      <div class="rueck-nav">
        <button type="button" class="btn-secondary ern-pfeil" onclick="rueckBlaettern(-1)" aria-label="Vorige Woche">${ic("zurueck")}</button>
        <strong class="rueck-titel">${titel}</strong>
        <button type="button" class="btn-secondary ern-pfeil" onclick="rueckBlaettern(1)" aria-label="Nächste Woche"${rueckWoche >= wochenstartISO(heute) ? " disabled" : ""}>${ic("weiter")}</button>
      </div>
      <div class="rueck-fazit">${fazit.join("")}</div>
      ${bloecke.join("")}`;
  }

  window.wochenrueckblickOeffnen = function(mo) {
    const dlg = document.getElementById("rueck-dialog");
    if (!dlg) return;
    if (typeof kontoMenuSchliessen === "function") kontoMenuSchliessen();
    rueckWoche = mo || rueckStandardWoche();
    rueckRendern();
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
    const inhalt = document.getElementById("rueck-inhalt");
    if (inhalt) inhalt.scrollTop = 0;
    dlg.scrollTop = 0;
  };
  window.wochenrueckblickSchliessen = function() {
    const dlg = document.getElementById("rueck-dialog");
    if (!dlg) return;
    if (typeof dlg.close === "function" && dlg.open) dlg.close(); else dlg.removeAttribute("open");
  };
  window.rueckBlaettern = function(richtung) {
    const neu = addTage(rueckWoche, 7 * richtung);
    if (richtung > 0 && neu > wochenstartISO(heuteISO())) return;
    rueckWoche = neu;
    rueckRendern();
  };
  // Tipp auf einen Eintrag: Blatt schließen und den Eintrag bearbeiten
  window.rueckOeffnen = function(typ, id) {
    window.wochenrueckblickSchliessen();
    window.eintragBearbeiten(typ, id);
  };
  // Liegengebliebenes auf den nächsten Montag (bzw. heute) verschieben; ids = null → alle
  window.rueckVerschieben = async function(ids) {
    const d = rueckDaten(rueckWoche);
    const heute = heuteISO();
    const ziel = d.nMo > heute ? d.nMo : heute;
    const liste = ids ? d.liegen.filter((a) => ids.includes(String(a.id))) : d.liegen;
    if (!liste.length) return;
    let fehler = 0;
    for (const a of liste) {
      try {
        await api("aufgabe_aktualisieren", {
          id: a.id, titel: a.titel, projekt_id: a.projekt_id || null, faellig_am: ziel,
          uhrzeit: a.uhrzeit || null, ende_uhrzeit: a.ende_uhrzeit || null, erinnere_alle_tage: a.erinnere_alle_tage || null,
        });
      } catch (e) { fehler++; }
    }
    await ladeDaten();
    rueckRendern();
    hinweisZeigen(fehler ? `${fehler} von ${liste.length} nicht verschoben` : `${liste.length} ${liste.length === 1 ? "Aufgabe" : "Aufgaben"} auf ${ziel === heute ? "heute" : rueckTag(ziel)} verschoben`);
  };
  window.rueckImpuls = function(knopf) {
    const feld = document.getElementById("rueck-refl-text");
    if (!feld) return;
    const zeile = knopf.textContent.trim() + " ";
    feld.value = feld.value ? feld.value.replace(/\s*$/, "") + "\n" + zeile : zeile;
    feld.focus();
    feld.setSelectionRange(feld.value.length, feld.value.length);
  };
  window.rueckReflexionSpeichern = async function(datum) {
    const feld = document.getElementById("rueck-refl-text");
    const text = feld ? feld.value.trim() : "";
    if (!text) { if (feld) feld.focus(); return; }
    const knopf = document.getElementById("rueck-refl-speichern");
    if (knopf) knopf.disabled = true;
    try {
      await api("reflexion_hinzufuegen", { text, datum, bereich: aktiverBereich });
    } catch (e) {
      if (knopf) knopf.disabled = false;
      alert("Nicht gespeichert: " + (e.message || "Fehler"));
      return;
    }
    await ladeDaten();
    rueckRendern();
    hinweisZeigen("Reflexion gespeichert");
  };

  // Karte auf dem Start-Screen (Fr–Mo, bis „Später“ für diese Woche)
  function heuteRueckblickHtml() {
    if (aktiverBereich === "verwaltung") return "";
    const tag = new Date().getDay();
    if (![5, 6, 0, 1].includes(tag)) return "";
    const mo = rueckStandardWoche();
    try { if (localStorage.getItem("rueckblick-weg-" + aktiverBereich) === mo) return ""; } catch (_e) { /* egal */ }
    const d = rueckDaten(mo);
    const teile = [];
    if (d.erledigtAmBekannt) teile.push(`${d.erledigt.length} erledigt`);
    if (d.liegen.length) teile.push(`${d.liegen.length} liegen geblieben`);
    if (d.train) teile.push(`${d.train.anzahl} ${d.train.anzahl === 1 ? "Training" : "Trainings"}`);
    return `
      <section class="heute-block rueck-karte">
        <button type="button" class="rueck-karte-knopf" onclick="wochenrueckblickOeffnen()">
          <span class="rueck-karte-titel">${ic("statistik")} Wochenrückblick · KW ${kalenderwoche(mo)}</span>
          <span class="notiz-meta">${escapeHtml(teile.join(" · ") || "Woche ansehen und die nächste planen")}</span>
        </button>
        <button type="button" class="schnell-zu" onclick="rueckKarteWeg('${mo}')" aria-label="Wochenrückblick ausblenden" title="Später">${ic("x")}</button>
      </section>`;
  }
  window.rueckKarteWeg = function(mo) {
    try { localStorage.setItem("rueckblick-weg-" + aktiverBereich, mo); } catch (_e) { /* egal */ }
    renderHeute();
  };

  (function rueckEinrichten() {
    const dlg = document.getElementById("rueck-dialog");
    if (dlg) dlg.addEventListener("click", (e) => { if (e.target === dlg) window.wochenrueckblickSchliessen(); });
  })();

  // ==========================================================
  // Globale Suche (seit Session 37, Etappe 2): Lupe oben in der Kopfzeile,
  // „/“ oder Strg+K am PC. Durchsucht die schon geladenen Daten im Browser
  // (nichts geht an einen Server). Nur Reiter, die im jeweiligen Bereich
  // eingeblendet sind. Ein Treffer öffnet den Reiter und – wo möglich – den
  // Eintrag im Bearbeiten-Blatt.
  // ==========================================================
  const such = { bereich: "aktiv", offeneGruppen: new Set(), treffer: [] };
  const SUCH_PRO_GRUPPE = 5;

  function suchNorm(s) {
    return String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
  }
  function suchDatum(iso) {
    return iso ? formatDatumKurz(String(iso).slice(0, 10)) : "";
  }
  function suchFinanzTab(typ, aktion) {
    return () => { const k = document.getElementById("fintyp-" + typ); if (k) k.click(); if (aktion) aktion(); };
  }

  // Quellen: je Typ die Liste, der Reiter, die Felder und was ein Tipp öffnet.
  // bereich: null = gemeinsame Daten (Spiele)
  function suchQuellen() {
    const inventarName = (id) => { const i = ogsInventar.find((x) => String(x.id) === String(id)); return i ? i.name : ""; };
    const raumName = (id) => { const r = raeume.find((x) => String(x.id) === String(id)); return r ? r.name : ""; };
    const projektName = (id) => { const p = projekte.find((x) => String(x.id) === String(id)); return p ? p.name : ""; };
    return [
      { typ: "aufgabe", gruppe: "Aufgaben", tab: "aufgaben", liste: aufgaben,
        felder: (a) => ({ titel: a.titel, texte: [a.notiz, projektName(a.projekt_id)], meta: [a.faellig_am ? "fällig " + suchDatum(a.faellig_am) : "", a.erledigt ? "erledigt" : ""],
          datum: a.faellig_am, nachrangig: !!a.erledigt }),
        oeffnen: (a) => () => window.eintragBearbeiten("aufgabe", a.id) },
      { typ: "termin", gruppe: "Termine", tab: "kalender", liste: termine,
        felder: (x) => ({ titel: x.titel, texte: [x.notiz], meta: [suchDatum(x.datum) + (x.uhrzeit ? " · " + String(x.uhrzeit).slice(0, 5) : "")], datum: x.datum }),
        oeffnen: (x) => () => window.eintragBearbeiten("termin", x.id) },
      { typ: "notiz", gruppe: "Notizen", tab: "notizen", liste: notizen,
        felder: (n) => ({ titel: String(n.text || "").split("\n")[0], texte: [n.text, projektName(n.projekt_id)], meta: [], datum: n.erstellt_am }),
        oeffnen: (n) => () => window.blattOeffnen("notiz", n.id) },
      { typ: "link", gruppe: "Links", tab: "links", liste: links,
        felder: (l) => ({ titel: l.titel, texte: [l.url, l.notiz], meta: [], datum: l.erstellt_am }),
        oeffnen: (l) => () => window.blattOeffnen("link", l.id) },
      { typ: "idee", gruppe: "Ideen", tab: "ogsideen", liste: ogsIdeen,
        felder: (i) => ({ titel: i.titel, texte: [i.beschreibung], meta: [OGS_IDEE_STATUS_LABEL[i.status] || i.status || ""], datum: i.erstellt_am }),
        oeffnen: (i) => () => window.blattOeffnen("idee", i.id) },
      { typ: "reflexion", gruppe: "Reflexion", tab: "reflexion", liste: reflexionen,
        felder: (r) => ({ titel: suchDatum(r.datum), texte: [r.text], meta: [], datum: r.datum, textVorschau: true }),
        oeffnen: (r) => () => window.blattOeffnen("reflexion", r.id) },
      { typ: "einkauf", gruppe: "Einkaufsliste", tab: "einkauf", liste: einkaufsliste,
        felder: (e) => ({ titel: e.text, texte: [], meta: [e.erledigt ? "erledigt" : "offen"], nachrangig: !!e.erledigt }),
        oeffnen: () => null },
      { typ: "rezept", gruppe: "Rezepte", tab: "rezepte", liste: rezepte,
        felder: (r) => ({ titel: r.titel, texte: [r.kategorie, r.zutaten, r.notiz], meta: [r.kategorie || ""] }),
        vorher: (r) => () => { rezeptOffenId = r.id; }, oeffnen: () => null },
      { typ: "spiel", gruppe: "Spiele", tab: "spiele", liste: spiele, gemeinsam: true,
        felder: (s) => ({ titel: s.titel, texte: [s.kategorie, s.beschreibung, s.material], meta: [s.kategorie || ""] }),
        oeffnen: (s) => () => window.blattOeffnen("spiel", s.id) },
      { typ: "einheit", gruppe: "Einheiten", tab: "einheiten", liste: einheiten || [],
        felder: (e) => ({ titel: e.titel, texte: [e.ort, e.gruppe, e.ziel, e.notiz, e.reflexion],
          meta: [e.datum ? suchDatum(e.datum) : "ohne Datum", e.status === "durchgefuehrt" ? "durchgeführt" : ""], datum: e.datum }),
        vorher: (e) => () => { einheitOffenId = e.id; }, oeffnen: () => null },
      { typ: "training", gruppe: "Training", tab: "training", liste: training,
        felder: (x) => ({ titel: x.sportart, texte: [x.ort, x.notiz], meta: [suchDatum(x.datum), x.ort || ""], datum: x.datum }),
        oeffnen: (x) => () => window.trainingBearbeitenStart(x.id) },
      { typ: "inventar", gruppe: "Inventar", tab: "ogsinventar", liste: ogsInventar,
        felder: (i) => ({ titel: i.name, texte: [i.kategorie, i.standort, i.beschreibung], meta: [i.kategorie || "", i.standort || ""] }),
        oeffnen: (i) => () => window.blattOeffnen("inventar", i.id) },
      { typ: "projekt", gruppe: "Projekte", tab: "ogsprojekte", liste: ogsProjekte,
        felder: (p) => ({ titel: p.titel, texte: [p.kategorie, p.beschreibung], meta: [p.kategorie || ""] }),
        oeffnen: (p) => () => window.blattOeffnen("projekt", p.id) },
      { typ: "verleih", gruppe: "Verleih", tab: "verleih", liste: verleih,
        felder: (v) => ({ titel: inventarName(v.inventar_id) || "Verleih", texte: [v.ausgeliehen_an, v.notiz],
          meta: [v.ausgeliehen_an || "", suchDatum(v.ausgeliehen_am), v.zurueckgegeben_am ? "zurück" : "offen"], datum: v.ausgeliehen_am, nachrangig: !!v.zurueckgegeben_am }),
        oeffnen: (v) => () => window.blattOeffnen("verleih", v.id) },
      { typ: "vermietung", gruppe: "Raumplanung", tab: "raumplanung", liste: raumVermietungen,
        felder: (v) => ({ titel: v.mieter, texte: [v.zweck, v.notiz, v.kontakt, raumName(v.raum_id)], meta: [suchDatum(v.datum), raumName(v.raum_id)], datum: v.datum }),
        oeffnen: (v) => () => window.raumBearbeitenStart(v.id, "liste") },
      { typ: "schluessel", gruppe: "Schlüssel", tab: "schluessel", liste: schluesselListe,
        felder: (s) => ({ titel: `${s.art === "key" ? "Key" : "Schlüssel"} ${s.seriennummer || ""}`.trim(), texte: [s.inhaber, s.verein, s.notiz],
          meta: [s.inhaber || "", s.verein || ""] }),
        oeffnen: (s) => () => window.blattOeffnen("schluessel", s.id) },
      { typ: "buchung", gruppe: "Buchungen", tab: "finanzen", liste: buchungen,
        felder: (b) => ({ titel: b.notiz || b.kategorie || "Buchung", texte: [b.kategorie],
          meta: [suchDatum(b.datum), `${b.typ === "einnahme" ? "+" : "−"}${finEuro(b.betrag)}`, b.kategorie || ""], datum: b.datum }),
        vorher: (b) => () => {
          const [j, m] = String(b.datum || "").split("-").map(Number);
          if (j && m) { finBuchJahr = j; finBuchMonat = m; }
          finBearbeiteteBuchung = b.id;
        },
        oeffnen: () => suchFinanzTab("buchungen") },
      { typ: "fixkosten", gruppe: "Fixkosten", tab: "finanzen", liste: fixkosten,
        felder: (f) => ({ titel: f.bezeichnung, texte: [f.kategorie], meta: [f.typ === "einnahme" ? "Einnahme" : "Ausgabe"] }),
        oeffnen: (f) => suchFinanzTab("fixkosten", () => window.fixkostenBearbeitenStart(f.id)) },
      { typ: "sonderausgabe", gruppe: "Sonderausgaben", tab: "finanzen", liste: sonderausgaben,
        felder: (s) => ({ titel: s.bezeichnung, texte: [s.notiz], meta: [finEuro(s.betrag)] }),
        oeffnen: (s) => suchFinanzTab("sonderausgaben", () => window.sonderausgabeBearbeitenStart(s.id)) },
    ];
  }

  // Bereich, in dem ein Treffer geöffnet wird (null bei gemeinsamen Daten:
  // der aktive, wenn der Reiter dort sichtbar ist, sonst der erste passende)
  function suchBereichFuer(quelle, eintrag) {
    if (!quelle.gemeinsam) return bereichVon(eintrag);
    if (reiterIstSichtbar(aktiverBereich, quelle.tab)) return aktiverBereich;
    return BEREICH_FARBWELT.find((b) => reiterIstSichtbar(b, quelle.tab)) || null;
  }

  // Sucht in allen Quellen; jedes Wort muss irgendwo vorkommen
  function suchen(eingabe, nurBereich) {
    const woerter = suchNorm(eingabe).split(/\s+/).filter(Boolean);
    if (!woerter.length || suchNorm(eingabe).replace(/\s/g, "").length < 2) return [];
    const ergebnis = [];
    for (const q of suchQuellen()) {
      for (const e of q.liste || []) {
        const bereich = suchBereichFuer(q, e);
        if (!bereich || !reiterIstSichtbar(bereich, q.tab)) continue;
        if (nurBereich && !q.gemeinsam && bereich !== aktiverBereich) continue;
        const f = q.felder(e);
        const titelN = suchNorm(f.titel);
        const alles = titelN + " " + suchNorm((f.texte || []).filter(Boolean).join(" "));
        if (!woerter.every((w) => alles.includes(w))) continue;
        let punkte = woerter.every((w) => titelN.includes(w)) ? 2 : 0;
        if (titelN.startsWith(woerter[0])) punkte += 1;
        if (f.nachrangig) punkte -= 3;
        ergebnis.push({ q, e, f, bereich, punkte, woerter });
      }
    }
    return ergebnis.sort((a, b) => b.punkte - a.punkte || String(b.f.datum || "").localeCompare(String(a.f.datum || "")));
  }

  // Markiert Fundstellen (ohne Rücksicht auf Groß-/Kleinschreibung und Akzente);
  // max: Ausschnitt um die erste Fundstelle
  function suchMarkieren(text, woerter, max) {
    const orig = String(text ?? "");
    let norm = "";
    const map = [];
    for (let i = 0; i < orig.length; i++) {
      for (const c of suchNorm(orig[i])) { norm += c; map.push(i); }
    }
    const bereiche = [];
    woerter.forEach((w) => {
      let p = norm.indexOf(w);
      while (p !== -1 && w) {
        bereiche.push([map[p], map[p + w.length - 1] + 1]);
        p = norm.indexOf(w, p + w.length);
      }
    });
    bereiche.sort((a, b) => a[0] - b[0]);
    let von = 0, bis = orig.length, vorne = "", hinten = "";
    if (max && orig.length > max) {
      const erste = bereiche.length ? bereiche[0][0] : 0;
      von = Math.max(0, Math.min(erste - 30, orig.length - max));
      bis = Math.min(orig.length, von + max);
      if (von > 0) vorne = "…";
      if (bis < orig.length) hinten = "…";
    }
    let html = "", pos = von;
    for (const [a, b] of bereiche) {
      const s = Math.max(a, pos), en = Math.min(b, bis);
      if (en <= s) continue;
      html += escapeHtml(orig.slice(pos, s)) + "<mark>" + escapeHtml(orig.slice(s, en)) + "</mark>";
      pos = en;
    }
    html += escapeHtml(orig.slice(pos, bis));
    return vorne + html + hinten;
  }

  function suchRendern() {
    const eingabe = document.getElementById("such-text").value;
    const box = document.getElementById("such-ergebnis");
    document.querySelectorAll("#such-bereiche .schnell-chip").forEach((k) => {
      const an = k.dataset.wahl === such.bereich;
      k.classList.toggle("aktiv", an);
      k.setAttribute("aria-pressed", String(an));
    });
    const nurBereich = such.bereich === "aktiv";
    if (suchNorm(eingabe).replace(/\s/g, "").length < 2) {
      such.treffer = [];
      box.innerHTML = `<p class="notiz-meta such-leer">Durchsucht Aufgaben, Termine, Notizen, Links, Ideen, Reflexion, Einkauf, Rezepte, Spiele, Training, Inventar, Projekte, Verleih, Raumplanung, Schlüssel und Finanzen – nur Reiter, die eingeblendet sind. Ab 2 Zeichen, jedes Wort muss vorkommen.</p>`;
      return;
    }
    const treffer = suchen(eingabe, nurBereich);
    such.treffer = treffer;
    if (!treffer.length) {
      box.innerHTML = `<p class="empty-text such-leer">Nichts gefunden für „${escapeHtml(eingabe.trim())}“.</p>` +
        (nurBereich ? `<button type="button" class="btn-secondary" onclick="suchBereichSetzen('alle')">In allen Bereichen suchen</button>` : "");
      return;
    }
    const gruppen = new Map();
    treffer.forEach((t, i) => {
      const g = gruppen.get(t.q.gruppe) || [];
      g.push(i);
      gruppen.set(t.q.gruppe, g);
    });
    let html = `<p class="notiz-meta such-anzahl" role="status">${treffer.length} ${treffer.length === 1 ? "Treffer" : "Treffer"}${nurBereich ? ` in ${escapeHtml(BEREICH_KNOPF_TEXT[aktiverBereich] || "")}` : " in allen Bereichen"}</p>`;
    for (const [name, idx] of gruppen) {
      const offen = such.offeneGruppen.has(name);
      const zeigen = offen ? idx : idx.slice(0, SUCH_PRO_GRUPPE);
      html += `<div class="such-gruppe"><div class="schnell-label such-gruppe-titel">${escapeHtml(name)} <span class="such-gruppe-zahl">${idx.length}</span></div>`;
      html += zeigen.map((i) => {
        const t = treffer[i];
        const titelHtml = suchMarkieren(t.f.titel || "–", t.woerter, 90);
        const titelTreffer = t.woerter.every((w) => suchNorm(t.f.titel).includes(w));
        const textQuelle = (t.f.texte || []).filter(Boolean).find((x) => t.woerter.some((w) => suchNorm(x).includes(w)));
        const auszug = (!titelTreffer || t.f.textVorschau) && textQuelle ? `<span class="such-auszug">${suchMarkieren(textQuelle, t.woerter, 110)}</span>` : "";
        const meta = (t.f.meta || []).filter(Boolean);
        if (!nurBereich && !t.q.gemeinsam) meta.unshift(BEREICH_KNOPF_TEXT[t.bereich] || t.bereich);
        return `<button type="button" class="such-treffer${t.f.nachrangig ? " nachrangig" : ""}" onclick="suchTrefferOeffnen(${i})">
            <span class="such-titel">${titelHtml}</span>${auszug}
            ${meta.length ? `<span class="notiz-meta such-meta">${meta.map(escapeHtml).join(" · ")}</span>` : ""}
          </button>`;
      }).join("");
      if (!offen && idx.length > SUCH_PRO_GRUPPE) {
        html += `<button type="button" class="link-btn such-mehr" onclick="suchGruppeAufklappen('${escapeAttr(name)}')">+ ${idx.length - SUCH_PRO_GRUPPE} weitere</button>`;
      }
      html += `</div>`;
    }
    box.innerHTML = html;
  }

  window.sucheOeffnen = function() {
    const dlg = document.getElementById("such-dialog");
    if (!dlg) return;
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
    such.offeneGruppen = new Set();
    suchRendern();
    const feld = document.getElementById("such-text");
    feld.focus();
    feld.select();
  };
  window.sucheSchliessen = function() {
    const dlg = document.getElementById("such-dialog");
    if (!dlg) return;
    if (typeof dlg.close === "function" && dlg.open) dlg.close(); else dlg.removeAttribute("open");
  };
  window.suchBereichSetzen = function(wahl) {
    such.bereich = wahl === "alle" ? "alle" : "aktiv";
    such.offeneGruppen = new Set();
    suchRendern();
  };
  window.suchGruppeAufklappen = function(name) {
    such.offeneGruppen.add(name);
    suchRendern();
  };
  window.suchTrefferOeffnen = function(i) {
    const t = such.treffer[i];
    if (!t) return;
    window.sucheSchliessen();
    if (t.bereich && t.bereich !== aktiverBereich) window.bereichAuswaehlen(t.bereich);
    if (t.q.vorher) t.q.vorher(t.e)();
    tabWechseln(t.q.tab);
    const aktion = t.q.oeffnen(t.e);
    if (aktion) setTimeout(aktion, 0);
  };

  (function sucheEinrichten() {
    const dlg = document.getElementById("such-dialog");
    const feld = document.getElementById("such-text");
    if (!dlg || !feld) return;
    feld.addEventListener("input", () => { such.offeneGruppen = new Set(); suchRendern(); });
    feld.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing && such.treffer.length) { e.preventDefault(); window.suchTrefferOeffnen(0); }
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) window.sucheSchliessen(); });
    const knopf = document.getElementById("such-knopf");
    if (knopf) knopf.addEventListener("click", () => window.sucheOeffnen());
    // „/“ oder Strg+K öffnet die Suche (nicht beim Tippen in einem Feld)
    document.addEventListener("keydown", (e) => {
      const ziel = e.target;
      const tippt = ziel && (ziel.tagName === "INPUT" || ziel.tagName === "TEXTAREA" || ziel.tagName === "SELECT" || ziel.isContentEditable);
      const strgK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if ((strgK || (e.key === "/" && !tippt)) && !document.getElementById("app").classList.contains("hidden")) {
        if (document.querySelector("dialog[open]:not(#such-dialog)")) return;
        e.preventDefault();
        window.sucheOeffnen();
      }
    });
  })();

  // ==========================================================
  // Schnellerfassung (seit Session 34, Redesign Etappe 3): der „+“-Knopf
  // in der Mitte der Leiste unten öffnet ein Blatt mit Text, Art, Bereich
  // und Wann. Zusatzfelder (Ende, Projekt, Wiederholung, Notiz,
  // Beschreibung) stehen hinter „Details“. Gespeichert wird über dieselben
  // Aktionen wie in den Reitern – kein neues Backend. Angeboten werden nur
  // Arten, deren Reiter im gewählten Bereich eingeblendet ist (Aufgabe
  // immer), damit nichts in einem ausgeblendeten Reiter verschwindet.
  // ==========================================================
  const SCHNELL_ARTEN = [
    { art: "aufgabe", label: "Aufgabe", tab: "aufgaben", platzhalter: "Was ist zu tun? z. B. „Steuer bis Freitag“" },
    { art: "termin", label: "Termin", tab: "kalender", platzhalter: "Welcher Termin? z. B. „Zahnarzt morgen 15 Uhr“" },
    { art: "notiz", label: "Notiz", tab: "notizen", platzhalter: "Notiz …" },
    { art: "einkauf", label: "Einkauf", tab: "einkauf", platzhalter: "Was fehlt?" },
    { art: "idee", label: "Idee", tab: "ogsideen", platzhalter: "Welche Idee?" },
  ];
  // Welche Art ist beim Öffnen vorgewählt? Passend zum gerade offenen Reiter
  const SCHNELL_ART_VON_TAB = { kalender: "termin", frei: "termin", notizen: "notiz", einkauf: "einkauf", ogsideen: "idee" };
  const SCHNELL_PLUS_ICON = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
  let schnell = { art: "aufgabe", bereich: "privat", wann: "ohne", details: false };
  // Reiter mit eigenem Formular, das die Schnellerfassung nicht abdeckt (seit Etappe 5)
  const SCHNELL_REITERFORMULAR = {
    links: "Neuer Link", reflexion: "Neuer Reflexions-Eintrag", spiele: "Neues Spiel", ogsinventar: "Neuer Gegenstand",
    ogsprojekte: "Neues Projekt", verleih: "Neu verleihen", raumplanung: "Neue Vermietung", schluessel: "Neuer Schlüssel",
    training: "Neues Training",
  };

  // ==========================================================
  // Datum/Uhrzeit aus dem Text erkennen (seit Session 35). Reine Funktion,
  // ohne DOM: liefert { datum, uhrzeit, ende, rest, teile } oder null.
  //   datum   "YYYY-MM-DD" oder null (nur Uhrzeit → heute)
  //   uhrzeit "HH:MM" oder null, ende "HH:MM" oder null
  //   rest    Text ohne die erkannten Angaben (wird zum Titel)
  // Erkannt: heute, morgen, übermorgen, Wochentage („Freitag“, „am Fr“,
  // „nächsten Montag“), „in 3 Tagen“, „in 2 Wochen“, 12.10., 12.10.2026,
  // 12. Oktober; Uhrzeiten „15 Uhr“, „15:30“, „um 9“, „15.30 Uhr“,
  // Spannen „15–16 Uhr“, „von 9 bis 11 Uhr“, „14:00-15:30“; „abends“ /
  // „nachmittags“ hinter einer Uhrzeit unter 12 zählt +12 Stunden.
  // Bewusst nicht: Wiederholungen („jeden Montag“), „halb 3“, „Wochenende“.
  // ==========================================================
  const TD_MONATE = {
    januar: 1, jan: 1, februar: 2, feb: 2, "märz": 3, maerz: 3, "mär": 3, april: 4, apr: 4, mai: 5,
    juni: 6, jun: 6, juli: 7, jul: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9,
    oktober: 10, okt: 10, november: 11, nov: 11, dezember: 12, dez: 12,
  };
  const TD_WOCHENTAGE = { sonntag: 0, montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6 };
  const TD_KURZ = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };
  const TD_ZAHLWORT = { ein: 1, einem: 1, einer: 1, eine: 1, zwei: 2, drei: 3, vier: 4, "fünf": 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10 };
  // Wortgrenzen, die auch Umlaute kennen (\b reicht in JS nur für a–z)
  const TD_VOR = "(?<![\\p{L}\\p{N}])";
  const TD_NACH = "(?![\\p{L}\\p{N}])";

  function textDatumErkennen(text, jetzt = new Date()) {
    const quelle = String(text || "");
    if (!quelle.trim()) return null;
    const teile = []; // erkannte Stellen [start, ende, art]
    const frei = (s, e) => teile.every(([a, b]) => e <= a || s >= b);
    const nimm = (re, art) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(quelle))) {
        if (frei(m.index, m.index + m[0].length)) { teile.push([m.index, m.index + m[0].length, art]); return m; }
      }
      return null;
    };
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const heute = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate());
    const plusTage = (n) => { const d = new Date(heute); d.setDate(d.getDate() + n); return d; };
    const zeit = (h, m) => (h >= 0 && h <= 23 && m >= 0 && m <= 59) ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` : null;
    // Gibt es ein gültiges Kalenderdatum? (31.02. → nein)
    const gueltig = (j, mo, t) => { const d = new Date(j, mo - 1, t); return d.getMonth() === mo - 1 && d.getDate() === t ? d : null; };
    // Datum ohne Jahr: liegt es schon hinter uns, ist das nächste Jahr gemeint
    const ohneJahr = (mo, t) => {
      let d = gueltig(heute.getFullYear(), mo, t);
      if (d && d < heute) d = gueltig(heute.getFullYear() + 1, mo, t);
      return d;
    };

    // ---- Uhrzeit zuerst (sonst hält „15.30“ für ein Datum her) ----
    let uhrzeit = null, ende = null;
    const tageszeit = (h, nachsatz) => (h < 12 && /^\s*(abends|nachmittags|nachts)/i.test(nachsatz) ? h + 12 : h);
    const spanne = nimm(new RegExp(`${TD_VOR}(?:von\\s+|ab\\s+)?(\\d{1,2})(?:[:.](\\d{2}))?\\s*(?:uhr\\s*)?(?:-|–|bis)\\s*(\\d{1,2})(?:[:.](\\d{2}))?\\s*uhr${TD_NACH}`, "giu"), "zeit")
      || nimm(new RegExp(`${TD_VOR}(?:von\\s+|ab\\s+)?(\\d{1,2}):(\\d{2})\\s*(?:-|–|bis)\\s*(\\d{1,2}):(\\d{2})(?:\\s*uhr)?${TD_NACH}`, "giu"), "zeit");
    if (spanne) {
      const s = zeit(+spanne[1], +(spanne[2] || 0)), e = zeit(+spanne[3], +(spanne[4] || 0));
      if (s && e && e > s) { uhrzeit = s; ende = e; } else teile.pop();
    }
    if (!uhrzeit) {
      const muster = [
        new RegExp(`${TD_VOR}(?:um|ab|gegen)\\s+(\\d{1,2})(?:[:.](\\d{2}))?(?:\\s*uhr)?${TD_NACH}`, "giu"),
        new RegExp(`${TD_VOR}(\\d{1,2})(?:[:.](\\d{2}))?\\s*uhr${TD_NACH}`, "giu"),
        new RegExp(`${TD_VOR}(\\d{1,2}):(\\d{2})${TD_NACH}`, "giu"),
      ];
      for (const re of muster) {
        const m = nimm(re, "zeit");
        if (!m) continue;
        const nach = quelle.slice(m.index + m[0].length);
        const z = zeit(tageszeit(+m[1], nach), +(m[2] || 0));
        if (z) {
          uhrzeit = z;
          const tz = nach.match(/^\s*(abends|nachmittags|nachts|morgens|vormittags|früh)(?![\p{L}])/iu);
          if (tz) teile[teile.length - 1][1] += tz[0].length;
          break;
        }
        teile.pop();
      }
    }

    // ---- Datum ----
    let datum = null;
    let m;
    if ((m = nimm(new RegExp(`${TD_VOR}(?:am\\s+|bis\\s+(?:zum\\s+)?|zum\\s+|ab\\s+(?:dem\\s+)?)?(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4}|\\d{2})?${TD_NACH}`, "giu"), "datum"))) {
      const t = +m[1], mo = +m[2];
      let d = null;
      if (m[3]) { const j = m[3].length === 2 ? 2000 + +m[3] : +m[3]; d = gueltig(j, mo, t); } else d = ohneJahr(mo, t);
      if (d) datum = iso(d); else teile.pop();
    }
    if (!datum && (m = nimm(new RegExp(`${TD_VOR}(?:am\\s+|bis\\s+(?:zum\\s+)?|zum\\s+|ab\\s+(?:dem\\s+)?)?(\\d{1,2})\\.\\s*(${Object.keys(TD_MONATE).join("|")})\\.?(?:\\s+(\\d{4}))?${TD_NACH}`, "giu"), "datum"))) {
      const t = +m[1], mo = TD_MONATE[m[2].toLowerCase()];
      const d = m[3] ? gueltig(+m[3], mo, t) : ohneJahr(mo, t);
      if (d) datum = iso(d); else teile.pop();
    }
    if (!datum && (m = nimm(new RegExp(`${TD_VOR}(?:über|ueber)morgen${TD_NACH}`, "giu"), "datum"))) datum = iso(plusTage(2));
    if (!datum && (m = nimm(new RegExp(`${TD_VOR}morgen(?:\\s+(?:früh|frueh|vormittag|mittag|nachmittag|abend))?${TD_NACH}`, "giu"), "datum"))) datum = iso(plusTage(1));
    if (!datum && (m = nimm(new RegExp(`${TD_VOR}heute(?:\\s+(?:früh|frueh|vormittag|mittag|nachmittag|abend))?${TD_NACH}`, "giu"), "datum"))) datum = iso(heute);
    if (!datum && (m = nimm(new RegExp(`${TD_VOR}in\\s+(\\d{1,2}|${Object.keys(TD_ZAHLWORT).join("|")})\\s+(tag|tagen|woche|wochen)${TD_NACH}`, "giu"), "datum"))) {
      const n = /^\d+$/.test(m[1]) ? +m[1] : TD_ZAHLWORT[m[1].toLowerCase()];
      datum = iso(plusTage(n * (/^woche/i.test(m[2]) ? 7 : 1)));
    }
    if (!datum) {
      // „nächsten Freitag“: immer nach heute; „Freitag“/„am Fr“: ab heute
      const lang = nimm(new RegExp(`${TD_VOR}(?:(nächsten|nächste|naechsten|kommenden|kommende)\\s+|am\\s+)?(${Object.keys(TD_WOCHENTAGE).join("|")})${TD_NACH}`, "giu"), "datum");
      // Kurzformen nur großgeschrieben und mit „am“ davor oder direkt vor einer
      // Uhrzeit („Mo 15 Uhr“) – sonst wäre „so“ ein Wochentag
      const k = Object.keys(TD_KURZ).join("|");
      const kurz = lang ? null : (nimm(new RegExp(`${TD_VOR}am\\s+(${k})\\.?${TD_NACH}`, "gu"), "datum")
        || nimm(new RegExp(`${TD_VOR}(${k})\\.?(?=\\s+(?:(?:um|ab|von|gegen)\\s+\\d|\\d{1,2}(?::\\d{2}|(?:[.]\\d{2})?\\s*(?:[Uu]hr|-|–|bis))))`, "gu"), "datum"));
      const ziel = lang ? TD_WOCHENTAGE[lang[2].toLowerCase()] : (kurz ? TD_KURZ[kurz[1]] : null);
      if (ziel !== null && ziel !== undefined) {
        let n = (ziel - heute.getDay() + 7) % 7;
        if (lang && lang[1] && n === 0) n = 7;
        datum = iso(plusTage(n));
      }
    }
    if (!datum && !uhrzeit) return null;

    // ---- Rest: erkannte Stellen raus, Füllwörter am Rand weg ----
    let rest = "";
    let pos = 0;
    teile.sort((a, b) => a[0] - b[0]).forEach(([s, e]) => { rest += quelle.slice(pos, s) + " "; pos = e; });
    rest += quelle.slice(pos);
    rest = rest.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim()
      .replace(/(?:^|\s)(am|um|ab|von|bis|gegen)$/iu, "").replace(/^[,;:–-]\s*|\s*[,;:–-]$/g, "").trim();
    return { datum, uhrzeit, ende, rest, teile };
  }

  // Arten, die im Bereich angeboten werden (Aufgabe immer)
  function schnellArtenFuer(bereich) {
    return SCHNELL_ARTEN.filter((a) => a.art === "aufgabe" || reiterIstSichtbar(bereich, a.tab));
  }

  // Öffnet die Schnellerfassung im aktiven Bereich; Art passend zum offenen Reiter
  window.schnellOeffnen = function() {
    const dlg = document.getElementById("schnell-dialog");
    if (!dlg) return;
    const bereich = BEREICH_FARBWELT.includes(aktiverBereich) ? aktiverBereich : "privat";
    const wunsch = SCHNELL_ART_VON_TAB[aktiverTab] || "aufgabe";
    const art = schnellArtenFuer(bereich).some((a) => a.art === wunsch) ? wunsch : "aufgabe";
    schnell = { art, bereich, wann: art === "termin" ? "heute" : "ohne", details: false, erkannt: null, erkennungAus: false, vorErkennung: null, modus: "neu", id: null };
    document.getElementById("schnell-text").value = "";
    ["schnell-datum", "schnell-uhrzeit", "schnell-ende", "schnell-intervall", "schnell-notiz"].forEach((id) => {
      document.getElementById(id).value = "";
    });
    schnellMeldung("", false);
    const reiterform = document.getElementById("schnell-reiterform");
    const formText = SCHNELL_REITERFORMULAR[aktiverTab];
    reiterform.classList.toggle("hidden", !formText);
    if (formText) reiterform.textContent = `Oder: ${formText} – ganzes Formular im Reiter →`;
    schnellRendern();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.getElementById("schnell-text").focus();
  };

  // ==========================================================
  // Bearbeiten im selben Blatt (seit Session 35): Aufgaben und Termine aus
  // Aufgaben, Kalender, Frei und Heute öffnen das „+“-Blatt ausgefüllt, mit
  // Speichern und Löschen. Ersetzt die früheren Inline-Formulare.
  // ==========================================================
  window.eintragBearbeiten = function(typ, id) {
    const dlg = document.getElementById("schnell-dialog");
    const liste = typ === "termin" ? termine : aufgaben;
    const e = liste.find((x) => String(x.id) === String(id));
    if (!dlg || !e) return;
    const heute = heuteISO();
    const datum = (typ === "termin" ? e.datum : e.faellig_am) || null;
    const wann = !datum ? "ohne" : datum === heute ? "heute" : datum === addTage(heute, 1) ? "morgen" : "datum";
    const bereich = BEREICH_FARBWELT.includes(bereichVon(e)) ? bereichVon(e) : "privat";
    schnell = { art: typ, bereich, wann, details: true, erkannt: null, erkennungAus: false, vorErkennung: null, modus: "bearbeiten", id: e.id, altDatum: datum };
    const zeit = (z) => (z ? String(z).slice(0, 5) : "");
    document.getElementById("schnell-text").value = e.titel || "";
    document.getElementById("schnell-datum").value = wann === "datum" ? datum : "";
    document.getElementById("schnell-uhrzeit").value = zeit(e.uhrzeit);
    document.getElementById("schnell-ende").value = zeit(e.ende_uhrzeit);
    document.getElementById("schnell-intervall").value = typ === "aufgabe" && e.erinnere_alle_tage ? e.erinnere_alle_tage : "";
    document.getElementById("schnell-notiz").value = typ === "termin" ? (e.notiz || "") : "";
    schnellMeldung("", false);
    document.getElementById("schnell-reiterform").classList.add("hidden");
    schnellRendern();
    document.getElementById("schnell-projekt").value = typ === "aufgabe" && e.projekt_id ? String(e.projekt_id) : "";
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.getElementById("schnell-text").focus();
  };

  // Löscht den gerade bearbeiteten Eintrag (mit Rückfrage)
  window.schnellLoeschen = async function() {
    if (schnell.modus !== "bearbeiten") return;
    const label = schnell.art === "termin" ? "Termin" : "Aufgabe";
    const titel = document.getElementById("schnell-text").value.trim();
    if (!confirm(`${label} „${titel}“ löschen?`)) return;
    try {
      await api(schnell.art === "termin" ? "termin_loeschen" : "aufgabe_loeschen", { id: schnell.id, aktiver_bereich: schnell.bereich });
    } catch (e) {
      schnellMeldung("Nicht gelöscht: " + (e.message || "Fehler"), true);
      return;
    }
    window.schnellSchliessen();
    hinweisZeigen(`${label} gelöscht`);
    await ladeDaten();
    if (aktiverTab === "frei") renderFrei();
  };

  // ==========================================================
  // Allgemeines Bearbeiten-Blatt (seit Session 35) – gleicher Look wie das
  // „+“-Blatt, Felder kommen aus BLATT_ARTEN. Genutzt von Blockzeiten,
  // Inventar und Verleih; weitere Reiter lassen sich hier anschließen.
  // Feldtypen: text, zahl, datum, zeit, text-lang, chips (eine Auswahl),
  // auswahl (Klappliste), wochentage (mehrere), mehrfach (Haken-Liste,
  // Wert ist ein Array), info (nur Anzeige), html (fertiges HTML, z. B.
  // Verlauf mit Knöpfen). „gesperrt(werte)“ macht ein Textfeld schreibgeschützt.
  // „optionen“ darf eine Liste [[wert, text], …] oder eine Funktion(werte) sein. „wenn(werte)“ blendet ein
  // Feld ein oder aus, „pflicht“ prüft vor dem Speichern.
  // ==========================================================
  const BLATT_ARTEN = {
    blockzeit: {
      titel: "Blockzeit bearbeiten",
      finden: (id) => blockzeiten.find((b) => String(b.id) === String(id)),
      laden: (b) => ({
        titel: b.titel || "",
        start: b.start_zeit ? b.start_zeit.slice(0, 5) : "",
        ende: b.end_zeit ? b.end_zeit.slice(0, 5) : "",
        art: b.datum ? "einmalig" : "wiederkehrend",
        wochentage: Array.isArray(b.wochentage) ? b.wochentage.map(Number) : [],
        datum: b.datum || "",
        notiz: b.notiz || "",
      }),
      felder: [
        { key: "titel", label: "Titel", typ: "text", pflicht: true },
        { key: "start", label: "Von", typ: "zeit", pflicht: true, halb: true },
        { key: "ende", label: "Bis", typ: "zeit", pflicht: true, halb: true },
        { key: "art", label: "Wiederholung", typ: "chips", optionen: [["wiederkehrend", "Wiederkehrend"], ["einmalig", "Einmalig"]] },
        { key: "wochentage", label: "Wochentage", typ: "wochentage", wenn: (w) => w.art === "wiederkehrend" },
        { key: "datum", label: "Datum", typ: "datum", wenn: (w) => w.art === "einmalig" },
        { key: "notiz", label: "Notiz", typ: "text", platzhalter: "optional" },
      ],
      pruefen: (w) => {
        if (w.ende <= w.start) return "Das Ende muss nach dem Beginn liegen.";
        if (w.art === "wiederkehrend" && !w.wochentage.length) return "Bitte mindestens einen Wochentag wählen.";
        if (w.art === "einmalig" && !w.datum) return "Bitte ein Datum wählen.";
        return "";
      },
      speichern: (id, w) => api("blockzeit_aktualisieren", {
        id, titel: w.titel, start_zeit: w.start, end_zeit: w.ende, notiz: w.notiz || null,
        wochentage: w.art === "wiederkehrend" ? [...w.wochentage].sort((a, b) => a - b) : null,
        datum: w.art === "einmalig" ? w.datum : null,
      }),
      loeschen: (id) => api("blockzeit_loeschen", { id }),
      loeschFrage: (b) => `Blockzeit „${b.titel}“ löschen?`,
      gespeichert: "Blockzeit gespeichert",
      danach: () => { if (aktiverTab === "frei") renderFrei(); },
    },

    inventar: {
      titel: "Gegenstand bearbeiten",
      finden: (id) => ogsInventar.find((i) => String(i.id) === String(id)),
      laden: (i) => ({
        name: i.name || "", kategorie: i.kategorie || "", menge: String(i.menge || 1),
        wert: invWert(i) === null ? "" : String(invWert(i)), standort: i.standort || "",
        beschreibung: i.beschreibung || "", zustand: i.zustand || "gut",
      }),
      felder: [
        { key: "name", label: "Gegenstand", typ: "text", pflicht: true },
        { key: "kategorie", label: "Kategorie", typ: "text", pflicht: true, liste: "inv-kategorie-liste" },
        { key: "menge", label: "Menge", typ: "zahl", min: 1, halb: true },
        { key: "wert", label: "Wert je Stück (€)", typ: "zahl", min: 0, schritt: "0.01", halb: true, platzhalter: "optional" },
        { key: "zustand", label: "Zustand", typ: "chips", optionen: [["gut", "Gut"], ["eingeschraenkt", "Eingeschränkt"], ["defekt", "Defekt"]] },
        { key: "standort", label: "Standort", typ: "text", platzhalter: "optional" },
        { key: "beschreibung", label: "Beschreibung", typ: "text-lang", platzhalter: "optional" },
      ],
      speichern: (id, w) => api("ogs_inventar_aktualisieren", {
        id, name: w.name, kategorie: w.kategorie, menge: w.menge || 1, standort: w.standort || null,
        beschreibung: w.beschreibung || null, zustand: w.zustand, wiederbeschaffungswert: w.wert,
      }),
      loeschen: (id) => api("ogs_inventar_loeschen", { id }),
      loeschFrage: (i) => `Gegenstand „${i.name}“ wirklich löschen?`,
      gespeichert: "Gegenstand gespeichert",
      // Kategorie nach dem Speichern offen lassen (auch eine geänderte)
      vorher: (w) => { invGruppenOffen.add(invGruppenSchluessel(w.kategorie)); invGruppenMerken(); },
    },

    verleih: {
      titel: "Verleih bearbeiten",
      finden: (id) => verleih.find((v) => String(v.id) === String(id)),
      laden: (v) => ({
        gegenstand: (ogsInventar.find((i) => i.id === v.inventar_id) || {}).name || "(gelöschter Gegenstand)",
        an: v.ausgeliehen_an || "", menge: String(v.menge || 1),
        am: v.ausgeliehen_am || "", zurueck: v.rueckgabe_am || "", notiz: v.notiz || "",
      }),
      felder: [
        { key: "gegenstand", label: "Gegenstand", typ: "info" },
        { key: "an", label: "An wen", typ: "text", pflicht: true },
        { key: "menge", label: "Menge", typ: "zahl", min: 1, halb: true },
        { key: "am", label: "Ausgeliehen am", typ: "datum", pflicht: true, halb: true },
        { key: "zurueck", label: "Zurück am", typ: "datum", hinweis: "leer = noch verliehen" },
        { key: "notiz", label: "Notiz", typ: "text", platzhalter: "optional" },
      ],
      pruefen: (w) => (w.zurueck && w.zurueck < w.am ? "Die Rückgabe liegt vor dem Ausleihen." : ""),
      speichern: (id, w) => api("verleih_aktualisieren", {
        id, ausgeliehen_an: w.an, menge: w.menge || 1, ausgeliehen_am: w.am, rueckgabe_am: w.zurueck || null, notiz: w.notiz || null,
      }),
      loeschen: (id) => api("verleih_loeschen", { id }),
      loeschFrage: () => "Diesen Verleih-Eintrag endgültig löschen?",
      gespeichert: "Verleih gespeichert",
    },

    projekt: {
      titel: "Projekt bearbeiten",
      finden: (id) => ogsProjekte.find((p) => String(p.id) === String(id)),
      laden: (p) => ({
        _id: p.id,
        _unter: ogsProjekte.some((u) => u.hauptprojekt_id === p.id),
        titel: p.titel || "", kategorie: p.kategorie || "", beschreibung: p.beschreibung || "",
        haupt: p.hauptprojekt_id || "",
        unterInfo: "Hat eigene Unterprojekte – bleibt deshalb Hauptprojekt",
      }),
      felder: [
        { key: "titel", label: "Titel", typ: "text", pflicht: true },
        { key: "kategorie", label: "Kategorie", typ: "text", liste: "proj-kategorie-liste", platzhalter: "optional" },
        { key: "beschreibung", label: "Kurzbeschreibung", typ: "text-lang", platzhalter: "optional" },
        // Nur eine Ebene: Ziel sind Hauptprojekte des Bereichs außer dem Projekt selbst
        { key: "haupt", label: "Gehört zu", typ: "auswahl", wenn: (w) => !w._unter,
          optionen: (w) => [["", "– Eigenständiges Hauptprojekt –"],
            ...ogsProjekteAktuell().filter((h) => !h.hauptprojekt_id && h.id !== w._id)
              .sort((a, b) => a.titel.localeCompare(b.titel)).map((h) => [h.id, h.titel])] },
        { key: "unterInfo", label: "Gehört zu", typ: "info", wenn: (w) => w._unter },
      ],
      speichern: (id, w) => api("ogs_projekt_aktualisieren", {
        id, titel: w.titel, kategorie: w.kategorie || null, beschreibung: w.beschreibung || null,
        hauptprojekt_id: w._unter ? undefined : (w.haupt || null),
      }),
      loeschen: (id) => api("ogs_projekt_loeschen", { id }),
      loeschFrage: (p) => `Projekt „${p.titel}“ inklusive hinterlegter Dateien wirklich löschen?`,
      gespeichert: "Projekt gespeichert",
    },

    spiel: {
      titel: "Spiel bearbeiten",
      finden: (id) => spiele.find((x) => String(x.id) === String(id)),
      laden: (x) => ({
        titel: x.titel || "", kategorie: x.kategorie || "", teilnehmer: x.teilnehmerzahl || "",
        alter: x.altersgruppe || "", dauer: x.dauer || "", material: x.material || "", beschreibung: x.beschreibung || "",
      }),
      felder: [
        { key: "titel", label: "Titel", typ: "text", pflicht: true },
        { key: "kategorie", label: "Kategorie", typ: "text", liste: "spiel-kategorie-liste", platzhalter: "optional" },
        { key: "teilnehmer", label: "Teilnehmerzahl", typ: "text", halb: true, platzhalter: "z. B. 6–20" },
        { key: "alter", label: "Altersgruppe", typ: "text", halb: true, platzhalter: "z. B. ab 8" },
        { key: "dauer", label: "Dauer", typ: "text", halb: true, platzhalter: "z. B. 15 Min." },
        { key: "material", label: "Material", typ: "text", halb: true, platzhalter: "optional" },
        { key: "beschreibung", label: "Spielbeschreibung", typ: "text-lang", zeilen: 7, platzhalter: "optional" },
      ],
      speichern: (id, w) => api("spiel_aktualisieren", {
        id, titel: w.titel, kategorie: w.kategorie || null, beschreibung: w.beschreibung || null,
        teilnehmerzahl: w.teilnehmer || null, altersgruppe: w.alter || null, dauer: w.dauer || null, material: w.material || null,
      }),
      loeschen: (id) => api("spiel_loeschen", { id }),
      loeschFrage: (x) => `Spiel „${x.titel}“ inklusive hinterlegter Dateien wirklich löschen?`,
      gespeichert: "Spiel gespeichert",
      // Kategorie nach dem Speichern offen lassen (auch eine geänderte)
      vorher: (w) => { spielGruppenOffen.add(w.kategorie || SPIEL_OHNE_KATEGORIE); spielGruppenMerken(); },
    },

    reflexion: {
      titel: "Reflexion bearbeiten",
      finden: (id) => reflexionen.find((r) => String(r.id) === String(id)),
      laden: (r) => ({ datum: r.datum || "", text: r.text || "" }),
      felder: [
        { key: "datum", label: "Datum", typ: "datum", pflicht: true },
        { key: "text", label: "Text", typ: "text-lang", zeilen: 8, pflicht: true },
      ],
      speichern: (id, w) => api("reflexion_aktualisieren", { id, text: w.text, datum: w.datum }),
      loeschen: (id) => api("reflexion_loeschen", { id }),
      loeschFrage: () => "Diese Reflexion löschen?",
      gespeichert: "Reflexion gespeichert",
    },

    zugang: {
      titel: "Zugang bearbeiten",
      finden: (id) => schluesselZugaenge.find((z) => String(z.id) === String(id)),
      laden: (z) => ({ name: z.name || "", beschreibung: z.beschreibung || "" }),
      felder: [
        { key: "name", label: "Name", typ: "text", pflicht: true },
        { key: "beschreibung", label: "Beschreibung", typ: "text", platzhalter: "optional" },
      ],
      speichern: (id, w) => api("zugang_aktualisieren", { id, name: w.name, beschreibung: w.beschreibung }),
      loeschen: (id) => api("zugang_loeschen", { id }),
      loeschFrage: (z) => {
        const anzahl = schluesselAktuell().filter((k) => (k.zugaenge || []).includes(z.id)).length;
        return `Zugang „${z.name || ""}“ löschen?` + (anzahl ? ` Er wird bei ${anzahl} Schlüssel/Key${anzahl === 1 ? "" : "s"} entfernt.` : "");
      },
      gespeichert: "Zugang gespeichert",
    },

    raum: {
      titel: "Raum bearbeiten",
      finden: (id) => raeume.find((r) => String(r.id) === String(id)),
      laden: (r) => ({ name: r.name || "", beschreibung: r.beschreibung || "" }),
      felder: [
        { key: "name", label: "Name", typ: "text", pflicht: true },
        { key: "beschreibung", label: "Beschreibung", typ: "text", platzhalter: "optional" },
      ],
      speichern: (id, w) => api("raum_aktualisieren", { id, name: w.name, beschreibung: w.beschreibung }),
      loeschen: (id) => api("raum_loeschen", { id }),
      loeschFrage: (r) => `Raum „${r.name || ""}“ löschen? Vorhandene Vermietungen bleiben erhalten, stehen dann aber ohne Raum.`,
      gespeichert: "Raum gespeichert",
    },

    schluessel: {
      titel: "Schlüssel bearbeiten",
      finden: (id) => schluesselListe.find((k) => String(k.id) === String(id)),
      laden: (k) => ({
        _id: k.id,
        _ausgegeben: !!offeneAusgabe(k),
        art: k.art === "key" ? "key" : "schluessel", nr: k.seriennummer || "", name: k.inhaber || "", verein: k.verein || "",
        zugaenge: (k.zugaenge || []).slice(), notiz: k.notiz || "",
      }),
      felder: [
        { key: "art", label: "Art", typ: "chips", optionen: [["schluessel", "Schlüssel"], ["key", "Elektronischer Key"]] },
        { key: "nr", label: "Seriennummer", typ: "text", pflicht: true },
        // Ist der Schlüssel ausgegeben, ändern sich Name/Verein nur über das Protokoll
        { key: "name", label: "Name", typ: "text", halb: true, liste: "schluessel-namen-vorschlaege", platzhalter: "optional",
          gesperrt: (w) => w._ausgegeben, gesperrtHinweis: "ausgegeben – über das Protokoll ändern" },
        { key: "verein", label: "Verein", typ: "text", halb: true, liste: "schluessel-vereine-vorschlaege", platzhalter: "optional",
          gesperrt: (w) => w._ausgegeben, gesperrtHinweis: "ausgegeben – über das Protokoll ändern" },
        { key: "zugaenge", label: "Zugänge", typ: "mehrfach", icon: "tuer",
          optionen: () => zugaengeAktuell().map((z) => [z.id, z.name, z.beschreibung || ""]),
          leer: `Noch keine Zugänge – über ${ic("zahnrad")} oben („Zugänge verwalten“) anlegen.` },
        { key: "notiz", label: "Notiz", typ: "text", platzhalter: "optional" },
        { key: "ausgaben", label: "Ausgaben", typ: "html", wenn: (w) => ausgabenVonSchluessel(schluesselListe.find((k) => k.id === w._id) || {}).length > 0,
          html: (w) => ausgabenVonSchluessel(schluesselListe.find((k) => k.id === w._id)).map((a) => `
            <div class="blatt-ausgabe">${escapeHtml(a.inhaber)}${a.verein ? " (" + escapeHtml(a.verein) + ")" : ""} · ${datumDE(a.ausgegeben_am)} – ${a.zurueck_am ? datumDE(a.zurueck_am) : "heute"}
              <span class="blatt-ausgabe-knoepfe"><button type="button" class="link-btn" onclick="ausgabeDrucken('${a.id}')">${ic("drucken")}Drucken</button>
              <button type="button" class="link-btn" onclick="ausgabePdf('${a.id}')">${ic("export")}PDF</button>${mailEingerichtet ? `
              <button type="button" class="link-btn" onclick="ausgabeMailen('${a.id}')">${ic("mail")}Mail</button>` : ""}</span></div>`).join("") },
      ],
      speichern: (id, w) => api("schluessel_aktualisieren", {
        id, art: w.art, seriennummer: w.nr, inhaber: w.name, verein: w.verein, notiz: w.notiz,
        // Zugänge nur mitschicken, wenn es welche gibt (sonst bleibt die Spalte unberührt)
        ...(zugaengeAktuell().length ? { zugaenge: w.zugaenge } : {}),
      }),
      loeschen: (id) => api("schluessel_loeschen", { id }),
      loeschFrage: (k) => {
        const protokolle = ausgabenVonSchluessel(k).length;
        return `${k.art === "key" ? "Key" : "Schlüssel"} Nr. ${k.seriennummer || ""} löschen?` +
          (protokolle ? ` ${protokolle === 1 ? "Das Ausgabeprotokoll bleibt" : `Die ${protokolle} Ausgabeprotokolle bleiben`} erhalten (unten unter „Ausgabeprotokolle“).` : "");
      },
      gespeichert: "Schlüssel gespeichert",
    },

    notiz: {
      titel: "Notiz bearbeiten",
      finden: (id) => notizen.find((n) => String(n.id) === String(id)),
      laden: (n) => ({ text: n.text || "", projekt: n.projekt_id || "" }),
      felder: [
        { key: "text", label: "Notiz", typ: "text-lang", zeilen: 5, pflicht: true },
        { key: "projekt", label: "Projekt", typ: "auswahl",
          optionen: () => [["", "Ohne Projekt"], ...projekteAktuell().map((p) => [p.id, p.name])] },
      ],
      speichern: (id, w) => api("notiz_aktualisieren", { id, text: w.text, projekt_id: w.projekt || null }),
      loeschen: (id) => api("notiz_loeschen", { id }),
      loeschFrage: () => "Diese Notiz löschen?",
      gespeichert: "Notiz gespeichert",
    },

    link: {
      titel: "Link bearbeiten",
      finden: (id) => links.find((l) => String(l.id) === String(id)),
      laden: (l) => ({ titel: l.titel || "", url: l.url || "", notiz: l.notiz || "", projekt: l.projekt_id || "" }),
      felder: [
        { key: "titel", label: "Titel", typ: "text", pflicht: true },
        { key: "url", label: "Adresse", typ: "text", eingabe: "url", pflicht: true, hinweis: "ohne https:// wird es automatisch ergänzt" },
        { key: "notiz", label: "Notiz", typ: "text", platzhalter: "optional" },
        { key: "projekt", label: "Projekt", typ: "auswahl",
          optionen: () => [["", "Ohne Projekt"], ...projekteAktuell().map((p) => [p.id, p.name])] },
      ],
      speichern: (id, w) => api("link_aktualisieren", { id, titel: w.titel, url: w.url, notiz: w.notiz || null, projekt_id: w.projekt || null }),
      loeschen: (id) => api("link_loeschen", { id }),
      loeschFrage: (l) => `Link „${l.titel || ""}“ löschen?`,
      gespeichert: "Link gespeichert",
    },

    idee: {
      titel: "Idee bearbeiten",
      finden: (id) => ogsIdeen.find((i) => String(i.id) === String(id)),
      laden: (i) => ({ titel: i.titel || "", beschreibung: i.beschreibung || "", status: i.status || "offen" }),
      felder: [
        { key: "titel", label: "Idee", typ: "text", pflicht: true },
        { key: "beschreibung", label: "Beschreibung", typ: "text-lang", zeilen: 4, platzhalter: "optional" },
        { key: "status", label: "Status", typ: "chips", optionen: () => Object.entries(OGS_IDEE_STATUS_LABEL) },
      ],
      speichern: (id, w) => api("ogs_idee_aktualisieren", { id, titel: w.titel, beschreibung: w.beschreibung || null, status: w.status }),
      loeschen: (id) => api("ogs_idee_loeschen", { id }),
      loeschFrage: (i) => `Idee „${i.titel || ""}“ löschen?`,
      gespeichert: "Idee gespeichert",
    },

    // Einheit (seit Session 37) – Kopfdaten; Ablauf und Material im Reiter
    einheit: {
      titel: "Einheit bearbeiten",
      titelNeu: "Neue Einheit",
      finden: (id) => (einheiten || []).find((e) => String(e.id) === String(id)),
      laden: (e) => ({
        titel: e.titel || "", datum: e.datum || "", uhrzeit: e.uhrzeit ? String(e.uhrzeit).slice(0, 5) : "",
        ort: e.ort || "", gruppe: e.gruppe || "", ziel: e.ziel || "", notiz: e.notiz || "",
      }),
      felder: [
        { key: "titel", label: "Titel", typ: "text", pflicht: true, platzhalter: "z. B. Herbstferien Tag 2, Teamspiele 3b" },
        { key: "datum", label: "Datum", typ: "datum", halb: true, hinweis: "optional" },
        { key: "uhrzeit", label: "Beginn", typ: "zeit", halb: true, hinweis: "für die Uhrzeiten im Ablauf" },
        { key: "ort", label: "Ort", typ: "text", halb: true, platzhalter: "optional" },
        { key: "gruppe", label: "Gruppe", typ: "text", halb: true, platzhalter: "z. B. 8–12 J., 15 Kinder" },
        { key: "ziel", label: "Ziel", typ: "text-lang", zeilen: 2, platzhalter: "Was soll die Einheit bewirken? (optional)" },
        { key: "notiz", label: "Notiz", typ: "text-lang", zeilen: 2, platzhalter: "optional" },
      ],
      speichern: async (id, w) => {
        const erg = await api("einheit_speichern", {
          id, bereich: aktiverBereich, titel: w.titel, datum: w.datum, uhrzeit: w.uhrzeit, ort: w.ort, gruppe: w.gruppe, ziel: w.ziel, notiz: w.notiz,
        });
        if (!id && erg && erg.id) einheitOffenId = erg.id;
        return erg;
      },
      loeschen: (id) => api("einheit_loeschen", { id }),
      loeschFrage: (e) => `Einheit „${e.titel || ""}“ mit ihrem Ablauf löschen? Die Spiele in der Kartei bleiben.`,
      gespeichert: "Einheit gespeichert",
      danach: () => { if (aktiverTab === "einheiten") renderEinheiten(); },
    },

    // Baustein einer Einheit (Spiel aus der Kartei oder eigener Programmpunkt)
    baustein: {
      titel: "Baustein bearbeiten",
      titelNeu: "Eigener Baustein",
      finden: (id) => einheitBausteine.find((b) => String(b.id) === String(id)),
      laden: (b) => ({
        _einheit: b.einheit_id, _spiel: b.spiel_id || null,
        spiel: b.spiel_id ? bausteinTitel(b) : "",
        titel: b.spiel_id ? "" : (b.titel || ""),
        dauer: b.dauer_min !== undefined && b.dauer_min !== null ? String(b.dauer_min) : "10",
        notiz: b.notiz || "",
      }),
      felder: [
        { key: "spiel", label: "Spiel aus der Kartei", typ: "info", wenn: (w) => !!w._spiel },
        { key: "titel", label: "Programmpunkt", typ: "text", pflicht: true, wenn: (w) => !w._spiel, platzhalter: "z. B. Begrüßung, Pause, Abschlussrunde" },
        { key: "dauer", label: "Dauer (Minuten)", typ: "zahl", min: 0, pflicht: true },
        { key: "notiz", label: "Notiz", typ: "text-lang", zeilen: 3, platzhalter: "z. B. Varianten, Regeln, wer leitet an (optional)" },
      ],
      speichern: (id, w) => (id
        ? api("baustein_aktualisieren", { id, titel: w._spiel ? undefined : w.titel, dauer_min: w.dauer, notiz: w.notiz })
        : api("baustein_hinzufuegen", { einheit_id: w._einheit, titel: w.titel, dauer_min: w.dauer, notiz: w.notiz })),
      loeschen: (id) => api("baustein_loeschen", { id }),
      loeschFrage: (b) => `„${bausteinTitel(b)}“ aus dem Ablauf entfernen?`,
      gespeichert: "Ablauf gespeichert",
      danach: () => { if (aktiverTab === "einheiten") renderEinheiten(); },
    },

    // Sparziel (seit Session 37) – Rechnung in finSparzielRechnen
    sparziel: {
      titel: "Sparziel bearbeiten",
      titelNeu: "Neues Sparziel",
      finden: (id) => (sparziele || []).find((s) => String(s.id) === String(id)),
      laden: (s) => ({
        titel: s.titel || "",
        art: s.art === "kontostand" ? "kontostand" : "zuruecklegen",
        betrag: s.betrag !== undefined && s.betrag !== null ? String(finZahl(s.betrag)) : "",
        bis: s.bis || "",
        start: s.start_stand !== undefined && s.start_stand !== null ? String(finZahl(s.start_stand)) : "",
      }),
      felder: [
        { key: "titel", label: "Wofür?", typ: "text", pflicht: true, platzhalter: "z. B. Urlaub, Rücklage, neues Rad" },
        { key: "art", label: "Art", typ: "chips", optionen: [["zuruecklegen", "Zurücklegen"], ["kontostand", "Kontostand erreichen"]] },
        { key: "betrag", label: "Betrag (€)", typ: "zahl", min: 1, schritt: "0.01", pflicht: true, halb: true },
        { key: "bis", label: "Bis", typ: "datum", pflicht: true, halb: true, hinweis: "zählt das Monatsende" },
        { key: "start", label: "Ab Kontostand (€)", typ: "zahl", schritt: "0.01", wenn: (w) => w.art === "zuruecklegen",
          hinweis: "Stand beim Anlegen – ab hier zählt, was du zurücklegst." },
      ],
      pruefen: (w) => {
        if (!(finZahl(w.betrag) > 0)) return "Der Betrag muss größer als 0 sein.";
        if (w.art === "zuruecklegen" && w.start === "") return "Bitte den Kontostand eintragen, ab dem gezählt wird.";
        return "";
      },
      speichern: (id, w) => api("sparziel_speichern", {
        id, bereich: aktiverBereich, titel: w.titel, art: w.art, betrag: w.betrag, bis: w.bis, start_stand: w.start,
      }),
      loeschen: (id) => api("sparziel_loeschen", { id }),
      loeschFrage: (s) => `Sparziel „${s.titel || ""}“ löschen?`,
      gespeichert: "Sparziel gespeichert",
      danach: () => { if (aktiverTab === "finanzen" && finTyp === "prognose") renderFinPrognose(false); },
    },

    // Kategorie-Regel (seit Session 36): „Buchungstext beginnt mit … → Kategorie“
    katregel: {
      titel: "Kategorie-Regel bearbeiten",
      titelNeu: "Neue Kategorie-Regel",
      finden: (id) => (kategorieRegeln || []).find((r) => String(r.id) === String(id)),
      laden: (r) => ({
        muster: r.muster ? finNameAusSchluessel(finRegelText(r.muster)) : "",
        typ: r.typ === "einnahme" ? "einnahme" : "ausgabe",
        kategorie: r.kategorie || "",
        rueckwirkend: "ja",
      }),
      felder: [
        { key: "muster", label: "Buchungstext beginnt mit", typ: "text", pflicht: true, platzhalter: "z. B. Rewe",
          hinweis: "Groß- und Kleinschreibung, Zahlen und Wörter wie Lastschrift spielen keine Rolle." },
        { key: "typ", label: "Gilt für", typ: "chips", optionen: [["ausgabe", "Ausgaben"], ["einnahme", "Einnahmen"]] },
        { key: "kategorie", label: "Kategorie", typ: "text", pflicht: true, liste: "fin-kategorie-liste", platzhalter: "z. B. Lebensmittel" },
        { key: "rueckwirkend", label: "Bisherige Buchungen", typ: "chips", optionen: [["ja", "Auch ändern"], ["nein", "Nur neue Importe"]] },
        { key: "vorschau", label: "Passt zu", typ: "html", html: (w) => finRegelVorschauHtml(w) },
      ],
      pruefen: (w) => (finRegelText(w.muster).length < 2
        ? "Der Suchtext braucht mindestens 2 Buchstaben – Zahlen, Satzzeichen und Wörter wie Lastschrift zählen nicht." : ""),
      speichern: (id, w) => api("kategorie_regel_speichern", {
        id, bereich: aktiverBereich, typ: w.typ, muster: w.muster, kategorie: w.kategorie, rueckwirkend: w.rueckwirkend === "ja",
      }),
      loeschen: (id) => api("kategorie_regel_loeschen", { id }),
      loeschFrage: (r) => `Regel „${finNameAusSchluessel(r.muster || "")} → ${r.kategorie || ""}“ löschen? Schon geänderte Buchungen behalten ihre Kategorie.`,
      gespeichert: (erg) => (erg && erg.geaendert
        ? `Regel gespeichert · ${erg.geaendert} ${erg.geaendert === 1 ? "Buchung" : "Buchungen"} geändert` : "Regel gespeichert"),
      beimRendern: (w) => finKategorieListeFuellen(w.typ),
      beimTippen: (w) => {
        const el = document.getElementById("blatt-f-vorschau");
        if (el) el.innerHTML = finRegelVorschauHtml(w);
      },
      danach: () => finNachRegelAenderung(),
    },
  };

  let blatt = null; // { art, id, werte }

  // Öffnet das Bearbeiten-Blatt für einen Eintrag
  window.blattOeffnen = function(art, id) {
    const cfg = BLATT_ARTEN[art];
    const dlg = document.getElementById("blatt-dialog");
    const eintrag = cfg && cfg.finden(id);
    if (!dlg || !eintrag) return;
    blattStarten(art, eintrag.id, cfg.laden(eintrag), cfg.titel);
  };

  // Öffnet das Blatt für einen neuen Eintrag (seit Session 36, z. B. Kategorie-Regel);
  // vorlage wird wie ein vorhandener Eintrag über cfg.laden gelesen
  window.blattNeu = function(art, vorlage) {
    const cfg = BLATT_ARTEN[art];
    if (!cfg || !document.getElementById("blatt-dialog")) return;
    blattStarten(art, null, cfg.laden(vorlage || {}), cfg.titelNeu || cfg.titel);
  };

  function blattStarten(art, id, werte, titel) {
    const dlg = document.getElementById("blatt-dialog");
    blatt = { art, id, werte };
    document.getElementById("blatt-titel").textContent = titel;
    // „Löschen“ nur bei vorhandenen Einträgen
    document.getElementById("blatt-loeschen").classList.toggle("hidden", id === null);
    blattMeldung("", false);
    blattRendern();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    const erstes = dlg.querySelector("#blatt-felder input, #blatt-felder textarea");
    if (erstes) erstes.focus();
  }

  window.blattSchliessen = function() {
    const dlg = document.getElementById("blatt-dialog");
    if (!dlg) return;
    if (typeof dlg.close === "function" && dlg.open) dlg.close(); else dlg.removeAttribute("open");
  };

  function blattMeldung(text, fehler) {
    const el = document.getElementById("blatt-status");
    el.textContent = text;
    el.classList.toggle("fehler", !!fehler);
  }

  // Zeichnet die Felder; Werte stehen in blatt.werte, damit Neuzeichnen nichts verliert
  function blattRendern() {
    const cfg = BLATT_ARTEN[blatt.art];
    const w = blatt.werte;
    const html = cfg.felder.filter((f) => !f.wenn || f.wenn(w)).map((f) => {
      const id = `blatt-f-${f.key}`;
      const label = `<span class="schnell-label blatt-label">${escapeHtml(f.label)}</span>`;
      const ph = f.platzhalter ? ` placeholder="${escapeAttr(f.platzhalter)}"` : "";
      const daten = ` data-feld="${f.key}"`;
      let feld = "";
      if (f.typ === "info") {
        feld = `<p class="blatt-info" id="${id}">${escapeHtml(w[f.key])}</p>`;
      } else if (f.typ === "auswahl") {
        const optionen = typeof f.optionen === "function" ? f.optionen(w) : f.optionen;
        feld = `<select id="${id}"${daten}>` + optionen.map(([wert, text]) =>
          `<option value="${escapeAttr(wert)}"${String(w[f.key]) === String(wert) ? " selected" : ""}>${escapeHtml(text)}</option>`).join("") + `</select>`;
      } else if (f.typ === "chips") {
        const optionen = typeof f.optionen === "function" ? f.optionen(w) : f.optionen;
        feld = `<div class="schnell-chips" role="group" aria-label="${escapeAttr(f.label)}">` + optionen.map(([wert, text]) =>
          `<button type="button" class="schnell-chip${w[f.key] === wert ? " aktiv" : ""}" aria-pressed="${w[f.key] === wert}"
            onclick="blattWaehlen('${f.key}','${wert}')">${escapeHtml(text)}</button>`).join("") + `</div>`;
      } else if (f.typ === "wochentage") {
        feld = `<div class="schnell-chips blatt-wochentage" role="group" aria-label="${escapeAttr(f.label)}">` + TAGLABEL.map((t, i) => {
          const an = w[f.key].includes(i);
          return `<button type="button" class="schnell-chip${an ? " aktiv" : ""}" aria-pressed="${an}" onclick="blattWochentag(${i})">${t}</button>`;
        }).join("") + `</div>`;
      } else if (f.typ === "mehrfach") {
        const optionen = typeof f.optionen === "function" ? f.optionen(w) : f.optionen;
        feld = optionen.length
          ? `<div class="blatt-hakenliste" id="${id}" role="group" aria-label="${escapeAttr(f.label)}">` + optionen.map(([wert, text, unter]) => `
              <label class="blatt-haken"><input type="checkbox" data-mehrfach="${f.key}" value="${escapeAttr(wert)}"${w[f.key].includes(wert) ? " checked" : ""}>
                <span>${f.icon ? ic(f.icon) + " " : ""}${escapeHtml(text)}${unter ? `<span class="blatt-hinweis">${escapeHtml(unter)}</span>` : ""}</span></label>`).join("") + `</div>`
          : `<p class="blatt-hinweis">${f.leer || "Keine Auswahl vorhanden."}</p>`;
      } else if (f.typ === "html") {
        feld = `<div class="blatt-html" id="${id}">${f.html(w)}</div>`;
      } else if (f.typ === "text-lang") {
        feld = `<textarea id="${id}" class="schnell-notiz" rows="${f.zeilen || 3}"${daten}${ph}>${escapeHtml(w[f.key])}</textarea>`;
      } else {
        const typ = f.eingabe || { text: "text", zahl: "number", datum: "date", zeit: "time" }[f.typ];
        const extra = (f.liste ? ` list="${f.liste}"` : "") + (f.min !== undefined ? ` min="${f.min}"` : "") +
          (f.schritt ? ` step="${f.schritt}"` : "") + (f.typ === "zahl" ? ` inputmode="${f.schritt ? "decimal" : "numeric"}"` : "");
        const gesperrt = f.gesperrt && f.gesperrt(w);
        feld = `<input type="${typ}" id="${id}" value="${escapeAttr(w[f.key])}"${daten}${ph}${extra}${gesperrt ? " readonly" : ""} autocomplete="off">`;
      }
      const hinweisText = f.gesperrt && f.gesperrt(w) ? f.gesperrtHinweis : f.hinweis;
      const hinweis = hinweisText ? `<span class="blatt-hinweis">${escapeHtml(hinweisText)}</span>` : "";
      const fuer = ["chips", "wochentage", "info", "mehrfach", "html"].includes(f.typ) ? "div" : "label";
      return `<${fuer} class="blatt-feld${f.halb ? " halb" : ""}"${fuer === "label" ? ` for="${id}"` : ""}>${label}${feld}${hinweis}</${fuer}>`;
    }).join("");
    const box = document.getElementById("blatt-felder");
    box.innerHTML = html;
    box.querySelectorAll("[data-feld]").forEach((el) => {
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
        blatt.werte[el.dataset.feld] = el.value;
        if (cfg.beimTippen) cfg.beimTippen(blatt.werte);
      });
      if (el.tagName === "INPUT") el.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); window.blattSpeichern(); } });
    });
    // Haken-Listen: ohne Neuzeichnen, damit die Liste nicht nach oben springt
    box.querySelectorAll("[data-mehrfach]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const key = cb.dataset.mehrfach;
        const liste = blatt.werte[key].filter((x) => x !== cb.value);
        blatt.werte[key] = cb.checked ? [...liste, cb.value] : liste;
      });
    });
    if (cfg.beimRendern) cfg.beimRendern(w);
  }

  window.blattWaehlen = function(key, wert) {
    blatt.werte[key] = wert;
    blattRendern();
  };
  window.blattWochentag = function(i) {
    const liste = blatt.werte.wochentage;
    blatt.werte.wochentage = liste.includes(i) ? liste.filter((x) => x !== i) : [...liste, i];
    blattRendern();
  };

  window.blattSpeichern = async function() {
    if (!blatt) return;
    const cfg = BLATT_ARTEN[blatt.art];
    const w = blatt.werte;
    Object.keys(w).forEach((k) => { if (typeof w[k] === "string") w[k] = w[k].trim(); });
    const fehlt = cfg.felder.find((f) => f.pflicht && (!f.wenn || f.wenn(w)) && !w[f.key]);
    if (fehlt) {
      blattMeldung(`Bitte „${fehlt.label}“ ausfüllen.`, true);
      const el = document.getElementById(`blatt-f-${fehlt.key}`);
      if (el) el.focus();
      return;
    }
    const problem = cfg.pruefen ? cfg.pruefen(w) : "";
    if (problem) { blattMeldung(problem, true); return; }
    const knopf = document.getElementById("blatt-speichern");
    knopf.disabled = true;
    blattMeldung("Speichere …", false);
    let ergebnis;
    try {
      ergebnis = await cfg.speichern(blatt.id, w);
    } catch (e) {
      blattMeldung("Nicht gespeichert: " + (e.message || "Fehler"), true);
      knopf.disabled = false;
      return;
    }
    knopf.disabled = false;
    if (cfg.vorher) cfg.vorher(w);
    window.blattSchliessen();
    hinweisZeigen(typeof cfg.gespeichert === "function" ? cfg.gespeichert(ergebnis, w) : cfg.gespeichert);
    await ladeDaten();
    if (cfg.danach) cfg.danach();
  };

  window.blattLoeschen = async function() {
    if (!blatt) return;
    const cfg = BLATT_ARTEN[blatt.art];
    const eintrag = cfg.finden(blatt.id);
    if (!confirm(cfg.loeschFrage(eintrag || {}))) return;
    try {
      await cfg.loeschen(blatt.id);
    } catch (e) {
      blattMeldung("Nicht gelöscht: " + (e.message || "Fehler"), true);
      return;
    }
    window.blattSchliessen();
    hinweisZeigen("Gelöscht");
    await ladeDaten();
    if (cfg.danach) cfg.danach();
  };

  // Tipp neben das Blatt schließt es (Escape schließt der Browser selbst)
  (function blattEinrichten() {
    const dlg = document.getElementById("blatt-dialog");
    if (dlg) dlg.addEventListener("click", (e) => { if (e.target === dlg) window.blattSchliessen(); });
  })();

  // Schließt das Blatt und öffnet stattdessen das Formular des offenen Reiters
  window.schnellZumReiterformular = function() {
    window.schnellSchliessen();
    const id = "form-" + aktiverTab;
    if (!document.getElementById(id)) return;
    reiterFormularOeffnen(id, true);
    const knopf = reiterKnopfFuer(id);
    if (knopf && knopf.scrollIntoView) knopf.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  // Schließt die Schnellerfassung ohne zu speichern
  window.schnellSchliessen = function() {
    const dlg = document.getElementById("schnell-dialog");
    if (!dlg) return;
    if (typeof dlg.close === "function" && dlg.open) dlg.close(); else dlg.removeAttribute("open");
  };

  // Setzt Art, Bereich oder Wann und zeichnet das Blatt neu
  window.schnellSetzen = function(feld, wert) {
    if (feld === "wann" && schnell.erkannt) schnellErkennungAbschalten(false);
    schnell[feld] = wert;
    if (feld === "bereich" && !schnellArtenFuer(wert).some((a) => a.art === schnell.art)) schnell.art = "aufgabe";
    if (feld === "art") {
      if (wert === "termin" && schnell.wann === "ohne") schnell.wann = "heute";
    }
    if (feld === "wann" && wert === "datum") {
      const datum = document.getElementById("schnell-datum");
      if (!datum.value) datum.value = heuteISO();
    }
    if (feld === "art" || feld === "bereich") { schnellTextPruefen(); return; }
    schnellRendern();
    if (feld === "wann" && wert === "datum") document.getElementById("schnell-datum").focus();
  };

  // ---- Datum/Uhrzeit aus dem Text (seit Session 35) ----
  // Prüft beim Tippen den Text und stellt Wann, Datum, Uhrzeit und Ende ein.
  // Nur bei Aufgabe und Termin. Was vorher eingestellt war, wird gemerkt und
  // zurückgesetzt, sobald die Angabe wieder aus dem Text verschwindet.
  function schnellFelderLesen() {
    return {
      wann: schnell.wann,
      datum: document.getElementById("schnell-datum").value,
      uhrzeit: document.getElementById("schnell-uhrzeit").value,
      ende: document.getElementById("schnell-ende").value,
    };
  }
  function schnellFelderSetzen(w) {
    schnell.wann = w.wann;
    document.getElementById("schnell-datum").value = w.datum || "";
    document.getElementById("schnell-uhrzeit").value = w.uhrzeit || "";
    document.getElementById("schnell-ende").value = w.ende || "";
  }
  function schnellTextPruefen() {
    const mitWann = schnell.art === "aufgabe" || schnell.art === "termin";
    const e = (!mitWann || schnell.erkennungAus) ? null : textDatumErkennen(document.getElementById("schnell-text").value);
    if (e) {
      if (!schnell.erkannt) schnell.vorErkennung = schnellFelderLesen();
      const heute = heuteISO();
      // Nur Uhrzeit: ein vorher gewählter Tag (Morgen/Datum) bleibt, sonst heute
      const v = schnell.vorErkennung;
      const vorherTag = v && v.wann === "morgen" ? addTage(heute, 1) : v && v.wann === "datum" && v.datum ? v.datum : null;
      const datum = e.datum || vorherTag || heute;
      schnellFelderSetzen({
        wann: datum === heute ? "heute" : datum === addTage(heute, 1) ? "morgen" : "datum",
        datum: datum === heute || datum === addTage(heute, 1) ? "" : datum,
        uhrzeit: e.uhrzeit || "",
        ende: e.ende || "",
      });
    } else if (schnell.erkannt && schnell.vorErkennung) {
      schnellFelderSetzen(schnell.vorErkennung);
      schnell.vorErkennung = null;
    }
    schnell.erkannt = e;
    schnellRendern();
  }
  // „Ignorieren“ bzw. Wann von Hand geändert: Erkennung für diesen Eintrag aus
  function schnellErkennungAbschalten(zuruecksetzen) {
    if (zuruecksetzen && schnell.vorErkennung) schnellFelderSetzen(schnell.vorErkennung);
    schnell.vorErkennung = null;
    schnell.erkannt = null;
    schnell.erkennungAus = true;
  }
  window.schnellErkennungIgnorieren = function() {
    schnellErkennungAbschalten(true);
    schnellRendern();
    document.getElementById("schnell-text").focus();
  };
  // Hinweis unter dem Textfeld: was erkannt wurde und welcher Titel bleibt
  function schnellErkanntRendern() {
    const el = document.getElementById("schnell-erkannt");
    if (!el) return;
    const e = schnell.erkannt;
    if (!e) { el.classList.add("hidden"); el.innerHTML = ""; return; }
    el.innerHTML = erkanntHinweisHtml(e, e.datum || heuteISO()) +
      `<button type="button" class="link-btn" onclick="schnellErkennungIgnorieren()">Ignorieren</button>`;
    el.classList.remove("hidden");
  }

  // Text des Hinweises „Morgen · 15:00 Uhr – Titel: …“ (Schnellerfassung und Formulare)
  function erkanntHinweisHtml(e, datum, zusatz = "") {
    const [j, m, t] = datum.split("-").map(Number);
    const d = new Date(j, m - 1, t);
    const heute = heuteISO();
    const tagText = datum === heute ? "Heute" : datum === addTage(heute, 1) ? "Morgen"
      : d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short", year: j !== new Date().getFullYear() ? "numeric" : undefined });
    const zeitText = e.uhrzeit ? ` · ${e.uhrzeit}${e.ende ? "–" + e.ende : ""} Uhr` : "";
    const titel = e.rest ? `Titel: „${escapeHtml(e.rest)}“` : "Titel bleibt wie getippt";
    return `${ic("kalender")}<span class="schnell-erkannt-text"><strong>${escapeHtml(tagText + zeitText)}</strong><span>${titel}${zusatz ? " · " + escapeHtml(zusatz) : ""}</span></span>`;
  }

  // ==========================================================
  // Erkennung in den Formularen „+ Neue Aufgabe“ und Kalender-Tag
  // (seit Session 35). Gleiches Verhalten wie im „+“-Blatt: beim Tippen
  // Felder setzen, Stand davor merken, „Ignorieren“ bzw. eine Änderung von
  // Hand schaltet die Erkennung für diesen Eintrag ab.
  // opt: { text, datum (ID oder null), uhrzeit, ende, hinweis, festerTag: () => ISO | null }
  // Ohne Datumsfeld (Kalender) zählt der Tag aus festerTag(), ein erkanntes
  // Datum liefert erkanntesDatum().
  // ==========================================================
  function formErkennung(opt) {
    const st = { erkannt: null, aus: false, vorher: null };
    const el = (id) => (id ? document.getElementById(id) : null);
    const lesen = () => ({ datum: el(opt.datum) ? el(opt.datum).value : "", uhrzeit: el(opt.uhrzeit).value, ende: el(opt.ende).value });
    const setzen = (w) => {
      if (el(opt.datum)) el(opt.datum).value = w.datum || "";
      el(opt.uhrzeit).value = w.uhrzeit || "";
      el(opt.ende).value = w.ende || "";
    };
    st.rendern = () => {
      const h = el(opt.hinweis);
      if (!h) return;
      const e = st.erkannt;
      if (!e) { h.classList.add("hidden"); h.innerHTML = ""; return; }
      const fest = opt.festerTag ? opt.festerTag() : null;
      const datum = e.datum || fest || heuteISO();
      const zusatz = fest && e.datum && e.datum !== fest ? "anderer Tag als ausgewählt" : "";
      h.innerHTML = erkanntHinweisHtml(e, datum, zusatz) + `<button type="button" class="link-btn">Ignorieren</button>`;
      h.querySelector("button").addEventListener("click", () => { st.ignorieren(); el(opt.text).focus(); });
      h.classList.remove("hidden");
    };
    st.pruefen = () => {
      const e = st.aus ? null : textDatumErkennen(el(opt.text).value);
      if (e) {
        if (!st.erkannt) st.vorher = lesen();
        // Nur Uhrzeit: ein vorher eingetragenes Datum bleibt, sonst heute
        // (im Kalender gilt ohnehin der gewählte Tag)
        setzen({ datum: e.datum || (st.vorher && st.vorher.datum) || heuteISO(), uhrzeit: e.uhrzeit || "", ende: e.ende || "" });
      } else if (st.erkannt && st.vorher) {
        setzen(st.vorher);
        st.vorher = null;
      }
      st.erkannt = e;
      st.rendern();
    };
    st.ignorieren = () => {
      if (st.vorher) setzen(st.vorher);
      st.vorher = null; st.erkannt = null; st.aus = true;
      st.rendern();
    };
    st.manuell = () => {
      if (!st.erkannt) return;
      st.vorher = null; st.erkannt = null; st.aus = true;
      st.rendern();
    };
    st.titel = (roh) => (st.erkannt && st.erkannt.rest ? st.erkannt.rest : roh);
    st.erkanntesDatum = () => (st.erkannt && st.erkannt.datum) || null;
    st.zuruecksetzen = () => { st.erkannt = null; st.aus = false; st.vorher = null; st.rendern(); };
    el(opt.text).addEventListener("input", st.pruefen);
    [opt.datum, opt.uhrzeit, opt.ende].forEach((id) => { if (el(id)) el(id).addEventListener("input", st.manuell); });
    return st;
  }

  // Klappt die Zusatzfelder auf bzw. zu
  window.schnellDetailsUmschalten = function() {
    schnell.details = !schnell.details;
    schnellRendern();
  };

  // Chip-Knopf für Art, Bereich und Wann (aria-pressed zeigt die Auswahl)
  function schnellChip(feld, wert, label, aktiv, extra = "") {
    return `<button type="button" class="schnell-chip${aktiv ? " aktiv" : ""}" aria-pressed="${aktiv}"
      onclick="schnellSetzen('${feld}','${wert}')"${extra}>${label}</button>`;
  }

  // Zeichnet Chips und Felder passend zur aktuellen Auswahl
  function schnellRendern() {
    schnellErkanntRendern();
    const bearbeiten = schnell.modus === "bearbeiten";
    const artName = (SCHNELL_ARTEN.find((a) => a.art === schnell.art) || {}).label || "";
    document.getElementById("schnell-titel").textContent = bearbeiten ? `${artName} bearbeiten` : "Schnell erfassen";
    document.getElementById("schnell-art-label").classList.toggle("hidden", bearbeiten);
    document.getElementById("schnell-arten").classList.toggle("hidden", bearbeiten);
    document.getElementById("schnell-loeschen").classList.toggle("hidden", !bearbeiten);
    const arten = schnellArtenFuer(schnell.bereich);
    const artInfo = SCHNELL_ARTEN.find((a) => a.art === schnell.art);
    document.getElementById("schnell-text").placeholder = artInfo.platzhalter;

    document.getElementById("schnell-arten").innerHTML = arten
      .map((a) => schnellChip("art", a.art, a.label, a.art === schnell.art)).join("");

    document.getElementById("schnell-bereiche").innerHTML = BEREICH_UMSCHALTER.map((b) =>
      schnellChip("bereich", b.bereich, `<span class="schnell-punkt" style="background:${b.farbe}; box-shadow:0 0 0 2px ${b.ring};" aria-hidden="true"></span>${escapeHtml(b.name)}`,
        b.bereich === schnell.bereich, ` title="${escapeHtml(b.lang)}"`)).join("");

    // Wann: nur bei Aufgabe und Termin; Termin braucht ein Datum
    const mitWann = schnell.art === "aufgabe" || schnell.art === "termin";
    document.getElementById("schnell-wann-block").classList.toggle("hidden", !mitWann);
    if (mitWann) {
      const optionen = [["heute", "Heute"], ["morgen", "Morgen"], ["datum", "Datum"]];
      if (schnell.art === "aufgabe") optionen.unshift(["ohne", "Ohne"]);
      document.getElementById("schnell-wann").innerHTML = optionen
        .map(([w, l]) => schnellChip("wann", w, l, w === schnell.wann)).join("");
      document.getElementById("schnell-datum").classList.toggle("hidden", schnell.wann !== "datum");
      // Uhrzeit nur mit Datum sinnvoll – außer es steht schon eine drin
      // (Aufgaben dürfen eine Uhrzeit ohne Datum haben; sichtbar = gespeichert)
      const zeitOhneTag = schnell.wann === "ohne" && !document.getElementById("schnell-uhrzeit").value;
      document.getElementById("schnell-zeit-zeile").classList.toggle("hidden", zeitOhneTag);
      document.getElementById("schnell-zeile").classList.toggle("hidden", zeitOhneTag);
    }

    // Details je Art
    const hatDetails = schnell.art !== "einkauf";
    const detailsKnopf = document.getElementById("schnell-details-knopf");
    detailsKnopf.classList.toggle("hidden", !hatDetails);
    detailsKnopf.setAttribute("aria-expanded", String(schnell.details && hatDetails));
    detailsKnopf.textContent = (schnell.details && hatDetails ? "▾" : "▸") + " Details";
    const zeigen = schnell.details && hatDetails;
    document.getElementById("schnell-details").classList.toggle("hidden", !zeigen);
    const ohneZeit = schnell.wann === "ohne" && !document.getElementById("schnell-uhrzeit").value;
    document.getElementById("schnell-ende-zeile").classList.toggle("hidden", !(zeigen && mitWann && !ohneZeit));
    document.getElementById("schnell-projekt-zeile").classList.toggle("hidden", !(zeigen && (schnell.art === "aufgabe" || schnell.art === "notiz")));
    document.getElementById("schnell-intervall-zeile").classList.toggle("hidden", !(zeigen && schnell.art === "aufgabe"));
    document.getElementById("schnell-notiz-zeile").classList.toggle("hidden", !(zeigen && (schnell.art === "termin" || schnell.art === "idee")));
    document.getElementById("schnell-notiz").placeholder = schnell.art === "idee" ? "Beschreibung (optional)" : "Notiz zum Termin (optional)";

    // Projekte des gewählten Bereichs
    const select = document.getElementById("schnell-projekt");
    const bisher = select.value;
    const liste = projekte.filter((p) => bereichVon(p) === schnell.bereich);
    select.innerHTML = `<option value="">Kein Projekt</option>` +
      liste.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("");
    if (liste.some((p) => String(p.id) === bisher)) select.value = bisher;
  }

  // Zeigt eine Meldung im Blatt (Fehler rot)
  function schnellMeldung(text, fehler) {
    const el = document.getElementById("schnell-status");
    el.textContent = text;
    el.classList.toggle("fehler", !!fehler);
  }

  // Liefert das gewählte Datum als ISO-Text (oder null bei „Ohne“)
  function schnellDatum() {
    if (schnell.wann === "ohne") return null;
    if (schnell.wann === "datum") return document.getElementById("schnell-datum").value || null;
    const d = new Date();
    if (schnell.wann === "morgen") d.setDate(d.getDate() + 1);
    return dateToISO(d);
  }

  // Speichert den Eintrag über die passende Aktion, schließt das Blatt und lädt neu
  window.schnellSpeichern = async function() {
    const eingabe = document.getElementById("schnell-text").value.trim();
    if (!eingabe) { schnellMeldung("Bitte erst etwas eintragen.", true); document.getElementById("schnell-text").focus(); return; }
    // Erkanntes Datum/Uhrzeit aus dem Titel nehmen („Zahnarzt morgen 15 Uhr“ → „Zahnarzt“)
    const erkannt = schnell.erkannt;
    const text = erkannt && erkannt.rest ? erkannt.rest : eingabe;
    const bereich = schnell.bereich;
    const datum = schnellDatum();
    if (schnell.art === "termin" && !datum) { schnellMeldung("Ein Termin braucht ein Datum.", true); return; }
    const bearbeiten = schnell.modus === "bearbeiten";
    // Beim Bearbeiten zählt, was im Feld steht (auch Uhrzeit ohne Datum)
    const mitZeit = schnell.wann !== "ohne" || bearbeiten;
    const uhrzeit = (mitZeit && document.getElementById("schnell-uhrzeit").value) || null;
    // Beim Bearbeiten immer alle Felder mitschicken – das Backend überschreibt
    // sie, ein zugeklapptes Details würde sonst Projekt/Wiederholung löschen
    const zeigeDetails = schnell.details || bearbeiten;
    const ende_uhrzeit = ((zeigeDetails || (erkannt && erkannt.ende)) && uhrzeit && document.getElementById("schnell-ende").value) || null;
    const projekt_id = (zeigeDetails && document.getElementById("schnell-projekt").value) || null;
    const intervall = zeigeDetails ? document.getElementById("schnell-intervall").value : "";
    const notiz = (zeigeDetails && document.getElementById("schnell-notiz").value.trim()) || null;
    // Verlauf-Eintrag dem Zielbereich zuordnen, nicht dem gerade offenen
    const basis = { bereich, aktiver_bereich: bereich };

    const knopf = document.getElementById("schnell-speichern");
    knopf.disabled = true;
    schnellMeldung("Speichere …", false);
    try {
      if (bearbeiten && schnell.art === "aufgabe") {
        await api("aufgabe_aktualisieren", { ...basis, id: schnell.id, titel: text, projekt_id, faellig_am: datum, uhrzeit, ende_uhrzeit, erinnere_alle_tage: intervall || null });
      } else if (bearbeiten && schnell.art === "termin") {
        await api("termin_aktualisieren", { ...basis, id: schnell.id, titel: text, datum, uhrzeit, ende_uhrzeit, notiz });
      } else if (schnell.art === "aufgabe") {
        await api("aufgabe_hinzufuegen", { ...basis, titel: text, projekt_id, faellig_am: datum, uhrzeit, ende_uhrzeit, erinnere_alle_tage: intervall || null });
      } else if (schnell.art === "termin") {
        await api("termin_hinzufuegen", { ...basis, titel: text, datum, uhrzeit, ende_uhrzeit, notiz });
      } else if (schnell.art === "notiz") {
        await api("notiz_hinzufuegen", { ...basis, text, projekt_id });
      } else if (schnell.art === "einkauf") {
        await api("einkauf_hinzufuegen", { ...basis, text });
      } else if (schnell.art === "idee") {
        await api("ogs_idee_hinzufuegen", { ...basis, titel: text, beschreibung: notiz });
      }
    } catch (e) {
      schnellMeldung("Nicht gespeichert: " + (e.message || "Fehler"), true);
      knopf.disabled = false;
      return;
    }
    knopf.disabled = false;
    const artLabel = SCHNELL_ARTEN.find((a) => a.art === schnell.art).label;
    const bereichName = (BEREICH_UMSCHALTER.find((b) => b.bereich === bereich) || {}).name || bereich;
    window.schnellSchliessen();
    hinweisZeigen(`${artLabel} gespeichert${bereich !== aktiverBereich ? ` · ${bereichName}` : ""}`);
    // Verschoben? Frei und Kalender springen mit, damit der Eintrag sichtbar bleibt
    if (bearbeiten && datum && datum !== schnell.altDatum) {
      if (aktiverTab === "frei") freiTag = new Date(datum + "T00:00:00");
      if (aktiverTab === "kalender" && calAusgewaehlterTag === schnell.altDatum) {
        calAusgewaehlterTag = datum;
        const [j, m] = datum.split("-").map(Number);
        calMonat = new Date(j, m - 1, 1);
      }
    }
    await ladeDaten();
    if (schnell.art === "termin") renderKalender();
    if (aktiverTab === "frei") renderFrei();
  };

  // Kurze Rückmeldung unten über der Leiste, verschwindet nach 3 Sekunden
  let hinweisTimer = null;
  function hinweisZeigen(text, rueckgaengig, knopfText = "Rückgängig") {
    const el = document.getElementById("app-hinweis");
    if (!el) return;
    el.textContent = text;
    // Optional „Rückgängig“ (seit Session 35, z. B. nach einem Wisch in „Heute“)
    if (typeof rueckgaengig === "function") {
      const knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "app-hinweis-knopf";
      knopf.textContent = knopfText;
      knopf.addEventListener("click", async () => {
        el.classList.add("hidden");
        clearTimeout(hinweisTimer);
        try { await rueckgaengig(); } catch (_e) { alert(knopfText === "Rückgängig" ? "Konnte nicht rückgängig gemacht werden." : "Das hat nicht geklappt."); }
      });
      el.appendChild(knopf);
    }
    el.classList.remove("hidden");
    clearTimeout(hinweisTimer);
    hinweisTimer = setTimeout(() => el.classList.add("hidden"), typeof rueckgaengig === "function" ? 6000 : 3000);
  }

  // Dialog: Tipp neben das Blatt schließt, Enter im Textfeld speichert
  (function schnellEinrichten() {
    const dlg = document.getElementById("schnell-dialog");
    if (!dlg) return;
    dlg.addEventListener("click", (e) => { if (e.target === dlg) window.schnellSchliessen(); });
    document.getElementById("schnell-text").addEventListener("input", schnellTextPruefen);
    // Datum, Uhrzeit oder Ende von Hand geändert → Erkennung für diesen Eintrag aus (Text bleibt, wie er ist)
    ["schnell-datum", "schnell-uhrzeit", "schnell-ende"].forEach((id) => document.getElementById(id).addEventListener("input", () => {
      if (!schnell.erkannt) return;
      schnellErkennungAbschalten(false);
      schnellRendern();
    }));
    document.getElementById("schnell-text").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); window.schnellSpeichern(); }
    });
  })();

  // ==========================================================
  // Reiter-Formulare hinter „+ Neu …“ und Einstellungen hinter ⚙ (seit
  // Session 34, Redesign Etappe 5). Die Knöpfe stehen in .reiter-aktionen
  // unter der Überschrift; data-formular nennt die ID(s) der Bereiche, die
  // sie auf- und zuklappen. Zustand gilt bis zum Neuladen.
  // ==========================================================
  function reiterKnopfFuer(id) {
    return [...document.querySelectorAll(".reiter-neu, .reiter-zahnrad")]
      .find((k) => (k.dataset.formular || "").split(" ").includes(id));
  }
  // Klappt die Bereiche eines Knopfs auf oder zu; beim Öffnen eines Formulars Fokus aufs erste Feld
  function reiterBereichSetzen(knopf, offen) {
    if (!knopf) return;
    const ids = (knopf.dataset.formular || "").split(" ").filter(Boolean);
    ids.forEach((id) => { const el = document.getElementById(id); if (el) el.classList.toggle("hidden", !offen); });
    knopf.setAttribute("aria-expanded", String(offen));
    knopf.classList.toggle("aktiv", offen);
    if (knopf.classList.contains("reiter-neu")) {
      // Beschriftung samt Icon merken (innerHTML), damit „+“ nach dem Schließen wiederkommt
      if (!knopf.dataset.label) knopf.dataset.label = knopf.innerHTML;
      knopf.innerHTML = offen ? `${ic("x")}Schließen` : knopf.dataset.label;
    }
  }
  // Öffnet einen Formular-/Einstellungsbereich (z. B. beim Bearbeiten eines Eintrags)
  function reiterFormularOeffnen(id, fokus) {
    reiterBereichSetzen(reiterKnopfFuer(id), true);
    if (fokus) {
      const feld = document.getElementById(id) && document.getElementById(id).querySelector("input:not([type=hidden]):not([type=checkbox]):not([type=file]), textarea, select");
      if (feld) feld.focus();
    }
  }
  window.reiterFormularOeffnen = reiterFormularOeffnen;
  document.querySelectorAll(".reiter-neu, .reiter-zahnrad").forEach((knopf) => {
    knopf.addEventListener("click", () => {
      const offen = knopf.getAttribute("aria-expanded") !== "true";
      reiterBereichSetzen(knopf, offen);
      if (offen && knopf.classList.contains("reiter-neu")) reiterFormularOeffnen(knopf.dataset.formular, true);
    });
  });

  // „?“-Hilfesymbole ein-/ausblenden (⋮-Menü); farbschema.js setzt die Klasse schon beim Laden
  function hilfeSymboleAnwenden() {
    let aus = false;
    try { aus = localStorage.getItem("hilfe-symbole") === "aus"; } catch (e) { /* privater Modus */ }
    document.documentElement.classList.toggle("ohne-hilfe", aus);
    const knopf = document.getElementById("btn-hilfe-symbole");
    if (knopf) {
      knopf.setAttribute("aria-pressed", String(!aus));
      knopf.innerHTML = `${ic("hilfe")}<span>${aus ? "Hilfe-Symbole einblenden" : "Hilfe-Symbole ausblenden"}</span>`;
    }
  }
  document.getElementById("btn-hilfe-symbole").addEventListener("click", (e) => {
    e.stopPropagation();
    const aus = document.documentElement.classList.contains("ohne-hilfe");
    try { localStorage.setItem("hilfe-symbole", aus ? "an" : "aus"); } catch (err) { /* privater Modus */ }
    hilfeSymboleAnwenden();
  });
  hilfeSymboleAnwenden();

  // Einträge der früheren Gruppe „Verwalten“ (Export, Verlauf, Anleitung)
  // stehen seit Etappe 3 im ⋮-Menü – nur die im Bereich eingeblendeten.
  const MENU_VERWALTEN = [["export", "Export", "export"], ["verlauf", "Verlauf", "verlauf"], ["anleitung", "Anleitung", "hilfe"]];
  function renderMenuVerwalten() {
    const el = document.getElementById("menu-verwalten");
    if (!el) return;
    const eintraege = aktiverBereich === "verwaltung" ? [] : MENU_VERWALTEN.filter(([tab]) => reiterIstSichtbar(aktiverBereich, tab));
    const rueck = aktiverBereich === "verwaltung" ? "" : `<button class="link-btn" onclick="wochenrueckblickOeffnen()">${ic("statistik")}<span>Wochenrückblick</span></button>`;
    el.innerHTML = rueck + eintraege.map(([tab, label, icon]) =>
      `<button class="link-btn${tab === aktiverTab ? " aktiv" : ""}" onclick="tabWechseln('${tab}')">${ic(icon)}<span>${label}</span></button>`).join("");
    el.classList.toggle("hidden", !rueck && eintraege.length === 0);
  }

  // Zeigt den im Browser gespeicherten Dashboard-Namen in der Kopfzeile an
  function dashboardNameAnzeigen() {
    const gespeichert = localStorage.getItem("dashboard-name");
    document.getElementById("brand-name").textContent = gespeichert || "Dashboard";
  }

  // Fragt einen neuen Dashboard-Namen ab und speichert ihn im localStorage
  window.dashboardNameBearbeiten = function() {
    const aktuell = localStorage.getItem("dashboard-name") || "Dashboard";
    const neu = prompt("Wie soll dein Dashboard heißen?", aktuell);
    if (neu === null || !neu.trim()) return;
    localStorage.setItem("dashboard-name", neu.trim());
    dashboardNameAnzeigen();
  };

  // Zeigt den gespeicherten Untertitel neben dem Dashboard-Namen an
  function untertitelAnzeigen() {
    const gespeichert = localStorage.getItem("dashboard-untertitel");
    document.getElementById("brand-sub").textContent = gespeichert || "Aufgaben";
  }

  // Fragt einen neuen Untertitel ab und speichert ihn im localStorage
  window.untertitelBearbeiten = function() {
    const aktuell = localStorage.getItem("dashboard-untertitel") || "Aufgaben";
    const neu = prompt("Welcher Untertitel soll neben dem Namen stehen?", aktuell);
    if (neu === null) return;
    localStorage.setItem("dashboard-untertitel", neu.trim());
    untertitelAnzeigen();
  };

  document.getElementById("login-btn").addEventListener("click", anmelden);
  document.getElementById("login-pass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") anmelden();
  });

  // Meldet ab (auch bei ungültiger Session), löscht das Token und zeigt den Login
  async function abmelden() {
    try {
      await api("logout");
    } catch (e) {
      // Logout soll auch funktionieren, wenn die Session schon ungültig war
    }
    localStorage.removeItem("aufgaben-token");
    token = "";
    document.getElementById("login-pass").value = "";
    zeigeLogin();
  }

  document.getElementById("btn-abmelden").addEventListener("click", abmelden);
  document.getElementById("bereich-screen-abmelden").addEventListener("click", abmelden);
  document.getElementById("btn-bereich-wechseln").addEventListener("click", zeigeBereichAuswahl);

  // Meldet mit Passwort an, speichert das Token, lädt Daten und öffnet Bereichswahl bzw. geteilten Inhalt
  async function anmelden() {
    const eingegebenesPass = document.getElementById("login-pass").value;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", pass: eingegebenesPass }),
      });
      const daten = await res.json();
      if (!res.ok) {
        zeigeLogin(daten.error || "Anmeldung fehlgeschlagen.");
        return;
      }
      token = daten.token;
      localStorage.setItem("aufgaben-token", token);
      await ladeDaten();
      if (geteiltAnstehend()) {
        appDirektOeffnen();
        geteiltenInhaltVerarbeiten();
      } else {
        // Seit Session 34: ohne Umweg über die Willkommensseite
        appImLetztenBereichOeffnen();
      }
    } catch (e) {
      zeigeLogin("Verbindung fehlgeschlagen.");
    }
  }

  // Datum als "YYYY-MM-DD" in LOKALER Zeit. Nie toISOString() dafür
  // nehmen: das rechnet in UTC, dann ist "heute" nachts bis 1 bzw. 2 Uhr
  // noch gestern, und ein lokales Mitternachts-Datum rutscht auf den
  // Vortag (siehe ANLEITUNG.md, Stolperfallen).
  function datumLokalISO(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Liefert das heutige Datum als lokales ISO-Datum
  function heuteISO() {
    return datumLokalISO();
  }

  // Addiert Tage zu einem ISO-Datum und gibt das lokale ISO-Datum zurück
  function addTage(datumISO, tage) {
    const d = new Date(datumISO + "T00:00:00");
    d.setDate(d.getDate() + tage);
    return datumLokalISO(d);
  }

  // Ergänzt eine Aufgabe um Status (überfällig/heute/normal) und fällige Erinnerung
  function enrich(a) {
    const heute = heuteISO();
    let status = "normal";
    if (a.faellig_am) {
      if (a.faellig_am < heute) status = "ueberfaellig";
      else if (a.faellig_am === heute) status = "heute";
    }
    const erinnerungFaellig = !!(a.naechste_erinnerung && a.naechste_erinnerung <= heute);
    return { ...a, status, erinnerungFaellig };
  }

  // Lädt alle Daten per api("liste") in die globalen Listen und rendert alle Ansichten neu
  async function ladeDaten() {
    const data = await api("liste");
    projekte = data.projekte || [];
    aufgaben = data.aufgaben || [];
    termine = data.termine || [];
    notizen = data.notizen || [];
    links = data.links || [];
    reflexionen = data.reflexionen || [];
    einkaufsliste = data.einkaufsliste || [];
    verlauf = data.verlauf || [];
    ziele = data.ziele || [];
    zielSchritte = data.ziel_schritte || [];
    blockzeiten = data.blockzeiten || [];
    tagesrahmen = data.tagesrahmen || [];
    fixkosten = data.fixkosten || [];
    sonderausgaben = data.sonderausgaben || [];
    buchungen = data.buchungen || [];
    finanzEinstellungen = data.finanz_einstellungen || [];
    kategorieRegeln = Array.isArray(data.kategorie_regeln) ? data.kategorie_regeln : null;
    sparziele = Array.isArray(data.sparziele) ? data.sparziele : null;
    einheiten = Array.isArray(data.einheiten) ? data.einheiten : null;
    einheitBausteine = Array.isArray(data.einheit_bausteine) ? data.einheit_bausteine : [];
    if (aktiverTab === "einheiten") renderEinheiten();
    ogsIdeen = data.ogs_ideen || [];
    ogsInventar = data.ogs_inventar || [];
    ogsProjekte = data.ogs_projekte || [];
    ogsProjektDateien = data.ogs_projekt_dateien || [];
    spiele = data.spiele || [];
    spieleDateien = data.spiele_dateien || [];
    tabEinstellungen = data.tab_einstellungen || [];
    verleih = data.verleih || [];
    training = data.training || [];
    trainingUebungen = data.training_uebungen || [];
    trainingEinstellungen = data.training_einstellungen || [];
    trainingsplaene = data.trainingsplaene || [];
    trainingsplanUebungen = data.trainingsplan_uebungen || [];
    trainingStammdaten = data.training_stammdaten || [];
    intervallTimer = data.intervall_timer || [];
    zielEvents = data.training_ziel_events || [];
    rezepte = data.rezepte || [];
    raeume = data.raeume || [];
    raumVermietungen = data.raum_vermietungen || [];
    schluesselListe = data.schluessel || [];
    schluesselZugaenge = data.schluessel_zugaenge || [];
    schluesselAusgaben = data.schluessel_ausgaben || [];
    raumMailEmpfaenger = data.raum_mail_empfaenger || [];
    mailEingerichtet = data.mail_eingerichtet === true;
    bereichAnwenden();
    renderReiterVerwaltung();
    render();
    renderKalender();
    renderHeute();
    ladeWetter();
    renderNotizen();
    renderLinks();
    renderReflexionen();
    renderExport();
    renderEinkauf();
    renderVerlauf();
    renderPlanung();
    renderBlockzeiten();
    renderOgsIdeen();
    renderInventar();
    renderVerleih();
    renderProjekte();
    renderSpiele();
    renderRezepte();
    renderRaumplanung();
    renderSchluessel();
  }

  // Erzeugt das HTML für ein Badge mit CSS-Klasse und escaptem Text
  function badgeHtml(cls, text) {
    return `<span class="badge ${cls}">${escapeHtml(text)}</span>`;
  }

  // Bearbeiten einer Aufgabe: seit Session 35 im Blatt (eintragBearbeiten)
  window.aufgabeBearbeitenStart = function(id) {
    window.eintragBearbeiten("aufgabe", id);
  };

  // Erzeugt das HTML einer Aufgabenzeile mit Fälligkeits-/Erinnerungs-Badges und Aktionsknöpfen
  function taskHtml(a, done) {
    const projekt = projekteAktuell().find((p) => p.id === a.projekt_id);
    let meta = "";
    if (done && projekt) meta += badgeHtml("", projekt.name);
    if (!done && a.faellig_am) {
      const start = a.uhrzeit ? a.uhrzeit.slice(0,5) : "";
      const zeitZusatz = start ? " · " + start + (a.ende_uhrzeit ? "–" + a.ende_uhrzeit.slice(0,5) : "") : "";
      if (a.status === "ueberfaellig") meta += badgeHtml("overdue", "überfällig · " + a.faellig_am + zeitZusatz);
      else if (a.status === "heute") meta += badgeHtml("today", "heute fällig" + zeitZusatz);
      else meta += badgeHtml("", "fällig " + a.faellig_am + zeitZusatz);
    } else if (!done && a.uhrzeit) {
      meta += badgeHtml("", a.uhrzeit.slice(0,5) + (a.ende_uhrzeit ? "–" + a.ende_uhrzeit.slice(0,5) : "") + " Uhr");
    }
    if (!done && a.erinnere_alle_tage) meta += badgeHtml("reminder", "alle " + a.erinnere_alle_tage + " Tage");

    const snoozeBtn = !done && a.erinnerungFaellig
      ? `<button class="task-snooze" onclick="erinnerungVerschieben('${a.id}')" title="Später erneut erinnern" aria-label="Später erneut erinnern">${ic("wiederholen")}</button>`
      : "";

    const links = aufgabeWischLinks(a, done);
    return `
      <div class="task-wisch wisch-zeile" data-wisch-typ="aufgabe" data-wisch-id="${a.id}" data-wisch-links="${links}">
      ${wischHinterHtml(done ? "wiederholen" : "ok-kreis", done ? "Wieder offen" : "Erledigt", links)}
      <div class="task wisch-vorne ${!done ? a.status : ""}">
        <button class="task-check ${done ? "done" : ""}" onclick="umschalten('${a.id}')">${done ? "✓" : ""}</button>
        <div class="task-info">
          <span class="task-titel ${done ? "done" : ""}">${escapeHtml(a.titel)}</span>
          <div class="task-meta">${meta}</div>
        </div>
        ${snoozeBtn}
        <button class="task-edit-btn" onclick="aufgabeBearbeitenStart('${a.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>
        <button class="task-delete" onclick="loeschen('${a.id}')" aria-label="Löschen">${ic("x")}</button>
      </div>
      </div>`;
  }

  // Escaped Text für die sichere Ausgabe als HTML
  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  // Aufgaben-Projekte klappbar (seit Session 30). Zustand je
  // „bereich|projekt-id“ (bzw. „bereich|ohne“) im Browser gemerkt,
  // ohne gemerkten Zustand ist eine Gruppe offen.
  const aufgGruppeOffen = {};
  try { Object.assign(aufgGruppeOffen, JSON.parse(localStorage.getItem("aufgaben-gruppen-offen") || "{}")); } catch (_e) { /* leer lassen */ }
  function aufgGruppenMerken() {
    try { localStorage.setItem("aufgaben-gruppen-offen", JSON.stringify(aufgGruppeOffen)); } catch (_e) { /* egal */ }
  }
  // Merkt den Auf-/Zu-Zustand einer Aufgaben-Projektgruppe im Browser
  window.aufgGruppeUmschalten = function(el) {
    aufgGruppeOffen[el.dataset.schluessel] = el.open;
    aufgGruppenMerken();
  };
  // Klappt alle Aufgaben-Projektgruppen des aktiven Bereichs auf oder zu
  window.aufgAlleGruppen = function(auf) {
    aufgGruppeOffen[`${aktiverBereich}|ohne`] = auf;
    projekteAktuell().forEach((p) => { aufgGruppeOffen[`${aktiverBereich}|${p.id}`] = auf; });
    aufgGruppenMerken();
    render();
  };
  // Projektname direkt im Gruppenkopf bearbeiten (statt Popup-Abfrage)
  let aufgProjektEditId = null;
  function aufgGruppeHtml(schluesselId, titel, liste, editKnopf) {
    const schluessel = `${aktiverBereich}|${schluesselId}`;
    if (aufgProjektEditId === schluesselId) {
      return `
        <div class="spiel-gruppe">
          <div class="spiel-gruppe-kopf" style="cursor:default; flex-wrap:wrap; padding:0.5rem 0.7rem;">
            <input type="text" id="aufg-projekt-name-edit" value="${escapeAttr(titel)}" aria-label="Projektname" style="flex:1 1 12rem; min-width:0;"
              onkeydown="if (event.key === 'Enter') projektNameSpeichern('${schluesselId}'); if (event.key === 'Escape') projektNameAbbrechen();">
            <button class="btn-primary" onclick="projektNameSpeichern('${schluesselId}')">Speichern</button>
            <button class="link-btn" onclick="projektNameAbbrechen()">Abbrechen</button>
            <span id="aufg-projekt-name-status" class="notiz-meta" role="status" style="flex-basis:100%; margin:0;"></span>
          </div>
          <div class="task-list" style="margin:0.5rem 0 0.8rem;">${liste.map((a) => taskHtml(a, false)).join("")}</div>
        </div>`;
    }
    const gemerkt = aufgGruppeOffen[schluessel];
    const offen = gemerkt !== false;
    const ueber = liste.filter((a) => a.status === "ueberfaellig").length;
    const heute = liste.filter((a) => a.status === "heute").length;
    const info = [
      ueber ? badgeHtml("overdue", `${ueber} überfällig`) : "",
      heute ? badgeHtml("today", `${heute} heute`) : "",
    ].join("");
    return `
      <details class="spiel-gruppe" data-schluessel="${escapeAttr(schluessel)}" ${offen ? "open" : ""} ontoggle="aufgGruppeUmschalten(this)">
        <summary class="spiel-gruppe-kopf">
          <span class="spiel-gruppe-titel">${escapeHtml(titel)}</span>
          ${editKnopf}
          <span class="spiel-gruppe-info">${info}</span>
          <span class="zl-gruppe-zahl">${liste.length}</span>
        </summary>
        <div class="task-list" style="margin:0.5rem 0 0.8rem;">${liste.map((a) => taskHtml(a, false)).join("")}</div>
      </details>`;
  }

  // Rendert die offenen Aufgaben des aktiven Bereichs nach Projekt gruppiert plus Erledigt-Liste
  function render() {
    const select = document.getElementById("aufgabe-projekt");
    select.innerHTML = '<option value="">Ohne Projekt</option>' +
      projekteAktuell().map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

    const aufgabenBereich = aufgaben.filter((a) => bereichVon(a) === aktiverBereich);
    const offen = aufgabenBereich.filter((a) => !a.erledigt).map(enrich);
    const erledigt = aufgabenBereich.filter((a) => a.erledigt);

    const sortiere = (liste) => [...liste].sort((a, b) => {
      const ad = a.faellig_am || "9999-99-99";
      const bd = b.faellig_am || "9999-99-99";
      if (ad !== bd) return ad < bd ? -1 : 1;
      return b.erstellt_am < a.erstellt_am ? -1 : 1;
    });

    const ohneProjekt = sortiere(offen.filter((a) => !a.projekt_id));
    const gruppen = projekteAktuell()
      .map((p) => ({ projekt: p, liste: sortiere(offen.filter((a) => a.projekt_id === p.id)) }))
      .filter((g) => g.liste.length > 0);

    let html = "";
    if (ohneProjekt.length > 0) html += aufgGruppeHtml("ohne", "Ohne Projekt", ohneProjekt, "");
    for (const g of gruppen) {
      // ✎ im Kopf darf die Gruppe nicht mit auf- oder zuklappen
      const edit = `<button class="project-edit-btn" onclick="event.preventDefault(); event.stopPropagation(); projektUmbenennen('${g.projekt.id}')" title="Projekt umbenennen" aria-label="Projekt umbenennen">${ic("stift")}</button>`;
      html += aufgGruppeHtml(g.projekt.id, g.projekt.name, g.liste, edit);
    }
    const anzGruppen = gruppen.length + (ohneProjekt.length > 0 ? 1 : 0);
    if (anzGruppen === 0) {
      html = '<p class="empty-text">Keine offenen Aufgaben — gut gemacht.</p>';
    } else {
      html = `${anzGruppen > 1 ? `
        <div class="row" style="margin:0 0 0.4rem; gap:0.8rem;">
          <button class="link-btn" onclick="aufgAlleGruppen(true)">Alle aufklappen</button>
          <button class="link-btn" onclick="aufgAlleGruppen(false)">Alle zuklappen</button>
        </div>` : ""}<div class="spiel-gruppen">${html}</div>`;
    }
    document.getElementById("listen-bereich").innerHTML = html;

    const erledigtBereich = document.getElementById("erledigt-bereich");
    if (erledigt.length > 0) {
      erledigtBereich.innerHTML = `
        <button class="link-btn" id="toggle-erledigt">▸ Erledigt (${erledigt.length})</button>
        <div class="task-list hidden" id="erledigt-liste" style="margin-top:0.6rem;">
          ${erledigt.map((a) => taskHtml(a, true)).join("")}
        </div>`;
      document.getElementById("toggle-erledigt").addEventListener("click", (e) => {
        const liste = document.getElementById("erledigt-liste");
        liste.classList.toggle("hidden");
        e.target.textContent = (liste.classList.contains("hidden") ? "▸" : "▾") + ` Erledigt (${erledigt.length})`;
      });
    } else {
      erledigtBereich.innerHTML = "";
    }
  }

  document.getElementById("btn-hinzufuegen").addEventListener("click", aufgabeHinzufuegen);
  document.getElementById("neue-aufgabe").addEventListener("keydown", (e) => {
    if (e.key === "Enter") aufgabeHinzufuegen();
  });

  // Legt eine neue Aufgabe im aktiven Bereich an, leert das Formular und lädt neu
  // Erkennung im Formular „+ Neue Aufgabe“ (seit Session 35)
  const aufgabeErkennung = formErkennung({
    text: "neue-aufgabe", datum: "aufgabe-faellig", uhrzeit: "aufgabe-uhrzeit", ende: "aufgabe-ende", hinweis: "aufgabe-erkannt",
  });

  async function aufgabeHinzufuegen() {
    const eingabe = document.getElementById("neue-aufgabe").value.trim();
    if (!eingabe) return;
    const titel = aufgabeErkennung.titel(eingabe);
    const projekt_id = document.getElementById("aufgabe-projekt").value || null;
    const faellig_am = document.getElementById("aufgabe-faellig").value || null;
    const uhrzeit = document.getElementById("aufgabe-uhrzeit").value || null;
    const ende_uhrzeit = document.getElementById("aufgabe-ende").value || null;
    const erinnere_alle_tage = document.getElementById("aufgabe-intervall").value || null;

    await api("aufgabe_hinzufuegen", { titel, projekt_id, faellig_am, uhrzeit, ende_uhrzeit, erinnere_alle_tage, bereich: aktiverBereich });
    document.getElementById("neue-aufgabe").value = "";
    document.getElementById("aufgabe-faellig").value = "";
    document.getElementById("aufgabe-uhrzeit").value = "";
    document.getElementById("aufgabe-ende").value = "";
    document.getElementById("aufgabe-intervall").value = "";
    aufgabeErkennung.zuruecksetzen();
    await ladeDaten();
  }

  document.getElementById("toggle-projekt-form").addEventListener("click", (e) => {
    const form = document.getElementById("projekt-form");
    form.classList.toggle("hidden");
    e.target.textContent = (form.classList.contains("hidden") ? "▸" : "▾") + " Neues Projekt anlegen";
  });

  document.getElementById("btn-projekt-anlegen").addEventListener("click", projektAnlegen);
  document.getElementById("neues-projekt").addEventListener("keydown", (e) => {
    if (e.key === "Enter") projektAnlegen();
  });

  // Legt ein neues Projekt im aktiven Bereich an und lädt die Daten neu
  async function projektAnlegen() {
    const name = document.getElementById("neues-projekt").value.trim();
    if (!name) return;
    await api("projekt_hinzufuegen", { name, bereich: aktiverBereich });
    document.getElementById("neues-projekt").value = "";
    await ladeDaten();
  }

  // Schaltet den Gruppenkopf eines Projekts in den Umbenennen-Modus
  window.projektUmbenennen = function(id) {
    if (!projekteAktuell().some((p) => p.id === id)) return;
    aufgProjektEditId = id;
    render();
    const feld = document.getElementById("aufg-projekt-name-edit");
    if (feld) { feld.focus(); feld.select(); }
  };

  // Bricht das Umbenennen eines Projekts ab
  window.projektNameAbbrechen = function() {
    aufgProjektEditId = null;
    render();
  };

  // Prüft den neuen Projektnamen (leer/doppelt), speichert ihn und lädt neu
  window.projektNameSpeichern = async function(id) {
    const projekt = projekteAktuell().find((p) => p.id === id);
    const feld = document.getElementById("aufg-projekt-name-edit");
    const status = document.getElementById("aufg-projekt-name-status");
    if (!projekt || !feld) return;
    const neuerName = feld.value.trim();
    if (!neuerName) { status.textContent = "Bitte einen Namen eingeben."; return; }
    if (neuerName === projekt.name) { projektNameAbbrechen(); return; }
    if (projekteAktuell().some((p) => p.id !== id && p.name.toLowerCase() === neuerName.toLowerCase())) {
      status.textContent = "Diesen Projektnamen gibt es in diesem Bereich schon.";
      return;
    }
    try {
      await api("projekt_umbenennen", { id, name: neuerName });
      aufgProjektEditId = null;
      await ladeDaten();
    } catch (e) {
      status.textContent = "Umbenennen fehlgeschlagen – existiert der Name schon?";
    }
  };

  // Schaltet eine Aufgabe erledigt/offen und lädt die Daten neu
  async function umschalten(id) {
    await api("aufgabe_umschalten", { id });
    await ladeDaten();
  }

  // Löscht eine Aufgabe und lädt die Daten neu
  async function loeschen(id) {
    await api("aufgabe_loeschen", { id });
    await ladeDaten();
  }

  // Verschiebt die fällige Erinnerung einer Aufgabe und lädt die Daten neu
  async function erinnerungVerschieben(id) {
    await api("erinnerung_verschieben", { id });
    await ladeDaten();
  }

  // Hilfe-Icons ("?"): Tap öffnet ein kleines Popover direkt neben dem
  // Icon mit dem Text aus data-hilfe. Funktioniert per Event-Delegation,
  // also auch für Icons, die erst später (z.B. in gerenderten Listen)
  // ins DOM kommen.
  function initHilfeSystem() {
    let offenesPopover = null;

    // Schließt das offene Hilfe-Popover und setzt die aktiven Hilfe-Icons zurück
    function schliesseHilfePopover() {
      if (offenesPopover) {
        offenesPopover.remove();
        offenesPopover = null;
      }
      document.querySelectorAll(".hilfe-icon.aktiv").forEach((b) => b.classList.remove("aktiv"));
    }

    document.addEventListener("click", function (e) {
      const icon = e.target.closest(".hilfe-icon");
      if (icon) {
        e.preventDefault();
        e.stopPropagation();
        const warOffen = icon.classList.contains("aktiv");
        schliesseHilfePopover();
        if (warOffen) return;

        const text = icon.getAttribute("data-hilfe") || "";
        if (!text) return;

        const pop = document.createElement("div");
        pop.className = "hilfe-popover";
        pop.textContent = text;
        document.body.appendChild(pop);
        icon.classList.add("aktiv");
        offenesPopover = pop;

        const rect = icon.getBoundingClientRect();
        const pw = pop.offsetWidth;
        const ph = pop.offsetHeight;
        let left = rect.left + rect.width / 2 - pw / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
        let top = rect.bottom + 8;
        if (top + ph > window.innerHeight - 8) {
          top = rect.top - ph - 8;
        }
        pop.style.left = left + "px";
        pop.style.top = top + "px";
        return;
      }
      if (offenesPopover && !e.target.closest(".hilfe-popover")) {
        schliesseHilfePopover();
      }
    });

    window.addEventListener("scroll", schliesseHilfePopover, true);
    window.addEventListener("resize", schliesseHilfePopover);
  }
  initHilfeSystem();

  // ==========================================================
  // Teilen-Ziel (Web Share Target, siehe manifest.json)
  // Android „Teilen“ → Dashboard öffnet index.html?url=…&text=…&title=…
  // Bei GET ersetzt der Browser die Query der action-URL, deshalb geht
  // kein ?tab=rezepte – erkannt wird der Aufruf an url/text/title.
  // Der geteilte Inhalt wird in sessionStorage geparkt, damit er einen
  // nötigen Login übersteht, und danach sofort wieder entfernt.
  // ==========================================================
  const GETEILT_SCHLUESSEL = "geteilter-rezept-inhalt";

  // Link aus beliebigem Text ziehen; Satzzeichen am Ende („…/rezept).“)
  // gehören fast nie zur Adresse und werden abgeschnitten.
  function linkAusText(text) {
    const treffer = String(text || "").match(/https?:\/\/\S+/i);
    if (!treffer) return null;
    return treffer[0].replace(/[)\]}>.,;:!?"'»«“”„]+$/, "");
  }

  (function geteiltenInhaltParken() {
    const p = new URLSearchParams(location.search);
    if (!p.has("url") && !p.has("text") && !p.has("title")) return;
    const roh = [p.get("url"), p.get("text"), p.get("title")].filter(Boolean).join(" ");
    try { sessionStorage.setItem(GETEILT_SCHLUESSEL, roh.slice(0, 2000)); } catch (e) { /* ohne Speicher: dann eben nicht */ }
    history.replaceState({}, "", location.pathname);
  })();

  // Prüft, ob ein geteilter Inhalt in sessionStorage auf Verarbeitung wartet
  function geteiltAnstehend() {
    try { return sessionStorage.getItem(GETEILT_SCHLUESSEL) !== null; } catch (e) { return false; }
  }

  // Direkt in die App (letzter Bereich), ohne Willkommensseite
  function appDirektOeffnen() {
    zeigeApp();
    bereichAnwenden();
    render();
    renderNotizen();
    renderKalender();
    renderHeute();
    renderOgsIdeen();
  }

  // Übernimmt geteilten Inhalt: öffnet Rezepte und startet den Import mit dem enthaltenen Link
  function geteiltenInhaltVerarbeiten() {
    let roh = null;
    try {
      roh = sessionStorage.getItem(GETEILT_SCHLUESSEL);
      sessionStorage.removeItem(GETEILT_SCHLUESSEL);
    } catch (e) { return; }
    if (roh === null) return;

    // Rezepte in einem Bereich öffnen, in dem der Reiter sichtbar ist:
    // erst der aktuelle, sonst Privat, Business, OGS, AWO. Ist er
    // nirgends an, trotzdem Privat (Reiter öffnet sich, nur ohne Chip).
    if (aktiverBereich === "verwaltung" || !reiterIstSichtbar(aktiverBereich, "rezepte")) {
      const ziel = ["privat", "business", "ogs", "awo"].find((b) => reiterIstSichtbar(b, "rezepte")) || "privat";
      window.bereichAuswaehlen(ziel);
    }
    tabWechseln("rezepte");

    document.getElementById("rezept-import-bereich").classList.remove("hidden");
    const feld = document.getElementById("rezept-import-url");
    const status = document.getElementById("rezept-import-status");
    const link = linkAusText(roh);
    if (!link) {
      feld.value = "";
      status.textContent = "Im geteilten Inhalt war kein Link. Bitte den Link zur Rezeptseite von Hand einfügen.";
      feld.focus();
      return;
    }
    feld.value = link;
    document.getElementById("btn-rezept-import-laden").click();
  }

  // Beim Start: automatisch anmelden, falls Token schon gespeichert
  (async function init() {
    if (token) {
      try {
        await ladeDaten();

        // Falls wir gerade von Googles OAuth-Login zurückkommen oder über
        // eine App-Verknüpfung mit ?tab=... geöffnet wurden, macht die
        // Bereichs-Auswahl keinen Sinn – direkt in die App (letzter Bereich).
        const urlParams = new URLSearchParams(location.search);
        const googleCode = urlParams.get("code");
        const gewuenschterTab = urlParams.get("tab");

        if (googleCode || gewuenschterTab || geteiltAnstehend()) {
          appDirektOeffnen();
        } else {
          // Seit Session 34: direkt im zuletzt genutzten Bereich starten
          appImLetztenBereichOeffnen();
        }

        if (googleCode) {
          try {
            await api("google_auth_callback", { code: googleCode, state: urlParams.get("state") });
            history.replaceState({}, "", location.pathname);
            tabWechseln("kalender");
          } catch (e) {
            alert("Google-Verbindung fehlgeschlagen: " + e.message);
            history.replaceState({}, "", location.pathname);
          }
        }

        if (gewuenschterTab && VIEW_ELEMENTE[gewuenschterTab]) {
          tabWechseln(gewuenschterTab);
        }
        geteiltenInhaltVerarbeiten();
        return;
      } catch (e) {
        // Passwort ungültig geworden -> Login zeigen
      }
    }
    zeigeLogin();
  })();

  // Google-Kalender-Sync: Statuskarte im Kalender-Tab mit Verbinden/
  // Trennen/manuellem Abgleich. Automatischer Abgleich läuft serverseitig
  // per pg_cron alle 15 Minuten unabhängig von dieser Oberfläche.
  let googleSyncKarteLaedt = false;

  function relativeZeitkurz(iso) {
    if (!iso) return null;
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.round(diffMs / 60000);
    if (min < 1) return "gerade eben";
    if (min < 60) return `vor ${min} Min.`;
    const std = Math.round(min / 60);
    if (std < 24) return `vor ${std} Std.`;
    const tage = Math.round(std / 24);
    return `vor ${tage} Tag${tage === 1 ? "" : "en"}`;
  }

  // Formatiert ein ISO-Datum als TT.MM.JJJJ (trotz Name ohne Uhrzeit)
  function formatDatumUhrzeit(iso) {
    const dt = new Date(iso);
    return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  // Rendert die Google-Kalender-Statuskarte (verbinden bzw. Sync-Info, jetzt sync., trennen)
  function renderGoogleSyncKarte(status) {
    const el = document.getElementById("google-sync-karte");
    if (!el) return;

    if (!status.verbunden) {
      el.innerHTML = `
        <div class="sync-kopf"><span class="sync-punkt sync-punkt--aus"></span><span>Nicht mit Google Kalender verbunden</span></div>
        <p class="hero-text" style="margin:0.3rem 0 0.8rem;">Verbinde deinen Google-Kalender, um Termine automatisch beidseitig abzugleichen.</p>
        <button class="btn-primary" id="sync-verbinden-btn">Mit Google verbinden</button>
      `;
      document.getElementById("sync-verbinden-btn").addEventListener("click", googleVerbindenKlick);
      return;
    }

    const letzterAbgleichText = status.letzter_sync
      ? relativeZeitkurz(status.letzter_sync)
      : "noch nie";

    el.innerHTML = `
      <div class="sync-kopf"><span class="sync-punkt sync-punkt--an"></span><span>Verbunden mit Google Kalender</span></div>
      <div class="sync-meta">
        <span>Verbunden seit ${formatDatumUhrzeit(status.verbunden_seit)}</span>
        <span>·</span>
        <span id="sync-letzter-abgleich">Letzter Abgleich: ${letzterAbgleichText}</span>
      </div>
      <p class="hero-text" style="margin:0.3rem 0 0;">Automatischer Abgleich alle 15 Minuten.</p>
      <div class="sync-aktionen">
        <button class="btn-secondary" id="sync-jetzt-btn">Jetzt synchronisieren</button>
        <button class="sync-trennen-btn" id="sync-trennen-btn">Verbindung trennen</button>
      </div>
      <div id="sync-feedback" class="sync-feedback hidden"></div>
    `;
    document.getElementById("sync-jetzt-btn").addEventListener("click", googleSyncJetztKlick);
    document.getElementById("sync-trennen-btn").addEventListener("click", googleTrennenKlick);
  }

  // Lädt den Google-Sync-Status vom Server und rendert die Statuskarte
  async function ladeGoogleSyncStatus() {
    if (googleSyncKarteLaedt) return;
    googleSyncKarteLaedt = true;
    try {
      const status = await api("google_status");
      renderGoogleSyncKarte(status);
    } catch (e) {
      // Statuskarte bleibt beim vorherigen Zustand, kein hartes Fehlerbild
      // nötig – der Nutzer sieht ohnehin am Kalender, ob etwas fehlt.
      console.error("Google-Status konnte nicht geladen werden:", e);
    } finally {
      googleSyncKarteLaedt = false;
    }
  }

  // Startet den Google-OAuth-Login und leitet zur Google-Seite weiter
  async function googleVerbindenKlick() {
    try {
      const { url } = await api("google_auth_start");
      location.href = url;
    } catch (e) {
      alert("Konnte Google-Login nicht starten: " + e.message);
    }
  }

  // Trennt nach Rückfrage die Google-Kalender-Verbindung und aktualisiert die Statuskarte
  async function googleTrennenKlick() {
    if (!confirm("Google-Kalender-Verknüpfung wirklich entfernen?")) return;
    const btn = document.getElementById("sync-trennen-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Trenne …"; }
    try {
      await api("google_disconnect");
      await ladeGoogleSyncStatus();
    } catch (e) {
      alert("Fehler beim Trennen: " + e.message);
      if (btn) { btn.disabled = false; btn.textContent = "Verbindung trennen"; }
    }
  }

  // Stößt einen manuellen Google-Sync an, lädt neu und zeigt das Ergebnis an
  async function googleSyncJetztKlick() {
    const btn = document.getElementById("sync-jetzt-btn");
    const feedback = document.getElementById("sync-feedback");
    if (btn) { btn.disabled = true; btn.textContent = "Synchronisiere …"; }
    try {
      const ergebnis = await api("google_sync");
      await ladeDaten();
      render();
      await ladeGoogleSyncStatus();
      const neueFeedback = document.getElementById("sync-feedback");
      if (neueFeedback) {
        neueFeedback.textContent = `✓ ${ergebnis.erstellt} neu, ${ergebnis.aktualisiert} aktualisiert, ${ergebnis.geloescht} gelöscht`;
        neueFeedback.classList.remove("hidden");
        neueFeedback.classList.add("erfolg");
      }
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = "Jetzt synchronisieren"; }
      if (feedback) {
        feedback.textContent = "Sync fehlgeschlagen: " + e.message;
        feedback.classList.remove("hidden");
        feedback.classList.add("fehler");
      }
    }
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  // ==========================================================
  // Bereich (Privat / OGS Rapunzel)
  // ==========================================================
  // Aufgaben, Notizen und Termine tragen ein "bereich"-Feld (privat/ogs).
  // Fehlt es (ältere Einträge), gilt Default "privat".
  function bereichVon(objekt) {
    return objekt.bereich || "privat";
  }

  // Liefert die Projekte des aktiven Bereichs
  function projekteAktuell() {
    return projekte.filter((p) => bereichVon(p) === aktiverBereich);
  }

  // Liefert die Fixkosten des aktiven Bereichs
  function fixkostenAktuell() {
    return fixkosten.filter((f) => bereichVon(f) === aktiverBereich);
  }

  // Liefert die Sonderausgaben des aktiven Bereichs
  function sonderausgabenAktuell() {
    return sonderausgaben.filter((s) => bereichVon(s) === aktiverBereich);
  }

  // Liefert die Buchungen des aktiven Bereichs
  function buchungenAktuell() {
    return buchungen.filter((b) => bereichVon(b) === aktiverBereich);
  }

  // Liefert die Inventar-Einträge des aktiven Bereichs
  function ogsInventarAktuell() {
    return ogsInventar.filter((i) => bereichVon(i) === aktiverBereich);
  }

  // Liefert die Projekte (Projekte-Reiter) des aktiven Bereichs
  function ogsProjekteAktuell() {
    return ogsProjekte.filter((p) => bereichVon(p) === aktiverBereich);
  }

  // Liefert die Verleih-Einträge des aktiven Bereichs
  function verleihAktuell() {
    return verleih.filter((v) => bereichVon(v) === aktiverBereich);
  }

  // Liefert die Trainingseinträge des aktiven Bereichs
  function trainingAktuell() {
    return training.filter((t) => bereichVon(t) === aktiverBereich);
  }

  const BEREICH_NAME = { ogs: "OGS Rapunzel", awo: "AWO OV Liblar", business: "Business" };

  // Aktualisiert Navigation sowie Titel und Untertitel des Ideen-Reiters für den aktiven Bereich
  function bereichAnwenden() {
    renderNavigation();
    const ideenTitel = document.getElementById("ogs-ideen-titel");
    const ideenUntertitel = document.getElementById("ogs-ideen-untertitel");
    if (ideenTitel) ideenTitel.textContent = "Ideen";
    if (ideenUntertitel) {
      ideenUntertitel.textContent = `Ideen für Angebote und Projekte${BEREICH_NAME[aktiverBereich] ? " – " + BEREICH_NAME[aktiverBereich] : ""} – sammeln, Status pflegen, wiederfinden.`;
    }
  }

  // ==========================================================
  // Tabs / Inhalt anzeigen
  // ==========================================================
  function tabWechseln(aktiv) {
    for (const key in VIEW_ELEMENTE) {
      document.getElementById(VIEW_ELEMENTE[key]).classList.toggle("hidden", key !== aktiv);
    }
    aktiverTab = aktiv;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("bereich-screen").classList.add("hidden");
    const gruppeAktiv = gruppeVonTab(aktiv);
    if (gruppeAktiv) localStorage.setItem(letzterReiterSchluessel(gruppeAktiv.schluessel), aktiv);
    renderNavigation();
    window.scrollTo(0, 0);
    document.getElementById("app").classList.remove("hidden");
    dashboardNameAnzeigen();
    untertitelAnzeigen();
    if (aktiv === "kalender") { renderKalender(); ladeGoogleSyncStatus(); }
    if (aktiv === "heute") renderHeute();
    if (aktiv === "planung") renderPlanung();
    if (aktiv === "frei") renderFrei();
    if (aktiv === "finanzen") renderFinanzen();
    if (aktiv === "ogsideen") renderOgsIdeen();
    if (aktiv === "ogsinventar") renderInventar();
    if (aktiv === "ogsprojekte") renderProjekte();
    if (aktiv === "spiele") renderSpiele();
    if (aktiv === "einheiten") renderEinheiten();
    if (aktiv === "verleih") renderVerleih();
    if (aktiv === "raumplanung") renderRaumplanung();
    if (aktiv === "schluessel") renderSchluessel();
    if (aktiv === "training") renderTraining();
    if (aktiv === "rezepte") renderRezepte();
    if (aktiv === "ernaehrung") { renderErnaehrung(); if (ernProfilGeladen) ernMetRendern(); }
    if (aktiv === "verlauf") renderVerlauf();
    if (aktiv === "reiterverwaltung") renderReiterVerwaltung();
    kontoMenuSchliessen();
  }
  window.tabWechseln = tabWechseln;

  // ⋮-Menü „Reiter verwalten“: öffnet den Bereich Verwaltung (seit Session 34 nur noch hier und auf der Bereichsübersicht)
  document.getElementById("btn-verwaltung-oeffnen").addEventListener("click", () => window.bereichAuswaehlen("verwaltung"));

  // Konto-/Einstellungs-Menü (⋮ oben rechts): Name/Untertitel ändern,
  // Bereich wechseln, Abmelden – ersetzt die frühere Sidebar-Ecke.
  const menuToggleBtn = document.getElementById("menu-toggle");
  const accountMenuEl = document.getElementById("account-menu");

  // Öffnet das Konto-Menü (⋮)
  function kontoMenuOeffnen() {
    accountMenuEl.classList.remove("hidden");
    menuToggleBtn.setAttribute("aria-expanded", "true");
  }
  // Schließt das Konto-Menü (⋮)
  function kontoMenuSchliessen() {
    accountMenuEl.classList.add("hidden");
    menuToggleBtn.setAttribute("aria-expanded", "false");
  }
  menuToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (accountMenuEl.classList.contains("hidden")) kontoMenuOeffnen(); else kontoMenuSchliessen();
  });
  document.addEventListener("click", (e) => {
    if (!accountMenuEl.classList.contains("hidden") && !accountMenuEl.contains(e.target) && e.target !== menuToggleBtn) {
      kontoMenuSchliessen();
    }
  });
  // ==========================================================
  // Reiter-Verwaltung (Bereich "Verwaltung")
  // ==========================================================
  function renderReiterVerwaltung() {
    const container = document.getElementById("reiter-verwaltung-liste");
    if (!container) return;
    container.innerHTML = Object.entries(BEREICH_TABS).map(([bereich, tabsListe]) => `
      <div class="reiter-verwaltung-block">
        <h3>${BEREICH_TITEL_VERWALTUNG[bereich]}</h3>
        <div class="reiter-verwaltung-grid">
          ${tabsListe.map(([schluessel, label]) => `
            <label class="reiter-verwaltung-item">
              <input type="checkbox" ${reiterIstSichtbar(bereich, schluessel) ? "checked" : ""}
                onchange="reiterUmschalten('${bereich}','${schluessel}', this.checked)">
              ${escapeHtml(label)}
            </label>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  // Speichert die Sichtbarkeit eines Reiters je Bereich und aktualisiert die Navigation
  window.reiterUmschalten = async function(bereich, schluessel, sichtbar) {
    const idx = tabEinstellungen.findIndex((e) => e.bereich === bereich && e.tab_id === schluessel);
    if (idx >= 0) tabEinstellungen[idx].sichtbar = sichtbar;
    else tabEinstellungen.push({ bereich, tab_id: schluessel, sichtbar });
    await api("tab_einstellungen_speichern", { bereich, tab_id: schluessel, sichtbar });
    bereichAnwenden();
  };

  // ==========================================================
  // Wetter (Start-Tab)
  // ==========================================================
  // WMO-Wettercodes (von Open-Meteo) grob zusammengefasst. Erster Wert =
  // Linien-Icon aus dem Sprite (seit Session 35, vorher Emoji).
  const WETTER_CODES = {
    0: ["sonne", "Klar"], 1: ["sonne-wolke", "Meist klar"], 2: ["sonne-wolke", "Teilweise bewölkt"], 3: ["wolke", "Bedeckt"],
    45: ["nebel", "Nebel"], 48: ["nebel", "Reifnebel"],
    51: ["niesel", "Leichter Nieselregen"], 53: ["niesel", "Nieselregen"], 55: ["niesel", "Starker Nieselregen"],
    61: ["regen", "Leichter Regen"], 63: ["regen", "Regen"], 65: ["regen", "Starker Regen"],
    71: ["schnee", "Leichter Schneefall"], 73: ["schnee", "Schneefall"], 75: ["schnee", "Starker Schneefall"],
    80: ["regen", "Regenschauer"], 81: ["regen", "Kräftiger Regenschauer"], 82: ["gewitter", "Heftiger Regenschauer"],
    95: ["gewitter", "Gewitter"], 96: ["gewitter", "Gewitter mit Hagel"], 99: ["gewitter", "Starkes Gewitter mit Hagel"],
  };
  // Liefert Icon-Name und Beschreibung zu einem WMO-Wettercode
  function wetterCodeInfo(code) {
    return WETTER_CODES[code] || ["thermometer", "Unbekannt"];
  }
  const WETTER_WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  // Lädt das Wetter für den gewählten Ort (30-Min-Cache) und zeigt Lade-/Fehlerkachel
  async function ladeWetter(erzwingen = false) {
    const container = document.getElementById("heute-wetter");
    if (!container) {
      console.error("[Wetter] Knopf #heute-wetter nicht im DOM gefunden – index.html nicht aktuell?");
      return;
    }
    const jetzigerOrt = wetterOrt;
    if (!erzwingen && wetterDaten && Date.now() - wetterLetzterAbruf < WETTER_CACHE_MS) {
      renderWetter();
      return;
    }
    container.textContent = "Wetter lädt …";
    try {
      const daten = await api("wetter_abrufen", { ort: jetzigerOrt });
      // Falls der Ort zwischenzeitlich geändert wurde, veraltete Antwort verwerfen.
      if (jetzigerOrt !== wetterOrt) return;
      wetterDaten = daten;
      wetterLetzterAbruf = Date.now();
      renderWetter();
    } catch (fehler) {
      console.error("[Wetter] Laden fehlgeschlagen:", fehler);
      wetterDaten = null;
      container.textContent = "Wetter nicht geladen · nochmal";
      container.title = fehler.message || "Fehler";
    }
  }

  // Rendert die Wetter-Kachel und den aufklappbaren 5-Tage-Ausblick
  function renderWetter() {
    if (!wetterDaten) return;
    const [aktIcon, aktText] = wetterCodeInfo(wetterDaten.aktueller_code);
    const tage = (wetterDaten.tage || []).slice(0, 5).map((t) => {
      const [icon, text] = wetterCodeInfo(t.code);
      const datum = new Date(t.datum + "T00:00:00");
      const wochentag = WETTER_WOCHENTAGE[datum.getDay()];
      return `
        <div class="wetter-kachel" title="${escapeHtml(text)}">
          <span class="wetter-kachel-tag">${wochentag}</span>
          <span class="wetter-kachel-icon">${ic(icon)}<span class="nur-vorleser">${escapeHtml(text)}</span></span>
          <span class="wetter-kachel-max">${Math.round(t.max)}°</span>
          <span class="wetter-kachel-min">${Math.round(t.min)}°</span>
        </div>`;
    }).join("");

    // Seit Session 34: kompakt in der Datumszeile, Tipp klappt den Ausblick auf
    const knopf = document.getElementById("heute-wetter");
    if (knopf) {
      knopf.innerHTML = `${Math.round(wetterDaten.aktuelle_temperatur)}° ${ic(aktIcon, "ic-wetter")} ${escapeHtml(aktText)}`;
      knopf.title = `Wetter in ${wetterDaten.ort_gefunden || wetterOrt} – 5-Tage-Ausblick ${wetterAusblickOffen ? "schließen" : "öffnen"}`;
      knopf.setAttribute("aria-expanded", String(wetterAusblickOffen));
    }
    const ausblick = document.getElementById("wetter-ausblick");
    if (ausblick) {
      ausblick.classList.toggle("hidden", !wetterAusblickOffen);
      ausblick.innerHTML = `
        <div class="wetter-karte">
          <div class="wetter-ort-zeile">
            <span>5-Tage-Ausblick · ${escapeHtml(wetterDaten.ort_gefunden || wetterOrt)}</span>
            <button class="project-edit-btn" onclick="wetterOrtBearbeiten()" title="Ort ändern" aria-label="Ort ändern">${ic("stift")}</button>
          </div>
          <div class="wetter-kachel-grid">${tage}</div>
        </div>`;
    }
  }

  // Tipp auf das Wetter in der Datumszeile: Ausblick auf/zu, nach einem Fehler neu laden
  window.wetterKnopfKlick = function () {
    if (!wetterDaten) { ladeWetter(true); return; }
    window.wetterAusblickUmschalten();
  };

  // Klappt den 5-Tage-Wetterausblick auf oder zu
  window.wetterAusblickUmschalten = function () {
    wetterAusblickOffen = !wetterAusblickOffen;
    renderWetter();
  };

  // Fragt einen neuen Wetter-Ort ab, speichert ihn und lädt das Wetter neu
  window.wetterOrtBearbeiten = function () {
    const neu = prompt("Ort für die Wettervorhersage:", wetterOrt);
    if (neu === null) return;
    const bereinigt = neu.trim();
    if (!bereinigt || bereinigt === wetterOrt) return;
    wetterOrt = bereinigt;
    localStorage.setItem("wetter-ort", wetterOrt);
    ladeWetter(true);
  };

  // ==========================================================
  // Zitat des Tages (Start-Screen, je Bereich eigene Liste)
  // Nur gemeinfreie Zitate mit Quellenangabe. Lateinische und
  // griechische Texte (Seneca, Marc Aurel, Aristoteles) sowie
  // englische/chinesische sind eigene Übersetzungen – ältere
  // deutsche Übersetzungen können urheberrechtlich geschützt sein.
  // Wechsel täglich um Mitternacht (lokale Zeit).
  // ==========================================================
  const ZITATE = {
    privat: [
      { text: "Während man es aufschiebt, eilt das Leben vorüber.", autor: "Seneca", quelle: "Briefe an Lucilius 1,2 (eigene Übersetzung)" },
      { text: "Alles andere gehört nicht uns, nur die Zeit ist unser.", autor: "Seneca", quelle: "Briefe an Lucilius 1,3 (eigene Übersetzung)" },
      { text: "Tu wenig, wenn du heiter bleiben willst.", autor: "Marc Aurel (nach Demokrit)", quelle: "Selbstbetrachtungen 4,24 (eigene Übersetzung)" },
      { text: "Wie deine Gedanken meistens sind, so wird auch dein Gemüt sein; denn die Seele wird von den Gedanken gefärbt.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 5,16 (eigene Übersetzung)" },
      { text: "Grabe nach innen. Innen ist die Quelle des Guten, und sie kann immer wieder hervorsprudeln, wenn du immer weiter gräbst.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 7,59 (eigene Übersetzung)" },
      { text: "Ohne Musik wäre das Leben ein Irrtum.", autor: "Friedrich Nietzsche", quelle: "Götzen-Dämmerung, Sprüche und Pfeile 33" },
      { text: "Es ist ein Brauch von alters her: Wer Sorgen hat, hat auch Likör!", autor: "Wilhelm Busch", quelle: "Die fromme Helene" },
      { text: "Das ist ein weites Feld.", autor: "Theodor Fontane", quelle: "Effi Briest" },
      { text: "Kein Mensch muß müssen.", autor: "Gotthold Ephraim Lessing", quelle: "Nathan der Weise, I,3" },
      { text: "Haben Sie Geduld gegen alles Ungelöste in Ihrem Herzen und versuchen Sie, die Fragen selbst liebzuhaben.", autor: "Rainer Maria Rilke", quelle: "Briefe an einen jungen Dichter, 16. Juli 1903" },
      { text: "Wo aber Gefahr ist, wächst das Rettende auch.", autor: "Friedrich Hölderlin", quelle: "Patmos" },
      { text: "Grau, teurer Freund, ist alle Theorie, und grün des Lebens goldner Baum.", autor: "Johann Wolfgang von Goethe", quelle: "Faust I, Studierzimmer" },
      { text: "Allen Gewalten zum Trutz sich erhalten, nimmer sich beugen, kräftig sich zeigen.", autor: "Johann Wolfgang von Goethe", quelle: "Lila" },
      { text: "Wenn jemand eine Reise tut, so kann er was verzählen.", autor: "Matthias Claudius", quelle: "Urians Reise um die Welt" },
      { text: "Am Ziele deiner Wünsche wirst du jedenfalls eines vermissen: dein Wandern zum Ziel.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Der Gedanke an die Vergänglichkeit aller irdischen Dinge ist ein Quell unendlichen Leids – und ein Quell unendlichen Trostes.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "In der Jugend lernt, im Alter versteht man.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Wie teuer du eine schöne Illusion auch bezahltest, du hast doch einen guten Handel gemacht.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Wenn man das Dasein als eine Aufgabe betrachtet, dann vermag man es immer zu ertragen.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Im Unglück finden wir meistens die Ruhe wieder, die uns durch die Furcht vor dem Unglück geraubt wurde.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Es gibt mehr Dinge, die uns schrecken, als solche, die uns bedrängen; öfter leiden wir in der Vorstellung als in Wirklichkeit.", autor: "Seneca", quelle: "Briefe an Lucilius 13,4 (eigene Übersetzung)" },
      { text: "Du musst deine Gesinnung ändern, nicht den Himmel über dir.", autor: "Seneca", quelle: "Briefe an Lucilius 28,1–2 (eigene Übersetzung)" },
      { text: "Wir haben nicht zu wenig Zeit, sondern wir vergeuden viel davon.", autor: "Seneca", quelle: "Von der Kürze des Lebens 1,3 (eigene Übersetzung)" },
      { text: "Lebe nicht, als hättest du zehntausend Jahre vor dir. Solange du lebst, solange es möglich ist, werde gut.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 4,17 (eigene Übersetzung)" },
      { text: "Lass dich durch die Zukunft nicht beunruhigen. Du wirst ihr, wenn nötig, mit derselben Vernunft begegnen, die du jetzt für die Gegenwart gebrauchst.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 7,8 (eigene Übersetzung)" },
      { text: "Hier bin ich Mensch, hier darf ich's sein!", autor: "Johann Wolfgang von Goethe", quelle: "Faust I, Vor dem Tor" },
      { text: "Willst du immer weiter schweifen? Sieh, das Gute liegt so nah. Lerne nur das Glück ergreifen, denn das Glück ist immer da.", autor: "Johann Wolfgang von Goethe", quelle: "Erinnerung" },
      { text: "Wo viel Licht ist, ist starker Schatten.", autor: "Johann Wolfgang von Goethe", quelle: "Götz von Berlichingen, 1. Akt" },
      { text: "Raum ist in der kleinsten Hütte für ein glücklich liebend Paar.", autor: "Friedrich Schiller", quelle: "Der Jüngling am Bache" },
      { text: "Die Uhr schlägt keinem Glücklichen.", autor: "Friedrich Schiller", quelle: "Die Piccolomini, III,3" },
      { text: "Es ist der Geist, der sich den Körper baut.", autor: "Friedrich Schiller", quelle: "Wallensteins Tod, III,13" },
      { text: "Zwei Dinge erfüllen das Gemüt mit immer neuer und zunehmender Bewunderung und Ehrfurcht: der bestirnte Himmel über mir und das moralische Gesetz in mir.", autor: "Immanuel Kant", quelle: "Kritik der praktischen Vernunft, Beschluss" },
      { text: "Was mich nicht umbringt, macht mich stärker.", autor: "Friedrich Nietzsche", quelle: "Götzen-Dämmerung, Sprüche und Pfeile 8" },
      { text: "Und verloren sei uns der Tag, wo nicht Ein Mal getanzt wurde!", autor: "Friedrich Nietzsche", quelle: "Also sprach Zarathustra, Von alten und neuen Tafeln 23" },
      { text: "Nur die ergangenen Gedanken haben Werth.", autor: "Friedrich Nietzsche", quelle: "Götzen-Dämmerung, Sprüche und Pfeile 34" },
      { text: "Das Gute – dieser Satz steht fest – ist stets das Böse, was man läßt!", autor: "Wilhelm Busch", quelle: "Die fromme Helene" },
      { text: "Der Himmel ist ebenso unter unseren Füßen wie über unseren Köpfen.", autor: "Henry David Thoreau", quelle: "Walden, Der Teich im Winter (eigene Übersetzung)" },
      { text: "In der Wildnis liegt die Bewahrung der Welt.", autor: "Henry David Thoreau", quelle: "Walking, 1862 (eigene Übersetzung)" },
      { text: "Nicht die Dinge selbst beunruhigen die Menschen, sondern ihre Meinungen über die Dinge.", autor: "Epiktet", quelle: "Handbüchlein der Moral 5 (eigene Übersetzung)" },
      { text: "Wer andere kennt, ist klug. Wer sich selbst kennt, ist weise.", autor: "Laozi", quelle: "Daodejing 33 (eigene Übersetzung)" },
    ],
    ogs: [
      { text: "Der Mensch spielt nur, wo er in voller Bedeutung des Worts Mensch ist, und er ist nur da ganz Mensch, wo er spielt.", autor: "Friedrich Schiller", quelle: "Über die ästhetische Erziehung des Menschen, 15. Brief" },
      { text: "Der Mensch kann nur Mensch werden durch Erziehung.", autor: "Immanuel Kant", quelle: "Über Pädagogik" },
      { text: "Habe Mut, dich deines eigenen Verstandes zu bedienen!", autor: "Immanuel Kant", quelle: "Beantwortung der Frage: Was ist Aufklärung?" },
      { text: "Indem die Menschen lehren, lernen sie.", autor: "Seneca", quelle: "Briefe an Lucilius 7,8 (eigene Übersetzung)" },
      { text: "Lang ist der Weg durch Lehren, kurz und wirksam durch Beispiele.", autor: "Seneca", quelle: "Briefe an Lucilius 6,5 (eigene Übersetzung)" },
      { text: "Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.", autor: "Seneca", quelle: "Briefe an Lucilius 104,26 (eigene Übersetzung)" },
      { text: "Was man gelernt haben muss, um es zu tun, das lernt man, indem man es tut.", autor: "Aristoteles", quelle: "Nikomachische Ethik II,1 (eigene Übersetzung)" },
      { text: "Wenn wir die Menschen nur nehmen, wie sie sind, so machen wir sie schlechter; wenn wir sie behandeln, als wären sie, was sie sein sollten, so bringen wir sie dahin, wohin sie zu bringen sind.", autor: "Johann Wolfgang von Goethe", quelle: "Wilhelm Meisters Lehrjahre, 8. Buch" },
      { text: "Früh übt sich, was ein Meister werden will.", autor: "Friedrich Schiller", quelle: "Wilhelm Tell, III,3" },
      { text: "Musik wird störend oft empfunden, dieweil sie mit Geräusch verbunden.", autor: "Wilhelm Busch", quelle: "Dideldum!" },
      { text: "Vater werden ist nicht schwer, Vater sein dagegen sehr.", autor: "Wilhelm Busch", quelle: "Julchen" },
      { text: "Es ist nicht genug zu wissen, man muß auch anwenden; es ist nicht genug zu wollen, man muß auch tun.", autor: "Johann Wolfgang von Goethe", quelle: "Wilhelm Meisters Wanderjahre, Betrachtungen im Sinne der Wanderer" },
      { text: "Wer sich seiner eigenen Kindheit nicht mehr deutlich erinnert, ist ein schlechter Erzieher.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen" },
      { text: "Eltern verzeihen ihren Kindern die Fehler am schwersten, die sie ihnen selbst anerzogen haben.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen" },
      { text: "Das Leben erzieht die großen Menschen und lässt die kleinen laufen.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Die verstehen sehr wenig, die nur das verstehen, was sich erklären läßt.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Auch das kleinste Licht hat sein Atmosphärchen.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Ein Urteil läßt sich widerlegen, aber niemals ein Vorurteil.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen" },
      { text: "Wer nichts weiß, muss alles glauben.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "So lange muss man lernen, wie man etwas nicht weiß – und wenn wir dem Sprichwort glauben, so lange man lebt.", autor: "Seneca", quelle: "Briefe an Lucilius 76,3 (eigene Übersetzung)" },
      { text: "Wenn dir etwas schwerfällt, halte es nicht für menschenunmöglich. Was aber menschenmöglich ist, das halte auch für dir erreichbar.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 6,19 (eigene Übersetzung)" },
      { text: "Es bildet ein Talent sich in der Stille, sich ein Charakter in dem Strom der Welt.", autor: "Johann Wolfgang von Goethe", quelle: "Torquato Tasso, I,2" },
      { text: "Es irrt der Mensch, solang er strebt.", autor: "Johann Wolfgang von Goethe", quelle: "Faust I, Prolog im Himmel" },
      { text: "Wer fremde Sprachen nicht kennt, weiß nichts von seiner eigenen.", autor: "Johann Wolfgang von Goethe", quelle: "Maximen und Reflexionen" },
      { text: "Kinder sollen nicht dem gegenwärtigen, sondern dem zukünftig möglich bessern Zustande des menschlichen Geschlechts … erzogen werden.", autor: "Immanuel Kant", quelle: "Über Pädagogik" },
      { text: "Der Mensch ist nichts, als was die Erziehung aus ihm macht.", autor: "Immanuel Kant", quelle: "Über Pädagogik" },
      { text: "Du sollst der werden, der du bist.", autor: "Friedrich Nietzsche", quelle: "Die fröhliche Wissenschaft 270" },
      { text: "Ach, was muß man oft von bösen Kindern hören oder lesen!", autor: "Wilhelm Busch", quelle: "Max und Moritz, Vorwort" },
      { text: "Aber wehe, wehe, wehe! Wenn ich auf das Ende sehe!!", autor: "Wilhelm Busch", quelle: "Max und Moritz, Vorwort" },
      { text: "Sage nicht alles, was du weißt, aber wisse immer, was du sagst.", autor: "Matthias Claudius", quelle: "An meinen Sohn Johannes (1799)" },
      { text: "Nicht die Kinder bloß speist man mit Märchen ab.", autor: "Gotthold Ephraim Lessing", quelle: "Nathan der Weise, III,6" },
      { text: "Was die Erziehung bei dem einzelnen Menschen ist, ist die Offenbarung bei dem ganzen Menschengeschlechte.", autor: "Gotthold Ephraim Lessing", quelle: "Die Erziehung des Menschengeschlechts, § 1" },
      { text: "Der Geist muss nicht wie ein Gefäß gefüllt werden, sondern er braucht, wie Holz, nur einen Funken, der ihn entzündet.", autor: "Plutarch", quelle: "Über das Hören 18 (eigene Übersetzung)" },
      { text: "Wissen, was man weiß, und wissen, was man nicht weiß – das ist Wissen.", autor: "Konfuzius", quelle: "Gespräche 2,17 (eigene Übersetzung)" },
      { text: "Lernen und das Gelernte immer wieder üben – ist das nicht auch eine Freude?", autor: "Konfuzius", quelle: "Gespräche 1,1 (eigene Übersetzung)" },
      { text: "Wenn drei miteinander gehen, ist gewiss einer darunter, von dem ich lernen kann.", autor: "Konfuzius", quelle: "Gespräche, Buch 7 (eigene Übersetzung)" },
      { text: "Nichts in der Welt ist weicher und schwächer als das Wasser, und doch kommt ihm im Angriff auf das Harte und Starke nichts gleich.", autor: "Laozi", quelle: "Daodejing 78 (eigene Übersetzung)" },
    ],
    awo: [
      { text: "Wo immer ein Mensch ist, da ist Gelegenheit zu einer Wohltat.", autor: "Seneca", quelle: "Vom glücklichen Leben 24,3 (eigene Übersetzung)" },
      { text: "Du musst für den anderen leben, wenn du für dich leben willst.", autor: "Seneca", quelle: "Briefe an Lucilius 48,2 (eigene Übersetzung)" },
      { text: "Wir sind Glieder eines großen Körpers.", autor: "Seneca", quelle: "Briefe an Lucilius 95,52 (eigene Übersetzung)" },
      { text: "Was dem Schwarm nicht nützt, nützt auch der Biene nicht.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 6,54 (eigene Übersetzung)" },
      { text: "Rede nicht länger darüber, wie ein guter Mensch sein soll, sondern sei einer.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 10,16 (eigene Übersetzung)" },
      { text: "Die beste Art, sich zu wehren, ist, nicht so zu werden wie der, der Unrecht tut.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 6,6 (eigene Übersetzung)" },
      { text: "Verbunden werden auch die Schwachen mächtig.", autor: "Friedrich Schiller", quelle: "Wilhelm Tell, I,3" },
      { text: "Alle Menschen werden Brüder.", autor: "Friedrich Schiller", quelle: "An die Freude (Fassung von 1803)" },
      { text: "Edel sei der Mensch, hülfreich und gut!", autor: "Johann Wolfgang von Goethe", quelle: "Das Göttliche" },
      { text: "Von guten Mächten wunderbar geborgen, erwarten wir getrost, was kommen mag.", autor: "Dietrich Bonhoeffer", quelle: "Von guten Mächten (1944)" },
      { text: "Wer immer strebend sich bemüht, den können wir erlösen.", autor: "Johann Wolfgang von Goethe", quelle: "Faust II, Bergschluchten" },
      { text: "Vom sichern Port läßt sich's gemächlich raten.", autor: "Friedrich Schiller", quelle: "Wilhelm Tell, I,1" },
      { text: "Handle so, daß du die Menschheit, sowohl in deiner Person, als in der Person eines jeden andern, jederzeit zugleich als Zweck, niemals bloß als Mittel brauchest.", autor: "Immanuel Kant", quelle: "Grundlegung zur Metaphysik der Sitten" },
      { text: "Die Menschen, denen wir eine Stütze sind, die geben uns den Halt im Leben.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Haben und nicht geben ist in manchen Fällen schlimmer als stehlen.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Mut des Schwachen, Milde des Starken – beide anbetungswürdig!", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Das Recht des Stärkeren ist das stärkste Unrecht.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Der größte Feind des Rechtes ist das Vorrecht.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Suche immer zu nützen! Suche nie, dich unentbehrlich zu machen.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Wir sollen immer verzeihen, dem Reuigen um seinetwillen, dem Reuelosen um unseretwillen.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Bis zu einem gewissen Grade selbstlos sollte man schon aus Selbstsucht sein.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Wenn du geliebt werden willst, liebe.", autor: "Seneca (nach Hekaton)", quelle: "Briefe an Lucilius 9,6 (eigene Übersetzung)" },
      { text: "Wer eine Wohltat erwiesen hat, schweige; erzählen soll, wer sie empfangen hat.", autor: "Seneca", quelle: "Über die Wohltaten 2,11 (eigene Übersetzung)" },
      { text: "Dem Menschen ist es eigen, auch die zu lieben, die fehlen.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 7,22 (eigene Übersetzung)" },
      { text: "Die Menschen sind füreinander da. Belehre sie also oder ertrage sie.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 8,59 (eigene Übersetzung)" },
      { text: "Ein guter Mensch in seinem dunklen Drange ist sich des rechten Weges wohl bewußt.", autor: "Johann Wolfgang von Goethe", quelle: "Faust I, Prolog im Himmel" },
      { text: "Ein edler Mensch zieht edle Menschen an und weiß sie festzuhalten.", autor: "Johann Wolfgang von Goethe", quelle: "Torquato Tasso, I,1" },
      { text: "Die Tat ist alles, nichts der Ruhm.", autor: "Johann Wolfgang von Goethe", quelle: "Faust II, 4. Akt" },
      { text: "Der brave Mann denkt an sich selbst zuletzt.", autor: "Friedrich Schiller", quelle: "Wilhelm Tell, I,1" },
      { text: "Der Mensch ist frei geschaffen, ist frei, und würd' er in Ketten geboren.", autor: "Friedrich Schiller", quelle: "Die Worte des Glaubens" },
      { text: "Aus so krummem Holze, als woraus der Mensch gemacht ist, kann nichts ganz Gerades gezimmert werden.", autor: "Immanuel Kant", quelle: "Idee zu einer allgemeinen Geschichte in weltbürgerlicher Absicht, 6. Satz" },
      { text: "Es eifre jeder seiner unbestochnen, von Vorurteilen freien Liebe nach!", autor: "Gotthold Ephraim Lessing", quelle: "Nathan der Weise, III,7" },
      { text: "Die einzige Art, einen Freund zu haben, ist, einer zu sein.", autor: "Ralph Waldo Emerson", quelle: "Friendship, 1841 (eigene Übersetzung)" },
      { text: "Der Mensch ist von Natur aus ein Gemeinschaftswesen.", autor: "Aristoteles", quelle: "Politik I,2 (eigene Übersetzung)" },
      { text: "Der Weise häuft nicht an. Je mehr er für andere tut, desto mehr hat er selbst.", autor: "Laozi", quelle: "Daodejing 81 (eigene Übersetzung)" },
      { text: "Was du selbst nicht wünschst, das tu auch anderen nicht an.", autor: "Konfuzius", quelle: "Gespräche, Buch 15 (eigene Übersetzung)" },
      { text: "Ich bin ein Mensch; nichts Menschliches, meine ich, ist mir fremd.", autor: "Terenz", quelle: "Der Selbstquäler 77 (eigene Übersetzung)" },
      { text: "Nicht das Beliebige, sondern das Rechte tun und wagen, nicht im Möglichen schweben, das Wirkliche tapfer ergreifen.", autor: "Dietrich Bonhoeffer", quelle: "Stationen auf dem Wege zur Freiheit (1944)" },
      { text: "Wo Mäßigung ein Fehler ist, da ist Gleichgültigkeit ein Verbrechen.", autor: "Georg Christoph Lichtenberg", quelle: "Sudelbücher, Heft G" },
    ],
    business: [
      { text: "Man muss noch Chaos in sich haben, um einen tanzenden Stern gebären zu können.", autor: "Friedrich Nietzsche", quelle: "Also sprach Zarathustra, Vorrede 5" },
      { text: "Wer nicht weiß, welchen Hafen er ansteuert, für den ist kein Wind der richtige.", autor: "Seneca", quelle: "Briefe an Lucilius 71,3 (eigene Übersetzung)" },
      { text: "Eine Reise von tausend Meilen beginnt unter deinen Füßen.", autor: "Laozi", quelle: "Daodejing 64 (eigene Übersetzung)" },
      { text: "Gut gemacht ist besser als gut gesagt.", autor: "Benjamin Franklin", quelle: "Poor Richard's Almanack 1737 (eigene Übersetzung)" },
      { text: "Nichts Großes ist je ohne Begeisterung erreicht worden.", autor: "Ralph Waldo Emerson", quelle: "Circles, 1841 (eigene Übersetzung)" },
      { text: "Das Was bedenke, mehr bedenke Wie.", autor: "Johann Wolfgang von Goethe", quelle: "Faust II, Laboratorium" },
      { text: "Wer gar zu viel bedenkt, wird wenig leisten.", autor: "Friedrich Schiller", quelle: "Wilhelm Tell, III,1" },
      { text: "Dem Mann kann geholfen werden.", autor: "Friedrich Schiller", quelle: "Die Räuber, V,2" },
      { text: "Getretner Quark wird breit, nicht stark.", autor: "Johann Wolfgang von Goethe", quelle: "West-östlicher Divan, Buch der Sprüche" },
      { text: "Die Axt im Haus erspart den Zimmermann.", autor: "Friedrich Schiller", quelle: "Wilhelm Tell, III,1" },
      { text: "Was du ererbt von deinen Vätern hast, erwirb es, um es zu besitzen.", autor: "Johann Wolfgang von Goethe", quelle: "Faust I, Nacht" },
      { text: "Die Welt ist Wandel, das Leben Auffassung.", autor: "Marc Aurel", quelle: "Selbstbetrachtungen 4,3 (eigene Übersetzung)" },
      { text: "Ernst ist das Leben, heiter ist die Kunst.", autor: "Friedrich Schiller", quelle: "Wallensteins Lager, Prolog" },
      { text: "Für das Können gibt es nur einen Beweis: das Tun.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen" },
      { text: "Was noch zu leisten ist, das bedenke; was du schon geleistet hast, das vergiss.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Zwischen Können und Tun liegt ein großes Meer und auf seinem Grunde die gescheiterte Willenskraft.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Ausnahmen sind nicht immer Bestätigungen der alten Regel; sie können auch die Vorboten einer neuen Regel sein.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Sag etwas, das sich von selbst versteht, zum ersten Mal, und du bist unsterblich.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Nichts Besseres kann der Künstler sich wünschen als grobe Freunde und höfliche Feinde.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Wenn die Zeit kommt, in der man könnte, ist die vorüber, in der man kann.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen" },
      { text: "Begeisterung spricht nicht immer für den, der sie erweckt, und immer für den, der sie empfindet.", autor: "Marie von Ebner-Eschenbach", quelle: "Aphorismen (Ausgabe 1893)" },
      { text: "Nirgends ist, wer überall ist.", autor: "Seneca", quelle: "Briefe an Lucilius 2,2 (eigene Übersetzung)" },
      { text: "Das größte Hindernis für das Leben ist das Warten, das am Morgen hängt und das Heute verliert.", autor: "Seneca", quelle: "Von der Kürze des Lebens 9,1 (eigene Übersetzung)" },
      { text: "Wer vieles bringt, wird manchem etwas bringen.", autor: "Johann Wolfgang von Goethe", quelle: "Faust I, Vorspiel auf dem Theater" },
      { text: "Der Worte sind genug gewechselt, laßt mich auch endlich Taten sehn!", autor: "Johann Wolfgang von Goethe", quelle: "Faust I, Vorspiel auf dem Theater" },
      { text: "Was glänzt, ist für den Augenblick geboren; das Echte bleibt der Nachwelt unverloren.", autor: "Johann Wolfgang von Goethe", quelle: "Faust I, Vorspiel auf dem Theater" },
      { text: "Gebraucht der Zeit, sie geht so schnell von hinnen, doch Ordnung lehrt Euch Zeit gewinnen.", autor: "Johann Wolfgang von Goethe", quelle: "Faust I, Studierzimmer" },
      { text: "Die ich rief, die Geister, werd ich nun nicht los.", autor: "Johann Wolfgang von Goethe", quelle: "Der Zauberlehrling" },
      { text: "Von der Stirne heiß rinnen muß der Schweiß, soll das Werk den Meister loben.", autor: "Friedrich Schiller", quelle: "Das Lied von der Glocke" },
      { text: "Leicht beieinander wohnen die Gedanken, doch hart im Raume stoßen sich die Sachen.", autor: "Friedrich Schiller", quelle: "Wallensteins Tod, II,2" },
      { text: "Verlorene Zeit findet sich nie wieder.", autor: "Benjamin Franklin", quelle: "Poor Richard's Almanack 1748 (eigene Übersetzung)" },
      { text: "Kleine Hiebe fällen große Eichen.", autor: "Benjamin Franklin", quelle: "Poor Richard's Almanack 1750 (eigene Übersetzung)" },
      { text: "Vertraue dir selbst: Jedes Herz schwingt mit dieser eisernen Saite.", autor: "Ralph Waldo Emerson", quelle: "Self-Reliance, 1841 (eigene Übersetzung)" },
      { text: "Eine Schwalbe macht noch keinen Frühling.", autor: "Aristoteles", quelle: "Nikomachische Ethik I,6 (eigene Übersetzung)" },
      { text: "Das Schwierige der Welt beginnt immer im Leichten, das Große der Welt beginnt immer im Kleinen.", autor: "Laozi", quelle: "Daodejing 63 (eigene Übersetzung)" },
      { text: "Wer angefangen hat, hat schon die Hälfte getan: Wage, weise zu sein!", autor: "Horaz", quelle: "Briefe I,2,40 (eigene Übersetzung)" },
      { text: "Der Tropfen höhlt den Stein.", autor: "Ovid", quelle: "Briefe aus dem Pontus IV,10,5 (eigene Übersetzung)" },
      { text: "Weil, so schließt er messerscharf, nicht sein kann, was nicht sein darf.", autor: "Christian Morgenstern", quelle: "Die unmögliche Tatsache (Palmström)" },
      { text: "Ich kann freilich nicht sagen, ob es besser werden wird, wenn es anders wird; aber so viel kann ich sagen, es muß anders werden, wenn es gut werden soll.", autor: "Georg Christoph Lichtenberg", quelle: "Sudelbücher" },
      { text: "Die Neigung der Menschen, kleine Dinge für wichtig zu halten, hat sehr viel Großes hervorgebracht.", autor: "Georg Christoph Lichtenberg", quelle: "Sudelbücher" },
    ],
  };

  // Wählt das Zitat des Tages für einen Bereich anhand des Kalendertags
  function zitatDesTages(bereich, datum = new Date()) {
    const liste = ZITATE[bereich];
    if (!liste || liste.length === 0) return null;
    // Tageszähler nach lokalem Kalendertag (UTC-Konstruktor vermeidet
    // Sprünge durch Sommer-/Winterzeit)
    const tag = Math.floor(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()) / 86400000);
    return liste[((tag % liste.length) + liste.length) % liste.length];
  }

  // Zeigt das Zitat des Tages des aktiven Bereichs auf dem Start-Screen an
  function renderTagesZitat() {
    const el = document.getElementById("tages-zitat");
    if (!el) return;
    const z = zitatDesTages(aktiverBereich);
    if (!z) { el.classList.add("hidden"); el.innerHTML = ""; return; }
    el.classList.remove("hidden");
    el.innerHTML = `<blockquote class="tages-zitat-text">${escapeHtml(z.text)}</blockquote>` +
      `<figcaption class="tages-zitat-quelle">${escapeHtml(z.autor)} · <cite>${escapeHtml(z.quelle)}</cite></figcaption>`;
  }

  // ==========================================================
  // Start-Screen „Heute“ – seit Session 34 (Redesign Etappe 2).
  // Reihenfolge: Kopf (Datum · Wetter, Gruß, Statuszeile) → „Dein Tag“
  // (freie Zeit als Band) → „Als Nächstes“ → Modul-Kacheln des Bereichs
  // (OGS/AWO/Business) → Liste „Heute“ → Überfällig-Streifen mit „Alle auf
  // heute“ → Kennzahlen → Ziele → Zitat (steht in index.html ganz unten).
  // Jede Zahl erscheint nur noch einmal (früher: Gruß, Überfällig-Kachel,
  // Gruppenköpfe und „Aufgaben fällig“ zeigten dasselbe).
  // ==========================================================

  // Linien-Icons der Modul-Kacheln (statt Emoji)
  const HEUTE_MODUL_ICON = {
    ogsideen: `<svg ${SVG_ATTR}><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/></svg>`,
    ogsinventar: `<svg ${SVG_ATTR}><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>`,
    ogsprojekte: `<svg ${SVG_ATTR}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`,
    verleih: `<svg ${SVG_ATTR}><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>`,
    raumplanung: `<svg ${SVG_ATTR}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
    schluessel: `<svg ${SVG_ATTR}><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/></svg>`,
  };

  // Minuten als kurzer Text: „40 Min.“, „2 Std.“, „2 Std. 15 Min.“
  function dauerText(min) {
    const m = Math.max(0, Math.round(min));
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h === 0) return `${r} Min.`;
    return r ? `${h} Std. ${r} Min.` : `${h} Std.`;
  }

  // Sammelt alles, was heute im aktiven Bereich ansteht (ohne Überfälliges), nach Uhrzeit sortiert
  function heuteEintraegeSammeln(heuteIso, offenEnriched) {
    const liste = [];
    termine
      .filter((t) => t.datum === heuteIso && !t.uhrzeit && bereichVon(t) === aktiverBereich)
      .sort((a, b) => a.titel.localeCompare(b.titel))
      .forEach((t) => liste.push({
        id: t.id, typ: "termin", zeit: "ganzt.", titel: t.titel, meta: "Termin · ganztägig",
        tab: "kalender", sort: -1, erledigt: !!t.erledigt,
      }));
    termine
      .filter((t) => t.datum === heuteIso && t.uhrzeit && bereichVon(t) === aktiverBereich)
      .forEach((t) => {
        const start = t.uhrzeit.slice(0, 5);
        const endeEcht = t.ende_uhrzeit ? t.ende_uhrzeit.slice(0, 5) : null;
        liste.push({
          id: t.id, typ: "termin", zeit: start, start, ende: endeEcht || minutenZuZeit(zeitZuMinuten(start) + 30), endeEcht,
          titel: t.titel, meta: "Termin" + (endeEcht ? ` bis ${endeEcht}` : ""), tab: "kalender",
          sort: zeitZuMinuten(start), erledigt: !!t.erledigt,
        });
      });
    offenEnriched
      .filter((a) => a.status !== "ueberfaellig" && (a.status === "heute" || a.erinnerungFaellig))
      .forEach((a) => {
        const start = a.status === "heute" && a.uhrzeit ? a.uhrzeit.slice(0, 5) : null;
        const endeEcht = start && a.ende_uhrzeit ? a.ende_uhrzeit.slice(0, 5) : null;
        liste.push({
          id: a.id, typ: "aufgabe", zeit: start || "–", start,
          ende: start ? (endeEcht || minutenZuZeit(zeitZuMinuten(start) + 30)) : null, endeEcht,
          titel: a.titel, meta: a.status === "heute" ? "Aufgabe" + (endeEcht ? ` bis ${endeEcht}` : "") : "Erinnerung",
          erinnerung: a.status !== "heute",
          tab: "aufgaben", sort: start ? zeitZuMinuten(start) : 24 * 60,
        });
      });
    return liste.sort((a, b) => a.sort - b.sort);
  }

  // Rendert den Start-Screen (Heute) des aktiven Bereichs
  function renderHeute() {
    bereichAnwenden();
    const heuteIso = heuteISO();
    const jetztDate = new Date();
    const jetztMinuten = jetztDate.getHours() * 60 + jetztDate.getMinutes();
    const offenEnriched = aufgaben
      .filter((a) => bereichVon(a) === aktiverBereich && !a.erledigt)
      .map(enrich);
    const eintraege = heuteEintraegeSammeln(heuteIso, offenEnriched);
    const ueberfaellig = offenEnriched
      .filter((a) => a.status === "ueberfaellig")
      .sort((a, b) => (a.faellig_am || "").localeCompare(b.faellig_am || "") || (a.uhrzeit || "99").localeCompare(b.uhrzeit || "99"));

    // ---- Kopf ----
    const datumEl = document.getElementById("heute-datum");
    if (datumEl) datumEl.textContent = jetztDate.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
    const grussEl = document.getElementById("heute-gruss");
    if (grussEl) grussEl.textContent = GRUSS;
    const offenHeute = eintraege.filter((e) => !e.erledigt).length;
    const statusEl = document.getElementById("heute-status");
    if (statusEl) {
      let text = offenHeute > 0
        ? `${offenHeute} ${offenHeute === 1 ? "Ding" : "Dinge"} heute`
        : (ueberfaellig.length ? "Heute nichts Neues" : "Freie Bahn heute.");
      if (ueberfaellig.length) text = `${escapeHtml(text)} · <span class="heute-status-warn">${ueberfaellig.length} überfällig</span>`;
      else text = escapeHtml(text);
      statusEl.innerHTML = text;
    }
    renderTagesZitat();

    // ---- Inhalt ----
    const einkaufOffen = einkaufsliste.filter((e) => bereichVon(e) === aktiverBereich && !e.erledigt);
    const aktuelleZiele = aktiverBereich === "privat" ? ["woche", "monat", "jahr"].flatMap((typ) => {
      const startIso = dateToISO(periodStart(typ, new Date()));
      return ziele.filter((z) => z.zeitraum_typ === typ && z.zeitraum_start === startIso);
    }) : [];

    let html = "";
    html += heuteDeinTagHtml(heuteIso, jetztDate, jetztMinuten);
    html += heuteNaechstesHtml(eintraege, jetztMinuten);
    html += heuteRueckblickHtml();
    html += heuteModuleHtml(heuteIso);
    html += heuteListeHtml(eintraege, jetztMinuten);
    html += heuteUeberfaelligHtml(ueberfaellig, heuteIso);
    html += heuteKennzahlenHtml(einkaufOffen, aktuelleZiele);
    html += heuteZieleHtml(aktuelleZiele);
    document.getElementById("heute-bereich").innerHTML = html;
  }

  // „Dein Tag“: heutiger Zeitrahmen als Band (frei/belegt/erledigt) mit Jetzt-Marker; Tipp öffnet Frei
  function heuteDeinTagHtml(heuteIso, jetztDate, jetztMinuten) {
    const wt = wochentagIndex(jetztDate);
    const rahmen = freiRahmenFuerWochentag(wt);
    const tag = freiTagEintraege(heuteIso, wt);
    if (!rahmen.aktiv || !tag || tag.length === 0) return "";
    const rStart = zeitZuMinuten(rahmen.start_zeit);
    const rEnde = zeitZuMinuten(rahmen.end_zeit);
    const spanne = Math.max(1, rEnde - rStart);
    const segmente = tag.map((e) => {
      const s = Math.max(rStart, zeitZuMinuten(e.start));
      const en = Math.min(rEnde, zeitZuMinuten(e.ende));
      if (en <= s) return "";
      const art = e.art === "frei" ? "frei" : (e.art === "erledigt" ? "erledigt" : "belegt");
      return `<span class="dt-seg ${art}" style="width:${((en - s) / spanne) * 100}%;" title="${e.start}–${e.ende}${e.titel ? " · " + escapeAttr(e.titel) : ""}"></span>`;
    }).join("");
    let restFrei = 0;
    tag.filter((e) => e.art === "frei").forEach((e) => {
      const s = Math.max(zeitZuMinuten(e.start), jetztMinuten);
      const en = zeitZuMinuten(e.ende);
      if (en > s) restFrei += en - s;
    });
    const jetztLabel = minutenZuZeit(jetztMinuten);
    const freiText = jetztMinuten >= rEnde ? "Zeitrahmen vorbei"
      : restFrei === 0 ? "heute nichts mehr frei"
      : `noch ${dauerText(restFrei)} frei`;
    const marker = jetztMinuten >= rStart && jetztMinuten <= rEnde
      ? `<span class="dein-tag-marker" style="left:${((jetztMinuten - rStart) / spanne) * 100}%;"></span>` : "";
    return `
      <button type="button" class="heute-karte dein-tag" onclick="heuteFreiOeffnen()" aria-label="Dein Tag: ${freiText}. Öffnet die Ansicht Frei">
        <span class="dein-tag-kopf"><span class="heute-label">Dein Tag</span><span class="dein-tag-frei">${jetztLabel} · ${freiText}</span></span>
        <span class="dein-tag-band"><span class="dein-tag-segmente">${segmente}</span>${marker}</span>
        <span class="dein-tag-skala"><span>${rahmen.start_zeit}</span><span>${rahmen.end_zeit}</span></span>
      </button>`;
  }

  // „Als Nächstes“ bzw. „Jetzt“: der laufende oder nächste Eintrag mit Uhrzeit, in Bereichsfarbe
  function heuteNaechstesHtml(eintraege, jetztMinuten) {
    const mitZeit = eintraege.filter((e) => !e.erledigt && e.start && e.ende);
    const laufend = mitZeit.find((e) => zeitZuMinuten(e.start) <= jetztMinuten && jetztMinuten < zeitZuMinuten(e.ende));
    const naechster = laufend || mitZeit
      .filter((e) => zeitZuMinuten(e.start) > jetztMinuten)
      .sort((a, b) => zeitZuMinuten(a.start) - zeitZuMinuten(b.start))[0];
    if (!naechster) return "";
    const s = zeitZuMinuten(naechster.start);
    const en = zeitZuMinuten(naechster.ende);
    const zeit = naechster.start + (naechster.endeEcht ? "–" + naechster.endeEcht : "");
    const hinweis = laufend ? `noch ${dauerText(en - jetztMinuten)}` : `in ${dauerText(s - jetztMinuten)}`;
    return `
      <button type="button" class="heute-naechstes" onclick="eintragBearbeiten('${naechster.typ}','${naechster.id}')" title="Bearbeiten">
        <span class="heute-naechstes-text">
          <span class="heute-naechstes-label">${laufend ? "Jetzt" : "Als Nächstes"} · ${zeit}</span>
          <span class="heute-naechstes-titel">${escapeHtml(naechster.titel)}</span>
        </span>
        <span class="heute-naechstes-chip">${hinweis}</span>
      </button>`;
  }

  // Kurzer Stand je Modul des Bereichsblocks (Ideen, Inventar, Projekte, Verleih, Raumplanung, Schlüssel)
  function heuteModulInfo(tab, heuteIso) {
    const warn = (t) => `<span class="heute-warn">${t}</span>`;
    if (tab === "ogsideen") {
      const n = ogsIdeen.filter((i) => bereichVon(i) === aktiverBereich && (i.status === "offen" || i.status === "in_arbeit")).length;
      return n ? `${n} offen` : "keine offenen";
    }
    if (tab === "ogsinventar") {
      const items = ogsInventarAktuell();
      const defekt = items.filter((i) => i.zustand === "defekt").length;
      return `${items.length} ${items.length === 1 ? "Gegenstand" : "Gegenstände"}` + (defekt ? ` · ${warn(`${defekt} defekt`)}` : "");
    }
    if (tab === "ogsprojekte") {
      const n = ogsProjekteAktuell().length;
      return `${n} ${n === 1 ? "Projekt" : "Projekte"}`;
    }
    if (tab === "verleih") {
      const n = verleihAktuell().filter((v) => !v.rueckgabe_am).reduce((s, v) => s + (Number(v.menge) || 1), 0);
      return n ? `${n} verliehen` : "nichts verliehen";
    }
    if (tab === "raumplanung") {
      const kommend = raumVermietungenAktuell()
        .filter((v) => (v.datum_bis || v.datum) >= heuteIso)
        .sort((a, b) => a.datum.localeCompare(b.datum));
      if (kommend.some((v) => v.datum <= heuteIso)) return "heute belegt";
      if (!kommend.length) return "nichts geplant";
      const n = kommend[0];
      const [j, m, t] = n.datum.split("-").map(Number);
      const wt = new Date(j, m - 1, t).toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
      return `nächste: ${wt} ${formatDatumKurz(n.datum)}`;
    }
    if (tab === "schluessel") {
      const offen = ausgabenAktuell().filter((a) => !a.zurueck_am);
      const ueber = offen.filter(ausgabeUeberfaellig).length;
      return `${offen.length} ausgegeben` + (ueber ? ` · ${warn(`${ueber} überfällig`)}` : "");
    }
    return "";
  }

  // Modul-Kacheln: die sichtbaren Reiter des Bereichsblocks mit ihrem Stand
  function heuteModuleHtml(heuteIso) {
    const gruppe = hauptkategorien().find((g) => g.schluessel === "arbeit");
    const tabs = gruppe ? sichtbareTabsInGruppe(gruppe) : [];
    if (!tabs.length) return "";
    return `<div class="heute-module">` + tabs.map((tab) => {
      const eintrag = ALLE_REITER.find(([s]) => s === tab);
      return `
        <button type="button" class="heute-modul" onclick="tabWechseln('${tab}')">
          <span class="heute-modul-icon">${HEUTE_MODUL_ICON[tab] || ""}</span>
          <span class="heute-modul-name">${escapeHtml(eintrag ? eintrag[1] : tab)}</span>
          <span class="heute-modul-info">${heuteModulInfo(tab, heuteIso)}</span>
        </button>`;
    }).join("") + `</div>`;
  }

  // Was ein Wisch nach links bei dieser Zeile tut (seit Session 35):
  // überfällig → auf heute, Erinnerung → später erinnern, sonst → morgen; erledigt → nichts
  function heuteWischLinks(e) {
    if (e.erledigt) return "";
    if (e.ueberfaellig) return "heute";
    if (e.erinnerung) return "erinnerung";
    return "morgen";
  }
  const WISCH_LINKS_TEXT = {
    morgen: ["kalender", "Morgen"], heute: ["kalender", "Auf heute"], spaeter: ["kalender", "+1 Tag"],
    erinnerung: ["wiederholen", "Später erinnern"], loeschen: ["x", "Löschen"],
  };
  // Farbige Rückseite einer wischbaren Zeile: links die Rechts-Aktion, rechts die Links-Aktion
  function wischHinterHtml(rechtsIcon, rechtsText, links) {
    const [linksIcon, linksText] = WISCH_LINKS_TEXT[links] || ["", ""];
    return `<div class="wisch-hinter" aria-hidden="true">
          <span class="wisch-text-rechts">${ic(rechtsIcon)} ${rechtsText}</span>
          <span class="wisch-text-links">${links ? `${linksText} ${ic(linksIcon)}` : ""}</span>
        </div>`;
  }
  // Wisch nach links in der Aufgabenliste: überfällig → heute, fällige Erinnerung → später,
  // Datum in der Zukunft → einen Tag später, sonst → morgen; erledigt → nichts
  function aufgabeWischLinks(a, done) {
    if (done) return "";
    if (a.status === "ueberfaellig") return "heute";
    if (a.erinnerungFaellig && a.status !== "heute") return "erinnerung";
    if (a.faellig_am && a.faellig_am > heuteISO()) return "spaeter";
    return "morgen";
  }

  // Eine Zeile der Liste „Heute“ bzw. „Überfällig“: Abhak-Kreis, Zeit, Titel, Art.
  // Seit Session 35 wischbar: nach rechts = erledigt/wieder offen, nach links = verschieben.
  function heuteZeileHtml(e, jetztMinuten) {
    const laeuftJetzt = !e.erledigt && e.start && e.ende &&
      zeitZuMinuten(e.start) <= jetztMinuten && jetztMinuten < zeitZuMinuten(e.ende);
    const klassen = ["heute-zeile"];
    if (laeuftJetzt) klassen.push("jetzt");
    if (e.erledigt) klassen.push("erledigt");
    const links = heuteWischLinks(e);
    klassen.push("wisch-zeile");
    return `
      <div class="${klassen.join(" ")}" data-wisch-typ="${e.typ}" data-wisch-id="${e.id}" data-wisch-links="${links}">
        ${wischHinterHtml(e.erledigt ? "wiederholen" : "ok-kreis", e.erledigt ? "Wieder offen" : "Erledigt", links)}
        <div class="heute-zeile-vorne wisch-vorne">
        <button class="zl-check ${e.erledigt ? "done" : ""}" onclick="zeitleisteUmschalten('${e.typ}','${e.id}', this)"
          title="${e.erledigt ? "Wieder offen" : "Erledigt"}" aria-label="${escapeAttr(e.titel)} ${e.erledigt ? "wieder öffnen" : "als erledigt markieren"}"></button>
        <span class="heute-zeit">${laeuftJetzt ? "Jetzt" : escapeHtml(e.zeit)}</span>
        <button class="heute-zeile-inhalt" onclick="eintragBearbeiten('${e.typ}','${e.id}')" title="${e.typ === "termin" ? "Termin bearbeiten" : "Aufgabe bearbeiten"}">
          <span class="heute-zeile-titel">${escapeHtml(e.titel)}</span>
          <span class="heute-zeile-meta">${escapeHtml(e.meta)}</span>
        </button>
        </div>
      </div>`;
  }


  // ==========================================================
  // Wischgesten (seit Session 35) in „Heute“, Aufgaben und Einkauf
  // Nach rechts: erledigt/abgehakt bzw. wieder offen. Nach links: Aufgabe/
  // Termin auf morgen (Aufgabe mit späterem Datum: +1 Tag), überfällige
  // Aufgabe auf heute, Erinnerung später, Einkauf löschen. Danach kurz
  // „Rückgängig“ (außer bei Erinnerungen). Senkrechtes Scrollen bleibt dem
  // Browser (touch-action: pan-y); erst eine klar waagerechte Bewegung wird
  // zum Wisch, sonst bleibt alles ein normaler Tipp.
  // ==========================================================
  let wisch = null;          // laufender Wisch
  let wischKlickSperre = 0;  // Zeitpunkt, bis zu dem Klicks nach einem Wisch verschluckt werden

  // Führt die Aktion eines Wischs aus; liefert den Hinweistext und ggf. eine Rückgängig-Funktion
  async function wischAusfuehren(typ, id, richtung, art) {
    if (typ === "einkauf") {
      const e = einkaufsliste.find((x) => String(x.id) === String(id));
      if (!e) throw new Error("Eintrag nicht gefunden");
      if (richtung === "rechts") {
        await api("einkauf_umschalten", { id });
        return { text: e.erledigt ? "Wieder offen" : "Abgehakt", zurueck: async () => { await api("einkauf_umschalten", { id }); await ladeDaten(); } };
      }
      await api("einkauf_loeschen", { id });
      // Rückgängig legt den Eintrag neu an (neue ID); war er abgehakt, wird er wieder abgehakt
      return { text: `„${e.text}“ gelöscht`, zurueck: async () => {
        const vorher = new Set(einkaufsliste.map((x) => String(x.id)));
        await api("einkauf_hinzufuegen", { text: e.text, bereich: bereichVon(e) });
        if (e.erledigt) {
          await ladeDaten();
          const neu = einkaufsliste.find((x) => !vorher.has(String(x.id)) && x.text === e.text);
          if (neu) await api("einkauf_umschalten", { id: neu.id });
        }
        await ladeDaten();
      } };
    }
    if (richtung === "rechts") {
      const eintrag = (typ === "termin" ? termine : aufgaben).find((x) => String(x.id) === String(id));
      const warErledigt = !!(eintrag && eintrag.erledigt);
      const aktion = typ === "termin" ? "termin_umschalten" : "aufgabe_umschalten";
      await api(aktion, { id });
      return { text: warErledigt ? "Wieder offen" : "Erledigt", zurueck: async () => { await api(aktion, { id }); await ladeDaten(); } };
    }
    if (art === "erinnerung") {
      await api("erinnerung_verschieben", { id });
      return { text: "Erinnerung verschoben" };
    }
    const eintragVorher = (typ === "termin" ? termine : aufgaben).find((x) => String(x.id) === String(id));
    const ziel = art === "heute" ? heuteISO()
      : art === "spaeter" && eintragVorher && eintragVorher.faellig_am ? addTage(eintragVorher.faellig_am, 1)
      : addTage(heuteISO(), 1);
    const zielText = art === "heute" ? "Auf heute verschoben"
      : art === "spaeter" ? `Auf ${formatDatumKurz(ziel)} verschoben` : "Auf morgen verschoben";
    if (typ === "termin") {
      const t = termine.find((x) => String(x.id) === String(id));
      if (!t) throw new Error("Termin nicht gefunden");
      const felder = (datum) => ({ id, titel: t.titel, datum, uhrzeit: t.uhrzeit ? t.uhrzeit.slice(0, 5) : null,
        ende_uhrzeit: t.ende_uhrzeit ? t.ende_uhrzeit.slice(0, 5) : null, notiz: t.notiz || null, aktiver_bereich: bereichVon(t) });
      const alt = t.datum;
      await api("termin_aktualisieren", felder(ziel));
      return { text: zielText, zurueck: async () => { await api("termin_aktualisieren", felder(alt)); await ladeDaten(); } };
    }
    const a = aufgaben.find((x) => String(x.id) === String(id));
    if (!a) throw new Error("Aufgabe nicht gefunden");
    // Alle Felder mitschicken – aufgabe_aktualisieren überschreibt sonst Projekt, Uhrzeit, Wiederholung
    const felder = (datum) => ({ id, titel: a.titel, projekt_id: a.projekt_id || null, faellig_am: datum,
      uhrzeit: a.uhrzeit ? a.uhrzeit.slice(0, 5) : null, ende_uhrzeit: a.ende_uhrzeit ? a.ende_uhrzeit.slice(0, 5) : null,
      erinnere_alle_tage: a.erinnere_alle_tage || null });
    const alt = a.faellig_am || null;
    await api("aufgabe_aktualisieren", felder(ziel));
    return { text: zielText, zurueck: async () => { await api("aufgabe_aktualisieren", felder(alt)); await ladeDaten(); } };
  }

  // Setzt die Zeile auf eine Verschiebung und färbt den Hintergrund passend zur Richtung
  function wischSetzen(zeile, dx, animiert) {
    const vorne = zeile.querySelector(".wisch-vorne");
    vorne.style.transition = animiert ? "transform 0.2s ease" : "none";
    vorne.style.transform = dx ? `translateX(${dx}px)` : "";
    zeile.classList.toggle("wisch-rechts", dx > 0);
    zeile.classList.toggle("wisch-links", dx < 0);
  }

  // Eingerichtet für „Heute“, die Aufgabenliste und den Einkauf (je per Delegation auf dem Container)
  ["heute-bereich", "listen-bereich", "erledigt-bereich", "einkauf-bereich"].forEach(function wischEinrichten(wurzelId) {
    const wurzel = document.getElementById(wurzelId);
    if (!wurzel) return;

    wurzel.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || wisch) return;
      const zeile = e.target.closest(".wisch-zeile[data-wisch-id]");
      if (!zeile) return;
      wisch = { zeile, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, aktiv: false, breite: zeile.offsetWidth };
    });

    wurzel.addEventListener("pointermove", (e) => {
      if (!wisch || e.pointerId !== wisch.id) return;
      const dx = e.clientX - wisch.x0;
      const dy = e.clientY - wisch.y0;
      if (!wisch.aktiv) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { wisch = null; return; } // senkrecht → Scrollen
        if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        wisch.aktiv = true;
        wisch.zeile.classList.add("wischt");
        try { wisch.zeile.setPointerCapture(e.pointerId); } catch (_e) { /* egal */ }
      }
      e.preventDefault();
      // Nach links nur, wenn die Zeile dort etwas anbietet – sonst gedämpftes Nachgeben
      let weg = dx;
      if (dx < 0 && !wisch.zeile.dataset.wischLinks) weg = Math.max(dx * 0.25, -40);
      wisch.dx = weg;
      wischSetzen(wisch.zeile, weg, false);
    });

    const ende = async (e) => {
      if (!wisch || e.pointerId !== wisch.id) return;
      const w = wisch;
      wisch = null;
      if (!w.aktiv) return;
      wischKlickSperre = Date.now() + 400;
      w.zeile.classList.remove("wischt");
      const schwelle = Math.min(120, w.breite * 0.35);
      const richtung = w.dx > 0 ? "rechts" : "links";
      const art = w.zeile.dataset.wischLinks;
      if (e.type === "pointercancel" || Math.abs(w.dx) < schwelle || (richtung === "links" && !art)) {
        wischSetzen(w.zeile, 0, true);
        return;
      }
      wischSetzen(w.zeile, richtung === "rechts" ? w.breite : -w.breite, true);
      try {
        const erg = await wischAusfuehren(w.zeile.dataset.wischTyp, w.zeile.dataset.wischId, richtung, art);
        try { localStorage.setItem("heute-wisch-tipp", "gesehen"); } catch (_e) { /* egal */ }
        await ladeDaten();
        hinweisZeigen(erg.text, erg.zurueck);
      } catch (fehler) {
        wischSetzen(w.zeile, 0, true);
        alert("Konnte nicht gespeichert werden: " + (fehler.message || "Fehler"));
      }
    };
    wurzel.addEventListener("pointerup", ende);
    wurzel.addEventListener("pointercancel", ende);

    // Nach einem Wisch keinen Klick auf Abhak-Kreis oder Zeile auslösen
    wurzel.addEventListener("click", (e) => {
      if (Date.now() < wischKlickSperre) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  });

  // Einmaliger Tipp über der Liste, bis zum ersten Wisch (oder bis er weggetippt wird)
  function heuteWischTippHtml() {
    let gesehen = false;
    try { gesehen = localStorage.getItem("heute-wisch-tipp") === "gesehen"; } catch (_e) { /* egal */ }
    if (gesehen) return "";
    return `<p class="heute-wisch-tipp">Tipp: Zeile nach rechts wischen = erledigt, nach links = verschieben.
      <button type="button" class="link-btn" onclick="heuteWischTippWeg()">Verstanden</button></p>`;
  }
  window.heuteWischTippWeg = function() {
    try { localStorage.setItem("heute-wisch-tipp", "gesehen"); } catch (_e) { /* egal */ }
    renderHeute();
  };

  // Liste „Heute“ in einer gemeinsamen Karte
  function heuteListeHtml(eintraege, jetztMinuten) {
    const offen = eintraege.filter((e) => !e.erledigt).length;
    const inhalt = eintraege.length
      ? eintraege.map((e) => heuteZeileHtml(e, jetztMinuten)).join("")
      : `<p class="heute-leer">Nichts mehr für heute – guter Tag.</p>`;
    return `
      <section class="heute-block" aria-labelledby="heute-liste-titel">
        <div class="heute-block-kopf"><h2 class="heute-label" id="heute-liste-titel">Heute</h2>${eintraege.length ? `<span class="heute-block-zahl">${offen} offen</span>` : ""}</div>
        ${eintraege.length ? heuteWischTippHtml() : ""}
        <div class="heute-liste">${inhalt}</div>
      </section>`;
  }

  // Überfällig-Streifen: aufklappbar, mit „Alle auf heute“
  function heuteUeberfaelligHtml(liste, heuteIso) {
    if (!liste.length) return "";
    const tage = tageSeitIso(liste[0].faellig_am, heuteIso);
    const seit = tage === 1 ? "seit gestern" : `ältestes seit ${tage} Tagen`;
    const zeilen = liste.map((a) => {
      const t = tageSeitIso(a.faellig_am, heuteIso);
      return heuteZeileHtml({
        id: a.id, typ: "aufgabe", zeit: formatDatumKurz(a.faellig_am), titel: a.titel, tab: "aufgaben", ueberfaellig: true,
        meta: "fällig " + (t === 1 ? "gestern" : t === 2 ? "vorgestern" : `vor ${t} Tagen`),
      }, -1);
    }).join("");
    return `
      <details class="heute-ueberfaellig" ${zlGruppenOffen.has("ueberfaellig") ? "open" : ""} ontoggle="zlGruppeUmschalten('ueberfaellig', this.open)">
        <summary class="heute-ueberfaellig-kopf">
          <span class="heute-ueberfaellig-text"><strong>${liste.length} überfällig</strong><span>${seit} · antippen zum Anzeigen</span></span>
          <button type="button" class="heute-ueberfaellig-knopf" onclick="event.preventDefault(); event.stopPropagation(); ueberfaelligAufHeute(this)">Alle auf heute</button>
        </summary>
        <div class="heute-liste">${zeilen}</div>
      </details>`;
  }

  // Verschiebt alle überfälligen Aufgaben des aktiven Bereichs auf heute (Uhrzeit, Projekt und Wiederholung bleiben)
  window.ueberfaelligAufHeute = async function(knopf) {
    const heute = heuteISO();
    const liste = aufgaben.filter((a) => bereichVon(a) === aktiverBereich && !a.erledigt && a.faellig_am && a.faellig_am < heute);
    if (!liste.length) return;
    if (knopf) { knopf.disabled = true; knopf.textContent = "Verschiebe …"; }
    let fehler = 0;
    for (const a of liste) {
      try {
        await api("aufgabe_aktualisieren", {
          id: a.id, titel: a.titel, projekt_id: a.projekt_id || null, faellig_am: heute,
          uhrzeit: a.uhrzeit || null, ende_uhrzeit: a.ende_uhrzeit || null, erinnere_alle_tage: a.erinnere_alle_tage || null,
        });
      } catch (e) {
        fehler++;
      }
    }
    await ladeDaten();
    if (fehler) alert(`${fehler} von ${liste.length} Aufgaben konnten nicht verschoben werden. Bitte nochmal versuchen.`);
  };

  // Eine Kennzahl-Kachel (Zahl + Beschriftung, Tipp öffnet den Reiter)
  function kennzahlHtml(zahl, label, onclick) {
    return `
      <button type="button" class="heute-kennzahl" onclick="${onclick}">
        <span class="heute-kennzahl-zahl">${zahl}</span>
        <span class="heute-kennzahl-label">${escapeHtml(label)}</span>
      </button>`;
  }

  // Kennzahlen: kcal übrig (Privat), Einkauf offen, aktive Ziele (Privat) – nur sichtbare Reiter
  function heuteKennzahlenHtml(einkaufOffen, aktuelleZiele) {
    const k = [];
    const kcal = ernStartKachelHtml();
    if (kcal) k.push(kcal);
    if (reiterIstSichtbar(aktiverBereich, "einkauf")) k.push(kennzahlHtml(einkaufOffen.length, "Einkauf offen", "tabWechseln('einkauf')"));
    if (aktiverBereich === "privat" && reiterIstSichtbar("privat", "planung")) {
      k.push(kennzahlHtml(aktuelleZiele.length, aktuelleZiele.length === 1 ? "aktives Ziel" : "aktive Ziele", "tabWechseln('planung')"));
    }
    return k.length ? `<div class="heute-kennzahlen">${k.join("")}</div>` : "";
  }

  // Ziel-Kacheln der laufenden Woche/Monat/Jahr mit Fortschritt (nur Privat)
  function heuteZieleHtml(aktuelleZiele) {
    if (!aktuelleZiele.length) return "";
    const TYP_LABEL = { woche: "Woche", monat: "Monat", jahr: "Jahr" };
    return `<section class="heute-block"><div class="heute-block-kopf"><h2 class="heute-label">Ziele</h2></div><div class="ziel-kachel-grid">` +
      aktuelleZiele.map((z) => {
        const schritte = zielSchritte.filter((s) => s.ziel_id === z.id);
        const erledigtCount = schritte.filter((s) => s.erledigt).length;
        return `
          <button class="ziel-kachel" onclick="zielKachelKlick('${z.id}')">
            <span class="ziel-kachel-typ">${TYP_LABEL[z.zeitraum_typ]}</span>
            <span class="ziel-kachel-titel">${escapeHtml(z.titel)}</span>
            <span class="ziel-kachel-fortschritt">${schritte.length > 0 ? erledigtCount + " / " + schritte.length + " Schritte" : "keine Schritte"}</span>
          </button>`;
      }).join("") + `</div></section>`;
  }

  // ==========================================================
  // Kalender
  // ==========================================================
  const MONATSNAMEN = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const TAGLABEL = ["Mo","Di","Mi","Do","Fr","Sa","So"];

  // Wandelt ein Datum in ein lokales ISO-Datum (YYYY-MM-DD) um
  function dateToISO(d) {
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  }

  // Liefert die Termine des aktiven Bereichs an einem Tag, nach Uhrzeit sortiert
  function termineAmTag(isoDatum) {
    return termine.filter((t) => t.datum === isoDatum && bereichVon(t) === aktiverBereich).sort((a,b) => (a.uhrzeit||"99:99").localeCompare(b.uhrzeit||"99:99"));
  }

  document.getElementById("cal-prev").addEventListener("click", () => {
    calMonat.setMonth(calMonat.getMonth() - 1);
    renderKalender();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    calMonat.setMonth(calMonat.getMonth() + 1);
    renderKalender();
  });

  // Rendert das Monatsraster des Kalenders mit Termin-Punkten, nächsten Terminen und Tagespanel
  function renderKalender() {
    document.getElementById("cal-monat-label").textContent =
      MONATSNAMEN[calMonat.getMonth()] + " " + calMonat.getFullYear();

    const jahr = calMonat.getFullYear();
    const monat = calMonat.getMonth();
    const ersterTag = new Date(jahr, monat, 1);
    const anzahlTage = new Date(jahr, monat + 1, 0).getDate();
    // Montag = 0 ... Sonntag = 6
    const startOffset = (ersterTag.getDay() + 6) % 7;
    const heuteIso = dateToISO(new Date());

    let html = TAGLABEL.map((l) => `<div class="cal-daylabel">${l}</div>`).join("");
    for (let i = 0; i < startOffset; i++) html += `<div class="cal-day empty"></div>`;

    for (let tag = 1; tag <= anzahlTage; tag++) {
      const iso = dateToISO(new Date(jahr, monat, tag));
      const anzahl = termineAmTag(iso).length;
      const classes = ["cal-day"];
      if (iso === heuteIso) classes.push("today");
      if (iso === calAusgewaehlterTag) classes.push("selected");
      html += `<div class="${classes.join(" ")}" onclick="calTagAuswaehlen('${iso}')">
        <span>${tag}</span>
        ${anzahl > 0 ? '<span class="dot"></span>' : ""}
      </div>`;
    }
    document.getElementById("cal-grid").innerHTML = html;

    renderUpcoming();
    renderCalDayPanel();
  }

  // Rendert die nächsten fünf Termine des aktiven Bereichs ab heute
  function renderUpcoming() {
    const heuteIso = dateToISO(new Date());
    const kommende = termine
      .filter((t) => t.datum >= heuteIso && bereichVon(t) === aktiverBereich)
      .sort((a,b) => (a.datum + (a.uhrzeit||"99:99")).localeCompare(b.datum + (b.uhrzeit||"99:99")))
      .slice(0, 5);

    if (kommende.length === 0) {
      document.getElementById("upcoming-bereich").innerHTML = "";
      return;
    }
    const html = kommende.map((t) => `
      <div class="upcoming-item">
        <span class="upcoming-datum">${formatDatumKurz(t.datum)}${t.uhrzeit ? " · " + t.uhrzeit.slice(0,5) + (t.ende_uhrzeit ? "–" + t.ende_uhrzeit.slice(0,5) : "") : ""}</span>
        <span>${escapeHtml(t.titel)}</span>
      </div>`).join("");
    document.getElementById("upcoming-bereich").innerHTML =
      `<div class="project-heading">Nächste Termine</div><div class="upcoming-list">${html}</div>`;
  }

  // Ganze Kalendertage zwischen zwei ISO-Daten (YYYY-MM-DD), bis - von
  function tageSeitIso(vonIso, bisIso) {
    const [vj, vm, vt] = vonIso.split("-").map(Number);
    const [bj, bm, bt] = bisIso.split("-").map(Number);
    return Math.round((Date.UTC(bj, bm - 1, bt) - Date.UTC(vj, vm - 1, vt)) / 86400000);
  }

  // Liefert das Label für einen Zeitleisten-Tag (Gestern, Vorgestern oder Wochentag + Datum)
  function zlTagLabel(iso, heuteIso) {
    const tage = tageSeitIso(iso, heuteIso);
    if (tage === 1) return "Gestern";
    if (tage === 2) return "Vorgestern";
    const [j, m, t] = iso.split("-").map(Number);
    const wt = new Date(j, m - 1, t).toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
    return wt + ", " + formatDatumKurz(iso);
  }

  // Merkt, ob eine Tagesgruppe der Zeitleiste auf- oder zugeklappt ist
  window.zlGruppeUmschalten = function(key, offen) {
    if (offen) zlGruppenOffen.add(key); else zlGruppenOffen.delete(key);
  };

  // Formatiert ein ISO-Datum kurz als TT.MM.
  function formatDatumKurz(iso) {
    const [j,m,t] = iso.split("-");
    return t + "." + m + ".";
  }

  // Wählt einen Kalendertag aus bzw. hebt die Auswahl wieder auf
  window.calTagAuswaehlen = function(iso) {
    calAusgewaehlterTag = (calAusgewaehlterTag === iso) ? null : iso;
    renderKalender();
  };

  // Rendert das Tagespanel mit Terminen und Formular zum Anlegen oder Bearbeiten
  let terminErkennung = null; // Erkennung im Tagespanel (seit Session 35, neu je Darstellung)

  function renderCalDayPanel() {
    const panel = document.getElementById("cal-day-panel");
    if (!calAusgewaehlterTag) { panel.innerHTML = ""; return; }

    const liste = termineAmTag(calAusgewaehlterTag);
    const [j,m,t] = calAusgewaehlterTag.split("-");
    const titel = `${t}. ${MONATSNAMEN[parseInt(m,10)-1]} ${j}`;

    const itemsHtml = liste.length === 0
      ? `<p class="empty-text" style="margin:0 0 0.6rem;">Noch keine Termine an diesem Tag.</p>`
      : liste.map((t) => `
          <div class="termin-item">
            <span class="termin-zeit">${t.uhrzeit ? t.uhrzeit.slice(0,5) + (t.ende_uhrzeit ? "–" + t.ende_uhrzeit.slice(0,5) : "") : ""}</span>
            <span class="termin-titel">${escapeHtml(t.titel)}${t.notiz ? `<span class="termin-notiz">${escapeHtml(t.notiz)}</span>` : ""}</span>
            <button class="task-snooze" onclick="terminBearbeitenStart('${t.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>
            <button class="task-delete" onclick="terminLoeschen('${t.id}')" aria-label="Löschen">${ic("x")}</button>
          </div>`).join("");

    // Das Formular dient nur noch zum Anlegen – Bearbeiten läuft seit
    // Session 35 über das Blatt (terminBearbeitenStart → eintragBearbeiten)
    panel.innerHTML = `
      <div class="cal-day-panel">
        <h3>${titel}</h3>
        ${itemsHtml}
        <div class="termin-form">
          <input type="text" id="termin-titel" placeholder="Titel, z. B. „Elternabend 19 Uhr“">
          <div class="schnell-erkannt form-erkannt hidden" id="termin-erkannt" role="status" aria-live="polite"></div>
          <input type="time" id="termin-uhrzeit" style="width:8rem;" title="Beginn (optional)">
          <input type="time" id="termin-ende" style="width:8rem;" title="Ende (optional)">
          <input type="text" id="termin-notiz" placeholder="Notiz (optional)">
          <button class="btn-primary" id="btn-termin-hinzufuegen">Eintragen</button>
        </div>
      </div>`;
    terminErkennung = formErkennung({
      text: "termin-titel", datum: null, uhrzeit: "termin-uhrzeit", ende: "termin-ende", hinweis: "termin-erkannt",
      festerTag: () => calAusgewaehlterTag,
    });

    document.getElementById("btn-termin-hinzufuegen").addEventListener("click", terminHinzufuegen);
    document.getElementById("termin-titel").addEventListener("keydown", (e) => {
      if (e.key === "Enter") terminHinzufuegen();
    });
  }


  // Bearbeiten eines Termins: seit Session 35 im Blatt (eintragBearbeiten)
  window.terminBearbeitenStart = function(id) {
    window.eintragBearbeiten("termin", id);
  };

  // Legt einen Termin am ausgewählten Tag im aktiven Bereich an und lädt neu
  async function terminHinzufuegen() {
    const eingabe = document.getElementById("termin-titel").value.trim();
    if (!eingabe || !calAusgewaehlterTag) return;
    const titel = terminErkennung ? terminErkennung.titel(eingabe) : eingabe;
    // Erkanntes Datum im Text („… am 12.10.“) geht vor dem angetippten Tag
    const datum = (terminErkennung && terminErkennung.erkanntesDatum()) || calAusgewaehlterTag;
    const uhrzeit = document.getElementById("termin-uhrzeit").value || null;
    const ende_uhrzeit = document.getElementById("termin-ende").value || null;
    const notiz = document.getElementById("termin-notiz").value.trim() || null;

    await api("termin_hinzufuegen", { titel, datum, uhrzeit, ende_uhrzeit, notiz, bereich: aktiverBereich });
    // Anderer Tag erkannt: dorthin springen, damit der neue Termin sichtbar ist
    if (datum !== calAusgewaehlterTag) {
      calAusgewaehlterTag = datum;
      const [j, m] = datum.split("-").map(Number);
      calMonat = new Date(j, m - 1, 1);
    }
    await ladeDaten();
    renderKalender();
  }

  // Löscht einen Termin und lädt die Daten neu
  window.terminLoeschen = async function(id) {
    await api("termin_loeschen", { id });
    await ladeDaten();
    renderKalender();
  };

  // ==========================================================
  // Blockzeiten ("nicht stören" – wiederkehrend oder einmalig)
  // ==========================================================
  document.getElementById("toggle-blockzeit-form").addEventListener("click", (e) => {
    const form = document.getElementById("blockzeit-form");
    form.classList.toggle("hidden");
    e.target.textContent = (form.classList.contains("hidden") ? "▸" : "▾") + " Neue Blockzeit anlegen";
  });

  document.querySelectorAll('input[name="blockzeit-art"]').forEach((radio) => {
    radio.addEventListener("change", blockzeitArtUmschalten);
  });

  // Blendet je nach Blockzeit-Art Wochentage oder Datum im Formular ein
  function blockzeitArtUmschalten() {
    const wiederkehrend = document.getElementById("blockzeit-art-wiederkehrend").checked;
    document.getElementById("blockzeit-wochentage-row").classList.toggle("hidden", !wiederkehrend);
    document.getElementById("blockzeit-datum-row").classList.toggle("hidden", wiederkehrend);
  }

  // Erzeugt die Wochentag-Checkboxen für wiederkehrende Blockzeiten
  function renderBlockzeitWochentage() {
    const row = document.getElementById("blockzeit-wochentage-row");
    row.innerHTML = TAGLABEL.map((label, i) => `
      <label style="display:flex; align-items:center; gap:0.25rem; font-size:0.82rem;">
        <input type="checkbox" class="blockzeit-wochentag-cb" value="${i}"> ${label}
      </label>`).join("");
  }
  renderBlockzeitWochentage();

  document.getElementById("btn-blockzeit-anlegen").addEventListener("click", blockzeitSpeichern);

  // Setzt das Blockzeit-Formular nach dem Anlegen zurück
  function blockzeitFormZuruecksetzen() {
    document.getElementById("blockzeit-titel").value = "";
    document.getElementById("blockzeit-start").value = "";
    document.getElementById("blockzeit-ende").value = "";
    document.getElementById("blockzeit-notiz").value = "";
    document.getElementById("blockzeit-datum").value = "";
    document.getElementById("blockzeit-art-wiederkehrend").checked = true;
    document.querySelectorAll(".blockzeit-wochentag-cb").forEach((cb) => { cb.checked = false; });
    blockzeitArtUmschalten();
  }

  // Bearbeiten einer Blockzeit: seit Session 35 im Bearbeiten-Blatt
  window.blockzeitBearbeitenStart = function(id) {
    window.blattOeffnen("blockzeit", id);
  };

  // Prüft Eingaben und legt eine neue Blockzeit an (wiederkehrend oder einmalig)
  async function blockzeitSpeichern() {
    const titel = document.getElementById("blockzeit-titel").value.trim();
    const start_zeit = document.getElementById("blockzeit-start").value;
    const end_zeit = document.getElementById("blockzeit-ende").value;
    if (!titel || !start_zeit || !end_zeit) return;

    const wiederkehrend = document.getElementById("blockzeit-art-wiederkehrend").checked;
    let wochentage = null;
    let datum = null;
    if (wiederkehrend) {
      wochentage = Array.from(document.querySelectorAll(".blockzeit-wochentag-cb:checked")).map((cb) => parseInt(cb.value, 10));
      if (wochentage.length === 0) { alert("Bitte mindestens einen Wochentag auswählen."); return; }
    } else {
      datum = document.getElementById("blockzeit-datum").value;
      if (!datum) { alert("Bitte ein Datum auswählen."); return; }
    }
    const notiz = document.getElementById("blockzeit-notiz").value.trim() || null;

    await api("blockzeit_hinzufuegen", { titel, start_zeit, end_zeit, wochentage, datum, notiz });
    blockzeitFormZuruecksetzen();
    await ladeDaten();
  }

  // Löscht eine Blockzeit und lädt die Daten neu
  window.blockzeitLoeschen = async function(id) {
    await api("blockzeit_loeschen", { id });
    await ladeDaten();
  };

  // Liefert den Wiederholungstext einer Blockzeit: einmaliges Datum oder sortierte Wochentage
  function blockzeitWiederholungText(b) {
    if (b.datum) return "einmalig · " + formatDatumKurz(b.datum);
    if (b.wochentage && b.wochentage.length > 0) {
      const sortiert = [...b.wochentage].sort((x, y) => x - y);
      return sortiert.map((i) => TAGLABEL[i]).join(", ");
    }
    return "";
  }

  // Rendert die Liste der Blockzeiten, sortiert nach Startzeit
  function renderBlockzeiten() {
    const bereich = document.getElementById("blockzeiten-liste");
    if (blockzeiten.length === 0) {
      bereich.innerHTML = '<p class="empty-text">Noch keine Blockzeiten.</p>';
      return;
    }
    const sortiert = [...blockzeiten].sort((a, b) => (a.start_zeit || "").localeCompare(b.start_zeit || ""));
    bereich.innerHTML = sortiert.map((b) => `
      <div class="termin-item">
        <span class="termin-zeit">${b.start_zeit ? b.start_zeit.slice(0,5) : ""}${b.end_zeit ? "–" + b.end_zeit.slice(0,5) : ""}</span>
        <span class="termin-titel">${escapeHtml(b.titel)}<span class="termin-notiz">${blockzeitWiederholungText(b)}${b.notiz ? " · " + escapeHtml(b.notiz) : ""}</span></span>
        <button class="task-snooze" onclick="blockzeitBearbeitenStart('${b.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>
        <button class="task-delete" onclick="blockzeitLoeschen('${b.id}')" aria-label="Löschen">${ic("x")}</button>
      </div>`).join("");
  }

  // ==========================================================
  // Frei – Zeitleiste mit Lücken-Berechnung
  //
  // Was blockiert Zeit:
  // - Termine MIT Uhrzeit (ganztägige Termine ohne Uhrzeit nicht)
  // - offene Aufgaben MIT Uhrzeit (erledigte nicht)
  // - Blockzeiten (wiederkehrend oder einmalig)
  // Fehlt bei einem Termin/einer Aufgabe die Endzeit, werden
  // pauschal 30 Minuten ab Beginn blockiert.
  // Ist für einen Wochentag noch kein Zeitrahmen gespeichert,
  // wird 08:00–20:00 als Vorschlag angezeigt (erst gültig, wenn
  // du auf "Speichern" tippst).
  // ==========================================================
  const WOCHENTAGSNAMEN = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
  let freiTag = new Date();
  let freiAusgewaehlteLuecke = null;
  let freiFormularTyp = "termin";

  // Wandelt JS-Wochentag in Index mit Montag=0 bis Sonntag=6 um
  function wochentagIndex(d) {
    return (d.getDay() + 6) % 7; // 0=Mo … 6=So
  }
  // Rechnet eine Uhrzeit "HH:MM" in Minuten seit Mitternacht um
  function zeitZuMinuten(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  // Rechnet Minuten seit Mitternacht in eine Uhrzeit "HH:MM" um
  function minutenZuZeit(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  document.getElementById("frei-prev").addEventListener("click", () => {
    freiTag.setDate(freiTag.getDate() - 1);
    freiFormularSchliessen();
    renderFrei();
  });
  document.getElementById("frei-next").addEventListener("click", () => {
    freiTag.setDate(freiTag.getDate() + 1);
    freiFormularSchliessen();
    renderFrei();
  });
  document.getElementById("btn-frei-rahmen-speichern").addEventListener("click", freiRahmenSpeichern);

  // Liefert den gespeicherten Zeitrahmen des Wochentags, sonst Vorschlag 08:00–20:00
  function freiRahmenFuerWochentag(wtIndex) {
    const eintrag = tagesrahmen.find((r) => r.wochentag === wtIndex);
    if (eintrag) {
      return { start_zeit: eintrag.start_zeit.slice(0,5), end_zeit: eintrag.end_zeit.slice(0,5), aktiv: eintrag.aktiv };
    }
    return { start_zeit: "08:00", end_zeit: "20:00", aktiv: true }; // Vorschlag, noch nicht gespeichert
  }

  // Speichert den Zeitrahmen für den Wochentag des angezeigten Tages
  async function freiRahmenSpeichern() {
    const wochentag = wochentagIndex(freiTag);
    const start_zeit = document.getElementById("frei-rahmen-start").value;
    const end_zeit = document.getElementById("frei-rahmen-ende").value;
    const aktiv = document.getElementById("frei-rahmen-aktiv").checked;
    if (!start_zeit || !end_zeit) return;
    await api("tagesrahmen_speichern", { wochentag, start_zeit, end_zeit, aktiv });
    await ladeDaten();
    renderFrei();
  }

  // Sammelt belegte Blöcke eines Tages aus Terminen, Aufgaben mit Uhrzeit und Blockzeiten
  function freiBusyBloecke(tagIso, wtIndex) {
    const bloecke = [];

    termine.filter((t) => t.datum === tagIso && t.uhrzeit).forEach((t) => {
      const start = t.uhrzeit.slice(0,5);
      const ende = t.ende_uhrzeit ? t.ende_uhrzeit.slice(0,5) : minutenZuZeit(zeitZuMinuten(start) + 30);
      bloecke.push({ start, ende, titel: t.titel, typ: "Termin", id: t.id, erledigt: !!t.erledigt });
    });

    aufgaben.filter((a) => a.faellig_am === tagIso && a.uhrzeit).forEach((a) => {
      const start = a.uhrzeit.slice(0,5);
      const ende = a.ende_uhrzeit ? a.ende_uhrzeit.slice(0,5) : minutenZuZeit(zeitZuMinuten(start) + 30);
      bloecke.push({ start, ende, titel: a.titel, typ: "Aufgabe", id: a.id, erledigt: !!a.erledigt });
    });

    blockzeiten.forEach((b) => {
      const trifftZu = (b.datum && b.datum === tagIso) || (!b.datum && b.wochentage && b.wochentage.includes(wtIndex));
      if (trifftZu) {
        bloecke.push({ start: b.start_zeit.slice(0,5), ende: b.end_zeit.slice(0,5), titel: b.titel, typ: "Blockzeit", erledigt: false });
      }
    });

    return bloecke.sort((a, b) => zeitZuMinuten(a.start) - zeitZuMinuten(b.start));
  }

  // Berechnet freie Lücken im Zeitrahmen, indem überlappende Blöcke verschmolzen werden
  function freiLueckenBerechnen(rahmenStart, rahmenEnde, bloecke) {
    const rStart = zeitZuMinuten(rahmenStart);
    const rEnde = zeitZuMinuten(rahmenEnde);
    if (rEnde <= rStart) return [];

    const intervalle = bloecke
      .map((b) => [Math.max(rStart, zeitZuMinuten(b.start)), Math.min(rEnde, zeitZuMinuten(b.ende))])
      .filter(([s, e]) => e > s)
      .sort((a, b) => a[0] - b[0]);

    const verschmolzen = [];
    for (const [s, e] of intervalle) {
      if (verschmolzen.length > 0 && s <= verschmolzen[verschmolzen.length - 1][1]) {
        verschmolzen[verschmolzen.length - 1][1] = Math.max(verschmolzen[verschmolzen.length - 1][1], e);
      } else {
        verschmolzen.push([s, e]);
      }
    }

    const luecken = [];
    let cursor = rStart;
    for (const [s, e] of verschmolzen) {
      if (s > cursor) luecken.push([cursor, s]);
      cursor = Math.max(cursor, e);
    }
    if (cursor < rEnde) luecken.push([cursor, rEnde]);

    return luecken.map(([s, e]) => ({ start: minutenZuZeit(s), ende: minutenZuZeit(e) }));
  }

  // Liefert die belegten Blöcke + Lücken eines Tages chronologisch gemischt,
  // oder null, wenn für diesen Wochentag kein Zeitrahmen aktiv ist.
  function freiTagEintraege(tagIso, wtIndex) {
    const rahmen = freiRahmenFuerWochentag(wtIndex);
    if (!rahmen.aktiv) return null;
    const bloecke = freiBusyBloecke(tagIso, wtIndex);
    // Erledigt = nur abgehakt, blockiert aber weiterhin die Zeit (keine zusätzliche Lücke).
    const luecken = freiLueckenBerechnen(rahmen.start_zeit, rahmen.end_zeit, bloecke);
    return [
      ...bloecke.map((b) => ({ ...b, art: b.erledigt ? "erledigt" : "belegt" })),
      ...luecken.map((l) => ({ start: l.start, ende: l.ende, art: "frei" })),
    ].sort((a, b) => zeitZuMinuten(a.start) - zeitZuMinuten(b.start));
  }

  // Rendert die Frei-Zeitleiste des gewählten Tages mit belegten Blöcken und freien Lücken
  function renderFrei() {
    const iso = dateToISO(freiTag);
    const wtIndex = wochentagIndex(freiTag);

    document.getElementById("frei-tag-label").textContent = WOCHENTAGSNAMEN[wtIndex] + ", " + formatDatumLang(iso);

    const rahmen = freiRahmenFuerWochentag(wtIndex);
    document.getElementById("frei-rahmen-aktiv").checked = rahmen.aktiv;
    document.getElementById("frei-rahmen-start").value = rahmen.start_zeit;
    document.getElementById("frei-rahmen-ende").value = rahmen.end_zeit;

    const timelineEl = document.getElementById("frei-timeline");
    const eintraege = freiTagEintraege(iso, wtIndex);

    if (!eintraege) {
      timelineEl.innerHTML = `<p class="empty-text">Für diesen Wochentag ist kein Zeitrahmen aktiv – einschalten über ${ic("zahnrad")} oben.</p>`;
      freiFormularSchliessen();
      return;
    }

    if (eintraege.length === 0) {
      timelineEl.innerHTML = `<p class="empty-text">Kein Zeitrahmen für diesen Tag eingestellt – über ${ic("zahnrad")} oben festlegen.</p>`;
      return;
    }

    timelineEl.innerHTML = eintraege.map((e) => {
      if (e.art === "frei") {
        return `
          <div class="frei-item frei-luecke" onclick="freiLueckeAuswaehlen('${e.start}','${e.ende}')">
            <span class="frei-zeit">${e.start}–${e.ende}</span>
            <span class="frei-label">frei</span>
            <span class="frei-plus">+</span>
          </div>`;
      }
      const istErledigt = e.art === "erledigt";
      const checkboxHtml = e.typ === "Termin"
        ? `<button class="task-check ${istErledigt ? "done" : ""}" onclick="freiTerminUmschalten('${e.id}')" title="Erledigt">${istErledigt ? "✓" : ""}</button>`
        : e.typ === "Aufgabe"
        ? `<button class="task-check ${istErledigt ? "done" : ""}" onclick="freiAufgabeUmschalten('${e.id}')" title="Erledigt">${istErledigt ? "✓" : ""}</button>`
        : `<span style="width:1.4rem; flex-shrink:0;"></span>`;
      return `
        <div class="frei-item frei-belegt${istErledigt ? " frei-erledigt" : ""}">
          ${checkboxHtml}
          <span class="frei-zeit">${e.start}–${e.ende}</span>
          <span class="frei-label">${escapeHtml(e.titel)}<span class="frei-typ">${e.typ}</span></span>
          ${e.typ === "Termin" ? `<button class="task-snooze" onclick="freiTerminBearbeitenStart('${e.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>` : ""}
          ${e.typ === "Termin" ? `<button class="task-delete" onclick="freiTerminEntfernen('${e.id}')" title="Entfernen" aria-label="Entfernen">${ic("x")}</button>` : ""}
          ${e.typ === "Aufgabe" ? `<button class="task-snooze" onclick="freiAufgabeBearbeitenStart('${e.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>` : ""}
          ${e.typ === "Aufgabe" ? `<button class="task-delete" onclick="freiAufgabeEntfernen('${e.id}')" title="Entfernen" aria-label="Entfernen">${ic("x")}</button>` : ""}
        </div>`;
    }).join("");
  }

  // Abhaken direkt in der Zeitleiste auf dem Start-Screen. Nutzt dieselben
  // Backend-Aktionen wie Aufgaben bzw. Kalender – erledigte Aufgaben
  // verschwinden danach aus der Zeitleiste (unter Aufgaben → Erledigt),
  // Termine bleiben durchgestrichen stehen und lassen sich zurücknehmen.
  window.zeitleisteUmschalten = async function(typ, id, knopf) {
    if (knopf) {
      if (knopf.disabled) return;
      knopf.disabled = true;
      knopf.classList.toggle("done");
    }
    try {
      await api(typ === "termin" ? "termin_umschalten" : "aufgabe_umschalten", { id });
      await ladeDaten();
    } catch (fehler) {
      if (knopf) {
        knopf.disabled = false;
        knopf.classList.toggle("done");
        }
      alert("Konnte nicht gespeichert werden. Bitte nochmal versuchen.");
    }
  };

  // Schaltet einen Termin in der Frei-Ansicht erledigt/offen und zeichnet neu
  window.freiTerminUmschalten = async function(id) {
    await api("termin_umschalten", { id });
    await ladeDaten();
    renderFrei();
  };

  // Schaltet eine Aufgabe in der Frei-Ansicht erledigt/offen und zeichnet neu
  window.freiAufgabeUmschalten = async function(id) {
    await api("aufgabe_umschalten", { id });
    await ladeDaten();
    renderFrei();
  };

  // Löscht einen Termin aus der Frei-Ansicht und schließt ggf. dessen Formular
  window.freiTerminEntfernen = async function(id) {
    await api("termin_loeschen", { id });
    await ladeDaten();
    renderFrei();
  };

  // Löscht eine Aufgabe aus der Frei-Ansicht und zeichnet neu
  window.freiAufgabeEntfernen = async function(id) {
    await api("aufgabe_loeschen", { id });
    await ladeDaten();
    renderFrei();
  };

  // Wählt eine freie Lücke aus und öffnet das Formular zum Eintragen
  window.freiLueckeAuswaehlen = function(start, ende) {
    freiAusgewaehlteLuecke = { start, ende };
    freiFormularTyp = "termin";
    renderFreiFormular();
    document.getElementById("frei-formular-bereich").scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Schließt das Formular der Frei-Ansicht und setzt Auswahl/Bearbeitung zurück
  function freiFormularSchliessen() {
    freiAusgewaehlteLuecke = null;
    document.getElementById("frei-formular-bereich").innerHTML = "";
  }

  // Bearbeiten in Frei: seit Session 35 im Blatt (eintragBearbeiten) – vorher
  // eigene Formulare, die u. a. die Wiederholung einer Aufgabe verloren
  window.freiTerminBearbeitenStart = function(id) { window.eintragBearbeiten("termin", id); };
  window.freiAufgabeBearbeitenStart = function(id) { window.eintragBearbeiten("aufgabe", id); };

  // Rendert das Formular zum Eintragen eines Termins oder einer Aufgabe in eine freie Lücke
  function renderFreiFormular() {
    const bereich = document.getElementById("frei-formular-bereich");
    if (!freiAusgewaehlteLuecke) { bereich.innerHTML = ""; return; }

    const { start, ende } = freiAusgewaehlteLuecke;
    const projektOptions = '<option value="">Ohne Projekt</option>' +
      projekteAktuell().map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

    bereich.innerHTML = `
      <div class="cal-day-panel">
        <div class="project-heading" style="margin:0 0 0.6rem;">${start}–${ende} eintragen</div>
        <div class="row" style="align-items:center;">
          <label style="display:flex; align-items:center; gap:0.3rem; font-size:0.85rem;">
            <input type="radio" name="frei-typ" id="frei-typ-termin" ${freiFormularTyp === "termin" ? "checked" : ""}> Termin
          </label>
          <label style="display:flex; align-items:center; gap:0.3rem; font-size:0.85rem;">
            <input type="radio" name="frei-typ" id="frei-typ-aufgabe" ${freiFormularTyp === "aufgabe" ? "checked" : ""}> Aufgabe
          </label>
        </div>
        <div class="row">
          <input type="text" id="frei-titel" placeholder="Titel">
          <input type="time" id="frei-start" style="width:8rem;" value="${start}">
          <input type="time" id="frei-ende" style="width:8rem;" value="${ende}">
        </div>
        ${freiFormularTyp === "aufgabe" ? `<div class="row"><select id="frei-projekt">${projektOptions}</select></div>` : ""}
        <div class="row">
          <button class="btn-primary" id="btn-frei-eintragen">Eintragen</button>
          <button class="btn-secondary" id="btn-frei-abbrechen">Abbrechen</button>
        </div>
      </div>`;

    document.getElementById("frei-typ-termin").addEventListener("change", () => { freiFormularTyp = "termin"; renderFreiFormular(); });
    document.getElementById("frei-typ-aufgabe").addEventListener("change", () => { freiFormularTyp = "aufgabe"; renderFreiFormular(); });
    document.getElementById("btn-frei-eintragen").addEventListener("click", freiEintragen);
    document.getElementById("btn-frei-abbrechen").addEventListener("click", freiFormularSchliessen);
  }

  // Legt in der gewählten Lücke einen Termin oder eine Aufgabe (Bereich privat) an
  async function freiEintragen() {
    const titel = document.getElementById("frei-titel").value.trim();
    if (!titel) return;
    const iso = dateToISO(freiTag);
    const start = document.getElementById("frei-start").value || freiAusgewaehlteLuecke.start;
    const ende = document.getElementById("frei-ende").value || null;

    if (freiFormularTyp === "termin") {
      await api("termin_hinzufuegen", { titel, datum: iso, uhrzeit: start, ende_uhrzeit: ende, notiz: null, kein_google_push: true, bereich: "privat" });
    } else {
      const projekt_id = document.getElementById("frei-projekt").value || null;
      await api("aufgabe_hinzufuegen", { titel, projekt_id, faellig_am: iso, uhrzeit: start, ende_uhrzeit: ende, erinnere_alle_tage: null, bereich: "privat" });
    }
    freiFormularSchliessen();
    await ladeDaten();
    renderFrei();
  }

  // ==========================================================
  // Notizen
  // ==========================================================
  function renderNotizen() {
    const select = document.getElementById("notiz-projekt");
    select.innerHTML = '<option value="">Ohne Projekt</option>' +
      projekteAktuell().map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

    const bereich = document.getElementById("notizen-bereich");
    const notizenBereich = notizen.filter((n) => bereichVon(n) === aktiverBereich);
    if (notizenBereich.length === 0) {
      bereich.innerHTML = '<p class="empty-text">Noch keine Notizen.</p>';
      return;
    }
    const html = notizenBereich.map((n) => {
      const projekt = projekteAktuell().find((p) => p.id === n.projekt_id);
      const datum = new Date(n.erstellt_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      return `
        <div class="notiz-item">
          <div style="flex:1;">
            <span class="notiz-text">${escapeHtml(n.text)}</span>
            <span class="notiz-meta">${datum}${projekt ? " · " + escapeHtml(projekt.name) : ""}</span>
          </div>
          <button class="task-edit-btn" onclick="blattOeffnen('notiz','${n.id}')" aria-label="Notiz bearbeiten" title="Bearbeiten">${ic("stift")}</button>
          <button class="task-delete" onclick="notizLoeschen('${n.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>`;
    }).join("");
    bereich.innerHTML = `<div class="notiz-list">${html}</div>`;
  }

  document.getElementById("btn-notiz-hinzufuegen").addEventListener("click", notizHinzufuegen);
  document.getElementById("neue-notiz").addEventListener("keydown", (e) => {
    if (e.key === "Enter") notizHinzufuegen();
  });

  // Legt eine neue Notiz im aktiven Bereich an, optional mit Projekt
  async function notizHinzufuegen() {
    const text = document.getElementById("neue-notiz").value.trim();
    if (!text) return;
    const projekt_id = document.getElementById("notiz-projekt").value || null;
    await api("notiz_hinzufuegen", { text, projekt_id, bereich: aktiverBereich });
    document.getElementById("neue-notiz").value = "";
    await ladeDaten();
  }

  // Löscht eine Notiz und lädt die Daten neu
  window.notizLoeschen = async function(id) {
    await api("notiz_loeschen", { id });
    await ladeDaten();
  };

  // ==========================================================
  // OGS Rapunzel – Ideen-Sammlung
  // ==========================================================
  const OGS_IDEE_STATUS_LABEL = { offen: "Offen", in_arbeit: "In Arbeit", umgesetzt: "Umgesetzt", verworfen: "Verworfen" };

  function renderOgsIdeen() {
    const bereich = document.getElementById("ogs-ideen-bereich");
    if (!bereich) return;
    const ideenBereich = ogsIdeen.filter((i) => bereichVon(i) === aktiverBereich);
    if (ideenBereich.length === 0) {
      bereich.innerHTML = '<p class="empty-text">Noch keine Ideen gesammelt.</p>';
      return;
    }
    const html = ideenBereich.map((i) => {
      const datum = new Date(i.erstellt_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      const statusOptions = Object.entries(OGS_IDEE_STATUS_LABEL)
        .map(([k, l]) => `<option value="${k}" ${k === i.status ? "selected" : ""}>${l}</option>`).join("");
      return `
        <div class="notiz-item">
          <div style="flex:1;">
            <span class="notiz-text">${escapeHtml(i.titel)}</span>
            ${i.beschreibung ? `<div class="notiz-meta" style="margin-top:0.2rem;">${escapeHtml(i.beschreibung)}</div>` : ""}
            <div class="notiz-meta" style="margin-top:0.4rem; display:flex; align-items:center; gap:0.4rem;">
              <span>${datum}</span>
              <select onchange="ogsIdeeStatusAendern('${i.id}', this.value)" style="padding:0.2rem 0.4rem; font-size:0.78rem;">${statusOptions}</select>
            </div>
          </div>
          <button class="task-edit-btn" onclick="blattOeffnen('idee','${i.id}')" aria-label="Idee bearbeiten" title="Bearbeiten">${ic("stift")}</button>
          <button class="task-delete" onclick="ogsIdeeLoeschen('${i.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>`;
    }).join("");
    bereich.innerHTML = `<div class="notiz-list">${html}</div>`;
  }

  document.getElementById("btn-ogs-idee-hinzufuegen").addEventListener("click", ogsIdeeHinzufuegen);
  document.getElementById("neue-ogs-idee").addEventListener("keydown", (e) => {
    if (e.key === "Enter") ogsIdeeHinzufuegen();
  });

  // Legt eine neue OGS-Idee mit optionaler Beschreibung im aktiven Bereich an
  async function ogsIdeeHinzufuegen() {
    const titel = document.getElementById("neue-ogs-idee").value.trim();
    if (!titel) return;
    const beschreibung = document.getElementById("neue-ogs-idee-beschreibung").value.trim() || null;
    await api("ogs_idee_hinzufuegen", { titel, beschreibung, bereich: aktiverBereich });
    document.getElementById("neue-ogs-idee").value = "";
    document.getElementById("neue-ogs-idee-beschreibung").value = "";
    await ladeDaten();
  }

  // Ändert den Status einer OGS-Idee
  window.ogsIdeeStatusAendern = async function(id, status) {
    const idee = ogsIdeen.find((i) => i.id === id);
    if (!idee) return;
    await api("ogs_idee_aktualisieren", { id, titel: idee.titel, beschreibung: idee.beschreibung, status });
    await ladeDaten();
  };

  // Löscht eine OGS-Idee und lädt die Daten neu
  window.ogsIdeeLoeschen = async function(id) {
    await api("ogs_idee_loeschen", { id });
    await ladeDaten();
  };


  // ==========================================================
  // Rezepte (Etappe 1: Sammlung mit Suche, Kategorie-Filter,
  // Favoriten, Detailansicht, Anlegen/Bearbeiten/Löschen)
  // Zutaten = freier Text, eine Zeile pro Zutat. Eine Zeile, die auf
  // ":" endet (z.B. "Für den Teig:"), wird als Zwischenüberschrift gezeigt.
  // ==========================================================
  const REZEPT_KATEGORIE_VORSCHLAEGE = ["Frühstück", "Hauptgericht", "Suppe", "Salat", "Beilage", "Snack", "Dessert", "Backen", "Getränk"];
  let rezeptSuche = "";
  let rezeptKategorie = "alle";
  let rezeptOffenId = null;   // aufgeklappte Detailansicht
  let rezeptFormId = null;    // null = Formular zu, "neu" = neues Rezept, sonst id
  // Etappe 2
  let rezeptSortierung = localStorage.getItem("rezept-sortierung") || "favorit"; // favorit | lange | zuletzt
  const rezeptPortionenAnzeige = {}; // id -> gerade angezeigte Portionenzahl (Umrechnung)
  let rezeptEinkaufId = null;        // Rezept, bei dem gerade Zutaten ausgewählt werden
  let rezeptEinkaufAuswahl = new Set(); // Zeilen-Indizes der ausgewählten Zutaten
  const rezeptGekochtVorher = {};    // id -> Datum vor "Heute gekocht" (zum Zurücknehmen)
  // Etappe 3
  const rezeptBildUrls = {};         // id -> { url, ablauf } (signierte URL, 60 Min. gültig)
  const rezeptBildLaedt = new Set(); // ids, deren URL gerade abgerufen wird
  let rezeptFotoNeu = null;          // { base64, typ, vorschau } – im Formular gewähltes, verkleinertes Foto
  let rezeptFotoEntfernen = false;   // im Formular "Foto entfernen" gewählt
  let kochmodus = null;              // { id, zutatenErledigt:Set, schritteErledigt:Set, wakeLock, wach }
  let rezeptVorlage = null;          // per Link importierte Daten, füllen das Formular "neu" vor

  // Liefert Text, wann ein Rezept zuletzt gekocht wurde (heute, gestern, vor X Tagen)
  function rezeptGekochtText(iso) {
    if (!iso) return "noch nie gekocht";
    const tage = tageSeitIso(iso, heuteISO());
    if (tage <= 0) return "heute gekocht";
    if (tage === 1) return "gestern gekocht";
    return `vor ${tage} Tagen gekocht`;
  }

  // ---- Portionsrechner: Menge am Zeilenanfang erkennen und umrechnen ----
  const BRUCH_ZEICHEN = { "½": 1 / 2, "¼": 1 / 4, "¾": 3 / 4, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 1 / 8 };
  const MENGE_MUSTER = [
    // Reihenfolge wichtig: spezifischere Formen zuerst
    [/^(\d+)\s+(\d+)\/(\d+)/, (m) => Number(m[1]) + Number(m[2]) / Number(m[3])],   // 1 1/2
    [/^(\d+)\/(\d+)/, (m) => Number(m[1]) / Number(m[2])],                          // 1/2
    [/^(\d*)\s?([½¼¾⅓⅔⅛])/, (m) => (m[1] ? Number(m[1]) : 0) + BRUCH_ZEICHEN[m[2]]], // 1½, ½
    [/^(\d{1,3}(?:\.\d{3})+)(?![\d,])/, (m) => Number(m[1].replace(/\./g, ""))],   // 1.000 (Tausenderpunkt)
    [/^(\d+(?:[.,]\d+)?)/, (m) => Number(m[1].replace(",", "."))],                   // 200, 1,5, 1.5
  ];

  // Liest die Menge am Zeilenanfang (Zahl, Bruch, Tausenderpunkt) und deren Textlänge
  function mengeLesen(text) {
    for (const [muster, wert] of MENGE_MUSTER) {
      const m = text.match(muster);
      if (m) {
        const zahl = wert(m);
        if (Number.isFinite(zahl) && zahl > 0) return { zahl, laenge: m[0].length };
      }
    }
    return null;
  }

  // Formatiert eine Menge gerundet im deutschen Zahlenformat
  function mengeFormatieren(zahl) {
    const gerundet = zahl >= 10 ? Math.round(zahl) : Math.max(0.1, Math.round(zahl * 10) / 10);
    return gerundet.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  }

  // Rechnet die Menge am Zeilenanfang um (auch Spannen wie "2-3" und
  // Vorsätze wie "ca."). Zeilen ohne Zahl bleiben unverändert.
  function zutatSkalieren(zeile, faktor) {
    if (faktor === 1) return zeile;
    const vorsatz = (zeile.match(/^(ca\.?\s*|etwa\s+|~\s*)/i) || [""])[0];
    let rest = zeile.slice(vorsatz.length);
    const erste = mengeLesen(rest);
    if (!erste) return zeile;
    let ergebnis = vorsatz + mengeFormatieren(erste.zahl * faktor);
    rest = rest.slice(erste.laenge);
    const spanne = rest.match(/^\s*[-–]\s*/);
    if (spanne) {
      const zweite = mengeLesen(rest.slice(spanne[0].length));
      if (zweite) {
        ergebnis += "–" + mengeFormatieren(zweite.zahl * faktor);
        rest = rest.slice(spanne[0].length + zweite.laenge);
      }
    }
    return ergebnis + rest;
  }

  // Zerlegt den Zutaten-Text in Zeilen: { typ: "titel" | "zutat", text, index }
  function rezeptZutatenZeilen(text, faktor) {
    const zeilen = String(text || "").split("\n").map((z) => z.trim()).filter(Boolean);
    let index = 0;
    return zeilen.map((z) => {
      if (z.endsWith(":")) return { typ: "titel", text: z.slice(0, -1) };
      const ohneZeichen = z.replace(/^[-*•]\s*/, "");
      return { typ: "zutat", text: zutatSkalieren(ohneZeichen, faktor), index: index++ };
    });
  }

  // Liefert die Rezepte des aktiven Bereichs
  function rezepteAktuell() {
    return rezepte.filter((r) => bereichVon(r) === aktiverBereich);
  }

  // Baut die Metazeile eines Rezepts (Foto, Kategorie, Portionen, Zeit)
  function rezeptMeta(r) {
    const teile = [];
    if (r.bild_pfad) teile.push(`${ic("kamera")}<span class="nur-vorleser">mit Foto</span>`);
    if (r.kategorie) teile.push(escapeHtml(r.kategorie));
    if (r.portionen) teile.push(`${r.portionen} ${r.portionen === 1 ? "Portion" : "Portionen"}`);
    if (r.zeit_minuten) teile.push(`${r.zeit_minuten} Min.`);
    return teile.join(" · ");
  }

  // Rendert die Zutaten als HTML-Listen mit Zwischentiteln, skaliert um den Faktor
  function rezeptZutatenHtml(text, faktor = 1) {
    const zeilen = rezeptZutatenZeilen(text, faktor);
    if (zeilen.length === 0) return "";
    let html = "";
    let listeOffen = false;
    for (const z of zeilen) {
      if (z.typ === "titel") {
        if (listeOffen) { html += "</ul>"; listeOffen = false; }
        html += `<p class="rezept-zwischentitel">${escapeHtml(z.text)}</p>`;
      } else {
        if (!listeOffen) { html += '<ul class="rezept-zutaten">'; listeOffen = true; }
        html += `<li>${escapeHtml(z.text)}</li>`;
      }
    }
    if (listeOffen) html += "</ul>";
    return html;
  }

  // Auswahl-Ansicht: Zutaten mit Checkboxen für die Einkaufsliste.
  // Was schon offen auf der Einkaufsliste steht, ist markiert und nicht wählbar.
  function rezeptEinkaufHtml(r, faktor) {
    const offeneArtikel = new Set(einkaufsliste
      .filter((e) => bereichVon(e) === aktiverBereich && !e.erledigt)
      .map((e) => e.text.trim().toLowerCase()));
    const zeilen = rezeptZutatenZeilen(r.zutaten, faktor);
    const html = zeilen.map((z) => {
      if (z.typ === "titel") return `<p class="rezept-zwischentitel">${escapeHtml(z.text)}</p>`;
      const schonDa = offeneArtikel.has(z.text.toLowerCase());
      return `
        <label class="rezept-einkauf-zeile${schonDa ? " schon-da" : ""}">
          <input type="checkbox" ${schonDa ? "disabled" : ""} ${rezeptEinkaufAuswahl.has(z.index) ? "checked" : ""}
            onchange="rezeptEinkaufWaehlen(${z.index}, this.checked)">
          <span>${escapeHtml(z.text)}${schonDa ? ' <em class="notiz-meta" style="display:inline;">steht schon drauf</em>' : ""}</span>
        </label>`;
    }).join("");
    const anzahl = rezeptEinkaufAuswahl.size;
    return `
      <div class="rezept-einkauf">
        <p class="notiz-meta" style="margin:0 0 0.4rem;">Tipp an, was fehlt:</p>
        ${html}
        <div class="rezept-aktionen">
          <button class="btn-primary" id="rezept-einkauf-uebernehmen" onclick="rezeptEinkaufUebernehmen('${r.id}')" ${anzahl === 0 ? "disabled" : ""}>
            ${rezeptEinkaufButtonText(anzahl)}</button>
          <button class="link-btn" onclick="rezeptEinkaufAlle('${r.id}')">Alle auswählen</button>
          <button class="link-btn" onclick="rezeptEinkaufAbbrechen()">Abbrechen</button>
        </div>
      </div>`;
  }

  // Liefert die Beschriftung des Einkaufslisten-Knopfs je nach Anzahl gewählter Zutaten
  function rezeptEinkaufButtonText(anzahl) {
    return anzahl === 0 ? "Zutaten auswählen" : `${anzahl} auf die Einkaufsliste`;
  }

  // Rendert die Rezeptquelle als Link mit Hostname oder als reinen Text
  function rezeptQuelleHtml(quelle) {
    if (!quelle) return "";
    if (/^https?:\/\/\S+$/i.test(quelle)) {
      let anzeige = quelle;
      try { anzeige = new URL(quelle).hostname.replace(/^www\./, ""); } catch (e) { /* Rohtext zeigen */ }
      return `<a href="${escapeAttr(quelle)}" target="_blank" rel="noopener noreferrer">${escapeHtml(anzeige)} ↗</a>`;
    }
    return escapeHtml(quelle);
  }

  // ---- Fotos ----
  function rezeptBildUrl(id) {
    const eintrag = rezeptBildUrls[id];
    return eintrag && eintrag.ablauf > Date.now() ? eintrag.url : null;
  }

  // Holt die signierte Foto-URL eines Rezepts (55 Min. gecacht) und zeichnet betroffene Ansichten neu
  async function rezeptBildLaden(id) {
    if (rezeptBildUrl(id) || rezeptBildLaedt.has(id)) return;
    rezeptBildLaedt.add(id);
    try {
      const res = await api("rezept_bild_url", { id });
      rezeptBildUrls[id] = { url: res.url, ablauf: Date.now() + 55 * 60 * 1000 };
    } catch (e) {
      console.error("Rezeptfoto konnte nicht geladen werden:", e);
      return;
    } finally {
      rezeptBildLaedt.delete(id);
    }
    if (rezeptOffenId === id) renderRezepte();
    if (rezeptFormId === id) rezeptFotoVorschauZeigen();
    if (kochmodus && kochmodus.id === id) renderKochmodus();
  }

  // Verkleinert ein Foto im Browser auf max. 1600 px (JPEG) – Handyfotos
  // haben sonst schnell 5–10 MB. createImageBitmap statt <img src=blob:>,
  // weil die CSP blob:-Bilder nicht erlaubt.
  async function fotoVerkleinern(datei) {
    const MAX_KANTE = 1600;
    let quelle;
    try {
      quelle = await createImageBitmap(datei, { imageOrientation: "from-image" });
    } catch (e) {
      quelle = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Das Bildformat wird nicht unterstützt (z.B. HEIC). Bitte als JPG speichern."));
          img.src = reader.result;
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(datei);
      });
    }
    const faktor = Math.min(1, MAX_KANTE / Math.max(quelle.width, quelle.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(quelle.width * faktor);
    canvas.height = Math.round(quelle.height * faktor);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // transparente PNGs sonst schwarz im JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(quelle, 0, 0, canvas.width, canvas.height);
    if (typeof quelle.close === "function") quelle.close();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    return { base64: dataUrl.split(",")[1], typ: "image/jpeg", vorschau: dataUrl };
  }

  // Zeigt im Rezeptformular die Fotovorschau (neu, gespeichert oder keins) und den Entfernen-Knopf
  function rezeptFotoVorschauZeigen() {
    const box = document.getElementById("rezept-f-foto-vorschau");
    if (!box) return;
    const r = rezeptFormId && rezeptFormId !== "neu" ? rezepte.find((x) => x.id === rezeptFormId) : null;
    let src = null;
    if (rezeptFotoNeu) src = rezeptFotoNeu.vorschau;
    else if (r && r.bild_pfad && !rezeptFotoEntfernen) src = rezeptBildUrl(r.id);
    const hatFoto = !!rezeptFotoNeu || !!(r && r.bild_pfad && !rezeptFotoEntfernen);
    box.innerHTML = src
      ? `<img src="${escapeAttr(src)}" class="rezept-foto-vorschau" alt="Vorschau des Fotos">`
      : (hatFoto ? '<p class="notiz-meta">Foto wird geladen …</p>' : '<p class="notiz-meta">Kein Foto</p>');
    const entfernen = document.getElementById("rezept-f-foto-entfernen");
    if (entfernen) entfernen.classList.toggle("hidden", !hatFoto);
  }

  // Markiert das Rezeptfoto im Formular zum Entfernen und aktualisiert die Vorschau
  window.rezeptFotoEntfernenKlick = function() {
    rezeptFotoNeu = null;
    rezeptFotoEntfernen = true;
    const input = document.getElementById("rezept-f-foto");
    if (input) input.value = "";
    rezeptFotoVorschauZeigen();
  };

  // ---- Kochmodus: Vollbild, große Schrift, Bildschirm bleibt an ----
  async function kochWachHalten() {
    if (!kochmodus) return;
    if (!("wakeLock" in navigator)) { kochmodus.wach = "nicht"; kochWachAnzeigen(); return; }
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (!kochmodus) { lock.release(); return; }
      kochmodus.wakeLock = lock;
      kochmodus.wach = "an";
      lock.addEventListener("release", () => {
        if (kochmodus && kochmodus.wakeLock === lock) { kochmodus.wakeLock = null; kochmodus.wach = "aus"; kochWachAnzeigen(); }
      });
    } catch (e) {
      kochmodus.wach = "fehler";
    }
    kochWachAnzeigen();
  }

  // Zeigt im Kochmodus den Status der Bildschirm-Wachhaltung an
  function kochWachAnzeigen() {
    const el = document.getElementById("koch-wach");
    if (!el || !kochmodus) return;
    const texte = {
      an: "Bildschirm bleibt an",
      aus: "Bildschirm-Sperre wieder aktiv – kurz antippen, um sie erneut zu verhindern",
      nicht: "Dieser Browser kann den Bildschirm nicht wach halten",
      fehler: "Bildschirm konnte nicht wach gehalten werden",
    };
    el.innerHTML = (kochmodus.wach === "an" ? ic("sonne") + " " : "") + escapeHtml(texte[kochmodus.wach] || "");
  }

  document.addEventListener("visibilitychange", () => {
    // Das Betriebssystem gibt die Sperre beim Wechsel in eine andere App frei
    if (kochmodus && document.visibilityState === "visible" && !kochmodus.wakeLock) kochWachHalten();
  });

  // Startet den Kochmodus als Vollbild-Overlay mit Wake Lock und Zurück-Tasten-Eintrag
  window.kochmodusStarten = function(id) {
    const r = rezepte.find((x) => x.id === id);
    if (!r) return;
    kochmodus = { id, zutatenErledigt: new Set(), schritteErledigt: new Set(), wakeLock: null, wach: "" };
    const overlay = document.createElement("div");
    overlay.className = "session-fokus-overlay koch-overlay";
    overlay.id = "koch-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "koch-titel");
    document.body.appendChild(overlay);
    document.body.classList.add("koch-offen");
    // Zurück-Taste (Android) schließt den Kochmodus statt die App
    history.pushState({ kochmodus: true }, "");
    renderKochmodus();
    kochWachHalten();
    if (r.bild_pfad) rezeptBildLaden(r.id);
  };

  // Beendet den Kochmodus: gibt Wake Lock frei und entfernt das Overlay
  function kochmodusAufraeumen() {
    if (!kochmodus) return;
    if (kochmodus.wakeLock) { try { kochmodus.wakeLock.release(); } catch (e) { /* egal */ } }
    kochmodus = null;
    const overlay = document.getElementById("koch-overlay");
    if (overlay) overlay.remove();
    document.body.classList.remove("koch-offen");
  }

  // Schließt den Kochmodus über history.back oder räumt direkt auf
  window.kochmodusSchliessen = function() {
    if (!kochmodus) return;
    if (history.state && history.state.kochmodus) history.back(); // räumt über popstate auf
    else kochmodusAufraeumen();
  };

  window.addEventListener("popstate", () => { if (kochmodus) kochmodusAufraeumen(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && kochmodus) window.kochmodusSchliessen(); });

  // Hakt im Kochmodus eine Zutat ab bzw. wieder an
  window.kochZutatUmschalten = function(index) {
    if (!kochmodus) return;
    const set = kochmodus.zutatenErledigt;
    if (set.has(index)) set.delete(index); else set.add(index);
    renderKochmodus();
  };

  // Hakt im Kochmodus einen Zubereitungsschritt ab bzw. wieder an
  window.kochSchrittUmschalten = function(index) {
    if (!kochmodus) return;
    const set = kochmodus.schritteErledigt;
    if (set.has(index)) set.delete(index); else set.add(index);
    renderKochmodus();
  };

  // Ändert im Kochmodus die angezeigte Portionenzahl
  window.kochPortionenAendern = function(delta) {
    if (!kochmodus) return;
    window.rezeptPortionenAendern(kochmodus.id, delta);
    renderKochmodus();
  };

  // Schließt den Kochmodus und markiert das Rezept als heute gekocht
  window.kochFertig = async function() {
    if (!kochmodus) return;
    const id = kochmodus.id;
    const r = rezepte.find((x) => x.id === id);
    window.kochmodusSchliessen();
    if (r && r.zuletzt_gekocht !== heuteISO()) await window.rezeptHeuteGekocht(id);
  };

  // Rendert das Kochmodus-Overlay mit abhakbaren Zutaten, Schritten und Portionsrechner
  function renderKochmodus() {
    const overlay = document.getElementById("koch-overlay");
    if (!overlay || !kochmodus) return;
    const r = rezepte.find((x) => x.id === kochmodus.id);
    if (!r) { kochmodusAufraeumen(); return; }
    const basis = r.portionen || null;
    const anzeige = basis ? (rezeptPortionenAnzeige[r.id] || basis) : null;
    const faktor = basis ? anzeige / basis : 1;
    const zutaten = rezeptZutatenZeilen(r.zutaten, faktor).map((z) => {
      if (z.typ === "titel") return `<p class="koch-zwischentitel">${escapeHtml(z.text)}</p>`;
      const erledigt = kochmodus.zutatenErledigt.has(z.index);
      return `<button class="koch-zeile${erledigt ? " erledigt" : ""}" onclick="kochZutatUmschalten(${z.index})" aria-pressed="${erledigt}">
        <span class="koch-haken" aria-hidden="true">${erledigt ? "✓" : ""}</span><span>${escapeHtml(z.text)}</span></button>`;
    }).join("");
    const schritte = String(r.zubereitung || "").split("\n").map((z) => z.trim()).filter(Boolean);
    const aktuell = schritte.findIndex((_, i) => !kochmodus.schritteErledigt.has(i));
    const schritteHtml = schritte.map((text, i) => {
      const erledigt = kochmodus.schritteErledigt.has(i);
      return `<button class="koch-schritt${erledigt ? " erledigt" : ""}${i === aktuell ? " aktuell" : ""}" onclick="kochSchrittUmschalten(${i})" aria-pressed="${erledigt}">${escapeHtml(text)}</button>`;
    }).join("");
    const bildUrl = r.bild_pfad ? rezeptBildUrl(r.id) : null;
    const scrollPos = overlay.querySelector(".session-fokus-inhalt")?.scrollTop || 0;
    overlay.innerHTML = `
      <div class="session-fokus-kopf">
        <span class="session-fokus-titel" id="koch-titel">${ic("kochen")} ${escapeHtml(r.titel)}</span>
        <button class="session-fokus-schliessen" onclick="kochmodusSchliessen()" aria-label="Kochmodus schließen">${ic("x")}</button>
      </div>
      <div class="session-fokus-inhalt koch-inhalt">
        <p class="notiz-meta" id="koch-wach"></p>
        ${bildUrl ? `<img src="${escapeAttr(bildUrl)}" class="session-fokus-bild" alt="">` : ""}
        ${zutaten ? `<h3 class="rezept-abschnitt">Zutaten</h3>
          ${basis ? `<div class="rezept-portionen">
            <button class="rezept-portionen-btn" onclick="kochPortionenAendern(-1)" aria-label="Eine Portion weniger" ${anzeige <= 1 ? "disabled" : ""}>−</button>
            <span class="rezept-portionen-zahl">${anzeige} ${anzeige === 1 ? "Portion" : "Portionen"}</span>
            <button class="rezept-portionen-btn" onclick="kochPortionenAendern(1)" aria-label="Eine Portion mehr" ${anzeige >= 100 ? "disabled" : ""}>+</button>
          </div>` : ""}
          <div class="koch-liste">${zutaten}</div>` : ""}
        ${schritteHtml ? `<h3 class="rezept-abschnitt">Zubereitung <span class="koch-hinweis">– Schritt antippen, wenn erledigt</span></h3><div class="koch-liste">${schritteHtml}</div>` : ""}
        ${r.notiz ? `<h3 class="rezept-abschnitt">Notiz</h3><p class="koch-text">${escapeHtml(r.notiz)}</p>` : ""}
      </div>
      <div class="session-fokus-fuss">
        <button class="session-fokus-btn-sek" onclick="kochmodusSchliessen()">Schließen</button>
        <button class="session-fokus-btn-primaer" onclick="kochFertig()">Fertig – heute gekocht</button>
      </div>`;
    const inhalt = overlay.querySelector(".session-fokus-inhalt");
    if (inhalt) inhalt.scrollTop = scrollPos;
    kochWachAnzeigen();
  }

  // Sortiervergleich für Rezepte: nach Favorit, längst nicht gekocht oder zuletzt gekocht
  function rezeptVergleich(a, b) {
    const alphabetisch = a.titel.localeCompare(b.titel, "de");
    if (rezeptSortierung === "lange") {
      // noch nie gekocht zuerst, dann am längsten her
      const da = a.zuletzt_gekocht || "0000-00-00";
      const db = b.zuletzt_gekocht || "0000-00-00";
      return da.localeCompare(db) || alphabetisch;
    }
    if (rezeptSortierung === "zuletzt") {
      const da = a.zuletzt_gekocht || "0000-00-00";
      const db = b.zuletzt_gekocht || "0000-00-00";
      return db.localeCompare(da) || alphabetisch;
    }
    return (b.favorit === true) - (a.favorit === true) || alphabetisch;
  }

  // Rendert Rezeptliste mit Kategorie-Filter, Suche, Sortierung und aufgeklappter Detailansicht
  function renderRezepte() {
    const listeBereich = document.getElementById("rezept-liste-bereich");
    const filter = document.getElementById("rezept-kategorie-filter");
    if (!listeBereich || !filter) return;
    const sortFeld = document.getElementById("rezept-sortierung");
    if (sortFeld) sortFeld.value = rezeptSortierung;

    const alle = rezepteAktuell();
    const kategorien = [...new Set(alle.map((r) => r.kategorie).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
    if (rezeptKategorie !== "alle" && !kategorien.includes(rezeptKategorie)) rezeptKategorie = "alle";

    filter.innerHTML = `<option value="alle">Alle Kategorien (${alle.length})</option>` +
      kategorien.map((k) => {
        const anzahl = alle.filter((r) => r.kategorie === k).length;
        return `<option value="${escapeAttr(k)}" ${rezeptKategorie === k ? "selected" : ""}>${escapeHtml(k)} (${anzahl})</option>`;
      }).join("");

    const datalist = document.getElementById("rezept-kategorie-liste");
    if (datalist) {
      const vorschlaege = [...new Set([...REZEPT_KATEGORIE_VORSCHLAEGE, ...kategorien])];
      datalist.innerHTML = vorschlaege.map((k) => `<option value="${escapeAttr(k)}"></option>`).join("");
    }

    const suche = rezeptSuche.trim().toLowerCase();
    const gefiltert = alle
      .filter((r) => rezeptKategorie === "alle" || r.kategorie === rezeptKategorie)
      .filter((r) => !suche || [r.titel, r.kategorie, r.zutaten, r.notiz]
        .some((feld) => String(feld || "").toLowerCase().includes(suche)))
      .sort(rezeptVergleich);

    if (alle.length === 0) {
      listeBereich.innerHTML = '<p class="empty-text">Noch keine Rezepte. Leg mit „+ Neues Rezept“ dein erstes an.</p>';
      return;
    }
    if (gefiltert.length === 0) {
      listeBereich.innerHTML = '<p class="empty-text">Kein Rezept passt zur Suche.</p>';
      return;
    }

    listeBereich.innerHTML = '<div class="rezept-liste">' + gefiltert.map((r) => {
      const offen = rezeptOffenId === r.id;
      let meta = rezeptMeta(r);
      if (rezeptSortierung !== "favorit") meta = [meta, rezeptGekochtText(r.zuletzt_gekocht)].filter(Boolean).join(" · ");
      let detail = "";
      if (offen) {
        const basis = r.portionen || null;
        const anzeige = basis ? (rezeptPortionenAnzeige[r.id] || basis) : null;
        const faktor = basis ? anzeige / basis : 1;
        const einkaufModus = rezeptEinkaufId === r.id;
        const zutaten = einkaufModus ? rezeptEinkaufHtml(r, faktor) : rezeptZutatenHtml(r.zutaten, faktor);
        const hatZutaten = rezeptZutatenZeilen(r.zutaten, 1).some((z) => z.typ === "zutat");
        const heute = heuteISO();
        const heuteGekocht = r.zuletzt_gekocht === heute;
        const portionenLeiste = basis ? `
            <div class="rezept-portionen">
              <button class="rezept-portionen-btn" onclick="rezeptPortionenAendern('${r.id}', -1)" aria-label="Eine Portion weniger" ${anzeige <= 1 ? "disabled" : ""}>−</button>
              <span class="rezept-portionen-zahl">${anzeige} ${anzeige === 1 ? "Portion" : "Portionen"}</span>
              <button class="rezept-portionen-btn" onclick="rezeptPortionenAendern('${r.id}', 1)" aria-label="Eine Portion mehr" ${anzeige >= 100 ? "disabled" : ""}>+</button>
              ${anzeige !== basis ? `<button class="link-btn" onclick="rezeptPortionenZuruecksetzen('${r.id}')">zurück auf ${basis}</button>` : ""}
            </div>` : "";
        let fotoHtml = "";
        if (r.bild_pfad) {
          const url = rezeptBildUrl(r.id);
          if (url) fotoHtml = `<img src="${escapeAttr(url)}" class="rezept-foto" alt="Foto: ${escapeAttr(r.titel)}">`;
          else { fotoHtml = '<div class="rezept-foto rezept-foto-platzhalter">Foto wird geladen …</div>'; rezeptBildLaden(r.id); }
        }
        detail = `
          <div class="rezept-detail">
            ${fotoHtml}
            <p class="notiz-meta rezept-gekocht-info">${rezeptGekochtText(r.zuletzt_gekocht)}</p>
            ${(hatZutaten || r.zubereitung) && !einkaufModus ? `<button class="btn-primary rezept-koch-start" onclick="kochmodusStarten('${r.id}')">${ic("kochen")}Kochmodus</button>` : ""}
            ${zutaten ? `<h3 class="rezept-abschnitt">Zutaten</h3>${portionenLeiste}${zutaten}` : ""}
            ${hatZutaten && !einkaufModus ? `<button class="btn-secondary rezept-einkauf-start" onclick="rezeptEinkaufStarten('${r.id}')">${ic("einkauf")}Zutaten auf die Einkaufsliste …</button>` : ""}
            ${r.zubereitung ? `<h3 class="rezept-abschnitt">Zubereitung</h3><p class="rezept-text">${escapeHtml(r.zubereitung)}</p>` : ""}
            ${r.notiz ? `<h3 class="rezept-abschnitt">Notiz</h3><p class="rezept-text">${escapeHtml(r.notiz)}</p>` : ""}
            ${r.quelle ? `<p class="notiz-meta">Quelle: ${rezeptQuelleHtml(r.quelle)}</p>` : ""}
            ${!zutaten && !r.zubereitung && !r.notiz ? '<p class="empty-text">Noch keine Zutaten oder Zubereitung eingetragen.</p>' : ""}
            <div class="rezept-aktionen">
              ${heuteGekocht
                ? `<button class="btn-secondary rezept-gekocht-btn erledigt" onclick="rezeptGekochtZuruecknehmen('${r.id}')">✓ Heute gekocht · zurücknehmen</button>`
                : `<button class="btn-secondary rezept-gekocht-btn" onclick="rezeptHeuteGekocht('${r.id}')">✓ Heute gekocht</button>`}
              <button class="btn-secondary" onclick="rezeptBearbeiten('${r.id}')">${ic("stift")}Bearbeiten</button>
              <button class="link-btn" onclick="rezeptLoeschen('${r.id}')">Löschen</button>
            </div>
          </div>`;
      }
      return `
        <div class="rezept-karte${offen ? " offen" : ""}">
          <div class="rezept-kopf">
            <button class="rezept-stern${r.favorit ? " aktiv" : ""}" onclick="rezeptFavoritUmschalten('${r.id}')"
              aria-label="${r.favorit ? "Aus Favoriten entfernen" : "Als Favorit markieren"}" aria-pressed="${r.favorit ? "true" : "false"}">${r.favorit ? "★" : "☆"}</button>
            <button class="rezept-titel-btn" onclick="rezeptUmschalten('${r.id}')" aria-expanded="${offen ? "true" : "false"}">
              <span class="rezept-titel">${escapeHtml(r.titel)}</span>
              ${meta ? `<span class="notiz-meta">${meta}</span>` : ""}
            </button>
            <span class="rezept-pfeil" aria-hidden="true">${offen ? "▴" : "▾"}</span>
          </div>
          ${detail}
        </div>`;
    }).join("") + "</div>";
  }

  // Rendert das Rezeptformular für neues, importiertes oder bearbeitetes Rezept inkl. Foto
  function rezeptFormRendern() {
    const formBereich = document.getElementById("rezept-form-bereich");
    const neuBtn = document.getElementById("btn-rezept-neu");
    if (!formBereich) return;
    if (!rezeptFormId) {
      formBereich.innerHTML = "";
      formBereich.classList.add("hidden");
      if (neuBtn) neuBtn.classList.remove("hidden");
      const knoepfe = document.getElementById("rezept-knoepfe");
      if (knoepfe) knoepfe.classList.remove("hidden");
      rezeptVorlage = null;
      return;
    }
    const r = rezeptFormId === "neu" ? (rezeptVorlage || {}) : (rezepte.find((x) => x.id === rezeptFormId) || {});
    const knoepfe = document.getElementById("rezept-knoepfe");
    if (knoepfe) knoepfe.classList.add("hidden");
    if (neuBtn) neuBtn.classList.add("hidden");
    formBereich.classList.remove("hidden");
    formBereich.innerHTML = `
      <h2 class="rezept-form-titel">${rezeptFormId !== "neu" ? "Rezept bearbeiten" : (rezeptVorlage ? "Importiertes Rezept" : "Neues Rezept")}</h2>
      ${rezeptVorlage ? '<p class="notiz-meta rezept-import-hinweis">Aus dem Link übernommen – bitte kurz prüfen (v.a. Zutaten und Schritte), dann speichern. Nur für den eigenen Gebrauch.</p>' : ""}
      <div class="row">
        <input type="text" id="rezept-f-titel" placeholder="Titel, z.B. Linsensuppe" value="${escapeAttr(r.titel || "")}">
      </div>
      <div class="rezept-foto-feld">
        <div id="rezept-f-foto-vorschau"></div>
        <div class="rezept-foto-knoepfe">
          <label class="btn-secondary rezept-foto-label" for="rezept-f-foto">${ic("kamera")}Foto wählen</label>
          <input type="file" id="rezept-f-foto" accept="image/jpeg,image/png,image/webp" class="rezept-foto-input">
          <button type="button" class="link-btn hidden" id="rezept-f-foto-entfernen" onclick="rezeptFotoEntfernenKlick()">Foto entfernen</button>
        </div>
      </div>
      <div class="row">
        <input type="text" id="rezept-f-kategorie" placeholder="Kategorie (optional)" list="rezept-kategorie-liste" value="${escapeAttr(r.kategorie || "")}">
        <input type="number" id="rezept-f-portionen" placeholder="Portionen" min="1" max="100" inputmode="numeric" value="${r.portionen ?? ""}">
        <input type="number" id="rezept-f-zeit" placeholder="Minuten" min="0" max="1440" inputmode="numeric" value="${r.zeit_minuten ?? ""}">
      </div>
      <label class="rezept-label" for="rezept-f-zutaten">Zutaten – eine pro Zeile, Menge vorne</label>
      <textarea id="rezept-f-zutaten" rows="8" placeholder="200 g Mehl&#10;2 Eier&#10;1 Prise Salz&#10;Für die Soße:&#10;1 Becher Sahne">${escapeHtml(r.zutaten || "")}</textarea>
      <label class="rezept-label" for="rezept-f-zubereitung">Zubereitung</label>
      <textarea id="rezept-f-zubereitung" rows="8" placeholder="1. Mehl und Eier verrühren …">${escapeHtml(r.zubereitung || "")}</textarea>
      <div class="row" style="margin-top:0.8rem;">
        <input type="text" id="rezept-f-quelle" placeholder="Quelle: Link oder z.B. „von Oma“ (optional)" value="${escapeAttr(r.quelle || "")}">
      </div>
      <textarea id="rezept-f-notiz" rows="2" placeholder="Notiz, z.B. „mit weniger Zucker besser“ (optional)">${escapeHtml(r.notiz || "")}</textarea>
      <label class="rezept-favorit-check"><input type="checkbox" id="rezept-f-favorit" ${r.favorit ? "checked" : ""}> Favorit ★</label>
      <div class="row">
        <button class="btn-primary" onclick="rezeptSpeichern()">Speichern</button>
        <button class="btn-secondary" onclick="rezeptFormSchliessen()">Abbrechen</button>
      </div>`;
    rezeptFotoNeu = null;
    rezeptFotoEntfernen = false;
    rezeptFotoVorschauZeigen();
    if (r.id && r.bild_pfad) rezeptBildLaden(r.id);
    document.getElementById("rezept-f-foto").addEventListener("change", async (e) => {
      const datei = e.target.files && e.target.files[0];
      if (!datei) return;
      const box = document.getElementById("rezept-f-foto-vorschau");
      if (box) box.innerHTML = '<p class="notiz-meta">Foto wird verkleinert …</p>';
      try {
        rezeptFotoNeu = await fotoVerkleinern(datei);
        rezeptFotoEntfernen = false;
      } catch (err) {
        rezeptFotoNeu = null;
        e.target.value = "";
        alert(err.message || "Foto konnte nicht gelesen werden.");
      }
      rezeptFotoVorschauZeigen();
    });
    document.getElementById("rezept-f-titel").focus();
    formBereich.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  document.getElementById("rezept-suche").addEventListener("input", (e) => {
    rezeptSuche = e.target.value;
    renderRezepte();
  });
  document.getElementById("rezept-kategorie-filter").addEventListener("change", (e) => {
    rezeptKategorie = e.target.value;
    renderRezepte();
  });
  document.getElementById("btn-rezept-neu").addEventListener("click", () => {
    rezeptVorlage = null;
    rezeptImportSchliessen();
    rezeptFormId = "neu";
    rezeptFormRendern();
  });

  // ---- Import per Link ----
  function rezeptImportSchliessen() {
    const bereich = document.getElementById("rezept-import-bereich");
    if (bereich) bereich.classList.add("hidden");
    const status = document.getElementById("rezept-import-status");
    if (status) status.textContent = "";
  }

  document.getElementById("btn-rezept-import").addEventListener("click", () => {
    const bereich = document.getElementById("rezept-import-bereich");
    bereich.classList.remove("hidden");
    const feld = document.getElementById("rezept-import-url");
    feld.value = "";
    feld.focus();
  });

  document.getElementById("btn-rezept-import-abbrechen").addEventListener("click", rezeptImportSchliessen);
  document.getElementById("rezept-import-url").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btn-rezept-import-laden").click();
  });

  document.getElementById("btn-rezept-import-laden").addEventListener("click", async () => {
    const feld = document.getElementById("rezept-import-url");
    const status = document.getElementById("rezept-import-status");
    const knopf = document.getElementById("btn-rezept-import-laden");
    // Aus geteiltem Text ("Schau mal: https://…") den Link herausziehen
    const link = linkAusText(feld.value);
    if (!link) { status.textContent = "Bitte einen Link mit https:// einfügen."; feld.focus(); return; }
    const vorhanden = rezepteAktuell().find((r) => r.quelle && r.quelle.split(/[?#]/)[0] === link.split(/[?#]/)[0]);
    if (vorhanden && !confirm(`Dieses Rezept gibt es schon: „${vorhanden.titel}“. Trotzdem noch einmal importieren?`)) return;
    knopf.disabled = true;
    status.textContent = "Rezept wird geladen …";
    try {
      const res = await api("rezept_import", { url: link });
      rezeptVorlage = res.rezept;
      rezeptImportSchliessen();
      rezeptFormId = "neu";
      rezeptFormRendern();
    } catch (e) {
      status.textContent = e.message || "Import fehlgeschlagen.";
    } finally {
      knopf.disabled = false;
    }
  });

  // Klappt die Detailansicht eines Rezepts auf/zu und beendet ggf. die Zutatenauswahl
  window.rezeptUmschalten = function(id) {
    rezeptOffenId = rezeptOffenId === id ? null : id;
    if (rezeptEinkaufId && rezeptEinkaufId !== rezeptOffenId) { rezeptEinkaufId = null; rezeptEinkaufAuswahl = new Set(); }
    renderRezepte();
  };

  document.getElementById("rezept-sortierung").addEventListener("change", (e) => {
    rezeptSortierung = e.target.value;
    localStorage.setItem("rezept-sortierung", rezeptSortierung);
    renderRezepte();
  });

  // Erhöht/verringert die angezeigte Portionenzahl eines Rezepts (1–100)
  window.rezeptPortionenAendern = function(id, delta) {
    const r = rezepte.find((x) => x.id === id);
    if (!r || !r.portionen) return;
    const aktuell = rezeptPortionenAnzeige[id] || r.portionen;
    rezeptPortionenAnzeige[id] = Math.min(100, Math.max(1, aktuell + delta));
    renderRezepte();
  };

  // Setzt die angezeigte Portionenzahl auf den Rezept-Grundwert zurück
  window.rezeptPortionenZuruecksetzen = function(id) {
    delete rezeptPortionenAnzeige[id];
    renderRezepte();
  };

  // Startet die Auswahl von Zutaten für die Einkaufsliste
  window.rezeptEinkaufStarten = function(id) {
    rezeptEinkaufId = id;
    rezeptEinkaufAuswahl = new Set();
    renderRezepte();
  };

  // Bricht die Zutatenauswahl für die Einkaufsliste ab
  window.rezeptEinkaufAbbrechen = function() {
    rezeptEinkaufId = null;
    rezeptEinkaufAuswahl = new Set();
    renderRezepte();
  };

  // Wählt eine Zutat für die Einkaufsliste an/ab und aktualisiert nur den Knopf
  window.rezeptEinkaufWaehlen = function(index, an) {
    if (an) rezeptEinkaufAuswahl.add(index); else rezeptEinkaufAuswahl.delete(index);
    // nur den Knopf aktualisieren, nicht neu zeichnen (Scrollposition bleibt)
    const knopf = document.getElementById("rezept-einkauf-uebernehmen");
    if (knopf) {
      knopf.textContent = rezeptEinkaufButtonText(rezeptEinkaufAuswahl.size);
      knopf.disabled = rezeptEinkaufAuswahl.size === 0;
    }
  };

  // Liefert skalierte Zutaten des Rezepts, die nicht schon offen auf der Einkaufsliste stehen
  function rezeptEinkaufKandidaten(r) {
    const faktor = r.portionen ? (rezeptPortionenAnzeige[r.id] || r.portionen) / r.portionen : 1;
    const offeneArtikel = new Set(einkaufsliste
      .filter((e) => bereichVon(e) === aktiverBereich && !e.erledigt)
      .map((e) => e.text.trim().toLowerCase()));
    return rezeptZutatenZeilen(r.zutaten, faktor)
      .filter((z) => z.typ === "zutat" && !offeneArtikel.has(z.text.toLowerCase()));
  }

  // Wählt alle noch nicht vorhandenen Zutaten für die Einkaufsliste aus
  window.rezeptEinkaufAlle = function(id) {
    const r = rezepte.find((x) => x.id === id);
    if (!r) return;
    rezeptEinkaufAuswahl = new Set(rezeptEinkaufKandidaten(r).map((z) => z.index));
    renderRezepte();
  };

  // Übernimmt die gewählten Zutaten in die Einkaufsliste des aktiven Bereichs
  window.rezeptEinkaufUebernehmen = async function(id) {
    const r = rezepte.find((x) => x.id === id);
    if (!r || rezeptEinkaufAuswahl.size === 0) return;
    const texte = rezeptEinkaufKandidaten(r)
      .filter((z) => rezeptEinkaufAuswahl.has(z.index))
      .map((z) => z.text);
    if (texte.length === 0) return;
    try {
      await api("einkauf_mehrere_hinzufuegen", { texte, bereich: aktiverBereich, herkunft: r.titel });
    } catch (e) {
      alert("Übernehmen fehlgeschlagen: " + e.message);
      return;
    }
    rezeptEinkaufId = null;
    rezeptEinkaufAuswahl = new Set();
    await ladeDaten();
    alert(`${texte.length} ${texte.length === 1 ? "Zutat steht" : "Zutaten stehen"} jetzt auf der Einkaufsliste.`);
  };

  // Markiert ein Rezept als heute gekocht und merkt das vorherige Datum
  window.rezeptHeuteGekocht = async function(id) {
    const r = rezepte.find((x) => x.id === id);
    if (!r) return;
    rezeptGekochtVorher[id] = r.zuletzt_gekocht || null;
    try {
      await api("rezept_gekocht", { id, datum: heuteISO() });
    } catch (e) {
      alert("Speichern fehlgeschlagen: " + e.message);
      return;
    }
    await ladeDaten();
  };

  // Nimmt "Heute gekocht" zurück und stellt das vorherige Datum wieder her
  window.rezeptGekochtZuruecknehmen = async function(id) {
    // Vorheriges Datum aus dieser Sitzung wiederherstellen; unbekannt = null
    const vorher = Object.prototype.hasOwnProperty.call(rezeptGekochtVorher, id) ? rezeptGekochtVorher[id] : null;
    try {
      await api("rezept_gekocht", { id, datum: vorher });
    } catch (e) {
      alert("Speichern fehlgeschlagen: " + e.message);
      return;
    }
    delete rezeptGekochtVorher[id];
    await ladeDaten();
  };

  // Öffnet das Rezeptformular zum Bearbeiten
  window.rezeptBearbeiten = function(id) {
    rezeptFormId = id;
    rezeptFormRendern();
  };

  // Schließt das Rezeptformular
  window.rezeptFormSchliessen = function() {
    rezeptFormId = null;
    rezeptFormRendern();
  };

  // Speichert das Rezept inkl. neuem oder entferntem Foto; Formular bleibt bei Fehler offen
  window.rezeptSpeichern = async function() {
    const titelFeld = document.getElementById("rezept-f-titel");
    const titel = titelFeld.value.trim();
    if (!titel) { titelFeld.focus(); alert("Bitte einen Titel eintragen."); return; }
    const wert = (id) => document.getElementById(id).value.trim();
    const payload = {
      titel,
      kategorie: wert("rezept-f-kategorie"),
      portionen: wert("rezept-f-portionen"),
      zeit_minuten: wert("rezept-f-zeit"),
      zutaten: wert("rezept-f-zutaten"),
      zubereitung: wert("rezept-f-zubereitung"),
      quelle: wert("rezept-f-quelle"),
      notiz: wert("rezept-f-notiz"),
      favorit: document.getElementById("rezept-f-favorit").checked,
      bereich: aktiverBereich,
    };
    if (rezeptFormId && rezeptFormId !== "neu") payload.id = rezeptFormId;
    if (rezeptFotoNeu) {
      payload.bild_base64 = rezeptFotoNeu.base64;
      payload.bild_typ = rezeptFotoNeu.typ;
    } else if (rezeptFotoEntfernen) {
      payload.bild_entfernen = true;
    }
    const knopf = document.querySelector("#rezept-form-bereich .btn-primary");
    if (knopf) { knopf.disabled = true; knopf.textContent = "Speichert …"; }
    try {
      await api("rezept_speichern", payload);
    } catch (e) {
      alert("Speichern fehlgeschlagen: " + e.message);
      if (knopf) { knopf.disabled = false; knopf.textContent = "Speichern"; }
      return; // Formular bleibt offen, nichts geht verloren
    }
    if (payload.id) rezeptOffenId = payload.id;
    rezeptVorlage = null;
    if (payload.id && (rezeptFotoNeu || rezeptFotoEntfernen)) delete rezeptBildUrls[payload.id];
    rezeptFotoNeu = null;
    rezeptFotoEntfernen = false;
    rezeptFormId = null;
    rezeptFormRendern();
    await ladeDaten();
  };

  // Schaltet den Favoriten-Status eines Rezepts sofort um und speichert im Hintergrund
  window.rezeptFavoritUmschalten = async function(id) {
    const r = rezepte.find((x) => x.id === id);
    if (!r) return;
    r.favorit = !r.favorit; // sofort anzeigen, Server im Hintergrund
    renderRezepte();
    try {
      await api("rezept_favorit", { id, favorit: r.favorit });
    } catch (e) {
      r.favorit = !r.favorit;
      renderRezepte();
      alert("Favorit konnte nicht gespeichert werden: " + e.message);
    }
  };

  // Löscht ein Rezept nach Rückfrage und schließt ggf. Detail/Formular
  window.rezeptLoeschen = async function(id) {
    const r = rezepte.find((x) => x.id === id);
    if (!r || !confirm(`Rezept „${r.titel}“ wirklich löschen?`)) return;
    await api("rezept_loeschen", { id });
    if (rezeptOffenId === id) rezeptOffenId = null;
    if (rezeptFormId === id) { rezeptFormId = null; rezeptFormRendern(); }
    await ladeDaten();
  };

  // ==========================================================
  // OGS Rapunzel – Inventar
  // ==========================================================
  const INV_ZUSTAND_LABEL = { gut: `${ic("ok-kreis")} Gut`, eingeschraenkt: `${ic("warnung")} Eingeschränkt nutzbar`, defekt: `${ic("x-kreis")} Defekt` };
  let invAktiveKategorie = "alle";
  // Offene Inventar-Kategorien, je Bereich (Schlüssel "bereich|Kategorie")
  const invGruppenOffen = new Set();
  try { JSON.parse(localStorage.getItem("inv-gruppen-offen") || "[]").forEach((k) => invGruppenOffen.add(k)); } catch (_e) { /* leer lassen */ }
  function invGruppenMerken() {
    try { localStorage.setItem("inv-gruppen-offen", JSON.stringify([...invGruppenOffen])); } catch (_e) { /* egal */ }
  }
  // Liefert den Schlüssel "Bereich|Kategorie" für offene Inventar-Gruppen
  function invGruppenSchluessel(kat) {
    return `${aktiverBereich}|${kat}`;
  }
  // Wiederbeschaffungswert je Stück (seit Session 29), null = nicht eingetragen
  function invWert(i) {
    if (i.wiederbeschaffungswert === null || i.wiederbeschaffungswert === undefined || i.wiederbeschaffungswert === "") return null;
    const n = Number(i.wiederbeschaffungswert);
    return Number.isFinite(n) ? n : null;
  }
  // Summe Wert × Menge; ohne = Anzahl Gegenstände ohne eingetragenen Wert
  function invWertSumme(liste) {
    let summe = 0;
    let ohne = 0;
    for (const i of liste) {
      const w = invWert(i);
      if (w === null) ohne++;
      else summe += w * (Number(i.menge) || 1);
    }
    return { summe: Math.round(summe * 100) / 100, ohne };
  }


  // Rendert das Inventar mit Kategorie-Filter, Wertsumme und aufklappbaren Kategoriegruppen
  function renderInventar() {
    const filterBereich = document.getElementById("inv-filter-bereich");
    const listeBereich = document.getElementById("inv-liste-bereich");
    if (!filterBereich || !listeBereich) return;

    const inventarAktuell = ogsInventarAktuell();
    const kategorien = [...new Set(inventarAktuell.map((i) => i.kategorie))].sort((a, b) => a.localeCompare(b));

    const datalist = document.getElementById("inv-kategorie-liste");
    if (datalist) datalist.innerHTML = kategorien.map((k) => `<option value="${escapeAttr(k)}"></option>`).join("");

    if (invAktiveKategorie !== "alle" && !kategorien.includes(invAktiveKategorie)) invAktiveKategorie = "alle";

    filterBereich.innerHTML = `
      <select id="inv-kategorie-filter" onchange="invFilterAendern(this.value)">
        <option value="alle" ${invAktiveKategorie === "alle" ? "selected" : ""}>Alle Kategorien (${inventarAktuell.length})</option>
        ${kategorien.map((k) => {
          const anzahl = inventarAktuell.filter((i) => i.kategorie === k).length;
          return `<option value="${escapeAttr(k)}" ${invAktiveKategorie === k ? "selected" : ""}>${escapeHtml(k)} (${anzahl})</option>`;
        }).join("")}
      </select>
      ${(() => {
        const liste = invAktiveKategorie === "alle" ? inventarAktuell : inventarAktuell.filter((i) => i.kategorie === invAktiveKategorie);
        const w = invWertSumme(liste);
        if (!w.summe && !w.ohne) return "";
        return `<p class="notiz-meta" style="margin:0.5rem 0 0;">Wiederbeschaffungswert${invAktiveKategorie === "alle" ? " gesamt" : ""}: <strong>${finEuro(w.summe)}</strong>${w.ohne ? ` · ${w.ohne} Gegenstand${w.ohne === 1 ? "" : "e"} ohne Wert (*)` : ""}</p>`;
      })()}`;

    const gefiltert = invAktiveKategorie === "alle" ? inventarAktuell : inventarAktuell.filter((i) => i.kategorie === invAktiveKategorie);

    if (gefiltert.length === 0) {
      listeBereich.innerHTML = '<p class="empty-text">Noch nichts im Inventar.</p>';
      return;
    }

    const gruppen = {};
    gefiltert.forEach((i) => { (gruppen[i.kategorie] = gruppen[i.kategorie] || []).push(i); });
    const kategorienSortiert = Object.keys(gruppen).sort((a, b) => a.localeCompare(b));

    listeBereich.innerHTML = kategorienSortiert.map((kat) => {
      const items = gruppen[kat].sort((a, b) => a.name.localeCompare(b.name));
      const zeilen = items.map((i) => {
        const offeneAusleihen = verleihAktuell().filter((v) => v.inventar_id === i.id && !v.rueckgabe_am);
        const ausleiheHinweis = offeneAusleihen.length > 0
          ? `<span class="notiz-meta" style="display:block; color:var(--accent);">→ ${offeneAusleihen.reduce((s, v) => s + v.menge, 0)}× verliehen an ${offeneAusleihen.map((v) => escapeHtml(v.ausgeliehen_an)).join(", ")}</span>`
          : "";
        return `
          <div class="notiz-item">
            <div style="flex:1; cursor:pointer;" onclick="invBearbeitenStart('${i.id}')">
              <span class="notiz-text">${escapeHtml(i.name)}</span>
              <span class="notiz-meta">${i.menge}× ${i.standort ? "· " + escapeHtml(i.standort) + " " : ""}· ${INV_ZUSTAND_LABEL[i.zustand] || i.zustand}</span>
              ${invWert(i) !== null ? `<span class="notiz-meta" style="display:block;">Wiederbeschaffung: ${finEuro(invWert(i))} je Stück${Number(i.menge) > 1 ? ` · zusammen ${finEuro(invWert(i) * Number(i.menge))}` : ""}</span>` : ""}
              ${i.beschreibung ? `<span class="notiz-meta" style="display:block;">${escapeHtml(i.beschreibung)}</span>` : ""}
              ${ausleiheHinweis}
            </div>
            <button class="task-delete" onclick="invLoeschen('${i.id}')" aria-label="Löschen">${ic("x")}</button>
          </div>`;
      }).join("");
      // Aufklappbar je Kategorie (seit Session 29), gleiche Optik wie bei den
      // Spielen. Offen bleibt, was du geöffnet hast (je Bereich gemerkt),
      // außerdem automatisch bei gewählter Kategorie im Filter.
      const schluessel = invGruppenSchluessel(kat);
      const offen = invAktiveKategorie !== "alle" || invGruppenOffen.has(schluessel);
      const defekt = items.filter((i) => i.zustand === "defekt").length;
      const verliehen = items.filter((i) => verleihAktuell().some((v) => v.inventar_id === i.id && !v.rueckgabe_am)).length;
      const wertKat = invWertSumme(items);
      const info = [
        wertKat.summe ? finEuro(wertKat.summe) + (wertKat.ohne ? "*" : "") : "",
        defekt ? `${defekt} defekt` : "",
        verliehen ? `${verliehen} verliehen` : "",
      ].filter(Boolean).join(" · ");
      return `
        <details class="spiel-gruppe" data-schluessel="${escapeAttr(schluessel)}" ${offen ? "open" : ""} ontoggle="invGruppeUmschalten(this)">
          <summary class="spiel-gruppe-kopf">
            <span class="spiel-gruppe-titel">${escapeHtml(kat)}</span>
            ${info ? `<span class="spiel-gruppe-info">${info}</span>` : ""}
            <span class="zl-gruppe-zahl">${items.length}</span>
          </summary>
          <div class="notiz-list">${zeilen}</div>
        </details>`;
    }).join("");
    if (kategorienSortiert.length > 1) {
      listeBereich.innerHTML = `
        <div class="row" style="margin:0.4rem 0 0.2rem; gap:0.8rem;">
          <button class="link-btn" onclick="invAlleGruppen(true)">Alle aufklappen</button>
          <button class="link-btn" onclick="invAlleGruppen(false)">Alle zuklappen</button>
        </div>
        <div class="spiel-gruppen">${listeBereich.innerHTML}</div>`;
    } else {
      listeBereich.innerHTML = `<div class="spiel-gruppen">${listeBereich.innerHTML}</div>`;
    }
  }

  // Merkt den Auf-/Zu-Zustand einer Inventar-Kategorie (nur ohne aktiven Filter)
  window.invGruppeUmschalten = function(el) {
    // Bei gewählter Kategorie ist sie automatisch offen – das nicht als Wunsch merken
    if (invAktiveKategorie !== "alle") return;
    const schluessel = el.dataset.schluessel;
    if (el.open) invGruppenOffen.add(schluessel); else invGruppenOffen.delete(schluessel);
    invGruppenMerken();
  };

  // Klappt alle Inventar-Kategorien auf oder zu und merkt den Zustand
  window.invAlleGruppen = function(auf) {
    const kategorien = [...new Set(ogsInventarAktuell().map((i) => i.kategorie))];
    kategorien.forEach((k) => {
      if (auf) invGruppenOffen.add(invGruppenSchluessel(k)); else invGruppenOffen.delete(invGruppenSchluessel(k));
    });
    invGruppenMerken();
    renderInventar();
  };

  // Setzt den Kategorie-Filter des Inventars und zeichnet neu
  window.invFilterAendern = function(wert) {
    invAktiveKategorie = wert;
    renderInventar();
  };

  document.getElementById("btn-inv-hinzufuegen").addEventListener("click", invHinzufuegen);

  // Legt einen neuen Inventar-Gegenstand an und klappt seine Kategorie auf
  async function invHinzufuegen() {
    const name = document.getElementById("neu-inv-name").value.trim();
    const kategorie = document.getElementById("neu-inv-kategorie").value.trim();
    if (!name || !kategorie) return;
    const menge = document.getElementById("neu-inv-menge").value || 1;
    const standort = document.getElementById("neu-inv-standort").value.trim() || null;
    const beschreibung = document.getElementById("neu-inv-beschreibung").value.trim() || null;
    const zustand = document.getElementById("neu-inv-zustand").value;
    const wiederbeschaffungswert = document.getElementById("neu-inv-wert").value.trim();
    try {
      await api("ogs_inventar_hinzufuegen", { name, kategorie, menge, standort, beschreibung, zustand, wiederbeschaffungswert, bereich: aktiverBereich });
    } catch (fehler) {
      alert("Speichern fehlgeschlagen: " + fehler.message);
      return;
    }
    // Seit die Kategorien zuklappbar sind (Session 29): die Kategorie des neuen
    // Gegenstands aufklappen, sonst verschwindet er in einem zugeklappten Block
    // und es sieht aus, als wäre nichts gespeichert worden.
    invGruppenOffen.add(invGruppenSchluessel(kategorie));
    invGruppenMerken();
    document.getElementById("neu-inv-name").value = "";
    document.getElementById("neu-inv-kategorie").value = "";
    document.getElementById("neu-inv-menge").value = "1";
    document.getElementById("neu-inv-standort").value = "";
    document.getElementById("neu-inv-beschreibung").value = "";
    document.getElementById("neu-inv-zustand").value = "gut";
    document.getElementById("neu-inv-wert").value = "";
    await ladeDaten();
  }

  // Bearbeiten eines Gegenstands: seit Session 35 im Bearbeiten-Blatt
  window.invBearbeitenStart = function(id) {
    window.blattOeffnen("inventar", id);
  };

  // Löscht einen Inventar-Gegenstand nach Rückfrage
  window.invLoeschen = async function(id) {
    if (!confirm("Diesen Gegenstand wirklich löschen?")) return;
    await api("ogs_inventar_loeschen", { id });
    await ladeDaten();
  };

  // ==========================================================
  // OGS Rapunzel – Projekte (mit Datei-Ablage)
  // ==========================================================
  const PROJ_ERLAUBTE_TYPEN = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const PROJ_MAX_BYTES = 5 * 1024 * 1024;

  // Liest eine Datei als Base64-String (ohne Data-URL-Präfix) ein
  function dateiZuBase64(datei) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(datei);
    });
  }

  // Rendert die OGS-Projekte mit Unterprojekten und Dateien
  function renderProjekte() {
    const bereich = document.getElementById("proj-liste-bereich");
    if (!bereich) return;

    const projekteAktuellOgs = ogsProjekteAktuell();

    const datalist = document.getElementById("proj-kategorie-liste");
    if (datalist) {
      const kategorien = [...new Set(projekteAktuellOgs.map((p) => p.kategorie).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      datalist.innerHTML = kategorien.map((k) => `<option value="${escapeAttr(k)}"></option>`).join("");
    }

    // Nur echte Hauptprojekte (ohne eigenes hauptprojekt_id) stehen als
    // Zuordnungs-Ziel zur Auswahl – so bleibt es bei einer Ebene.
    const hauptprojekte = projekteAktuellOgs.filter((p) => !p.hauptprojekt_id);
    const hauptSelect = document.getElementById("neu-proj-hauptprojekt");
    if (hauptSelect) {
      const bisher = hauptSelect.value;
      hauptSelect.innerHTML = '<option value="">– Eigenständiges Hauptprojekt –</option>' +
        hauptprojekte.map((p) => `<option value="${p.id}">${escapeAttr(p.titel)}</option>`).join("");
      if (hauptprojekte.some((p) => p.id === bisher)) hauptSelect.value = bisher;
    }

    if (projekteAktuellOgs.length === 0) {
      bereich.innerHTML = '<p class="empty-text">Noch keine Projekte hinterlegt.</p>';
      return;
    }

    // Baut das HTML eines (Unter-)Projekts mit Dateien (Bearbeiten öffnet das Blatt)
    function projektHtml(p, istUnterprojekt) {
      const datum = new Date(p.erstellt_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      const dateien = ogsProjektDateien.filter((d) => d.projekt_id === p.id);
      const itemKlasse = istUnterprojekt ? "proj-unter-item" : "notiz-item";

      const dateiZeilen = dateien.map((d) => {
        const hochgeladen = new Date(d.hochgeladen_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
        return `
              <div>${ic("anhang")} <span onclick="event.stopPropagation(); projDateiOeffnen('${d.id}')" style="text-decoration:underline; cursor:pointer;">${escapeHtml(d.datei_name)}</span>
                <span style="opacity:0.65;">(${hochgeladen})</span>
                <span onclick="event.stopPropagation(); projDateiLoeschen('${d.id}')" style="cursor:pointer; margin-left:0.3rem;" title="Datei entfernen" aria-label="Datei entfernen">${ic("x")}</span></div>`;
      }).join("");

      const unterprojekte = istUnterprojekt ? [] : projekteAktuellOgs.filter((u) => u.hauptprojekt_id === p.id);
      const unterprojekteHtml = unterprojekte.length > 0
        ? `<div class="proj-unter-liste">${unterprojekte.map((u) => projektHtml(u, true)).join("")}</div>`
        : "";

      return `
        <div class="${itemKlasse}">
          <div style="flex:1;">
            ${istUnterprojekt ? '<div class="proj-unter-label">Unterprojekt</div>' : ""}
            <div style="cursor:pointer;" onclick="projBearbeitenStart('${p.id}')">
              <span class="notiz-text">${escapeHtml(p.titel)}</span>
              ${p.beschreibung ? `<div class="notiz-meta" style="margin-top:0.2rem;">${escapeHtml(p.beschreibung)}</div>` : ""}
              <div class="notiz-meta" style="margin-top:0.3rem;">
                ${datum}${p.kategorie ? " · " + escapeHtml(p.kategorie) : ""}
              </div>
              <div class="notiz-meta" style="margin-top:0.3rem;">
                ${dateiZeilen}
                <label style="text-decoration:underline; cursor:pointer;" onclick="event.stopPropagation();">${ic("anhang")} Datei hinzufügen<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none;" onchange="projDateiHinzufuegen('${p.id}', this)"></label>
              </div>
            </div>
            ${unterprojekteHtml}
          </div>
          <button class="task-delete" onclick="projLoeschen('${p.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>`;
    }

    const html = hauptprojekte.map((p) => projektHtml(p, false)).join("");
    bereich.innerHTML = `<div class="notiz-list">${html}</div>`;
  }

  document.getElementById("btn-proj-hinzufuegen").addEventListener("click", projHinzufuegen);

  // Legt ein neues OGS-Projekt an, optional mit Hauptprojekt und PDF/DOCX-Datei (max. 5 MB)
  async function projHinzufuegen() {
    const titel = document.getElementById("neu-proj-titel").value.trim();
    if (!titel) return;
    const kategorie = document.getElementById("neu-proj-kategorie").value.trim() || null;
    const beschreibung = document.getElementById("neu-proj-beschreibung").value.trim() || null;
    const hauptprojektId = document.getElementById("neu-proj-hauptprojekt").value || null;
    const dateiInput = document.getElementById("neu-proj-datei");
    const datei = dateiInput.files[0];

    const payload = { titel, kategorie, beschreibung, hauptprojekt_id: hauptprojektId, bereich: aktiverBereich };
    if (datei) {
      if (!PROJ_ERLAUBTE_TYPEN.includes(datei.type)) {
        alert("Nur PDF- und Word-Dateien (.docx) sind erlaubt.");
        return;
      }
      if (datei.size > PROJ_MAX_BYTES) {
        alert("Die Datei ist größer als 5 MB.");
        return;
      }
      payload.datei_base64 = await dateiZuBase64(datei);
      payload.datei_name = datei.name;
      payload.datei_typ = datei.type;
    }

    await api("ogs_projekt_hinzufuegen", payload);
    document.getElementById("neu-proj-titel").value = "";
    document.getElementById("neu-proj-kategorie").value = "";
    document.getElementById("neu-proj-beschreibung").value = "";
    document.getElementById("neu-proj-hauptprojekt").value = "";
    dateiInput.value = "";
    await ladeDaten();
  }

  // Bearbeiten eines Projekts: seit Session 35 im Bearbeiten-Blatt
  window.projBearbeitenStart = function(id) {
    window.blattOeffnen("projekt", id);
  };

  // Löscht ein Projekt samt hinterlegter Dateien nach Rückfrage
  window.projLoeschen = async function(id) {
    if (!confirm("Dieses Projekt inklusive hinterlegter Dateien wirklich löschen?")) return;
    try {
      await api("ogs_projekt_loeschen", { id });
      await ladeDaten();
    } catch (e) {
      alert("Konnte nicht gelöscht werden: " + e.message);
    }
  };

  // Holt eine Download-URL für eine Projektdatei und öffnet sie in neuem Tab
  window.projDateiOeffnen = async function(dateiId) {
    try {
      const res = await api("ogs_projekt_datei_url", { datei_id: dateiId });
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      alert("Datei konnte nicht geöffnet werden: " + e.message);
    }
  };

  // Prüft Typ (PDF/DOCX) und Größe (max. 5 MB) und lädt eine Datei zu einem Projekt hoch
  window.projDateiHinzufuegen = async function(id, input) {
    const datei = input.files[0];
    if (!datei) return;
    if (!PROJ_ERLAUBTE_TYPEN.includes(datei.type)) {
      alert("Nur PDF- und Word-Dateien (.docx) sind erlaubt.");
      input.value = "";
      return;
    }
    if (datei.size > PROJ_MAX_BYTES) {
      alert("Die Datei ist größer als 5 MB.");
      input.value = "";
      return;
    }
    const datei_base64 = await dateiZuBase64(datei);
    await api("ogs_projekt_datei_hinzufuegen", {
      id, datei_base64, datei_name: datei.name, datei_typ: datei.type,
    });
    await ladeDaten();
  };

  // Entfernt eine Datei aus einem Projekt nach Rückfrage
  window.projDateiLoeschen = async function(dateiId) {
    if (!confirm("Diese Datei wirklich entfernen?")) return;
    await api("ogs_projekt_datei_loeschen", { datei_id: dateiId });
    await ladeDaten();
  };

  // ==========================================================
  // OGS Rapunzel – Projekte: CSV-Bulk-Import
  // ==========================================================
  document.getElementById("btn-proj-csv-import").addEventListener("click", projCsvImport);

  function csvZeileSplitten(zeile) {
    // Einfacher CSV-Parser: unterstützt Kommas innerhalb von "..."-Feldern.
    const felder = [];
    let aktuell = "";
    let inQuotes = false;
    for (let i = 0; i < zeile.length; i++) {
      const zeichen = zeile[i];
      if (zeichen === '"') {
        if (inQuotes && zeile[i + 1] === '"') { aktuell += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (zeichen === "," && !inQuotes) {
        felder.push(aktuell);
        aktuell = "";
      } else {
        aktuell += zeichen;
      }
    }
    felder.push(aktuell);
    return felder.map((f) => f.trim());
  }

  // Importiert Projekte aus einer CSV-Datei (Spalten Titel, Beschreibung, Kategorie) in den aktiven Bereich
  async function projCsvImport() {
    const input = document.getElementById("proj-csv-datei");
    const status = document.getElementById("proj-csv-status");
    const datei = input.files[0];
    if (!datei) { status.textContent = "Bitte zuerst eine CSV-Datei auswählen."; return; }

    const text = await datei.text();
    const zeilen = text.split(/\r?\n/).filter((z) => z.trim() !== "");
    if (zeilen.length < 2) { status.textContent = "Datei enthält keine Datenzeilen."; return; }

    const kopf = csvZeileSplitten(zeilen[0]).map((h) => h.toLowerCase());
    const idxTitel = kopf.findIndex((h) => h.includes("titel"));
    const idxBeschreibung = kopf.findIndex((h) => h.includes("beschreibung"));
    const idxKategorie = kopf.findIndex((h) => h.includes("kategorie"));

    if (idxTitel === -1) {
      status.textContent = 'Spalte "Titel" nicht gefunden – bitte Kopfzeile prüfen.';
      return;
    }

    const importZeilen = zeilen.slice(1).map((z) => {
      const felder = csvZeileSplitten(z);
      return {
        titel: felder[idxTitel] || "",
        beschreibung: idxBeschreibung > -1 ? felder[idxBeschreibung] || "" : "",
        kategorie: idxKategorie > -1 ? felder[idxKategorie] || "" : "",
      };
    }).filter((z) => z.titel);

    if (importZeilen.length === 0) {
      status.textContent = "Keine gültigen Zeilen gefunden (Titel fehlt überall).";
      return;
    }

    const res = await api("ogs_projekte_csv_import", { zeilen: importZeilen, bereich: aktiverBereich });
    status.textContent = `${res.anzahl} Projekte importiert.`;
    input.value = "";
    await ladeDaten();
  }

  // ==========================================================
  // Verleih (Verleih-Historie für Inventar-Gegenstände)
  // ==========================================================
  function datumDe(iso) {
    if (!iso) return "";
    const [j, m, t] = [iso.slice(0, 4), iso.slice(5, 7), iso.slice(8, 10)];
    return `${t}.${m}.${j}`;
  }

  // Rendert Inventar-Auswahl und Verleihliste (offen/zurückgegeben), jeweils gruppiert nach Person
  function renderVerleih() {
    const bereichEl = document.getElementById("verleih-liste-bereich");
    if (!bereichEl) return;

    const inventarAktuell = ogsInventarAktuell().slice().sort((a, b) => a.name.localeCompare(b.name));
    const select = document.getElementById("verleih-inventar");
    if (select) {
      const bisher = select.value;
      select.innerHTML = inventarAktuell.length
        ? inventarAktuell.map((i) => `<option value="${i.id}">${escapeAttr(i.name)}${i.kategorie ? " · " + escapeAttr(i.kategorie) : ""}</option>`).join("")
        : '<option value="">Kein Inventar vorhanden</option>';
      if (inventarAktuell.some((i) => i.id === bisher)) select.value = bisher;
    }

    const eintraegeAktuell = verleihAktuell();
    const inventarById = Object.fromEntries(ogsInventar.map((i) => [i.id, i]));

    // Liefert den Namen des verliehenen Gegenstands oder einen Platzhalter, falls gelöscht
    function gegenstandName(v) {
      return inventarById[v.inventar_id]?.name || "(gelöschter Gegenstand)";
    }

    // Baut das HTML eines Verleih-Eintrags (Bearbeiten öffnet das Blatt)
    function eintragHtml(v) {
      const offen = !v.rueckgabe_am;
      return `
        <div class="notiz-item">
          <div style="flex:1; cursor:pointer;" onclick="verleihBearbeitenStart('${v.id}')">
            <span class="notiz-text">${v.menge}× ${escapeHtml(gegenstandName(v))}</span>
            <span class="notiz-meta">
              seit ${datumDe(v.ausgeliehen_am)}${offen ? "" : " · zurück am " + datumDe(v.rueckgabe_am)}
              ${v.notiz ? " · " + escapeHtml(v.notiz) : ""}
            </span>
          </div>
          ${offen ? `<button class="btn-primary" style="white-space:nowrap;" onclick="event.stopPropagation(); verleihRueckgabe('${v.id}')">Zurück (heute)</button>` : ""}
          <button class="task-delete" onclick="event.stopPropagation(); verleihLoeschen('${v.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>`;
    }

    const offeneEintraege = eintraegeAktuell.filter((v) => !v.rueckgabe_am);
    const zurueckEintraege = eintraegeAktuell.filter((v) => v.rueckgabe_am);

    // Gruppiert Verleih-Einträge nach Person, sortiert nach Datumsfeld und erzeugt aufklappbare Blöcke
    function nachPersonGruppiert(liste, datumsfeld, aufsteigend) {
      const gruppen = {};
      liste.forEach((v) => { (gruppen[v.ausgeliehen_an] = gruppen[v.ausgeliehen_an] || []).push(v); });
      const personenSortiert = Object.keys(gruppen).sort((a, b) => a.localeCompare(b));
      return personenSortiert.map((person) => {
        const eintraege = gruppen[person].sort((a, b) =>
          aufsteigend ? a[datumsfeld].localeCompare(b[datumsfeld]) : b[datumsfeld].localeCompare(a[datumsfeld]));
        const anzahl = eintraege.reduce((s, v) => s + v.menge, 0);
        return `
          <details class="verleih-person" open>
            <summary>${escapeHtml(person)} <span class="empty-text">(${anzahl} Gegenstand${anzahl === 1 ? "" : "e"})</span></summary>
            <div class="notiz-list">${eintraege.map(eintragHtml).join("")}</div>
          </details>`;
      }).join("");
    }

    let html = `<h3 style="margin-top:1.2rem; margin-bottom:0.4rem; font-size:0.95rem; color:var(--ink-dim);">Aktuell ausgeliehen (${offeneEintraege.length})</h3>`;
    html += offeneEintraege.length
      ? nachPersonGruppiert(offeneEintraege, "ausgeliehen_am", true)
      : '<p class="empty-text">Gerade ist nichts verliehen.</p>';

    html += `<h3 style="margin-top:1.6rem; margin-bottom:0.4rem; font-size:0.95rem; color:var(--ink-dim);">Zurückgegeben (${zurueckEintraege.length})</h3>`;
    html += zurueckEintraege.length
      ? nachPersonGruppiert(zurueckEintraege, "rueckgabe_am", false)
      : '<p class="empty-text">Noch keine Rückgaben erfasst.</p>';

    bereichEl.innerHTML = html;
  }

  document.getElementById("btn-verleih-hinzufuegen").addEventListener("click", verleihHinzufuegen);

  // Legt einen neuen Verleih-Eintrag aus dem Formular an und setzt die Felder zurück
  async function verleihHinzufuegen() {
    const inventar_id = document.getElementById("verleih-inventar").value;
    const ausgeliehen_an = document.getElementById("verleih-an").value.trim();
    if (!inventar_id || !ausgeliehen_an) return;
    const menge = document.getElementById("verleih-menge").value || 1;
    const ausgeliehen_am = document.getElementById("verleih-am").value || heuteISO();
    const notiz = document.getElementById("verleih-notiz").value.trim() || null;

    await api("verleih_hinzufuegen", { inventar_id, ausgeliehen_an, menge, ausgeliehen_am, notiz, bereich: aktiverBereich });
    document.getElementById("verleih-an").value = "";
    document.getElementById("verleih-menge").value = "1";
    document.getElementById("verleih-am").value = "";
    document.getElementById("verleih-notiz").value = "";
    await ladeDaten();
  }

  // Markiert einen Verleih als heute zurückgegeben und lädt die Daten neu
  window.verleihRueckgabe = async function(id) {
    await api("verleih_rueckgabe", { id });
    await ladeDaten();
  };

  // Löscht einen Verleih-Eintrag nach Rückfrage
  window.verleihLoeschen = async function(id) {
    if (!confirm("Diesen Verleih-Eintrag endgültig löschen?")) return;
    await api("verleih_loeschen", { id });
    await ladeDaten();
  };

  // Bearbeiten eines Verleih-Eintrags: seit Session 35 im Bearbeiten-Blatt
  window.verleihBearbeitenStart = function(id) {
    window.blattOeffnen("verleih", id);
  };

  // ==========================================================
  // Training (Trainingsverlauf, Standard: nur Privat)
  // ==========================================================
  let trainingBearbeitenId = null;
  let trainingFormUebungen = []; // Übungs-Zeilen im "Neu"-Formular
  let trainingBearbeitenUebungen = []; // Übungs-Zeilen im gerade offenen Bearbeiten-Formular
  let trainingFormPlanId = null; // im "Neu"-Formular ausgewählter Plan (Verlinkung)
  let planBearbeitenId = null;
  let planFormUebungen = []; // Übungs-Zeilen im "Neuer Plan"-Formular
  let planBearbeitenUebungen = []; // Übungs-Zeilen im gerade offenen Plan-Bearbeiten-Formular
  let trainingFilterSportart = "";
  let trainingFilterOrt = "";
  let trainingFilterVon = "";
  let trainingFilterBis = "";
  let sessionTickHandle = null; // Tick für Gesamtzeit + Satz-Countdown im Fokus-Modus
  let trainingSession = null; // aktive "Plan starten"-Session: { planId, planName, sportart, ort, index, uebungen }

  // Montag der Woche, in der "iso" liegt (lokale Zeit, ISO-Datum rein/raus).
  function wochenstartISO(iso) {
    const d = new Date(iso + "T00:00:00");
    const tag = d.getDay(); // 0 = So, 1 = Mo, ...
    const diffZuMontag = tag === 0 ? -6 : 1 - tag;
    d.setDate(d.getDate() + diffZuMontag);
    return datumLokalISO(d);
  }

  // Liefert das Wochenziel für eine Sportart im aktiven Bereich (Gesamtziel ohne Eintrag: 2)
  function trainingWochenziel(sportart) {
    const key = (sportart || "").trim();
    const eintrag = trainingEinstellungen.find((e) => e.bereich === aktiverBereich && (e.sportart || "") === key);
    if (eintrag) return eintrag.wochenziel;
    return key ? null : 2;
  }

  // Liefert die sportartspezifischen Wochenziele des aktiven Bereichs, alphabetisch sortiert
  function trainingSportartZieleAktuell() {
    return trainingEinstellungen
      .filter((e) => e.bereich === aktiverBereich && (e.sportart || "").trim())
      .slice()
      .sort((a, b) => a.sportart.localeCompare(b.sportart));
  }

  // Längste je erreichte Serie von Wochen in Folge mit erreichtem Wochenziel
  // (Lücken ohne Eintrag zählen als 0 und brechen die Serie). Bezieht sich
  // auf das aktuell eingestellte Wochenziel, unabhängig davon, ob es früher
  // ein anderes war.
  function trainingLaengsteStreak(gruppen, zielWoche) {
    const keys = Object.keys(gruppen);
    if (!keys.length) return 0;
    const erste = keys.slice().sort()[0];
    const letzte = wochenstartISO(heuteISO());
    const cursor = new Date(erste + "T00:00:00");
    const ende = new Date(letzte + "T00:00:00");
    let laengste = 0, aktuell = 0;
    while (cursor <= ende) {
      const iso = datumLokalISO(cursor);
      const anzahl = (gruppen[iso] || []).length;
      if (anzahl >= zielWoche) {
        aktuell++;
        if (aktuell > laengste) laengste = aktuell;
      } else {
        aktuell = 0;
      }
      cursor.setDate(cursor.getDate() + 7);
    }
    return laengste;
  }

  // Erzeugt das HTML einer Übungs-Eingabezeile (Name, Sätze, Wdh, Sek., kg, Variante)
  function trainingUebungZeileHtml(u, i, praefix) {
    return `
      <div class="row" style="gap:0.4rem; margin-bottom:0.3rem; flex-wrap:wrap;">
        <input type="text" id="${praefix}-ueb-name-${i}" value="${escapeAttr(u.name || "")}" placeholder="Übung (z.B. Rudern)" list="training-uebung-namen-liste" style="flex:1; min-width:120px;">
        <input type="number" id="${praefix}-ueb-saetze-${i}" value="${u.saetze ?? ""}" placeholder="Sätze" min="0" style="width:4.3rem;">
        <input type="number" id="${praefix}-ueb-wdh-${i}" value="${u.wiederholungen ?? ""}" placeholder="Wdh" min="0" style="width:4.3rem;">
        <input type="number" id="${praefix}-ueb-sekunden-${i}" value="${u.sekunden ?? ""}" placeholder="Sek." min="0" title="Sekunden (statt Wdh., z.B. für Plank)" style="width:4.3rem;">
        <input type="number" id="${praefix}-ueb-gewicht-${i}" value="${u.gewicht_kg ?? ""}" placeholder="kg" min="0" step="0.5" style="width:4.3rem;">
        <input type="text" id="${praefix}-ueb-progression-${i}" value="${escapeAttr(u.progression || "")}" placeholder="Variante (z.B. unterstützt)" style="flex:1; min-width:110px;">
        <button class="task-delete" type="button" onclick="trainingUebungZeileEntfernen('${praefix}', ${i})" aria-label="Löschen">${ic("x")}</button>
      </div>`;
  }

  // Erzeugt den Block mit allen Übungszeilen plus Button zum Hinzufügen
  function trainingUebungenBlockHtml(arr, praefix) {
    return `
      <div id="${praefix}-uebungen-liste">${arr.map((u, i) => trainingUebungZeileHtml(u, i, praefix)).join("")}</div>
      <button class="link-btn" type="button" onclick="trainingUebungZeileHinzufuegen('${praefix}')">+ Übung hinzufügen</button>`;
  }

  // Liest die aktuell im DOM stehenden Werte einer Übungs-Zeilenliste aus
  // (nötig, weil Zeile-hinzufügen/-entfernen die Liste neu rendert und
  // dabei sonst schon eingetippte Werte in den übrigen Zeilen verlieren
  // würde).
  function trainingUebungenAusDom(praefix, anzahl) {
    const arr = [];
    for (let i = 0; i < anzahl; i++) {
      arr.push({
        name: document.getElementById(`${praefix}-ueb-name-${i}`)?.value.trim() || "",
        saetze: document.getElementById(`${praefix}-ueb-saetze-${i}`)?.value || "",
        wiederholungen: document.getElementById(`${praefix}-ueb-wdh-${i}`)?.value || "",
        sekunden: document.getElementById(`${praefix}-ueb-sekunden-${i}`)?.value || "",
        gewicht_kg: document.getElementById(`${praefix}-ueb-gewicht-${i}`)?.value || "",
        progression: document.getElementById(`${praefix}-ueb-progression-${i}`)?.value.trim() || "",
      });
    }
    return arr;
  }

  // Liefert das passende Übungs-Array zum Formular-Präfix (neu, Plan neu, Plan/Training bearbeiten)
  function trainingUebungenArray(praefix) {
    if (praefix === "neu") return trainingFormUebungen;
    if (praefix === "plan-neu") return planFormUebungen;
    if (praefix.startsWith("plan-edit-")) return planBearbeitenUebungen;
    return trainingBearbeitenUebungen;
  }

  // Fügt eine leere Übungszeile hinzu, ohne bereits eingetippte Werte zu verlieren
  window.trainingUebungZeileHinzufuegen = function(praefix) {
    const arr = trainingUebungenArray(praefix);
    const aktuell = trainingUebungenAusDom(praefix, arr.length);
    aktuell.push({ name: "", saetze: "", wiederholungen: "", gewicht_kg: "" });
    arr.length = 0;
    arr.push(...aktuell);
    renderTraining();
  };

  // Entfernt eine Übungszeile, ohne eingetippte Werte der übrigen Zeilen zu verlieren
  window.trainingUebungZeileEntfernen = function(praefix, index) {
    const arr = trainingUebungenArray(praefix);
    const aktuell = trainingUebungenAusDom(praefix, arr.length);
    aktuell.splice(index, 1);
    arr.length = 0;
    arr.push(...aktuell);
    renderTraining();
  };

  // Rendert den Trainingsbereich: Filter, Wochenziel/Serie, Unterbereiche und Wochenliste der Einträge
  function renderTraining() {
    // Für die kcal-Anzeige in Privat: Gewicht und MET-Werte einmal laden
    if (aktiverBereich === "privat" && !ernProfilGeladen && !ernProfilLaedt && !ernProfilFehlgeschlagen) ernProfilLaden();
    const bereichEl = document.getElementById("training-liste-bereich");
    if (!bereichEl) return;

    const eintraegeAktuell = trainingAktuell().slice().sort((a, b) => b.datum.localeCompare(a.datum));
    const uebungenByTraining = {};
    trainingUebungen.forEach((u) => {
      (uebungenByTraining[u.training_id] = uebungenByTraining[u.training_id] || []).push(u);
    });

    // Filter (Sportart/Ort/Zeitraum, kombinierbar) – wirkt auf Liste
    // UND auf die Wochenziel-/Serien-Anzeige oben.
    const eintraegeGefiltert = eintraegeAktuell.filter((t) => {
      if (trainingFilterSportart && t.sportart !== trainingFilterSportart) return false;
      if (trainingFilterOrt && t.ort !== trainingFilterOrt) return false;
      if (trainingFilterVon && t.datum < trainingFilterVon) return false;
      if (trainingFilterBis && t.datum > trainingFilterBis) return false;
      return true;
    });

    const filterSportartEl = document.getElementById("training-filter-sportart");
    if (filterSportartEl) {
      const sportarten = [...new Set(eintraegeAktuell.map((t) => t.sportart))].filter(Boolean).sort((a, b) => a.localeCompare(b));
      filterSportartEl.innerHTML = '<option value="">Alle Sportarten</option>'
        + sportarten.map((s) => `<option value="${escapeAttr(s)}" ${s === trainingFilterSportart ? "selected" : ""}>${escapeHtml(s)}</option>`).join("");
    }
    const filterOrtEl = document.getElementById("training-filter-ort");
    if (filterOrtEl) {
      const orte = [...new Set(eintraegeAktuell.map((t) => t.ort))].filter(Boolean).sort((a, b) => a.localeCompare(b));
      filterOrtEl.innerHTML = '<option value="">Alle Orte</option>'
        + orte.map((o) => `<option value="${escapeAttr(o)}" ${o === trainingFilterOrt ? "selected" : ""}>${escapeHtml(o)}</option>`).join("");
    }
    const filterVonEl = document.getElementById("training-filter-von");
    if (filterVonEl) filterVonEl.value = trainingFilterVon;
    const filterBisEl = document.getElementById("training-filter-bis");
    if (filterBisEl) filterBisEl.value = trainingFilterBis;

    // Wochenziel-Fortschritt der aktuellen Woche + längste je erreichte Streak
    // (bezogen auf die gefilterte Auswahl; bei aktivem Sportart-Filter zählt
    // deren eigenes Ziel, falls eines hinterlegt ist, sonst das Gesamtziel)
    const wocheStart = wochenstartISO(heuteISO());
    const zielSportartSpezifisch = trainingFilterSportart ? trainingWochenziel(trainingFilterSportart) : null;
    const zielWoche = zielSportartSpezifisch !== null ? zielSportartSpezifisch : trainingWochenziel("");
    const anzahlDieseWoche = eintraegeGefiltert.filter((t) => t.datum >= wocheStart).length;
    const gruppenFuerStreak = {};
    eintraegeGefiltert.forEach((t) => {
      const start = wochenstartISO(t.datum);
      (gruppenFuerStreak[start] = gruppenFuerStreak[start] || []).push(t);
    });
    const laengsteStreak = trainingLaengsteStreak(gruppenFuerStreak, zielWoche);
    const zielEl = document.getElementById("training-wochenziel-anzeige");
    if (zielEl) {
      const erreicht = anzahlDieseWoche >= zielWoche;
      const zielLabel = trainingFilterSportart ? ` – ${escapeHtml(trainingFilterSportart)}` : "";
      zielEl.innerHTML = `
        <span style="font-weight:600;">${anzahlDieseWoche} von ${zielWoche}</span> diese Woche${zielLabel}${erreicht ? " ✓" : ""}
        <button class="link-btn" style="margin-left:0.6rem;" onclick="trainingZielBearbeiten()">Ziel ändern</button>
        ${laengsteStreak >= 1 ? `<div class="empty-text" style="margin-top:0.2rem;">${ic("flamme")} Längste Serie: ${laengsteStreak} Woche${laengsteStreak === 1 ? "" : "n"} in Folge Ziel erreicht</div>` : ""}`;
    }

    renderTrainingSession();
    renderTrainingSportartZiele(eintraegeAktuell, wocheStart);

    // Sportart/Ort-Vorschläge aus bisherigen Einträgen (Autovervollständigung)
    const orteBisher = [...new Set(training.map((t) => t.ort).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const ortList = document.getElementById("training-ort-liste");
    if (ortList) ortList.innerHTML = orteBisher.map((o) => `<option value="${escapeAttr(o)}">`).join("");

    const uebungenFormEl = document.getElementById("training-neu-uebungen");
    if (uebungenFormEl) uebungenFormEl.innerHTML = trainingUebungenBlockHtml(trainingFormUebungen, "neu");

    renderTrainingsplaene();
    renderTrainingsstammdaten();
    renderTimerVerwaltung();
    renderZielEvents();
    renderKategorieAuswertung();
    renderTrainingsverlauf();

    // Fortschritts-Trend: letztes bekanntes Gewicht je Übungsname (gleicher
    // Bereich, chronologisch davor) zum Vergleich mit dem aktuellen Wert.
    const trainingByIdAktuell = {};
    eintraegeAktuell.forEach((t) => { trainingByIdAktuell[t.id] = t; });

    // Ermittelt das letzte frühere Gewicht derselben Übung für die Trendanzeige
    function vorherigesGewicht(t, u) {
      if (u.gewicht_kg === null || u.gewicht_kg === undefined || u.gewicht_kg === "") return null;
      const name = (u.name || "").trim().toLowerCase();
      if (!name) return null;
      let bestes = null;
      trainingUebungen.forEach((other) => {
        if (other.training_id === t.id) return;
        if (other.gewicht_kg === null || other.gewicht_kg === undefined || other.gewicht_kg === "") return;
        if ((other.name || "").trim().toLowerCase() !== name) return;
        const ot = trainingByIdAktuell[other.training_id];
        if (!ot || ot.datum > t.datum) return;
        if (!bestes || ot.datum > bestes.datum) bestes = { datum: ot.datum, gewicht_kg: other.gewicht_kg };
      });
      return bestes ? bestes.gewicht_kg : null;
    }

    // Bestleistung: neues Maximum bei Gewicht ODER Wiederholungen für diese
    // Übung (gleicher Bereich), verglichen mit allen vorherigen Einträgen.
    // Ohne vorherigen Eintrag zu dieser Übung gilt es noch nicht als "neu".
    function istBestleistung(t, u) {
      const hatGewicht = u.gewicht_kg !== null && u.gewicht_kg !== undefined && u.gewicht_kg !== "";
      const hatWdh = u.wiederholungen !== null && u.wiederholungen !== undefined && u.wiederholungen !== "";
      const hatSekunden = u.sekunden !== null && u.sekunden !== undefined && u.sekunden !== "";
      if (!hatGewicht && !hatWdh && !hatSekunden) return false;
      const name = (u.name || "").trim().toLowerCase();
      if (!name) return false;
      let maxGewicht = null, maxWdh = null, maxSekunden = null;
      trainingUebungen.forEach((other) => {
        if (other.training_id === t.id) return;
        if ((other.name || "").trim().toLowerCase() !== name) return;
        const ot = trainingByIdAktuell[other.training_id];
        if (!ot || ot.datum > t.datum) return;
        if (other.gewicht_kg !== null && other.gewicht_kg !== undefined && other.gewicht_kg !== "") {
          const w = Number(other.gewicht_kg);
          if (maxGewicht === null || w > maxGewicht) maxGewicht = w;
        }
        if (other.wiederholungen !== null && other.wiederholungen !== undefined && other.wiederholungen !== "") {
          const r = Number(other.wiederholungen);
          if (maxWdh === null || r > maxWdh) maxWdh = r;
        }
        if (other.sekunden !== null && other.sekunden !== undefined && other.sekunden !== "") {
          const s = Number(other.sekunden);
          if (maxSekunden === null || s > maxSekunden) maxSekunden = s;
        }
      });
      if (maxGewicht === null && maxWdh === null && maxSekunden === null) return false; // erster Eintrag: kein Vergleich möglich
      const gewichtNeu = hatGewicht && (maxGewicht === null || Number(u.gewicht_kg) > maxGewicht);
      const wdhNeu = hatWdh && (maxWdh === null || Number(u.wiederholungen) > maxWdh);
      const sekundenNeu = hatSekunden && (maxSekunden === null || Number(u.sekunden) > maxSekunden);
      return gewichtNeu || wdhNeu || sekundenNeu;
    }

    // Liefert einen Pfeil (↑/↓/→) für den Vergleich mit dem vorherigen Wert
    function trendSymbol(aktuell, vorher) {
      if (vorher === null || vorher === undefined) return "";
      const diff = Number(aktuell) - Number(vorher);
      if (diff > 0) return ` <span style="color:var(--mod-termine);">↑</span>`;
      if (diff < 0) return ` <span style="color:var(--overdue-text);">↓</span>`;
      return ` <span style="color:var(--ink-dim);">→</span>`;
    }

    // Rendert die Übungen eines Trainings als Chips mit Werten, Trend und Bestleistungs-Pokal
    function uebungenAnzeige(uebungenListe, t) {
      if (!uebungenListe.length) return "";
      const chips = uebungenListe.map((u) => {
        let werte = "";
        if (u.wiederholungen) werte += `${u.saetze || "?"}×${u.wiederholungen}`;
        else if (u.sekunden) werte += `${u.saetze || "?"}×${u.sekunden}s`;
        else if (u.saetze) werte += `${u.saetze} Sätze`;
        if (u.gewicht_kg) {
          if (werte) werte += " · ";
          werte += `${u.gewicht_kg} kg`;
          if (t) werte += trendSymbol(u.gewicht_kg, vorherigesGewicht(t, u));
        }
        if (u.progression) werte += `${werte ? " · " : ""}${escapeHtml(u.progression)}`;
        const bestleistung = t && istBestleistung(t, u);
        return `<span class="chip" style="cursor:default; padding-right:0.7rem;" ${bestleistung ? 'title="Neue Bestleistung"' : ""}>${chipBildHtml("uebung", u.name)}${bestleistung ? ic("pokal", "ic-pokal") + " " : ""}${escapeHtml(u.name)}${werte ? ` <span style="color:var(--ink-dim);">${werte}</span>` : ""}</span>`;
      });
      return `<div class="chip-liste" style="margin-top:0.4rem;">${chips.join("")}</div>`;
    }

    // Bestleistung (Strecke/Höhenmeter): neues Maximum für diese
    // Sportart (gleicher Bereich), verglichen mit allen vorherigen
    // Einträgen derselben Sportart. Ohne vorherigen Eintrag zu dieser
    // Sportart gilt es noch nicht als "neu".
    function istEntryBestleistung(t) {
      const hatStrecke = t.strecke_km !== null && t.strecke_km !== undefined && t.strecke_km !== "";
      const hatHoehenmeter = t.hoehenmeter !== null && t.hoehenmeter !== undefined && t.hoehenmeter !== "";
      if (!hatStrecke && !hatHoehenmeter) return false;
      const sportartName = (t.sportart || "").trim().toLowerCase();
      if (!sportartName) return false;
      let maxStrecke = null, maxHoehenmeter = null;
      eintraegeAktuell.forEach((other) => {
        if (other.id === t.id) return;
        if ((other.sportart || "").trim().toLowerCase() !== sportartName) return;
        if (other.datum > t.datum) return;
        if (other.strecke_km !== null && other.strecke_km !== undefined && other.strecke_km !== "") {
          const s = Number(other.strecke_km);
          if (maxStrecke === null || s > maxStrecke) maxStrecke = s;
        }
        if (other.hoehenmeter !== null && other.hoehenmeter !== undefined && other.hoehenmeter !== "") {
          const h = Number(other.hoehenmeter);
          if (maxHoehenmeter === null || h > maxHoehenmeter) maxHoehenmeter = h;
        }
      });
      if (maxStrecke === null && maxHoehenmeter === null) return false; // erster Eintrag: kein Vergleich möglich
      const streckeNeu = hatStrecke && (maxStrecke === null || Number(t.strecke_km) > maxStrecke);
      const hoehenmeterNeu = hatHoehenmeter && (maxHoehenmeter === null || Number(t.hoehenmeter) > maxHoehenmeter);
      return streckeNeu || hoehenmeterNeu;
    }

    // Baut das HTML eines Trainingseintrags – als Bearbeiten-Formular oder als Anzeigezeile
    function eintragHtml(t) {
      const uebungenListe = (uebungenByTraining[t.id] || []).slice().sort((a, b) => a.reihenfolge - b.reihenfolge);
      if (trainingBearbeitenId === t.id) {
        return `
          <div class="notiz-item" style="flex-direction:column; align-items:stretch;">
            <div class="row" style="flex-wrap:wrap;">
              <input type="date" id="training-edit-datum-${t.id}" value="${t.datum}">
              <input type="text" id="training-edit-sportart-${t.id}" value="${escapeAttr(t.sportart)}" placeholder="Sportart">
              <input type="text" id="training-edit-ort-${t.id}" value="${escapeAttr(t.ort || "")}" placeholder="Ort">
              <input type="number" id="training-edit-dauer-${t.id}" value="${t.dauer_minuten ?? ""}" placeholder="Minuten" min="0" style="width:6rem;">
              <input type="number" id="training-edit-strecke-${t.id}" value="${t.strecke_km ?? ""}" placeholder="km" min="0" step="0.1" style="width:5.5rem;" title="Strecke in km">
              <input type="number" id="training-edit-hoehenmeter-${t.id}" value="${t.hoehenmeter ?? ""}" placeholder="Höhenmeter" min="0" style="width:6.5rem;" title="Höhenmeter">
              <input type="number" id="training-edit-kcal-${t.id}" value="${t.kcal ?? ""}" placeholder="kcal (Uhr)" min="0" max="5000" style="width:7rem;" title="Kalorien, z. B. von der Sportuhr – leer lassen, dann schätzt die App">
              <input type="text" id="training-edit-notiz-${t.id}" value="${escapeAttr(t.notiz || "")}" placeholder="Notiz" style="flex:1; min-width:150px;">
              <select id="training-edit-plan-${t.id}" title="Verknüpfter Trainingsplan">
                <option value="">Kein Plan</option>
                ${trainingsplaeneAktuell().map((p) => `<option value="${p.id}" ${p.id === t.plan_id ? "selected" : ""}>${escapeAttr(p.name)}</option>`).join("")}
              </select>
            </div>
            <div style="margin-top:0.5rem;">
              ${trainingUebungenBlockHtml(trainingBearbeitenUebungen, `edit-${t.id}`)}
            </div>
            <div class="row" style="margin-top:0.5rem;">
              <button class="btn-primary" onclick="trainingBearbeitenSpeichern('${t.id}')">Speichern</button>
              <button class="link-btn" onclick="trainingBearbeitenAbbrechen()">Abbrechen</button>
            </div>
          </div>`;
      }
      return `
        <div class="notiz-item" style="cursor:pointer;" onclick="trainingBearbeitenStart('${t.id}')">
          <div style="flex:1;">
            <span class="notiz-text">${istEntryBestleistung(t) ? '<span title="Neue Bestleistung">' + ic("pokal", "ic-pokal") + '<span class="nur-vorleser">Neue Bestleistung</span></span> ' : ""}${escapeHtml(t.sportart)}${t.ort ? " · " + escapeHtml(t.ort) : ""}</span>
            <span class="notiz-meta">
              ${datumDe(t.datum)}${t.dauer_minuten ? " · " + t.dauer_minuten + " Min." : ""}
              ${t.strecke_km ? " · " + t.strecke_km + " km" : ""}
              ${t.hoehenmeter ? " · " + t.hoehenmeter + " Hm" : ""}
              ${trainingKcalAnzeige(t)}
              ${t.notiz ? " · " + escapeHtml(t.notiz) : ""}
              ${t.plan_id ? " · Plan: " + escapeHtml(planName(t.plan_id) || "?") : ""}
            </span>
            ${uebungenAnzeige(uebungenListe, t)}
          </div>
          <button class="task-delete" onclick="event.stopPropagation(); trainingLoeschen('${t.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>`;
    }

    const gruppen = {};
    eintraegeGefiltert.forEach((t) => {
      const start = wochenstartISO(t.datum);
      (gruppen[start] = gruppen[start] || []).push(t);
    });
    const wochenSortiert = Object.keys(gruppen).sort((a, b) => b.localeCompare(a));

    let html;
    if (!wochenSortiert.length) {
      const filterAktiv = trainingFilterSportart || trainingFilterOrt || trainingFilterVon || trainingFilterBis;
      html = `<p class="empty-text">${filterAktiv ? "Keine Einträge für diesen Filter." : "Noch kein Training erfasst."}</p>`;
    } else {
      html = wochenSortiert.map((start) => {
        const eintraege = gruppen[start];
        const anzahl = eintraege.length;
        const istAktuelleWoche = start === wocheStart;
        const erreicht = anzahl >= zielWoche;
        const label = istAktuelleWoche ? "Diese Woche" : `Woche ab ${datumDe(start)}`;
        return `
          <details class="verleih-person" ${istAktuelleWoche ? "open" : ""}>
            <summary>${label} <span class="empty-text">(${anzahl} Training${anzahl === 1 ? "" : "s"}${erreicht ? " ✓" : ""})</span></summary>
            <div class="notiz-list">${eintraege.map(eintragHtml).join("")}</div>
          </details>`;
      }).join("");
    }
    bereichEl.innerHTML = html;
  }

  document.getElementById("btn-training-hinzufuegen").addEventListener("click", trainingHinzufuegen);

  // Speichert ein neues Training samt Übungen aus dem Formular und setzt das Formular zurück
  async function trainingHinzufuegen() {
    const sportart = document.getElementById("training-sportart").value.trim();
    if (!sportart) return;
    const datum = document.getElementById("training-datum").value || heuteISO();
    const ort = document.getElementById("training-ort").value.trim() || null;
    const dauer_minuten = document.getElementById("training-dauer").value || null;
    const strecke_km = document.getElementById("training-strecke").value || null;
    const hoehenmeter = document.getElementById("training-hoehenmeter").value || null;
    const notiz = document.getElementById("training-notiz").value.trim() || null;
    const kcal = document.getElementById("training-kcal").value || null;
    const uebungen = trainingUebungenAusDom("neu", trainingFormUebungen.length);

    await api("training_hinzufuegen", { bereich: aktiverBereich, datum, sportart, ort, dauer_minuten, strecke_km, hoehenmeter, kcal, notiz, uebungen, plan_id: trainingFormPlanId });
    document.getElementById("training-kcal").value = "";

    document.getElementById("training-sportart").value = "";
    document.getElementById("training-ort").value = "";
    document.getElementById("training-dauer").value = "";
    document.getElementById("training-strecke").value = "";
    document.getElementById("training-hoehenmeter").value = "";
    document.getElementById("training-notiz").value = "";
    document.getElementById("training-datum").value = "";
    trainingFormUebungen = [];
    trainingFormPlanId = null;
    await ladeDaten();
    renderTraining();
  }

  // Löscht ein Training nach Rückfrage und rendert neu
  window.trainingLoeschen = async function(id) {
    if (!confirm("Dieses Training endgültig löschen?")) return;
    await api("training_loeschen", { id });
    await ladeDaten();
    renderTraining();
  };

  // Öffnet das Bearbeiten-Formular eines Trainings und lädt dessen Übungen ins Formular
  window.trainingBearbeitenStart = function(id) {
    trainingBearbeitenId = id;
    trainingBearbeitenUebungen = trainingUebungen
      .filter((u) => u.training_id === id)
      .sort((a, b) => a.reihenfolge - b.reihenfolge)
      .map((u) => ({ name: u.name, saetze: u.saetze ?? "", wiederholungen: u.wiederholungen ?? "", sekunden: u.sekunden ?? "", gewicht_kg: u.gewicht_kg ?? "", progression: u.progression ?? "" }));
    renderTraining();
  };

  // Bricht das Bearbeiten eines Trainings ab und verwirft die Formular-Übungen
  window.trainingBearbeitenAbbrechen = function() {
    trainingBearbeitenId = null;
    trainingBearbeitenUebungen = [];
    renderTraining();
  };

  // Speichert das bearbeitete Training inkl. Übungen und Plan-Verknüpfung und lädt neu
  window.trainingBearbeitenSpeichern = async function(id) {
    const sportart = document.getElementById(`training-edit-sportart-${id}`).value.trim();
    if (!sportart) return;
    const datum = document.getElementById(`training-edit-datum-${id}`).value;
    const ort = document.getElementById(`training-edit-ort-${id}`).value.trim() || null;
    const dauer_minuten = document.getElementById(`training-edit-dauer-${id}`).value || null;
    const strecke_km = document.getElementById(`training-edit-strecke-${id}`).value || null;
    const hoehenmeter = document.getElementById(`training-edit-hoehenmeter-${id}`).value || null;
    const notiz = document.getElementById(`training-edit-notiz-${id}`).value.trim() || null;
    const plan_id = document.getElementById(`training-edit-plan-${id}`).value || null;
    const kcal = document.getElementById(`training-edit-kcal-${id}`).value || null;
    const uebungen = trainingUebungenAusDom(`edit-${id}`, trainingBearbeitenUebungen.length);

    await api("training_aktualisieren", { id, datum, sportart, ort, dauer_minuten, strecke_km, hoehenmeter, kcal, notiz, plan_id, uebungen });
    trainingBearbeitenId = null;
    trainingBearbeitenUebungen = [];
    await ladeDaten();
    renderTraining();
  };

  // Fragt per Prompt das Wochenziel (gesamt oder für gefilterte Sportart) ab und speichert es
  window.trainingZielBearbeiten = async function() {
    const sportart = trainingFilterSportart || "";
    const aktuell = sportart ? (trainingWochenziel(sportart) ?? trainingWochenziel("")) : trainingWochenziel("");
    const label = sportart ? `Wochenziel für „${sportart}" (Anzahl Einheiten pro Woche):` : "Gesamt-Wochenziel (Anzahl Einheiten pro Woche):";
    const neu = prompt(label, aktuell);
    if (neu === null) return;
    const wert = parseInt(neu, 10);
    if (!Number.isFinite(wert) || wert < 0) return;
    await api("training_ziel_speichern", { bereich: aktiverBereich, sportart, wochenziel: wert });
    await ladeDaten();
    renderTraining();
  };

  // ------------------------------------------------------------
  // Trainingspläne (benannte Übungs-Vorlagen, verlinkbar mit
  // einzelnen Trainingseinträgen)
  // ------------------------------------------------------------

  function trainingsplaeneAktuell() {
    return trainingsplaene.filter((p) => bereichVon(p) === aktiverBereich);
  }

  // Liefert die Übungen eines Trainingsplans in Reihenfolge
  function planUebungenFuer(planId) {
    return trainingsplanUebungen.filter((u) => u.plan_id === planId).sort((a, b) => a.reihenfolge - b.reihenfolge);
  }

  // Liefert den Namen eines Trainingsplans zur ID oder null
  function planName(planId) {
    const p = trainingsplaene.find((pl) => pl.id === planId);
    return p ? p.name : null;
  }

  // Übernimmt die Übungen eines gewählten Plans in das "Neu"-Formular
  // für einen Trainingseintrag; bleibt danach frei editierbar.
  window.planAufTrainingAnwenden = function(planId) {
    trainingFormPlanId = planId || null;
    if (planId) {
      trainingFormUebungen = planUebungenFuer(planId)
        .map((u) => ({ name: u.name, saetze: u.saetze ?? "", wiederholungen: u.wiederholungen ?? "", sekunden: u.sekunden ?? "", gewicht_kg: u.gewicht_kg ?? "", progression: u.progression ?? "" }));
    }
    renderTraining();
  };

  // Rendert Plan-Auswahl, Liste der Trainingspläne und das Neu-Formular für Pläne
  function renderTrainingsplaene() {
    const listEl = document.getElementById("trainingsplan-liste");
    if (!listEl) return;
    const plaene = trainingsplaeneAktuell().slice().sort((a, b) => a.name.localeCompare(b.name));

    // Auswahl-Dropdown im "Neu"-Formular für Trainingseinträge
    const auswahlEl = document.getElementById("training-plan-auswahl");
    if (auswahlEl) {
      auswahlEl.innerHTML = '<option value="">Kein Plan</option>'
        + plaene.map((p) => `<option value="${p.id}">${escapeAttr(p.name)}</option>`).join("");
      auswahlEl.value = plaene.some((p) => p.id === trainingFormPlanId) ? trainingFormPlanId : "";
    }

    // Rendert die Übungen eines Plans als Chips mit Werten
    function uebungenAnzeige(liste) {
      if (!liste.length) return "";
      const chips = liste.map((u) => {
        let werte = "";
        if (u.wiederholungen) werte += `${u.saetze || "?"}×${u.wiederholungen}`;
        else if (u.sekunden) werte += `${u.saetze || "?"}×${u.sekunden}s`;
        else if (u.saetze) werte += `${u.saetze} Sätze`;
        if (u.gewicht_kg) werte += `${werte ? " · " : ""}${u.gewicht_kg} kg`;
        if (u.progression) werte += `${werte ? " · " : ""}${escapeHtml(u.progression)}`;
        return `<span class="chip" style="cursor:default; padding-right:0.7rem;">${chipBildHtml("uebung", u.name)}${escapeHtml(u.name)}${werte ? ` <span style="color:var(--ink-dim);">${werte}</span>` : ""}</span>`;
      });
      return `<div class="chip-liste" style="margin-top:0.4rem;">${chips.join("")}</div>`;
    }

    // Baut das HTML eines Plans – als Bearbeiten-Formular oder aufklappbar mit Aktionen
    function planHtml(p) {
      const uebungen = planUebungenFuer(p.id);
      if (planBearbeitenId === p.id) {
        return `
          <div class="notiz-item" style="flex-direction:column; align-items:stretch;">
            <input type="text" id="plan-edit-name-${p.id}" value="${escapeAttr(p.name)}" placeholder="Name (z.B. Rücken A)">
            <div style="margin-top:0.5rem;">${trainingUebungenBlockHtml(planBearbeitenUebungen, `plan-edit-${p.id}`)}</div>
            <div class="row" style="margin-top:0.5rem;">
              <button class="btn-primary" onclick="planBearbeitenSpeichern('${p.id}')">Speichern</button>
              <button class="link-btn" onclick="planBearbeitenAbbrechen()">Abbrechen</button>
            </div>
          </div>`;
      }
      return `
        <details class="plan-item">
          <summary>
            <span><span class="chevron">▸</span><span class="notiz-text">${escapeHtml(p.name)}</span></span>
            <span class="notiz-meta">${uebungen.length} Übung${uebungen.length === 1 ? "" : "en"}</span>
          </summary>
          ${uebungenAnzeige(uebungen)}
          <div class="row plan-item-aktionen" style="flex-wrap:wrap;">
            <button class="link-btn" onclick="planStarten('${p.id}')" ${uebungen.length ? "" : "disabled"}>${ic("play")}Starten</button>
            <button class="link-btn" onclick="planExportieren('${p.id}')">${ic("export")}Export</button>
            <button class="task-edit-btn" onclick="planBearbeitenStart('${p.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>
            <button class="task-delete" onclick="planLoeschen('${p.id}')" aria-label="Löschen">${ic("x")}</button>
          </div>
        </details>`;
    }

    listEl.innerHTML = plaene.length
      ? `<div class="notiz-list">${plaene.map(planHtml).join("")}</div>`
      : '<p class="empty-text">Noch keine Trainingspläne angelegt.</p>';

    const neuFormEl = document.getElementById("plan-neu-uebungen");
    if (neuFormEl) neuFormEl.innerHTML = trainingUebungenBlockHtml(planFormUebungen, "plan-neu");
  }

  const btnPlanHinzufuegen = document.getElementById("btn-plan-hinzufuegen");
  if (btnPlanHinzufuegen) btnPlanHinzufuegen.addEventListener("click", planHinzufuegen);

  // Legt einen neuen Trainingsplan mit Übungen aus dem Formular an
  async function planHinzufuegen() {
    const nameEl = document.getElementById("plan-neu-name");
    const name = nameEl.value.trim();
    if (!name) return;
    const uebungen = trainingUebungenAusDom("plan-neu", planFormUebungen.length);

    await api("plan_hinzufuegen", { bereich: aktiverBereich, name, uebungen });
    nameEl.value = "";
    planFormUebungen = [];
    await ladeDaten();
    renderTraining();
  }

  // Öffnet das Bearbeiten-Formular eines Plans und lädt dessen Übungen ins Formular
  window.planBearbeitenStart = function(id) {
    planBearbeitenId = id;
    planBearbeitenUebungen = planUebungenFuer(id)
      .map((u) => ({ name: u.name, saetze: u.saetze ?? "", wiederholungen: u.wiederholungen ?? "", sekunden: u.sekunden ?? "", gewicht_kg: u.gewicht_kg ?? "", progression: u.progression ?? "" }));
    renderTraining();
  };

  // Bricht das Bearbeiten eines Plans ab
  window.planBearbeitenAbbrechen = function() {
    planBearbeitenId = null;
    planBearbeitenUebungen = [];
    renderTraining();
  };

  // Speichert Name und Übungen des bearbeiteten Plans und lädt neu
  window.planBearbeitenSpeichern = async function(id) {
    const name = document.getElementById(`plan-edit-name-${id}`).value.trim();
    if (!name) return;
    const uebungen = trainingUebungenAusDom(`plan-edit-${id}`, planBearbeitenUebungen.length);

    await api("plan_aktualisieren", { id, name, uebungen });
    planBearbeitenId = null;
    planBearbeitenUebungen = [];
    await ladeDaten();
    renderTraining();
  };

  // Löscht einen Trainingsplan nach Rückfrage (Trainings bleiben, verlieren Verknüpfung)
  window.planLoeschen = async function(id) {
    if (!confirm("Diesen Trainingsplan endgültig löschen? Bereits erfasste Trainings bleiben erhalten, verlieren aber die Verknüpfung.")) return;
    await api("plan_loeschen", { id });
    await ladeDaten();
    renderTraining();
  };

  // ------------------------------------------------------------
  // Trainingspläne: Import & Export (JSON-Dateien, bereichslos –
  // Bereich wird beim Import immer aus dem aktiven Bereich gesetzt)
  // ------------------------------------------------------------

  function planZuExportObjekt(p) {
    return {
      name: p.name,
      uebungen: planUebungenFuer(p.id).map((u) => ({
        name: u.name,
        saetze: u.saetze ?? null,
        wiederholungen: u.wiederholungen ?? null,
        sekunden: u.sekunden ?? null,
        gewicht_kg: u.gewicht_kg ?? null,
        progression: u.progression ?? null,
      })),
    };
  }

  // Macht aus einem Plan-Namen einen dateinamentauglichen Slug (Umlaute ersetzt)
  function planDateinameSlug(text) {
    const ersatz = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
    const slug = (text || "plan")
      .toLowerCase()
      .replace(/[äöüß]/g, (c) => ersatz[c] || c)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "plan";
  }

  // Exportiert einen einzelnen Trainingsplan als JSON-Datei
  window.planExportieren = function(planId) {
    const p = trainingsplaene.find((pl) => pl.id === planId);
    if (!p) return;
    const exportObj = { typ: "trainingsplan_export", version: 1, plaene: [planZuExportObjekt(p)] };
    downloadDatei(`trainingsplan-${planDateinameSlug(p.name)}.json`, JSON.stringify(exportObj, null, 2), "application/json");
  };

  // Exportiert alle Trainingspläne des aktiven Bereichs als JSON-Datei
  function plaeneAlleExportieren() {
    const plaene = trainingsplaeneAktuell();
    if (!plaene.length) { alert("Keine Trainingspläne zum Exportieren vorhanden."); return; }
    const exportObj = { typ: "trainingsplan_export", version: 1, plaene: plaene.map(planZuExportObjekt) };
    downloadDatei(`trainingsplaene-${aktiverBereich}-${heuteISO()}.json`, JSON.stringify(exportObj, null, 2), "application/json");
  }

  // Einfaches CSV-Format für Laien (z.B. in Excel/LibreOffice Calc
  // auszufüllen): eine Zeile je Übung, mehrere Zeilen mit gleichem
  // Plan-Namen bilden gemeinsam einen Plan. Trennzeichen (; oder ,)
  // und deutsches Dezimalkomma werden automatisch erkannt (nutzt
  // dieselbe Logik wie der CSV-Import bei den Finanzen).
  function csvZuTrainingsplaenen(text) {
    const { header, rows } = parseCsvText(text);
    const kopf = header.map((h) => h.toLowerCase());
    const idxPlan = findeSpalte(kopf, ["plan", "plan-name", "planname", "trainingsplan"]);
    const idxUebung = findeSpalte(kopf, ["übung", "uebung", "übungsname", "uebungsname", "name"]);
    const idxSaetze = findeSpalte(kopf, ["sätze", "saetze", "sets"]);
    const idxWdh = findeSpalte(kopf, ["wiederholungen", "wdh", "reps"]);
    const idxSekunden = findeSpalte(kopf, ["sekunden", "sek", "sec", "seconds"]);
    const idxGewicht = findeSpalte(kopf, ["gewicht (kg)", "gewicht_kg", "gewicht", "kg"]);
    const idxProgression = findeSpalte(kopf, ["variante", "progression", "stufe"]);

    if (idxPlan === -1 || idxUebung === -1) {
      throw new Error(
        'Spalte "Plan" oder "Übung" wurde nicht gefunden. Erwartete Kopfzeile z.B.: ' +
        "Plan;Übung;Sätze;Wiederholungen;Gewicht (kg)"
      );
    }

    const reihenfolge = [];
    const nachPlan = new Map();
    for (const felder of rows) {
      const planName = (felder[idxPlan] || "").trim();
      const uebungName = (felder[idxUebung] || "").trim();
      if (!planName || !uebungName) continue;
      if (!nachPlan.has(planName)) { nachPlan.set(planName, []); reihenfolge.push(planName); }
      nachPlan.get(planName).push({
        name: uebungName,
        saetze: idxSaetze > -1 ? csvGanzzahlOderNull(felder[idxSaetze]) : null,
        wiederholungen: idxWdh > -1 ? csvGanzzahlOderNull(felder[idxWdh]) : null,
        sekunden: idxSekunden > -1 ? csvGanzzahlOderNull(felder[idxSekunden]) : null,
        gewicht_kg: idxGewicht > -1 ? parseCsvBetrag(felder[idxGewicht]) : null,
        progression: idxProgression > -1 ? (felder[idxProgression] || "").trim() || null : null,
      });
    }
    return reihenfolge.map((name) => ({ name, uebungen: nachPlan.get(name) }));
  }

  // Wandelt einen CSV-Wert in eine Ganzzahl um oder liefert null
  function csvGanzzahlOderNull(raw) {
    const s = (raw || "").trim();
    if (!s) return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }

  // Lädt eine CSV-Vorlage mit Beispielzeilen für den Plan-Import herunter
  window.planVorlageHerunterladen = function() {
    const vorlage =
      "Plan;Übung;Sätze;Wiederholungen;Sekunden;Gewicht (kg)\n" +
      "Rücken A;Latzug;3;12;;40\n" +
      "Rücken A;Rudern;3;10;;35\n" +
      "Rücken A;Klimmzug;3;8;;\n" +
      "Rücken B;Plank;3;;45;\n" +
      "Rücken B;Kreuzheben;4;6;;60\n";
    downloadDatei("trainingsplaene-vorlage.csv", vorlage, "text/csv");
  };

  // Importiert Pläne aus JSON/CSV, warnt bei Duplikaten und ergänzt neue Übungen in den Stammdaten
  async function plaeneImportieren(file) {
    const text = await file.text();
    const istJson = file.name.toLowerCase().endsWith(".json");

    let eingehendePlaene;
    if (istJson) {
      let daten;
      try {
        daten = JSON.parse(text);
      } catch {
        throw new Error("Datei ist kein gültiges JSON.");
      }
      eingehendePlaene = Array.isArray(daten?.plaene) ? daten.plaene : Array.isArray(daten) ? daten : null;
      if (!eingehendePlaene || !eingehendePlaene.length) {
        throw new Error("Keine Trainingspläne in der Datei gefunden.");
      }
    } else {
      eingehendePlaene = csvZuTrainingsplaenen(text);
      if (!eingehendePlaene.length) {
        throw new Error("Keine gültigen Zeilen gefunden (Plan- oder Übungsname fehlt überall).");
      }
    }

    const gueltig = eingehendePlaene
      .filter((p) => p && typeof p.name === "string" && p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        uebungen: Array.isArray(p.uebungen)
          ? p.uebungen
              .filter((u) => u && typeof u.name === "string" && u.name.trim())
              .map((u) => ({
                name: u.name.trim(),
                saetze: u.saetze ?? null,
                wiederholungen: u.wiederholungen ?? null,
                sekunden: u.sekunden ?? null,
                gewicht_kg: u.gewicht_kg ?? null,
                progression: u.progression ?? null,
              }))
          : [],
      }));
    if (!gueltig.length) throw new Error("Keine gültigen Trainingspläne in der Datei gefunden.");

    const bestehendeNamen = new Set(trainingsplaeneAktuell().map((p) => p.name));
    const duplikate = gueltig.filter((p) => bestehendeNamen.has(p.name)).map((p) => p.name);
    if (duplikate.length) {
      const weiter = confirm(
        `Diese Pläne existieren im Bereich „${aktiverBereich}" bereits: ${duplikate.join(", ")}.\n\n` +
        `Trotzdem importieren? Es entstehen zusätzliche Pläne mit gleichem Namen.`
      );
      if (!weiter) return;
    }

    for (const p of gueltig) {
      await api("plan_hinzufuegen", { bereich: aktiverBereich, name: p.name, uebungen: p.uebungen });
    }

    // Übungsnamen aus den importierten Plänen zusätzlich in die
    // Stammdaten übernehmen (Tab "Übungen verwalten"),
    // damit sie dort direkt gelistet sind und bei der Autovervoll-
    // ständigung erscheinen. Bereits vorhandene Namen werden dabei
    // übersprungen (stammdaten_hinzufuegen würde sie ohnehin ignorieren).
    const bekannteUebungsnamen = new Set(trainingStammdatenAktuell("uebung").map((s) => s.name));
    const neueUebungsnamen = new Set();
    for (const p of gueltig) {
      for (const u of p.uebungen) {
        if (!bekannteUebungsnamen.has(u.name)) neueUebungsnamen.add(u.name);
      }
    }
    for (const name of neueUebungsnamen) {
      await api("stammdaten_hinzufuegen", { bereich: aktiverBereich, typ: "uebung", name });
    }

    await ladeDaten();
    renderTraining();
    alert(
      `${gueltig.length} Trainingsplan/-pläne importiert.` +
      (neueUebungsnamen.size
        ? `\n${neueUebungsnamen.size} neue Übung(en) in den Stammdaten ergänzt.\nTipp: Unter „Übungen verwalten" → „Kategorien vorschlagen" lassen sie sich automatisch zuordnen.`
        : "")
    );
  }

  const btnPlaeneExportAlle = document.getElementById("btn-plaene-export-alle");
  if (btnPlaeneExportAlle) btnPlaeneExportAlle.addEventListener("click", plaeneAlleExportieren);

  const btnPlaeneVorlage = document.getElementById("btn-plaene-vorlage");
  if (btnPlaeneVorlage) btnPlaeneVorlage.addEventListener("click", planVorlageHerunterladen);

  const btnPlaeneImport = document.getElementById("btn-plaene-import");
  const plaeneImportInput = document.getElementById("plaene-import-input");
  if (btnPlaeneImport && plaeneImportInput) {
    btnPlaeneImport.addEventListener("click", () => plaeneImportInput.click());
    plaeneImportInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      btnPlaeneImport.textContent = "Importiere …";
      btnPlaeneImport.disabled = true;
      try {
        await plaeneImportieren(file);
      } catch (err) {
        console.error(err);
        alert("Import fehlgeschlagen: " + (err.message || err));
      } finally {
        btnPlaeneImport.innerHTML = `${ic("import")}Pläne importieren (CSV/JSON)`;
        btnPlaeneImport.disabled = false;
      }
    });
  }

  // ------------------------------------------------------------
  // Sportarten- & Übungen-Stammdaten (Vorschläge für die
  // Autovervollständigung; Freitext bleibt weiterhin möglich)
  // ------------------------------------------------------------

  function trainingStammdatenAktuell(typ) {
    return trainingStammdaten
      .filter((s) => bereichVon(s) === aktiverBereich && s.typ === typ)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Bild-URLs werden lazy geladen (nur wenn ein bild_pfad hinterlegt
  // ist) und pro Stammdaten-Eintrag 60 Minuten lang wiederverwendet
  // – so reicht ein Abruf für alle Vorkommen (Stammdaten-Liste,
  // Trainingseinträge, Trainingspläne, "Plan starten").
  async function trainingBilderLaden() {
    const brauchtLaden = trainingStammdaten.filter(
      (s) => s.bild_pfad && (!trainingBildUrls[s.id] || trainingBildUrls[s.id].ablauf < Date.now())
    );
    if (!brauchtLaden.length) return;
    for (const s of brauchtLaden) {
      try {
        const res = await api("stammdaten_bild_url", { id: s.id });
        trainingBildUrls[s.id] = { url: res.url, ablauf: Date.now() + 55 * 60 * 1000 };
      } catch (e) {
        console.error("Bild konnte nicht geladen werden:", e);
      }
    }
    renderTraining();
  }

  // Sucht (bereichsgetrennt) den Stammdaten-Eintrag zu einem Namen
  // und liefert dessen bereits geladene Bild-URL, falls vorhanden.
  function stammdatenBildUrlFuerName(typ, name) {
    if (!name) return null;
    const eintrag = trainingStammdaten.find(
      (s) => bereichVon(s) === aktiverBereich && s.typ === typ && s.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (!eintrag || !eintrag.bild_pfad) return null;
    return trainingBildUrls[eintrag.id]?.url || null;
  }

  // Liefert ein Bild-Tag für Chips, falls zum Namen ein Stammdaten-Bild geladen ist
  function chipBildHtml(typ, name) {
    const url = stammdatenBildUrlFuerName(typ, name);
    return url ? `<img src="${escapeAttr(url)}" class="chip-bild" alt="">` : "";
  }

  // ------------------------------------------------------------
  // Übungen: Kategorien (Muskelgruppen) + automatische Vorschläge
  // per Stichwort-Regeln. Freitext bleibt möglich, die Automatik
  // schlägt aber nur aus dem festen Set vor. Reihenfolge der Regeln
  // ist wichtig: spezifische Begriffe zuerst (z.B. "Muscle-up" vor
  // "Pull", "Leg Raise" vor "Beine", "Leg Curl" vor "Curl").
  // ------------------------------------------------------------
  const UEBUNG_KATEGORIEN = ["Rücken", "Core", "Push", "Pull", "Beine", "Ganzkörper", "Mobilität"];
  const UEBUNG_OHNE_KATEGORIE = "Ohne Kategorie";

  const UEBUNG_KATEGORIE_REGELN = [
    ["Mobilität", ["dehn", "stretch", "mobil", "cat cow", "katze kuh", "katzenbuckel", "kindhaltung", "child pose", "kobra", "cobra", "hüftbeuger", "hip flexor", "faszien", "foam", "blackroll", "yoga", "world greatest", "brustwirbel"]],
    ["Ganzkörper", ["burpee", "muscle up", "muscleup", "bear crawl", "bärengang", "mountain climber", "bergsteiger", "kettlebell swing", "swing", "thruster", "turkish", "get up", "jumping jack", "hampelmann", "seilspring", "rope skip", "clean", "snatch", "sprawl", "farmer", "carry"]],
    ["Core", ["plank", "unterarmstütz", "seitstütz", "side plank", "hollow", "dead bug", "deadbug", "crunch", "sit up", "situp", "l sit", "lsit", "leg raise", "beinheben", "knee raise", "knieheben", "russian twist", "ab wheel", "rollout", "bauch", "pallof", "v up", "flutter kick", "windscheibenwischer", "windshield", "dragon flag"]],
    ["Rücken", ["superman", "bird dog", "birddog", "vierfüßler", "hyperext", "rückenstreck", "back extension", "reverse fly", "reverse flys", "good morning", "kreuzheben", "deadlift", "y raise", "t raise", "w raise", "swimmer", "rückentrain", "rückenübung"]],
    ["Beine", ["kniebeug", "squat", "ausfallschritt", "lunge", "wadenheb", "calf", "step up", "stepup", "aufsteig", "pistol", "glute", "hip thrust", "beckenheb", "brücke", "bridge", "beinpresse", "leg press", "leg curl", "beinbeuger", "beinstreck", "leg extension", "wall sit", "wandsitz", "box jump", "bulgarian", "sprungkniebeuge", "nordic", "gesäß", "adduktor", "abduktor"]],
    ["Pull", ["klimmzug", "pull up", "pullup", "chin up", "chinup", "rudern", "row", "australian", "scapula", "face pull", "latzug", "lat pull", "bizeps", "biceps", "curl", "pull"]],
    ["Push", ["liegestütz", "push up", "pushup", "dips", "dip", "bankdrück", "bench", "schulterdrück", "overhead press", "military press", "pike", "handstand", "trizeps", "triceps", "seitheben", "lateral raise", "frontheben", "press", "push"]],
  ];

  // Normalisiert Text für Stichwortvergleich (klein, Trennzeichen zu Leerzeichen)
  function kategorieNormText(text) {
    return String(text || "").toLowerCase().replace(/[-_/.]+/g, " ").replace(/\s+/g, " ").trim();
  }

  // Liefert eine Kategorie aus dem festen Set oder null, wenn kein
  // Stichwort passt.
  function uebungKategorieVorschlag(name) {
    const text = kategorieNormText(name);
    if (!text) return null;
    for (const [kategorie, stichworte] of UEBUNG_KATEGORIE_REGELN) {
      if (stichworte.some((w) => text.includes(w))) return kategorie;
    }
    return null;
  }

  // Vereinheitlicht die Schreibweise (z.B. "core" -> "Core"), damit
  // gleiche Kategorien in einer Gruppe landen. Eigene Kategorien
  // bleiben wie eingegeben.
  function uebungKategorieAnzeige(kategorie) {
    const wert = String(kategorie || "").trim();
    if (!wert) return UEBUNG_OHNE_KATEGORIE;
    const fest = UEBUNG_KATEGORIEN.find((k) => k.toLowerCase() === wert.toLowerCase());
    return fest || wert;
  }

  // Rendert Sportarten- und Übungs-Stammdaten, Kategorie-Listen und Autovervollständigungs-Vorschläge
  function renderTrainingsstammdaten() {
    const sportarten = trainingStammdatenAktuell("sportart");
    const uebungen = trainingStammdatenAktuell("uebung");

    // Baut das HTML eines Stammdaten-Eintrags – als Bearbeiten-Formular oder als Anzeigezeile
    function eintragHtml(s) {
      if (stammdatenBearbeitenId === s.id) {
        const bildUrl = trainingBildUrls[s.id]?.url;
        return `
          <div class="notiz-item" style="flex-direction:column; align-items:stretch;">
            ${s.typ === "uebung"
              ? `<input type="text" id="stammdaten-edit-name-${s.id}" value="${escapeAttr(s.name)}" placeholder="Name der Übung">`
              : `<strong>${escapeHtml(s.name)}</strong>`}
            ${s.typ === "sportart"
              ? `<input type="text" id="stammdaten-edit-kategorie-${s.id}" value="${escapeAttr(s.kategorie || "")}" placeholder="Kategorie (z.B. Ausdauer, Kraft, Calisthenics)" list="stammdaten-kategorie-liste" style="margin-top:0.5rem;">`
              : `<input type="text" id="stammdaten-edit-kategorie-${s.id}" value="${escapeAttr(s.kategorie || "")}" placeholder="Kategorie${uebungKategorieVorschlag(s.name) ? ` (Vorschlag: ${escapeAttr(uebungKategorieVorschlag(s.name))})` : " (z.B. Rücken, Core, Push)"}" list="stammdaten-uebung-kategorie-liste" style="margin-top:0.5rem;">`}
            <textarea id="stammdaten-edit-beschreibung-${s.id}" placeholder="Beschreibung (optional)" rows="2" style="margin-top:0.5rem; width:100%;">${escapeHtml(s.beschreibung || "")}</textarea>
            <div class="row" style="align-items:center; margin-top:0.5rem; gap:0.6rem; flex-wrap:wrap;">
              ${s.bild_pfad ? `<img src="${bildUrl ? escapeAttr(bildUrl) : ""}" class="stammdaten-bild" alt="">` : ""}
              <input type="file" id="stammdaten-edit-bild-${s.id}" accept="image/jpeg,image/png,image/webp,image/gif">
              ${s.bild_pfad ? `<label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem;"><input type="checkbox" id="stammdaten-edit-bild-entfernen-${s.id}"> Bild entfernen</label>` : ""}
            </div>
            <div class="row" style="margin-top:0.6rem;">
              <button class="btn-primary" onclick="stammdatenBearbeitenSpeichern('${s.id}')">Speichern</button>
              <button class="link-btn" onclick="stammdatenBearbeitenAbbrechen()">Abbrechen</button>
            </div>
          </div>`;
      }
      const bildUrl = trainingBildUrls[s.id]?.url;
      return `
        <div class="notiz-item">
          ${s.bild_pfad && bildUrl ? `<img src="${escapeAttr(bildUrl)}" class="stammdaten-bild" alt="">` : ""}
          <div style="flex:1;">
            <span class="notiz-text">${escapeHtml(s.name)}${s.kategorie ? ` <span class="notiz-meta">· ${escapeHtml(s.kategorie)}</span>` : ""}</span>
            ${s.beschreibung ? `<span class="notiz-meta" style="white-space:pre-wrap;">${escapeHtml(s.beschreibung)}</span>` : ""}
          </div>
          <button class="task-edit-btn" onclick="stammdatenBearbeitenStart('${s.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>
          <button class="task-delete" onclick="stammdatenLoeschen('${s.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>`;
    }

    // Rendert eine einfache Stammdaten-Liste oder einen Leer-Hinweis
    function listeHtml(liste) {
      if (!liste.length) return '<p class="empty-text">Noch keine hinterlegt.</p>';
      return `<div class="notiz-list">${liste.map(eintragHtml).join("")}</div>`;
    }

    // Kompakte Zeile für die gruppierte Übungsliste (Kategorie steht
    // schon in der Gruppenüberschrift, Beschreibung einzeilig gekürzt).
    function uebungZeileHtml(s) {
      if (stammdatenBearbeitenId === s.id) return eintragHtml(s);
      const bildUrl = trainingBildUrls[s.id]?.url;
      return `
        <div class="notiz-item uebung-zeile">
          ${s.bild_pfad && bildUrl ? `<img src="${escapeAttr(bildUrl)}" class="stammdaten-bild-klein" alt="">` : `<span class="stammdaten-bild-klein stammdaten-bild-leer"></span>`}
          <div style="flex:1; min-width:0;">
            <span class="notiz-text">${escapeHtml(s.name)}</span>
            ${s.beschreibung ? `<span class="notiz-meta uebung-zeile-beschreibung">${escapeHtml(s.beschreibung)}</span>` : ""}
          </div>
          <button class="task-edit-btn" onclick="stammdatenBearbeitenStart('${s.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>
          <button class="task-delete" onclick="stammdatenLoeschen('${s.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>`;
    }

    // Rendert die Übungen nach Kategorie gruppiert, mit Suchfilter und gemerktem Aufklappzustand
    function uebungenGruppiertHtml(liste) {
      if (!liste.length) return '<p class="empty-text">Noch keine hinterlegt.</p>';
      const sucheEl = document.getElementById("stammdaten-uebung-suche");
      const suche = kategorieNormText(sucheEl ? sucheEl.value : "");
      const gefiltert = suche
        ? liste.filter((s) => kategorieNormText(`${s.name} ${s.beschreibung || ""}`).includes(suche))
        : liste;
      if (!gefiltert.length) return '<p class="empty-text">Keine Übung gefunden.</p>';

      const gruppen = {};
      gefiltert.forEach((s) => {
        const k = uebungKategorieAnzeige(s.kategorie);
        (gruppen[k] = gruppen[k] || []).push(s);
      });
      // Reihenfolge: festes Set, dann eigene Kategorien alphabetisch,
      // "Ohne Kategorie" immer zuletzt.
      const eigene = Object.keys(gruppen)
        .filter((k) => !UEBUNG_KATEGORIEN.includes(k) && k !== UEBUNG_OHNE_KATEGORIE)
        .sort((a, b) => a.localeCompare(b));
      const reihenfolge = [...UEBUNG_KATEGORIEN.filter((k) => gruppen[k]), ...eigene];
      if (gruppen[UEBUNG_OHNE_KATEGORIE]) reihenfolge.push(UEBUNG_OHNE_KATEGORIE);

      return reihenfolge.map((k) => {
        const eintraege = gruppen[k];
        const offen = suche || uebungGruppenOffen.has(k) || eintraege.some((s) => s.id === stammdatenBearbeitenId);
        return `
          <details class="plan-item uebung-gruppe" data-kategorie="${escapeAttr(k)}" ${offen ? "open" : ""}>
            <summary>
              <span><span class="chevron">▸</span><strong>${escapeHtml(k)}</strong></span>
              <span class="uebung-gruppe-anzahl">${eintraege.length}</span>
            </summary>
            <div class="notiz-list" style="margin-top:0.6rem;">${eintraege.map(uebungZeileHtml).join("")}</div>
          </details>`;
      }).join("");
    }

    const sportartenListEl = document.getElementById("stammdaten-sportarten-liste");
    if (sportartenListEl) sportartenListEl.innerHTML = listeHtml(sportarten);
    const uebungenListEl = document.getElementById("stammdaten-uebungen-liste");
    if (uebungenListEl) {
      uebungenListEl.innerHTML = uebungenGruppiertHtml(uebungen);
      // Auf-/Zuklapp-Zustand merken, damit er ein Neu-Rendern übersteht
      // (nicht während einer Suche – da klappen Treffer-Gruppen automatisch auf).
      uebungenListEl.querySelectorAll(".uebung-gruppe").forEach((d) => {
        d.addEventListener("toggle", () => {
          const sucheEl = document.getElementById("stammdaten-uebung-suche");
          if (sucheEl && sucheEl.value.trim()) return;
          if (d.open) uebungGruppenOffen.add(d.dataset.kategorie);
          else uebungGruppenOffen.delete(d.dataset.kategorie);
        });
      });
    }
    renderUebungKategorieVorschlag();

    const uebungKategorieListEl = document.getElementById("stammdaten-uebung-kategorie-liste");
    if (uebungKategorieListEl) {
      const kategorien = [...new Set([
        ...UEBUNG_KATEGORIEN,
        ...uebungen.map((s) => s.kategorie).filter(Boolean).map(uebungKategorieAnzeige),
      ])];
      uebungKategorieListEl.innerHTML = kategorien.map((k) => `<option value="${escapeAttr(k)}">`).join("");
    }

    const kategorieListEl = document.getElementById("stammdaten-kategorie-liste");
    if (kategorieListEl) {
      const kategorien = [...new Set(sportarten.map((s) => s.kategorie).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      kategorieListEl.innerHTML = kategorien.map((k) => `<option value="${escapeAttr(k)}">`).join("");
    }

    // Vorschläge für die Autovervollständigung: verwaltete Liste +
    // bisher tatsächlich genutzte Werte zusammengeführt.
    const sportartenVorschlaege = [...new Set([
      ...sportarten.map((s) => s.name),
      ...training.map((t) => t.sportart),
    ])].filter(Boolean).sort((a, b) => a.localeCompare(b));
    const sportartList = document.getElementById("training-sportart-liste");
    if (sportartList) sportartList.innerHTML = sportartenVorschlaege.map((s) => `<option value="${escapeAttr(s)}">`).join("");

    const uebungsnamenVorschlaege = [...new Set([
      ...uebungen.map((u) => u.name),
      ...trainingUebungen.map((u) => u.name),
      ...trainingsplanUebungen.map((u) => u.name),
    ])].filter(Boolean).sort((a, b) => a.localeCompare(b));
    const uebungList = document.getElementById("training-uebung-namen-liste");
    if (uebungList) uebungList.innerHTML = uebungsnamenVorschlaege.map((n) => `<option value="${escapeAttr(n)}">`).join("");

    trainingBilderLaden();
  }

  const btnStammSportart = document.getElementById("btn-stammdaten-sportart-hinzufuegen");
  if (btnStammSportart) btnStammSportart.addEventListener("click", () => stammdatenHinzufuegen("sportart"));
  const btnStammUebung = document.getElementById("btn-stammdaten-uebung-hinzufuegen");
  if (btnStammUebung) btnStammUebung.addEventListener("click", () => stammdatenHinzufuegen("uebung"));

  // Legt eine Sportart/Übung in den Stammdaten an und trägt ggf. die Kategorie direkt nach
  async function stammdatenHinzufuegen(typ) {
    const inputId = typ === "sportart" ? "stammdaten-sportart-neu" : "stammdaten-uebung-neu";
    const el = document.getElementById(inputId);
    const name = el.value.trim();
    if (!name) return;
    const kategorieEl = typ === "uebung" ? document.getElementById("stammdaten-uebung-kategorie-neu") : null;
    const kategorie = kategorieEl ? kategorieEl.value.trim() : "";

    await api("stammdaten_hinzufuegen", { bereich: aktiverBereich, typ, name });
    el.value = "";
    if (kategorieEl) {
      kategorieEl.value = "";
      uebungKategorieNeuManuell = false;
    }
    await ladeDaten();

    // stammdaten_hinzufuegen kennt keine Kategorie – daher direkt im
    // Anschluss nachtragen. Existierte die Übung schon mit eigener
    // Kategorie, bleibt diese unangetastet.
    if (kategorie) {
      const eintrag = trainingStammdaten.find(
        (s) => bereichVon(s) === aktiverBereich && s.typ === typ && s.name.trim().toLowerCase() === name.toLowerCase()
      );
      if (eintrag && !eintrag.kategorie) {
        await api("stammdaten_aktualisieren", { id: eintrag.id, kategorie });
        eintrag.kategorie = kategorie;
        uebungGruppenOffen.add(uebungKategorieAnzeige(kategorie));
      }
    }
    renderTraining();
  }

  // Beim Tippen eines neuen Übungsnamens die Kategorie automatisch
  // vorausfüllen – solange sie nicht von Hand geändert wurde.
  const stammUebungNeuEl = document.getElementById("stammdaten-uebung-neu");
  const stammUebungKatNeuEl = document.getElementById("stammdaten-uebung-kategorie-neu");
  if (stammUebungNeuEl && stammUebungKatNeuEl) {
    stammUebungNeuEl.addEventListener("input", () => {
      if (uebungKategorieNeuManuell) return;
      stammUebungKatNeuEl.value = uebungKategorieVorschlag(stammUebungNeuEl.value) || "";
    });
    stammUebungKatNeuEl.addEventListener("input", () => {
      uebungKategorieNeuManuell = stammUebungKatNeuEl.value.trim() !== "";
    });
    stammUebungNeuEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") stammdatenHinzufuegen("uebung");
    });
  }

  const stammUebungSucheEl = document.getElementById("stammdaten-uebung-suche");
  if (stammUebungSucheEl) stammUebungSucheEl.addEventListener("input", () => renderTrainingsstammdaten());

  // ------------------------------------------------------------
  // "Kategorien vorschlagen": Vorschau für alle Übungen ohne
  // Kategorie, gespeichert wird erst nach Bestätigung.
  // ------------------------------------------------------------
  function renderUebungKategorieVorschlag() {
    const el = document.getElementById("stammdaten-uebung-vorschlag");
    if (!el) return;
    if (!uebungKategorieVorschlaege) {
      el.innerHTML = "";
      return;
    }
    const erkannt = uebungKategorieVorschlaege.filter((v) => v.kategorie);
    const unerkannt = uebungKategorieVorschlaege.filter((v) => !v.kategorie);
    const anzahlUebernehmen = erkannt.filter((v) => v.uebernehmen).length;
    const optionen = (aktuell) => UEBUNG_KATEGORIEN
      .map((k) => `<option value="${escapeAttr(k)}" ${k === aktuell ? "selected" : ""}>${escapeHtml(k)}</option>`).join("");

    el.innerHTML = `
      <div class="kategorie-vorschlag-box">
        ${erkannt.length ? `
          <p class="empty-text" style="margin-top:0;">Vorschläge prüfen, Häkchen entfernen oder Kategorie ändern, dann übernehmen.</p>
          <div class="kategorie-vorschlag-liste">
            ${erkannt.map((v) => `
              <label class="kategorie-vorschlag-zeile">
                <input type="checkbox" ${v.uebernehmen ? "checked" : ""} onchange="uebungKategorieVorschlagHaken('${v.id}', this.checked)">
                <span class="kategorie-vorschlag-name">${escapeHtml(v.name)}</span>
                <select onchange="uebungKategorieVorschlagAendern('${v.id}', this.value)">${optionen(v.kategorie)}</select>
              </label>`).join("")}
          </div>` : `<p class="empty-text" style="margin-top:0;">Für keine Übung ohne Kategorie wurde ein passendes Stichwort gefunden.</p>`}
        ${unerkannt.length ? `<p class="empty-text">Nicht erkannt (bitte über den Stift von Hand zuordnen): ${unerkannt.map((v) => escapeHtml(v.name)).join(", ")}</p>` : ""}
        <div class="row" style="margin-top:0.6rem;">
          ${erkannt.length ? `<button class="btn-primary" id="btn-kategorie-vorschlag-uebernehmen" onclick="uebungKategorieVorschlaegeUebernehmen()" ${anzahlUebernehmen ? "" : "disabled"}>Übernehmen (${anzahlUebernehmen})</button>` : ""}
          <button class="link-btn" onclick="uebungKategorieVorschlaegeSchliessen()">${erkannt.length ? "Abbrechen" : "Schließen"}</button>
        </div>
      </div>`;
  }

  const btnKategorieVorschlagen = document.getElementById("btn-uebung-kategorien-vorschlagen");
  if (btnKategorieVorschlagen) {
    btnKategorieVorschlagen.addEventListener("click", () => {
      const ohne = trainingStammdatenAktuell("uebung").filter((s) => !(s.kategorie || "").trim());
      if (!ohne.length) {
        alert("Alle Übungen haben bereits eine Kategorie.");
        return;
      }
      uebungKategorieVorschlaege = ohne.map((s) => {
        const kategorie = uebungKategorieVorschlag(s.name);
        return { id: s.id, name: s.name, kategorie, uebernehmen: !!kategorie };
      });
      renderUebungKategorieVorschlag();
    });
  }

  // Setzt/entfernt das Übernehmen-Häkchen eines Kategorie-Vorschlags
  window.uebungKategorieVorschlagHaken = function(id, haken) {
    const v = uebungKategorieVorschlaege && uebungKategorieVorschlaege.find((x) => x.id === id);
    if (v) v.uebernehmen = haken;
    renderUebungKategorieVorschlag();
  };

  // Ändert die vorgeschlagene Kategorie einer Übung in der Vorschau
  window.uebungKategorieVorschlagAendern = function(id, kategorie) {
    const v = uebungKategorieVorschlaege && uebungKategorieVorschlaege.find((x) => x.id === id);
    if (v) v.kategorie = kategorie;
  };

  // Schließt die Kategorie-Vorschau ohne zu speichern
  window.uebungKategorieVorschlaegeSchliessen = function() {
    uebungKategorieVorschlaege = null;
    renderUebungKategorieVorschlag();
  };

  // Speichert die angehakten Kategorie-Vorschläge in 5er-Paketen und lädt neu
  window.uebungKategorieVorschlaegeUebernehmen = async function() {
    if (!uebungKategorieVorschlaege) return;
    const auswahl = uebungKategorieVorschlaege.filter((v) => v.uebernehmen && v.kategorie);
    if (!auswahl.length) return;
    const btn = document.getElementById("btn-kategorie-vorschlag-uebernehmen");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Speichere …";
    }
    try {
      // In kleinen Paketen parallel speichern (schneller als strikt
      // nacheinander, ohne die Edge Function zu fluten).
      for (let i = 0; i < auswahl.length; i += 5) {
        await Promise.all(
          auswahl.slice(i, i + 5).map((v) => api("stammdaten_aktualisieren", { id: v.id, kategorie: v.kategorie }))
        );
      }
      uebungKategorieVorschlaege = null;
      await ladeDaten();
      renderTraining();
    } catch (err) {
      console.error(err);
      alert("Speichern fehlgeschlagen: " + (err.message || err));
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Übernehmen";
      }
    }
  };

  // Löscht einen Stammdaten-Eintrag und rendert neu
  window.stammdatenLoeschen = async function(id) {
    await api("stammdaten_loeschen", { id });
    await ladeDaten();
    renderTraining();
  };

  // Öffnet das Bearbeiten-Formular eines Stammdaten-Eintrags
  window.stammdatenBearbeitenStart = function(id) {
    stammdatenBearbeitenId = id;
    renderTraining();
  };

  // Bricht das Bearbeiten eines Stammdaten-Eintrags ab
  window.stammdatenBearbeitenAbbrechen = function() {
    stammdatenBearbeitenId = null;
    renderTraining();
  };

  // Speichert Beschreibung, Kategorie, Bild und ggf. neuen Namen (mit Zusammenführen) eines Eintrags
  window.stammdatenBearbeitenSpeichern = async function(id) {
    const beschreibungEl = document.getElementById(`stammdaten-edit-beschreibung-${id}`);
    const kategorieEl = document.getElementById(`stammdaten-edit-kategorie-${id}`);
    const dateiEl = document.getElementById(`stammdaten-edit-bild-${id}`);
    const entfernenEl = document.getElementById(`stammdaten-edit-bild-entfernen-${id}`);

    const payload = { id, beschreibung: beschreibungEl ? beschreibungEl.value.trim() : "" };
    if (kategorieEl) payload.kategorie = kategorieEl.value.trim();

    const datei = dateiEl && dateiEl.files[0];
    if (datei) {
      const erlaubteTypen = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!erlaubteTypen.includes(datei.type)) {
        alert("Nur JPG-, PNG-, WebP- oder GIF-Bilder sind erlaubt.");
        return;
      }
      if (datei.size > 5 * 1024 * 1024) {
        alert("Bild ist größer als 5 MB.");
        return;
      }
      payload.bild_base64 = await dateiZuBase64(datei);
      payload.bild_typ = datei.type;
      payload.bild_name = datei.name;
    } else if (entfernenEl && entfernenEl.checked) {
      payload.bild_entfernen = true;
    }

    await api("stammdaten_aktualisieren", payload);

    // Umbenennen (nur Übungen): läuft nach dem Speichern der übrigen
    // Felder, damit diese bei einem Zusammenführen mit übernommen
    // werden (leere Felder des Ziels werden serverseitig ergänzt).
    const nameEl = document.getElementById(`stammdaten-edit-name-${id}`);
    const eintrag = trainingStammdaten.find((s) => s.id === id);
    const neuerName = nameEl ? nameEl.value.trim() : "";
    if (nameEl && eintrag && neuerName && neuerName !== eintrag.name) {
      try {
        let res = await api("stammdaten_umbenennen", { id, neuer_name: neuerName });
        if (res.konflikt) {
          const ok = confirm(
            `„${res.ziel_name}" gibt es bereits als Übung.\n\n` +
            `Zusammenführen? „${eintrag.name}" wird dann in allen Trainingseinträgen und Plänen zu „${res.ziel_name}". ` +
            `Beschreibung, Kategorie und Bild werden nur übernommen, wo „${res.ziel_name}" noch keine hat. ` +
            `Der Eintrag „${eintrag.name}" wird danach gelöscht.`
          );
          if (ok) {
            res = await api("stammdaten_umbenennen", { id, neuer_name: neuerName, zusammenfuehren: true });
          } else {
            alert("Name nicht geändert. Die übrigen Änderungen wurden gespeichert.");
            res = null;
          }
        }
        if (res && res.ok) {
          delete trainingBildUrls[id];
          const betroffen = (res.anzahl_eintraege || 0) + (res.anzahl_plaene || 0);
          if (res.zusammengefuehrt || betroffen) {
            alert(
              (res.zusammengefuehrt ? "Übungen zusammengeführt." : "Übung umbenannt.") +
              `\n${res.anzahl_eintraege || 0} Übung(en) in Trainingseinträgen und ${res.anzahl_plaene || 0} in Trainingsplänen angepasst.`
            );
          }
        }
      } catch (err) {
        console.error(err);
        alert("Umbenennen fehlgeschlagen: " + (err.message || err));
      }
    }

    stammdatenBearbeitenId = null;
    await ladeDaten();
    renderTraining();
  };

  // ------------------------------------------------------------
  // Wochenziel je Sportart (zusätzlich zum Gesamtziel) + Filter
  // ------------------------------------------------------------

  function renderTrainingSportartZiele(eintraegeAktuell, wocheStart) {
    const listEl = document.getElementById("training-sportart-ziele-liste");
    const auswahlEl = document.getElementById("training-sportart-ziel-auswahl");
    if (!listEl) return;

    const ziele = trainingSportartZieleAktuell();
    listEl.innerHTML = ziele.length
      ? ziele.map((z) => {
          const anzahl = eintraegeAktuell.filter((t) => t.sportart === z.sportart && t.datum >= wocheStart).length;
          const erreicht = anzahl >= z.wochenziel;
          return `
            <div class="notiz-item">
              <span style="flex:1;">${escapeHtml(z.sportart)}: <strong>${anzahl} von ${z.wochenziel}</strong> diese Woche${erreicht ? " ✓" : ""}</span>
              <button class="task-delete" data-sportart="${escapeAttr(z.sportart)}" onclick="trainingSportartZielLoeschen(this.dataset.sportart)" aria-label="Löschen">${ic("x")}</button>
            </div>`;
        }).join("")
      : "";

    if (auswahlEl) {
      const sportarten = [...new Set([
        ...trainingStammdatenAktuell("sportart").map((s) => s.name),
        ...eintraegeAktuell.map((t) => t.sportart),
      ])].filter(Boolean).sort((a, b) => a.localeCompare(b));
      auswahlEl.innerHTML = sportarten.map((s) => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join("");
    }
  }

  // Löscht das Wochenziel einer Sportart im aktiven Bereich
  window.trainingSportartZielLoeschen = async function(sportart) {
    await api("training_ziel_loeschen", { bereich: aktiverBereich, sportart });
    await ladeDaten();
    renderTraining();
  };

  const btnSportartZielSpeichern = document.getElementById("btn-training-sportart-ziel-speichern");
  if (btnSportartZielSpeichern) {
    btnSportartZielSpeichern.addEventListener("click", async () => {
      const sportart = document.getElementById("training-sportart-ziel-auswahl").value;
      const wertEl = document.getElementById("training-sportart-ziel-wert");
      const wert = parseInt(wertEl.value, 10);
      if (!sportart || !Number.isFinite(wert) || wert < 0) return;
      await api("training_ziel_speichern", { bereich: aktiverBereich, sportart, wochenziel: wert });
      wertEl.value = "";
      await ladeDaten();
      renderTraining();
    });
  }

  const filterSportartAuswahlEl = document.getElementById("training-filter-sportart");
  if (filterSportartAuswahlEl) filterSportartAuswahlEl.addEventListener("change", () => { trainingFilterSportart = filterSportartAuswahlEl.value; renderTraining(); });
  const filterOrtAuswahlEl = document.getElementById("training-filter-ort");
  if (filterOrtAuswahlEl) filterOrtAuswahlEl.addEventListener("change", () => { trainingFilterOrt = filterOrtAuswahlEl.value; renderTraining(); });
  const filterVonAuswahlEl = document.getElementById("training-filter-von");
  if (filterVonAuswahlEl) filterVonAuswahlEl.addEventListener("change", () => { trainingFilterVon = filterVonAuswahlEl.value; renderTraining(); });
  const filterBisAuswahlEl = document.getElementById("training-filter-bis");
  if (filterBisAuswahlEl) filterBisAuswahlEl.addEventListener("change", () => { trainingFilterBis = filterBisAuswahlEl.value; renderTraining(); });
  const btnTrainingFilterReset = document.getElementById("btn-training-filter-zuruecksetzen");
  if (btnTrainingFilterReset) {
    btnTrainingFilterReset.addEventListener("click", () => {
      trainingFilterSportart = "";
      trainingFilterOrt = "";
      trainingFilterVon = "";
      trainingFilterBis = "";
      renderTraining();
    });
  }

  // ------------------------------------------------------------
  // "Plan starten": geführtes Durchklicken der Übungen eines Plans
  // in einem Vollbild-Fokus-Modus (eigenes Overlay über der ganzen
  // App, kein Scrollen/Ablenkung nötig), speichert am Ende als
  // neuen, mit dem Plan verlinkten Trainingseintrag.
  // ------------------------------------------------------------

  window.planStarten = function(planId) {
    const plan = trainingsplaene.find((p) => p.id === planId);
    if (!plan) return;
    const uebungen = planUebungenFuer(planId)
      .map((u) => ({ name: u.name, saetze: u.saetze ?? "", wiederholungen: u.wiederholungen ?? "", sekunden: u.sekunden ?? "", gewicht_kg: u.gewicht_kg ?? "", progression: u.progression ?? "" }));
    if (!uebungen.length) return;
    trainingSession = {
      planId, planName: plan.name, sportart: plan.name, ort: "", index: 0, uebungen,
      startMs: Date.now(), // Gesamtzeit läuft ab Start der Session
      countdown: null,      // Satz-Countdown der aktuellen Übung (siehe sessionCountdown*)
      wakeLock: null,
    };
    sessionFokusOeffnen();
  };

  // Öffnet das Vollbild-Overlay für die Plan-Session, aktiviert Wake-Lock und startet den Tick
  function sessionFokusOeffnen() {
    if (document.getElementById("session-fokus-overlay")) { renderTrainingSession(); return; }
    const overlay = document.createElement("div");
    overlay.className = "session-fokus-overlay";
    overlay.id = "session-fokus-overlay";
    document.body.appendChild(overlay);
    renderTrainingSession();
    // Echtes Vollbild, wo unterstützt (Android/Desktop); auf iOS
    // Safari nicht verfügbar – die Overlay-Ansicht deckt den
    // Bildschirm dann trotzdem vollständig ab.
    try { document.documentElement.requestFullscreen?.()?.catch(() => {}); } catch {}
    // Bildschirm während der Session anlassen (Gesamtzeit + Countdown).
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen")
        .then((lock) => { if (trainingSession) trainingSession.wakeLock = lock; else lock.release(); })
        .catch(() => {});
    }
    clearInterval(sessionTickHandle);
    sessionTickHandle = setInterval(sessionTick, 250);
  }

  // Schließt das Session-Overlay, stoppt den Tick, gibt Wake-Lock frei und beendet Vollbild
  function sessionFokusSchliessen() {
    clearInterval(sessionTickHandle);
    sessionTickHandle = null;
    if (trainingSession && trainingSession.wakeLock) {
      try { trainingSession.wakeLock.release(); } catch {}
    }
    const overlay = document.getElementById("session-fokus-overlay");
    if (overlay) overlay.remove();
    if (document.fullscreenElement) {
      try { document.exitFullscreen?.().catch(() => {}); } catch {}
    }
  }

  // Übernimmt die Eingaben aus dem Fokus-Modus in den Session-Zustand der aktuellen Übung
  function trainingSessionAusDomUebernehmen() {
    if (!trainingSession) return;
    const sportartEl = document.getElementById("session-sportart");
    const ortEl = document.getElementById("session-ort");
    if (sportartEl) trainingSession.sportart = sportartEl.value.trim();
    if (ortEl) trainingSession.ort = ortEl.value.trim();
    const u = trainingSession.uebungen[trainingSession.index];
    const nameEl = document.getElementById("session-ueb-name");
    if (nameEl) u.name = nameEl.value.trim();
    const saetzeEl = document.getElementById("session-ueb-saetze");
    if (saetzeEl) u.saetze = saetzeEl.value;
    const wdhEl = document.getElementById("session-ueb-wdh");
    if (wdhEl) u.wiederholungen = wdhEl.value;
    const sekundenEl = document.getElementById("session-ueb-sekunden");
    if (sekundenEl) u.sekunden = sekundenEl.value;
    const gewichtEl = document.getElementById("session-ueb-gewicht");
    if (gewichtEl) u.gewicht_kg = gewichtEl.value;
    const progressionEl = document.getElementById("session-ueb-progression");
    if (progressionEl) u.progression = progressionEl.value.trim();
  }

  // Wechselt in der Plan-Session zur nächsten Übung mit frischem Countdown
  window.trainingSessionWeiter = function() {
    trainingSessionAusDomUebernehmen();
    trainingSession.index = Math.min(trainingSession.index + 1, trainingSession.uebungen.length - 1);
    trainingSession.countdown = null; // neue Übung = frischer Countdown
    renderTrainingSession();
  };

  // Wechselt in der Plan-Session zur vorherigen Übung mit frischem Countdown
  window.trainingSessionZurueck = function() {
    trainingSessionAusDomUebernehmen();
    trainingSession.index = Math.max(trainingSession.index - 1, 0);
    trainingSession.countdown = null;
    renderTrainingSession();
  };

  // Bricht die Plan-Session nach Rückfrage ab und schließt den Fokus-Modus
  window.trainingSessionAbbrechen = function() {
    if (!confirm("Trainings-Session abbrechen? Bisher eingegebene Werte gehen verloren.")) return;
    sessionFokusSchliessen();
    trainingSession = null;
    renderTraining();
  };

  // Speichert die Plan-Session als neues, verlinktes Training mit gemessener Dauer
  window.trainingSessionAbschliessen = async function() {
    trainingSessionAusDomUebernehmen();
    const sportart = (trainingSession.sportart || "").trim();
    if (!sportart) { alert("Bitte eine Sportart angeben."); return; }
    const uebungen = trainingSession.uebungen.filter((u) => (u.name || "").trim());
    const planId = trainingSession.planId;
    const ort = trainingSession.ort;
    // Gemessene Gesamtzeit als Dauer (gerundet, mindestens 1 Minute).
    const dauerMinuten = Math.max(1, Math.round((Date.now() - trainingSession.startMs) / 60000));

    await api("training_hinzufuegen", {
      bereich: aktiverBereich,
      datum: heuteISO(),
      sportart,
      ort,
      dauer_minuten: dauerMinuten,
      notiz: "",
      uebungen,
      plan_id: planId,
    });
    sessionFokusSchliessen();
    trainingSession = null;
    await ladeDaten();
    renderTraining();
  };

  // ------------------------------------------------------------
  // Gesamtzeit + Satz-Countdown im "Plan starten"-Fokus-Modus.
  // Zeiten laufen über Zeitstempel (nicht über Tick-Zählen), damit
  // sie auch stimmen, wenn der Browser den Tab kurz drosselt. Der
  // Tick aktualisiert nur die Zeit-Anzeigen per textContent – ein
  // komplettes Neu-Rendern würde sonst laufende Eingaben stören.
  // ------------------------------------------------------------
  function zeitFormat(sekunden, mitStunden) {
    const s = Math.max(0, Math.floor(sekunden));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sek = String(s % 60).padStart(2, "0");
    if (mitStunden && h > 0) return `${h}:${String(m).padStart(2, "0")}:${sek}`;
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${sek}`;
  }

  // Liefert die Restzeit des Satz-Countdowns in ms je nach Status
  function sessionCountdownRestMs(c) {
    if (c.status === "laeuft") return Math.max(0, c.endeMs - Date.now());
    if (c.status === "pausiert") return c.restMs;
    return c.sekunden * 1000;
  }

  // Countdown-Zustand der aktuellen Übung; null, wenn keine Sekunden
  // hinterlegt sind.
  function sessionCountdownAktuell() {
    if (!trainingSession) return null;
    const u = trainingSession.uebungen[trainingSession.index];
    const sekunden = parseInt(u.sekunden, 10);
    if (!(sekunden > 0)) return null;
    if (!trainingSession.countdown) {
      trainingSession.countdown = {
        sekunden,
        saetze: Math.max(1, parseInt(u.saetze, 10) || 1),
        satz: 1,
        status: "bereit", // bereit | laeuft | pausiert | fertig
        endeMs: 0,
        restMs: 0,
      };
    }
    return trainingSession.countdown;
  }

  // Aktualisiert Gesamtzeit und Countdown-Anzeige; schaltet bei Ablauf zum nächsten Satz mit Signal
  function sessionTick() {
    if (!trainingSession) return;
    const gesamtEl = document.getElementById("session-gesamtzeit");
    if (gesamtEl) gesamtEl.textContent = zeitFormat((Date.now() - trainingSession.startMs) / 1000, true);

    const c = trainingSession.countdown;
    if (!c || c.status !== "laeuft") return;
    const rest = sessionCountdownRestMs(c);
    const anzeigeEl = document.getElementById("session-countdown-zeit");
    if (anzeigeEl) anzeigeEl.textContent = zeitFormat(Math.ceil(rest / 1000));
    if (rest <= 0) {
      // Satz geschafft: kurzer Ton, beim letzten Satz das Abschluss-Signal.
      trainingSessionAusDomUebernehmen();
      if (c.satz >= c.saetze) {
        c.status = "fertig";
        timerSignal("fertig");
      } else {
        c.satz++;
        c.status = "bereit";
        timerSignal("satz");
      }
      renderTrainingSession();
    }
  }

  // Startet bzw. setzt den Satz-Countdown fort (schaltet Audio für iOS frei)
  window.sessionCountdownStart = function() {
    const c = sessionCountdownAktuell();
    if (!c) return;
    audioFreischalten(); // innerhalb des Tipps, sonst blockiert iOS den späteren Ton
    trainingSessionAusDomUebernehmen();
    if (c.status === "pausiert") {
      c.endeMs = Date.now() + c.restMs;
    } else {
      // Vor dem ersten Satz ggf. geänderte Werte aus den Feldern übernehmen.
      if (c.satz === 1) {
        const u = trainingSession.uebungen[trainingSession.index];
        const sek = parseInt(u.sekunden, 10);
        if (sek > 0) c.sekunden = sek;
        c.saetze = Math.max(1, parseInt(u.saetze, 10) || 1);
      }
      c.endeMs = Date.now() + c.sekunden * 1000;
    }
    c.status = "laeuft";
    renderTrainingSession();
  };

  // Pausiert den laufenden Satz-Countdown und merkt die Restzeit
  window.sessionCountdownPause = function() {
    const c = trainingSession && trainingSession.countdown;
    if (!c || c.status !== "laeuft") return;
    c.restMs = sessionCountdownRestMs(c);
    c.status = "pausiert";
    trainingSessionAusDomUebernehmen();
    renderTrainingSession();
  };

  // Sätze/Sekunden im Fokus-Modus geändert: Countdown neu aufbauen,
  // solange er noch nicht begonnen hat (so erscheint er auch, wenn die
  // Sekunden erst hier eingetragen werden).
  window.sessionCountdownWerteGeaendert = function() {
    if (!trainingSession) return;
    const c = trainingSession.countdown;
    if (c && !(c.status === "bereit" && c.satz === 1)) return;
    trainingSessionAusDomUebernehmen();
    trainingSession.countdown = null;
    renderTrainingSession();
  };

  // Setzt den Countdown der aktuellen Übung zurück („Nochmal“)
  window.sessionCountdownNeu = function() {
    if (!trainingSession) return;
    trainingSessionAusDomUebernehmen();
    trainingSession.countdown = null;
    renderTrainingSession();
  };

  // Erzeugt das HTML des Satz-Countdowns mit Status und passendem Knopf
  function sessionCountdownHtml() {
    const c = sessionCountdownAktuell();
    if (!c) return "";
    const rest = Math.ceil(sessionCountdownRestMs(c) / 1000);
    let status, knoepfe;
    if (c.status === "fertig") {
      status = c.saetze > 1 ? `Alle ${c.saetze} Sätze geschafft ✓` : "Geschafft ✓";
      knoepfe = `<button class="session-fokus-btn-sek" onclick="sessionCountdownNeu()">↺ Nochmal</button>`;
    } else if (c.status === "laeuft") {
      status = `Satz ${c.satz} von ${c.saetze} läuft`;
      knoepfe = `<button class="session-fokus-btn-sek" onclick="sessionCountdownPause()">${ic("pause")}Pause</button>`;
    } else if (c.status === "pausiert") {
      status = `Satz ${c.satz} von ${c.saetze} pausiert`;
      knoepfe = `<button class="session-fokus-btn-primaer" onclick="sessionCountdownStart()">${ic("play")}Weiter</button>`;
    } else {
      status = `Satz ${c.satz} von ${c.saetze}`;
      knoepfe = `<button class="session-fokus-btn-primaer" onclick="sessionCountdownStart()">${ic("play")}${c.saetze > 1 ? `Satz ${c.satz} starten` : "Start"}</button>`;
    }
    return `
      <div class="session-countdown session-countdown-${c.status}">
        <div class="session-countdown-status">${status}</div>
        ${c.status !== "fertig" ? `<div class="timer-countdown" id="session-countdown-zeit">${zeitFormat(rest)}</div>` : ""}
        <div class="session-countdown-knoepfe">${knoepfe}</div>
      </div>`;
  }

  // Rendert das Fokus-Overlay der Plan-Session (Übung, Werte, Countdown, Navigation)
  function renderTrainingSession() {
    const overlay = document.getElementById("session-fokus-overlay");
    if (!overlay) return;
    if (!trainingSession) { overlay.remove(); return; }

    const gesamt = trainingSession.uebungen.length;
    const i = trainingSession.index;
    const u = trainingSession.uebungen[i];
    const istLetzte = i === gesamt - 1;
    const bildUrl = stammdatenBildUrlFuerName("uebung", u.name);

    overlay.innerHTML = `
      <div class="session-fokus-kopf">
        <span class="session-fokus-titel">${escapeHtml(trainingSession.planName)} · Übung ${i + 1} von ${gesamt}</span>
        <span class="session-gesamtzeit" title="Gesamtzeit">${ic("stoppuhr")} <span id="session-gesamtzeit">${zeitFormat((Date.now() - trainingSession.startMs) / 1000, true)}</span></span>
        <button class="session-fokus-schliessen" onclick="trainingSessionAbbrechen()" aria-label="Schließen">${ic("x")}</button>
      </div>
      <div class="session-fokus-inhalt">
        <div class="row" style="flex-wrap:wrap; gap:0.5rem;">
          <input type="text" id="session-sportart" placeholder="Sportart" value="${escapeAttr(trainingSession.sportart)}" list="training-sportart-liste" style="flex:1; min-width:120px;">
          <input type="text" id="session-ort" placeholder="Ort (optional)" value="${escapeAttr(trainingSession.ort)}" list="training-ort-liste" style="flex:1; min-width:120px;">
        </div>
        ${bildUrl ? `<img src="${escapeAttr(bildUrl)}" class="session-fokus-bild" alt="">` : ""}
        <input type="text" id="session-ueb-name" class="session-fokus-uebung-name" value="${escapeAttr(u.name)}" placeholder="Übung" list="training-uebung-namen-liste">
        ${sessionCountdownHtml()}
        <div class="session-fokus-werte">
          <div><label>Sätze</label><input type="number" id="session-ueb-saetze" value="${escapeAttr(u.saetze)}" min="0" onchange="sessionCountdownWerteGeaendert()"></div>
          <div><label>Wdh</label><input type="number" id="session-ueb-wdh" value="${escapeAttr(u.wiederholungen)}" min="0"></div>
          <div><label>Sek.</label><input type="number" id="session-ueb-sekunden" value="${escapeAttr(u.sekunden)}" min="0" onchange="sessionCountdownWerteGeaendert()"></div>
          <div><label>Gewicht (kg)</label><input type="number" id="session-ueb-gewicht" value="${escapeAttr(u.gewicht_kg)}" min="0" step="0.5"></div>
        </div>
        <input type="text" id="session-ueb-progression" value="${escapeAttr(u.progression || "")}" placeholder="Variante (z.B. unterstützt)">
      </div>
      <div class="session-fokus-fuss">
        <button class="session-fokus-btn-sek" onclick="trainingSessionZurueck()" ${i === 0 ? "disabled" : ""}>← Zurück</button>
        ${istLetzte
          ? `<button class="session-fokus-btn-primaer" onclick="trainingSessionAbschliessen()">Training speichern</button>`
          : `<button class="session-fokus-btn-primaer" onclick="trainingSessionWeiter()">Weiter →</button>`}
      </div>`;
  }

  // ------------------------------------------------------------
  // Intervall-Timer: benannte Vorlagen (Verwaltung) + Vollbild-
  // Fokus-Modus mit automatisch laufendem Countdown (Signalton +
  // Vibration bei jedem Phasenwechsel, Screen-Wake-Lock während
  // der Timer läuft, damit das Display nicht einschläft).
  // ------------------------------------------------------------

  function renderTimerVerwaltung() {
    const listEl = document.getElementById("timer-liste");
    if (!listEl) return;
    const liste = intervallTimer
      .filter((t) => bereichVon(t) === aktiverBereich)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Baut das HTML eines Intervall-Timers – als Bearbeiten-Formular oder als Anzeigezeile
    function timerHtml(t) {
      if (timerBearbeitenId === t.id) {
        return `
          <div class="notiz-item" style="flex-direction:column; align-items:stretch;">
            <input type="text" id="timer-edit-name-${t.id}" value="${escapeAttr(t.name)}" placeholder="Name">
            <div class="row" style="flex-wrap:wrap; margin-top:0.6rem; gap:0.5rem;">
              <div style="display:flex; flex-direction:column; gap:0.2rem;">
                <label style="font-size:0.78rem; color:var(--ink-dim);">Arbeit (Sek.)</label>
                <input type="number" id="timer-edit-arbeit-${t.id}" min="1" value="${t.arbeit_sekunden}" style="width:6.5rem;">
              </div>
              <div style="display:flex; flex-direction:column; gap:0.2rem;">
                <label style="font-size:0.78rem; color:var(--ink-dim);">Pause (Sek.)</label>
                <input type="number" id="timer-edit-pause-${t.id}" min="0" value="${t.pause_sekunden}" style="width:6.5rem;">
              </div>
              <div style="display:flex; flex-direction:column; gap:0.2rem;">
                <label style="font-size:0.78rem; color:var(--ink-dim);">Runden</label>
                <input type="number" id="timer-edit-runden-${t.id}" min="1" value="${t.runden}" style="width:6.5rem;">
              </div>
              <div style="display:flex; flex-direction:column; gap:0.2rem;">
                <label style="font-size:0.78rem; color:var(--ink-dim);">Vorbereitung (Sek.)</label>
                <input type="number" id="timer-edit-vorbereitung-${t.id}" min="0" value="${t.vorbereitung_sekunden}" style="width:6.5rem;">
              </div>
            </div>
            <div class="row" style="margin-top:0.6rem;">
              <button class="btn-primary" onclick="timerBearbeitenSpeichern('${t.id}')">Speichern</button>
              <button class="link-btn" onclick="timerBearbeitenAbbrechen()">Abbrechen</button>
            </div>
          </div>`;
      }
      return `
        <div class="notiz-item">
          <div style="flex:1;">
            <span class="notiz-text">${escapeHtml(t.name)}</span>
            <span class="notiz-meta">${t.arbeit_sekunden}s Arbeit${t.pause_sekunden ? ` / ${t.pause_sekunden}s Pause` : ""} × ${t.runden} Runde${t.runden === 1 ? "" : "n"}${t.vorbereitung_sekunden ? ` · ${t.vorbereitung_sekunden}s Vorbereitung` : ""}</span>
          </div>
          <button class="link-btn" onclick="timerStarten('${t.id}')">${ic("play")}Starten</button>
          <button class="task-edit-btn" onclick="timerBearbeitenStart('${t.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>
          <button class="task-delete" onclick="timerLoeschen('${t.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>`;
    }

    listEl.innerHTML = liste.length
      ? `<div class="notiz-list">${liste.map(timerHtml).join("")}</div>`
      : '<p class="empty-text">Noch keine Timer angelegt.</p>';
  }

  const btnTimerHinzufuegen = document.getElementById("btn-timer-hinzufuegen");
  if (btnTimerHinzufuegen) btnTimerHinzufuegen.addEventListener("click", timerHinzufuegen);

  // Legt einen neuen Intervall-Timer aus dem Formular im aktiven Bereich an
  async function timerHinzufuegen() {
    const nameEl = document.getElementById("timer-neu-name");
    const name = nameEl.value.trim();
    if (!name) return;
    await api("timer_hinzufuegen", {
      bereich: aktiverBereich,
      name,
      arbeit_sekunden: document.getElementById("timer-neu-arbeit").value,
      pause_sekunden: document.getElementById("timer-neu-pause").value,
      runden: document.getElementById("timer-neu-runden").value,
      vorbereitung_sekunden: document.getElementById("timer-neu-vorbereitung").value,
    });
    nameEl.value = "";
    await ladeDaten();
    renderTraining();
  }

  // Öffnet das Bearbeiten-Formular eines Intervall-Timers
  window.timerBearbeitenStart = function(id) {
    timerBearbeitenId = id;
    renderTraining();
  };

  // Bricht das Bearbeiten eines Intervall-Timers ab
  window.timerBearbeitenAbbrechen = function() {
    timerBearbeitenId = null;
    renderTraining();
  };

  // Speichert den bearbeiteten Intervall-Timer und lädt die Trainingsdaten neu
  window.timerBearbeitenSpeichern = async function(id) {
    const name = document.getElementById(`timer-edit-name-${id}`).value.trim();
    if (!name) return;
    await api("timer_aktualisieren", {
      id,
      name,
      arbeit_sekunden: document.getElementById(`timer-edit-arbeit-${id}`).value,
      pause_sekunden: document.getElementById(`timer-edit-pause-${id}`).value,
      runden: document.getElementById(`timer-edit-runden-${id}`).value,
      vorbereitung_sekunden: document.getElementById(`timer-edit-vorbereitung-${id}`).value,
    });
    timerBearbeitenId = null;
    await ladeDaten();
    renderTraining();
  };

  // Löscht einen Intervall-Timer nach Rückfrage
  window.timerLoeschen = async function(id) {
    if (!confirm("Diesen Timer endgültig löschen?")) return;
    await api("timer_loeschen", { id });
    await ladeDaten();
    renderTraining();
  };

  let timerIntervalHandle = null;

  // Startet einen Intervall-Timer: legt die Session an (mit Vorbereitung, falls gesetzt) und öffnet den Fokusmodus
  window.timerStarten = function(id) {
    const t = intervallTimer.find((x) => x.id === id);
    if (!t) return;
    const startPhase = t.vorbereitung_sekunden > 0 ? "vorbereitung" : "arbeit";
    timerSession = {
      name: t.name,
      arbeit: t.arbeit_sekunden,
      pause: t.pause_sekunden,
      runden: t.runden,
      vorbereitung: t.vorbereitung_sekunden,
      phase: startPhase,
      rundeAktuell: 1,
      sekundenVerbleibend: startPhase === "vorbereitung" ? t.vorbereitung_sekunden : t.arbeit_sekunden,
      laeuft: true,
      wakeLock: null,
    };
    audioFreischalten();
    timerFokusOeffnen();
    timerSignal(timerSession.phase);
  };

  // Öffnet das Vollbild-Overlay des Timers, hält den Bildschirm wach und startet den Sekundentakt
  function timerFokusOeffnen() {
    if (!document.getElementById("timer-fokus-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "session-fokus-overlay";
      overlay.id = "timer-fokus-overlay";
      document.body.appendChild(overlay);
    }
    renderTimerSession();
    try { document.documentElement.requestFullscreen?.()?.catch(() => {}); } catch {}
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen")
        .then((lock) => { if (timerSession) timerSession.wakeLock = lock; })
        .catch(() => {});
    }
    clearInterval(timerIntervalHandle);
    timerIntervalHandle = setInterval(timerTick, 1000);
  }

  // Stoppt den Sekundentakt, entfernt das Timer-Overlay und verlässt den Vollbildmodus
  function timerFokusSchliessen() {
    clearInterval(timerIntervalHandle);
    timerIntervalHandle = null;
    const overlay = document.getElementById("timer-fokus-overlay");
    if (overlay) overlay.remove();
    if (document.fullscreenElement) {
      try { document.exitFullscreen?.().catch(() => {}); } catch {}
    }
  }

  // Sekundentakt des Timers: zählt herunter und wechselt bei 0 in die nächste Phase
  function timerTick() {
    if (!timerSession || !timerSession.laeuft) return;
    timerSession.sekundenVerbleibend--;
    if (timerSession.sekundenVerbleibend <= 0) {
      timerPhaseWeiter();
    } else {
      renderTimerSession();
    }
  }

  // Schaltet zur nächsten Phase (Vorbereitung → Arbeit → Pause → …) bzw. beendet nach der letzten Runde
  function timerPhaseWeiter() {
    const t = timerSession;
    if (t.phase === "vorbereitung") {
      t.phase = "arbeit";
      t.sekundenVerbleibend = t.arbeit;
    } else if (t.phase === "arbeit") {
      if (t.rundeAktuell >= t.runden) {
        t.phase = "fertig";
        t.laeuft = false;
        clearInterval(timerIntervalHandle);
        timerIntervalHandle = null;
        timerSignal("fertig");
        renderTimerSession();
        return;
      }
      if (t.pause > 0) {
        t.phase = "pause";
        t.sekundenVerbleibend = t.pause;
      } else {
        t.rundeAktuell++;
        t.phase = "arbeit";
        t.sekundenVerbleibend = t.arbeit;
      }
    } else if (t.phase === "pause") {
      t.rundeAktuell++;
      t.phase = "arbeit";
      t.sekundenVerbleibend = t.arbeit;
    }
    timerSignal(t.phase);
    renderTimerSession();
  }

  // Ein gemeinsamer AudioContext für alle Signaltöne (Intervall-Timer
  // und Satz-Countdown). Browser begrenzen die Zahl gleichzeitiger
  // Contexts, und iOS spielt Ton nur ab, wenn der Context einmal
  // innerhalb eines Tipps gestartet wurde – daher audioFreischalten()
  // bei jedem Start-Knopf.
  let signalAudioCtx = null;

  function audioFreischalten() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!signalAudioCtx) signalAudioCtx = new AudioCtx();
      if (signalAudioCtx.state === "suspended") signalAudioCtx.resume().catch(() => {});
      return signalAudioCtx;
    } catch {
      return null;
    }
  }

  // Gibt Vibration und Signalton passend zur Phase aus (Arbeit hoch, Pause tief, Fertig als Melodie)
  function timerSignal(phase) {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(phase === "fertig" ? [200, 100, 200, 100, 400] : 200);
      }
    } catch {}
    try {
      const ctx = audioFreischalten();
      if (!ctx) return;
      const beep = (freq, start, dauer) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dauer);
      };
      if (phase === "fertig") {
        beep(880, 0, 0.15); beep(1046, 0.18, 0.15); beep(1318, 0.36, 0.3);
      } else if (phase === "arbeit") {
        beep(880, 0, 0.2);
      } else if (phase === "pause") {
        beep(523, 0, 0.2);
      } else {
        beep(660, 0, 0.15);
      }
    } catch {}
  }

  // Pausiert den laufenden Timer bzw. setzt ihn fort
  window.timerPausieren = function() {
    if (!timerSession) return;
    timerSession.laeuft = !timerSession.laeuft;
    renderTimerSession();
  };

  // Beendet den Timer (mit Rückfrage, solange nicht fertig) und gibt den Wake-Lock frei
  window.timerAbbrechen = function() {
    if (!timerSession) return;
    if (timerSession.phase !== "fertig" && !confirm("Timer beenden?")) return;
    if (timerSession.wakeLock) { try { timerSession.wakeLock.release(); } catch {} }
    timerSession = null;
    timerFokusSchliessen();
  };

  // Zeichnet das Timer-Overlay: Phase, Runde und Countdown mm:ss samt Pause-/Beenden-Knöpfen
  function renderTimerSession() {
    const overlay = document.getElementById("timer-fokus-overlay");
    if (!overlay || !timerSession) return;
    const t = timerSession;
    const phaseLabel = { vorbereitung: "Vorbereitung", arbeit: "Arbeit", pause: "Pause", fertig: "Fertig!" }[t.phase];
    const mm = String(Math.floor(t.sekundenVerbleibend / 60)).padStart(2, "0");
    const ss = String(t.sekundenVerbleibend % 60).padStart(2, "0");

    overlay.innerHTML = `
      <div class="session-fokus-kopf">
        <span class="session-fokus-titel">${escapeHtml(t.name)} · Runde ${Math.min(t.rundeAktuell, t.runden)} von ${t.runden}</span>
        <button class="session-fokus-schliessen" onclick="timerAbbrechen()" aria-label="Schließen">${ic("x")}</button>
      </div>
      <div class="session-fokus-inhalt timer-fokus-mitte timer-phase-${t.phase}">
        <div class="timer-phase-label">${phaseLabel}</div>
        ${t.phase !== "fertig" ? `<div class="timer-countdown">${mm}:${ss}</div>` : ""}
      </div>
      <div class="session-fokus-fuss">
        ${t.phase !== "fertig" ? `<button class="session-fokus-btn-sek" onclick="timerPausieren()">${t.laeuft ? ic("pause") + "Pause" : ic("play") + "Weiter"}</button>` : ""}
        <button class="session-fokus-btn-primaer" onclick="timerAbbrechen()">${t.phase === "fertig" ? "Fertig" : "Beenden"}</button>
      </div>`;
  }

  // ------------------------------------------------------------
  // Ziel-Events: benannte Ziele mit Datum (z.B. Wettkampf-Termine)
  // und Countdown-Anzeige, optional mit einem Trainingsplan verlinkt.
  // ------------------------------------------------------------

  function renderZielEvents() {
    const listEl = document.getElementById("zielevent-liste");
    if (!listEl) return;
    const heute = heuteISO();
    const liste = zielEvents
      .filter((z) => bereichVon(z) === aktiverBereich)
      .slice()
      .sort((a, b) => a.datum.localeCompare(b.datum));

    const planAuswahlEl = document.getElementById("zielevent-neu-plan");
    if (planAuswahlEl) {
      planAuswahlEl.innerHTML = '<option value="">Kein Plan</option>'
        + trainingsplaeneAktuell().map((p) => `<option value="${p.id}">${escapeAttr(p.name)}</option>`).join("");
    }

    // Liefert den Countdown-Text bis zum Datum (z. B. "noch 20 Tage (≈ 3 Wochen)" oder "war vor …")
    function countdownText(datum) {
      const tage = Math.round((new Date(datum + "T00:00:00") - new Date(heute + "T00:00:00")) / 86400000);
      if (tage < 0) return `war vor ${Math.abs(tage)} Tag${Math.abs(tage) === 1 ? "" : "en"}`;
      if (tage === 0) return "heute!";
      const wochenText = tage >= 14 ? ` (≈ ${Math.round(tage / 7)} Wochen)` : "";
      return `noch ${tage} Tag${tage === 1 ? "" : "e"}${wochenText}`;
    }

    // Erzeugt das HTML eines Ziel-Events – Bearbeitungsformular oder Anzeige mit Countdown und Plan-Start
    function eventHtml(z) {
      const istVorbei = z.datum < heute;
      if (zielEventBearbeitenId === z.id) {
        return `
          <div class="notiz-item" style="flex-direction:column; align-items:stretch;">
            <input type="text" id="zielevent-edit-name-${z.id}" value="${escapeAttr(z.name)}" placeholder="Name (z.B. Mud Master)">
            <div class="row" style="margin-top:0.5rem; flex-wrap:wrap; gap:0.5rem;">
              <input type="date" id="zielevent-edit-datum-${z.id}" value="${z.datum}">
              <select id="zielevent-edit-plan-${z.id}">
                <option value="">Kein Plan</option>
                ${trainingsplaeneAktuell().map((p) => `<option value="${p.id}" ${p.id === z.plan_id ? "selected" : ""}>${escapeAttr(p.name)}</option>`).join("")}
              </select>
            </div>
            <div class="row" style="margin-top:0.5rem; flex-wrap:wrap; gap:0.5rem;">
              <input type="text" id="zielevent-edit-ort-${z.id}" value="${escapeAttr(z.ort || "")}" placeholder="Ort (optional)" style="flex:1; min-width:130px;">
              <input type="number" id="zielevent-edit-strecke-${z.id}" value="${z.strecke_km ?? ""}" placeholder="Ziel-Strecke (km)" min="0" step="0.1" style="width:9rem;">
            </div>
            <textarea id="zielevent-edit-beschreibung-${z.id}" placeholder="Beschreibung (optional)" rows="2" style="margin-top:0.5rem; width:100%;">${escapeHtml(z.beschreibung || "")}</textarea>
            <div class="row" style="margin-top:0.6rem;">
              <button class="btn-primary" onclick="zieleventBearbeitenSpeichern('${z.id}')">Speichern</button>
              <button class="link-btn" onclick="zieleventBearbeitenAbbrechen()">Abbrechen</button>
            </div>
          </div>`;
      }
      return `
        <div class="notiz-item" ${istVorbei ? 'style="opacity:0.55;"' : ""}>
          <div style="flex:1;">
            <span class="notiz-text">${escapeHtml(z.name)}${z.ort ? " · " + escapeHtml(z.ort) : ""}</span>
            <span class="notiz-meta">
              ${datumDe(z.datum)} · ${countdownText(z.datum)}
              ${z.strecke_km ? " · " + z.strecke_km + " km" : ""}
              ${z.plan_id ? " · Plan: " + escapeHtml(planName(z.plan_id) || "?") : ""}
            </span>
            ${z.beschreibung ? `<span class="notiz-meta" style="white-space:pre-wrap;">${escapeHtml(z.beschreibung)}</span>` : ""}
          </div>
          ${z.plan_id ? `<button class="link-btn" onclick="planStarten('${z.plan_id}')">${ic("play")}Starten</button>` : ""}
          <button class="task-edit-btn" onclick="zieleventBearbeitenStart('${z.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>
          <button class="task-delete" onclick="zieleventLoeschen('${z.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>`;
    }

    listEl.innerHTML = liste.length
      ? `<div class="notiz-list">${liste.map(eventHtml).join("")}</div>`
      : '<p class="empty-text">Noch keine Ziele angelegt.</p>';
  }

  const btnZieleventHinzufuegen = document.getElementById("btn-zielevent-hinzufuegen");
  if (btnZieleventHinzufuegen) btnZieleventHinzufuegen.addEventListener("click", zieleventHinzufuegen);

  // Legt ein neues Ziel-Event im aktiven Bereich an und leert das Formular
  async function zieleventHinzufuegen() {
    const nameEl = document.getElementById("zielevent-neu-name");
    const datumEl = document.getElementById("zielevent-neu-datum");
    const name = nameEl.value.trim();
    const datum = datumEl.value;
    if (!name || !datum) return;
    const plan_id = document.getElementById("zielevent-neu-plan").value || null;
    const ort = document.getElementById("zielevent-neu-ort").value.trim() || null;
    const strecke_km = document.getElementById("zielevent-neu-strecke").value || null;
    const beschreibung = document.getElementById("zielevent-neu-beschreibung").value.trim() || null;
    await api("zielevent_hinzufuegen", { bereich: aktiverBereich, name, datum, plan_id, ort, strecke_km, beschreibung });
    nameEl.value = "";
    datumEl.value = "";
    document.getElementById("zielevent-neu-ort").value = "";
    document.getElementById("zielevent-neu-strecke").value = "";
    document.getElementById("zielevent-neu-beschreibung").value = "";
    await ladeDaten();
    renderTraining();
  }

  // Öffnet ein Ziel-Event im Bearbeitungsmodus
  window.zieleventBearbeitenStart = function(id) {
    zielEventBearbeitenId = id;
    renderTraining();
  };

  // Bricht die Bearbeitung eines Ziel-Events ab
  window.zieleventBearbeitenAbbrechen = function() {
    zielEventBearbeitenId = null;
    renderTraining();
  };

  // Speichert das bearbeitete Ziel-Event und lädt die Daten neu
  window.zieleventBearbeitenSpeichern = async function(id) {
    const name = document.getElementById(`zielevent-edit-name-${id}`).value.trim();
    const datum = document.getElementById(`zielevent-edit-datum-${id}`).value;
    if (!name || !datum) return;
    const plan_id = document.getElementById(`zielevent-edit-plan-${id}`).value || null;
    const ort = document.getElementById(`zielevent-edit-ort-${id}`).value.trim() || null;
    const strecke_km = document.getElementById(`zielevent-edit-strecke-${id}`).value || null;
    const beschreibung = document.getElementById(`zielevent-edit-beschreibung-${id}`).value.trim() || null;
    await api("zielevent_aktualisieren", { id, name, datum, plan_id, ort, strecke_km, beschreibung });
    zielEventBearbeitenId = null;
    await ladeDaten();
    renderTraining();
  };

  // Löscht ein Ziel-Event nach Rückfrage
  window.zieleventLoeschen = async function(id) {
    if (!confirm("Dieses Ziel endgültig löschen?")) return;
    await api("zielevent_loeschen", { id });
    await ladeDaten();
    renderTraining();
  };

  // ------------------------------------------------------------
  // Auswertung nach Kategorie: Sportart-Kategorien (aus den
  // Stammdaten) je gewähltem Jahr als Balkendiagramm – Anzahl
  // Einheiten (Balkenlänge) + Gesamtdauer je Kategorie.
  // ------------------------------------------------------------

  function sportartKategorie(sportartName) {
    const name = (sportartName || "").trim().toLowerCase();
    if (!name) return "Ohne Kategorie";
    const eintrag = trainingStammdaten.find(
      (s) => bereichVon(s) === aktiverBereich && s.typ === "sportart" && s.name.trim().toLowerCase() === name
    );
    return (eintrag && eintrag.kategorie) || "Ohne Kategorie";
  }

  // Formatiert Minuten als lesbare Dauer, z. B. "1 Std. 30 Min."
  function formatMinuten(min) {
    if (!min) return "0 Min.";
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (!h) return `${m} Min.`;
    return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
  }

  // Baut das SVG-Balkendiagramm der Trainings je Sportart-Kategorie für ein Jahr (Einheiten + Dauer)
  function trainingKategorienChartSvg(jahr) {
    const proKategorie = {};
    training
      .filter((t) => bereichVon(t) === aktiverBereich && (t.datum || "").slice(0, 4) === String(jahr))
      .forEach((t) => {
        const kat = sportartKategorie(t.sportart);
        if (!proKategorie[kat]) proKategorie[kat] = { minuten: 0, einheiten: 0 };
        proKategorie[kat].minuten += Number(t.dauer_minuten) || 0;
        proKategorie[kat].einheiten += 1;
      });

    const eintraege = Object.entries(proKategorie).sort((a, b) => b[1].einheiten - a[1].einheiten);
    if (!eintraege.length) return `<p class="empty-text">Keine Trainings für ${jahr}.</p>`;

    const breite = 700;
    const zeilenHoehe = 26;
    const hoehe = eintraege.length * zeilenHoehe + 10;
    const maxWert = Math.max(...eintraege.map(([, w]) => w.einheiten));
    const labelBreite = 130;
    const balkenMax = breite - labelBreite - 90;

    const balken = eintraege.map(([kat, w], i) => {
      const y = i * zeilenHoehe + 6;
      const b = (balkenMax * w.einheiten) / maxWert;
      return `
        <text x="0" y="${y + 13}" font-size="10" fill="var(--ink)">${escapeHtml(kat.length > 16 ? kat.slice(0, 15) + "…" : kat)}</text>
        <rect x="${labelBreite}" y="${y}" width="${Math.max(2, b)}" height="16" rx="3" fill="var(--accent)"></rect>
        <text x="${labelBreite + b + 6}" y="${y + 13}" font-size="10" fill="var(--ink-dim)">${w.einheiten} · ${formatMinuten(w.minuten)}</text>
      `;
    }).join("");

    return `<svg viewBox="0 0 ${breite} ${hoehe}" style="width:100%; height:auto; display:block;">${balken}</svg>`;
  }

  // Füllt die Jahresauswahl und rendert die Kategorie-Auswertung für das gewählte Jahr
  function renderKategorieAuswertung() {
    const bereichEl = document.getElementById("auswertung-kategorie-bereich");
    if (!bereichEl) return;

    const jahreVorhanden = [...new Set(
      training.filter((t) => bereichVon(t) === aktiverBereich).map((t) => (t.datum || "").slice(0, 4))
    )].filter(Boolean).sort((a, b) => b.localeCompare(a));
    if (!jahreVorhanden.includes(String(auswertungJahr))) {
      auswertungJahr = jahreVorhanden.length ? Number(jahreVorhanden[0]) : new Date().getFullYear();
    }

    const jahrAuswahlEl = document.getElementById("auswertung-jahr-auswahl");
    if (jahrAuswahlEl) {
      const jahre = jahreVorhanden.length ? jahreVorhanden : [String(new Date().getFullYear())];
      jahrAuswahlEl.innerHTML = jahre.map((j) => `<option value="${j}" ${Number(j) === auswertungJahr ? "selected" : ""}>${j}</option>`).join("");
    }

    bereichEl.innerHTML = trainingKategorienChartSvg(auswertungJahr);
  }

  // Übernimmt das gewählte Auswertungsjahr und zeichnet das Training neu
  window.auswertungJahrGewaehlt = function(jahr) {
    auswertungJahr = Number(jahr);
    renderTraining();
  };

  // ------------------------------------------------------------
  // Übungsverlauf (Langzeit-Diagramm: Gewicht je Übung über die Zeit)
  // ------------------------------------------------------------

  let verlaufAusgewaehlteUebung = null;

  // Liefert alle Übungsnamen aus Trainings des aktiven Bereichs, alphabetisch sortiert
  function trainingUebungsnamenAktuell() {
    const idsAktuell = new Set(training.filter((t) => bereichVon(t) === aktiverBereich).map((t) => t.id));
    const namen = new Set();
    trainingUebungen.forEach((u) => {
      if (idsAktuell.has(u.training_id) && (u.name || "").trim()) namen.add(u.name.trim());
    });
    return [...namen].sort((a, b) => a.localeCompare(b));
  }

  // Sammelt die Gewichtsangaben einer Übung im aktiven Bereich als Datum/Gewicht-Punkte, chronologisch
  function trainingVerlaufFuerUebung(name) {
    const key = (name || "").trim().toLowerCase();
    if (!key) return [];
    const trainingMap = {};
    training.forEach((t) => { if (bereichVon(t) === aktiverBereich) trainingMap[t.id] = t; });
    const punkte = [];
    trainingUebungen.forEach((u) => {
      if ((u.name || "").trim().toLowerCase() !== key) return;
      if (u.gewicht_kg === null || u.gewicht_kg === undefined || u.gewicht_kg === "") return;
      const t = trainingMap[u.training_id];
      if (!t) return;
      punkte.push({ datum: t.datum, gewicht_kg: Number(u.gewicht_kg) });
    });
    punkte.sort((a, b) => a.datum.localeCompare(b.datum));
    return punkte;
  }

  // Baut das SVG-Liniendiagramm des Gewichtsverlaufs einer Übung mit Min/Max- und Datumslabels
  function trainingVerlaufChartSvg(punkte) {
    const breite = 700, hoehe = 200, unten = 24, oben = 20, linksrand = 10, rechtsrand = 10;
    const werte = punkte.map((p) => p.gewicht_kg);
    const minWert = Math.min(...werte);
    const maxWert = Math.max(...werte);
    const spanne = (maxWert - minWert) || 1;
    const schrittX = (breite - linksrand - rechtsrand) / Math.max(1, punkte.length - 1);
    const yVon = (w) => oben + (hoehe - oben - unten) * (1 - (w - minWert) / spanne);

    const punkteStr = punkte.map((p, i) => `${linksrand + i * schrittX},${yVon(p.gewicht_kg).toFixed(1)}`).join(" ");

    let labelSvg = "";
    punkte.forEach((p, i) => {
      if (i === 0 || i === punkte.length - 1 || punkte.length <= 6) {
        const kurz = `${p.datum.slice(8, 10)}.${p.datum.slice(5, 7)}.`;
        labelSvg += `<text x="${linksrand + i * schrittX}" y="${hoehe - 6}" font-size="9" fill="var(--ink-dim)" text-anchor="middle">${kurz}</text>`;
      }
    });

    return `<svg viewBox="0 0 ${breite} ${hoehe}" style="width:100%; height:auto; display:block;">
      <text x="${linksrand}" y="12" font-size="9" fill="var(--ink-dim)">${maxWert} kg</text>
      <text x="${linksrand}" y="${hoehe - unten - 4}" font-size="9" fill="var(--ink-dim)">${minWert} kg</text>
      <polyline points="${punkteStr}" fill="none" stroke="var(--accent)" stroke-width="2"></polyline>
      ${punkte.map((p, i) => `<circle cx="${linksrand + i * schrittX}" cy="${yVon(p.gewicht_kg).toFixed(1)}" r="2.6" fill="var(--accent)"></circle>`).join("")}
      ${labelSvg}
    </svg>`;
  }

  // Rendert Übungsauswahl und Gewichtsverlauf-Diagramm samt Veränderung seit dem ersten Eintrag
  function renderTrainingsverlauf() {
    const auswahlEl = document.getElementById("verlauf-uebung-auswahl");
    const chartEl = document.getElementById("verlauf-chart-bereich");
    if (!auswahlEl || !chartEl) return;

    const namen = trainingUebungsnamenAktuell();
    if (!namen.length) {
      auswahlEl.innerHTML = "";
      auswahlEl.style.display = "none";
      chartEl.innerHTML = '<p class="empty-text">Noch keine Übungen mit Gewichtsangabe erfasst.</p>';
      return;
    }
    auswahlEl.style.display = "";
    if (!verlaufAusgewaehlteUebung || !namen.includes(verlaufAusgewaehlteUebung)) verlaufAusgewaehlteUebung = namen[0];
    auswahlEl.innerHTML = namen.map((n) => `<option value="${escapeAttr(n)}" ${n === verlaufAusgewaehlteUebung ? "selected" : ""}>${escapeHtml(n)}</option>`).join("");

    const punkte = trainingVerlaufFuerUebung(verlaufAusgewaehlteUebung);
    if (punkte.length < 2) {
      chartEl.innerHTML = '<p class="empty-text">Für diese Übung noch zu wenige Gewichtsangaben (mind. 2 nötig) für ein Diagramm.</p>';
      return;
    }
    const erster = punkte[0].gewicht_kg, letzter = punkte[punkte.length - 1].gewicht_kg;
    const diff = letzter - erster;
    const diffText = diff > 0 ? `+${diff} kg seit dem ersten Eintrag` : diff < 0 ? `${diff} kg seit dem ersten Eintrag` : "unverändert seit dem ersten Eintrag";
    chartEl.innerHTML = `${trainingVerlaufChartSvg(punkte)}<p class="empty-text" style="margin-top:0.4rem;">${punkte.length} Einträge · ${diffText}</p>`;
  }

  const verlaufAuswahlEl = document.getElementById("verlauf-uebung-auswahl");
  if (verlaufAuswahlEl) {
    verlaufAuswahlEl.addEventListener("change", () => {
      verlaufAusgewaehlteUebung = verlaufAuswahlEl.value;
      renderTrainingsverlauf();
    });
  }

  // ==========================================================
  // Spiele (Spielekartei für die Jugendarbeit, nur Privat)
  // ==========================================================
  let spielAktiveKategorie = "alle";
  const SPIEL_OHNE_KATEGORIE = "__ohne__";
  // Bewertungs-Filter: "alle" | "5" | "4" | "3" (= mindestens so viele Sterne) | "ohne"
  let spielBewertungFilter = "alle";
  // Sortierung innerhalb einer Kategorie: "az" | "beste"
  let spielSortierung = "az";
  try { spielSortierung = localStorage.getItem("spiel-sortierung") === "beste" ? "beste" : "az"; } catch (_e) { /* Standard */ }
  // Aufgeklappte Kategorien (bleiben beim Neuzeichnen und beim Bewerten offen)
  const spielGruppenOffen = new Set();
  try { JSON.parse(localStorage.getItem("spiel-gruppen-offen") || "[]").forEach((k) => spielGruppenOffen.add(k)); } catch (_e) { /* leer lassen */ }
  function spielGruppenMerken() {
    try { localStorage.setItem("spiel-gruppen-offen", JSON.stringify([...spielGruppenOffen])); } catch (_e) { /* egal */ }
  }

  // Baut die Infozeile eines Spiels (Teilnehmer, Alter, Dauer, Material) mit Icons
  function spielMetaZeile(s) {
    const teile = [];
    if (s.teilnehmerzahl) teile.push(`<span title="Teilnehmerzahl">${ic("personen")} ${escapeHtml(s.teilnehmerzahl)}</span>`);
    if (s.altersgruppe) teile.push(`<span title="Altersgruppe">${ic("kuchen")} ${escapeHtml(s.altersgruppe)}</span>`);
    if (s.dauer) teile.push(`<span title="Dauer">${ic("stoppuhr")} ${escapeHtml(s.dauer)}</span>`);
    if (s.material) teile.push(`<span title="Material">${ic("werkzeug")} ${escapeHtml(s.material)}</span>`);
    return teile.join(" · ");
  }

  // Erzeugt die fünf antippbaren Bewertungssterne eines Spiels
  function spielSterne(s) {
    const wert = Number(s.bewertung) || 0;
    const knoepfe = [1, 2, 3, 4, 5].map((n) => `
      <button type="button" class="spiel-stern${n <= wert ? " aktiv" : ""}" onclick="spielBewerten('${s.id}', ${n})"
        aria-label="${n} von 5 Sternen${n === wert ? " (nochmal tippen entfernt die Bewertung)" : ""}">${n <= wert ? "★" : "☆"}</button>`).join("");
    return `<div class="spiel-sterne" role="group" aria-label="Bewertung: ${wert ? wert + " von 5" : "noch nicht bewertet"}">${knoepfe}</div>`;
  }

  // Prüft, ob ein Spiel zum aktiven Bewertungsfilter passt
  function spielPasstZuBewertung(s) {
    const wert = Number(s.bewertung) || 0;
    if (spielBewertungFilter === "alle") return true;
    if (spielBewertungFilter === "ohne") return wert === 0;
    return wert >= Number(spielBewertungFilter);
  }

  // Filter aktiv = Kategorien werden automatisch aufgeklappt
  function spielFilterAktiv() {
    return spielBewertungFilter !== "alle" || spielAktiveKategorie !== "alle";
  }

  // Rendert Filterleiste und Spielekartei, gruppiert nach Kategorie, mit Bewertung, Dateien und Bearbeiten
  function renderSpiele() {
    const filterBereich = document.getElementById("spiel-filter-bereich");
    const listeBereich = document.getElementById("spiel-liste-bereich");
    if (!filterBereich || !listeBereich) return;

    const kategorien = [...new Set(spiele.map((s) => s.kategorie).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const ohneKategorieAnzahl = spiele.filter((s) => !s.kategorie).length;

    const datalist = document.getElementById("spiel-kategorie-liste");
    if (datalist) datalist.innerHTML = kategorien.map((k) => `<option value="${escapeAttr(k)}"></option>`).join("");

    const gueltigeWerte = ["alle", ...kategorien, ...(ohneKategorieAnzahl > 0 ? [SPIEL_OHNE_KATEGORIE] : [])];
    if (!gueltigeWerte.includes(spielAktiveKategorie)) spielAktiveKategorie = "alle";

    const anzahlBewertet = spiele.filter((s) => Number(s.bewertung) > 0).length;
    const zaehle = (fn) => spiele.filter(fn).length;
    const bewOption = (wert, text) => `<option value="${wert}" ${spielBewertungFilter === wert ? "selected" : ""}>${text}</option>`;

    filterBereich.innerHTML = `
      <div class="row spiel-filter">
        <select id="spiel-kategorie-filter" onchange="spielFilterAendern(this.value)" aria-label="Nach Kategorie filtern">
          <option value="alle" ${spielAktiveKategorie === "alle" ? "selected" : ""}>Alle Kategorien (${spiele.length})</option>
          ${kategorien.map((k) => {
            const anzahl = spiele.filter((s) => s.kategorie === k).length;
            return `<option value="${escapeAttr(k)}" ${spielAktiveKategorie === k ? "selected" : ""}>${escapeHtml(k)} (${anzahl})</option>`;
          }).join("")}
          ${ohneKategorieAnzahl > 0 ? `<option value="${SPIEL_OHNE_KATEGORIE}" ${spielAktiveKategorie === SPIEL_OHNE_KATEGORIE ? "selected" : ""}>Ohne Kategorie (${ohneKategorieAnzahl})</option>` : ""}
        </select>
        <select id="spiel-bewertung-filter" onchange="spielBewertungFilterAendern(this.value)" aria-label="Nach Bewertung filtern">
          ${bewOption("alle", "Alle Bewertungen")}
          ${bewOption("5", `★★★★★ (${zaehle((s) => Number(s.bewertung) === 5)})`)}
          ${bewOption("4", `ab ★★★★ (${zaehle((s) => Number(s.bewertung) >= 4)})`)}
          ${bewOption("3", `ab ★★★ (${zaehle((s) => Number(s.bewertung) >= 3)})`)}
          ${bewOption("ohne", `Noch nicht bewertet (${spiele.length - anzahlBewertet})`)}
        </select>
        <select id="spiel-sortierung" onchange="spielSortierungAendern(this.value)" aria-label="Sortierung">
          <option value="az" ${spielSortierung === "az" ? "selected" : ""}>A–Z</option>
          <option value="beste" ${spielSortierung === "beste" ? "selected" : ""}>Beste zuerst</option>
        </select>
      </div>
      ${spiele.length ? `<p class="notiz-meta spiel-stand">${anzahlBewertet} von ${spiele.length} Spielen bewertet</p>` : ""}`;

    let gefiltert = spiele;
    if (spielAktiveKategorie === SPIEL_OHNE_KATEGORIE) gefiltert = gefiltert.filter((s) => !s.kategorie);
    else if (spielAktiveKategorie !== "alle") gefiltert = gefiltert.filter((s) => s.kategorie === spielAktiveKategorie);
    gefiltert = gefiltert.filter(spielPasstZuBewertung);

    if (gefiltert.length === 0) {
      listeBereich.innerHTML = spiele.length
        ? '<p class="empty-text">Keine Spiele für diesen Filter.</p>'
        : '<p class="empty-text">Noch keine Spiele hinterlegt.</p>';
      return;
    }

    const gruppen = {};
    gefiltert.forEach((s) => {
      const key = s.kategorie || SPIEL_OHNE_KATEGORIE;
      (gruppen[key] = gruppen[key] || []).push(s);
    });
    const kategorienSortiert = Object.keys(gruppen).sort((a, b) => {
      if (a === SPIEL_OHNE_KATEGORIE) return 1;
      if (b === SPIEL_OHNE_KATEGORIE) return -1;
      return a.localeCompare(b);
    });
    const vergleich = spielSortierung === "beste"
      ? (a, b) => (Number(b.bewertung) || 0) - (Number(a.bewertung) || 0) || a.titel.localeCompare(b.titel)
      : (a, b) => a.titel.localeCompare(b.titel);
    const autoOffen = spielFilterAktiv();

    listeBereich.innerHTML = `<div class="spiel-gruppen">` + kategorienSortiert.map((kat) => {
      const items = gruppen[kat].slice().sort(vergleich);
      const ueberschrift = kat === SPIEL_OHNE_KATEGORIE ? "Ohne Kategorie" : kat;
      const bewertete = items.filter((s) => Number(s.bewertung) > 0);
      const schnitt = bewertete.length
        ? (bewertete.reduce((sum, s) => sum + Number(s.bewertung), 0) / bewertete.length).toLocaleString("de-DE", { maximumFractionDigits: 1 })
        : null;
      const zeilen = items.map((s) => {
        const dateien = spieleDateien.filter((d) => d.spiel_id === s.id);

        const dateiZeilen = dateien.map((d) => {
          const hochgeladen = new Date(d.hochgeladen_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
          return `
                <div>${ic("anhang")} <span onclick="spielDateiOeffnen('${d.id}')" style="text-decoration:underline; cursor:pointer;">${escapeHtml(d.datei_name)}</span>
                  <span style="opacity:0.65;">(${hochgeladen})</span>
                  <span onclick="spielDateiLoeschen('${d.id}')" style="cursor:pointer; margin-left:0.3rem;" title="Datei entfernen" aria-label="Datei entfernen">${ic("x")}</span></div>`;
        }).join("");

        const meta = spielMetaZeile(s);

        return `
          <div class="notiz-item spiel-karte">
            <div class="spiel-karte-inhalt">
              <span class="notiz-text spiel-titel">${escapeHtml(s.titel)}</span>
              ${spielSterne(s)}
              ${meta ? `<div class="notiz-meta" style="margin-top:0.1rem;">${meta}</div>` : ""}
              ${s.beschreibung ? `
              <details class="spiel-beschreibung">
                <summary>Beschreibung</summary>
                <div class="notiz-meta spiel-beschreibung-text">${escapeHtml(s.beschreibung)}</div>
              </details>` : ""}
              <div class="notiz-meta" style="margin-top:0.3rem;">
                ${dateiZeilen}
                <label style="text-decoration:underline; cursor:pointer;">${ic("anhang")} Datei hinzufügen<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none;" onchange="spielDateiHinzufuegen('${s.id}', this)"></label>
              </div>
            </div>
            <div class="spiel-karte-knoepfe">
              <button class="task-edit-btn" onclick="spielBearbeitenStart('${s.id}')" aria-label="Spiel bearbeiten" title="Bearbeiten">${ic("stift")}</button>
              <button class="task-delete" onclick="spielLoeschen('${s.id}')" aria-label="Spiel löschen" title="Löschen">${ic("x")}</button>
            </div>
          </div>`;
      }).join("");
      const offen = autoOffen || spielGruppenOffen.has(kat);
      return `
        <details class="spiel-gruppe" data-kat="${escapeAttr(kat)}" ${offen ? "open" : ""} ontoggle="spielGruppeUmschalten(this)">
          <summary class="spiel-gruppe-kopf">
            <span class="spiel-gruppe-titel">${escapeHtml(ueberschrift)}</span>
            <span class="spiel-gruppe-info">${schnitt ? `Ø ${schnitt} ★ · ` : ""}${bewertete.length}/${items.length} bewertet</span>
            <span class="zl-gruppe-zahl">${items.length}</span>
          </summary>
          <div class="notiz-list">${zeilen}</div>
        </details>`;
    }).join("") + `</div>`;
  }

  // Merkt sich das Auf-/Zuklappen einer Spiele-Kategorie (nicht bei aktivem Filter)
  window.spielGruppeUmschalten = function(el) {
    // Bei aktivem Filter ist alles automatisch offen – das nicht als Wunsch merken
    if (spielFilterAktiv()) return;
    const kat = el.dataset.kat;
    if (el.open) spielGruppenOffen.add(kat); else spielGruppenOffen.delete(kat);
    spielGruppenMerken();
  };

  // Setzt den Kategorie-Filter der Spielekartei
  window.spielFilterAendern = function(wert) {
    spielAktiveKategorie = wert;
    renderSpiele();
  };

  // Setzt den Bewertungsfilter der Spielekartei (nur gültige Werte)
  window.spielBewertungFilterAendern = function(wert) {
    spielBewertungFilter = ["alle", "5", "4", "3", "ohne"].includes(wert) ? wert : "alle";
    renderSpiele();
  };

  // Setzt die Sortierung der Spiele (A–Z/beste zuerst) und speichert sie in localStorage
  window.spielSortierungAendern = function(wert) {
    spielSortierung = wert === "beste" ? "beste" : "az";
    try { localStorage.setItem("spiel-sortierung", spielSortierung); } catch (_e) { /* egal */ }
    renderSpiele();
  };

  // Stern antippen setzt die Bewertung; denselben Stern nochmal antippen entfernt sie.
  // Sofort anzeigen, Server im Hintergrund (wie beim Rezept-Favoriten).
  window.spielBewerten = async function(id, sterne) {
    const s = spiele.find((x) => x.id === id);
    if (!s) return;
    const vorher = s.bewertung ?? null;
    const neu = Number(vorher) === sterne ? null : sterne;
    s.bewertung = neu;
    renderSpiele();
    if (aktiverTab === "einheiten") renderEinheiten();
    try {
      await api("spiel_bewerten", { id, bewertung: neu });
    } catch (e) {
      s.bewertung = vorher;
      renderSpiele();
      alert("Bewertung konnte nicht gespeichert werden: " + e.message);
    }
  };

  document.getElementById("btn-spiel-hinzufuegen").addEventListener("click", spielHinzufuegen);

  // Legt ein neues Spiel an, optional mit PDF-/Word-Anhang (max. 5 MB), und leert das Formular
  async function spielHinzufuegen() {
    const titel = document.getElementById("neu-spiel-titel").value.trim();
    if (!titel) return;
    const kategorie = document.getElementById("neu-spiel-kategorie").value.trim() || null;
    const beschreibung = document.getElementById("neu-spiel-beschreibung").value.trim() || null;
    const teilnehmerzahl = document.getElementById("neu-spiel-teilnehmerzahl").value.trim() || null;
    const altersgruppe = document.getElementById("neu-spiel-altersgruppe").value.trim() || null;
    const dauer = document.getElementById("neu-spiel-dauer").value.trim() || null;
    const material = document.getElementById("neu-spiel-material").value.trim() || null;
    const dateiInput = document.getElementById("neu-spiel-datei");
    const datei = dateiInput.files[0];

    const payload = { titel, kategorie, beschreibung, teilnehmerzahl, altersgruppe, dauer, material };
    if (datei) {
      if (!PROJ_ERLAUBTE_TYPEN.includes(datei.type)) {
        alert("Nur PDF- und Word-Dateien (.docx) sind erlaubt.");
        return;
      }
      if (datei.size > PROJ_MAX_BYTES) {
        alert("Die Datei ist größer als 5 MB.");
        return;
      }
      payload.datei_base64 = await dateiZuBase64(datei);
      payload.datei_name = datei.name;
      payload.datei_typ = datei.type;
    }

    await api("spiel_hinzufuegen", payload);
    document.getElementById("neu-spiel-titel").value = "";
    document.getElementById("neu-spiel-kategorie").value = "";
    document.getElementById("neu-spiel-beschreibung").value = "";
    document.getElementById("neu-spiel-teilnehmerzahl").value = "";
    document.getElementById("neu-spiel-altersgruppe").value = "";
    document.getElementById("neu-spiel-dauer").value = "";
    document.getElementById("neu-spiel-material").value = "";
    dateiInput.value = "";
    await ladeDaten();
  }

  // Bearbeiten eines Spiels: seit Session 35 im Bearbeiten-Blatt
  window.spielBearbeitenStart = function(id) {
    window.blattOeffnen("spiel", id);
  };

  // Löscht ein Spiel samt Dateien nach Rückfrage
  window.spielLoeschen = async function(id) {
    if (!confirm("Dieses Spiel inklusive hinterlegter Dateien wirklich löschen?")) return;
    await api("spiel_loeschen", { id });
    await ladeDaten();
  };

  // Holt eine Download-URL für eine Spiel-Datei und öffnet sie in neuem Tab
  window.spielDateiOeffnen = async function(dateiId) {
    try {
      const res = await api("spiel_datei_url", { datei_id: dateiId });
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      alert("Datei konnte nicht geöffnet werden: " + e.message);
    }
  };

  // Hängt eine PDF-/Word-Datei (max. 5 MB) an ein bestehendes Spiel an
  window.spielDateiHinzufuegen = async function(id, input) {
    const datei = input.files[0];
    if (!datei) return;
    if (!PROJ_ERLAUBTE_TYPEN.includes(datei.type)) {
      alert("Nur PDF- und Word-Dateien (.docx) sind erlaubt.");
      input.value = "";
      return;
    }
    if (datei.size > PROJ_MAX_BYTES) {
      alert("Die Datei ist größer als 5 MB.");
      input.value = "";
      return;
    }
    const datei_base64 = await dateiZuBase64(datei);
    await api("spiel_datei_hinzufuegen", {
      id, datei_base64, datei_name: datei.name, datei_typ: datei.type,
    });
    await ladeDaten();
  };

  // Entfernt eine Datei von einem Spiel nach Rückfrage
  window.spielDateiLoeschen = async function(dateiId) {
    if (!confirm("Diese Datei wirklich entfernen?")) return;
    await api("spiel_datei_loeschen", { datei_id: dateiId });
    await ladeDaten();
  };

  // ==========================================================
  // Links
  // ==========================================================
  function linkHtml(l) {
    return `
      <div class="link-item">
        <div style="flex:1; min-width:0;">
          <a class="link-titel" href="${escapeAttr(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.titel)}</a>
          <span class="link-url">${escapeHtml(l.url)}</span>
          ${l.notiz ? `<span class="link-notiz">${escapeHtml(l.notiz)}</span>` : ""}
        </div>
        <button class="task-edit-btn" onclick="blattOeffnen('link','${l.id}')" aria-label="Link bearbeiten" title="Bearbeiten">${ic("stift")}</button>
        <button class="task-delete" onclick="linkLoeschen('${l.id}')" aria-label="Löschen">${ic("x")}</button>
      </div>`;
  }

  // Escaped Text für HTML-Attribute (zusätzlich Anführungszeichen)
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  // Rendert die Links des aktiven Bereichs, gruppiert nach Projekt, und füllt die Projektauswahl
  function renderLinks() {
    const select = document.getElementById("link-projekt");
    select.innerHTML = '<option value="">Ohne Projekt</option>' +
      projekteAktuell().map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

    const linksBereich = links.filter((l) => bereichVon(l) === aktiverBereich);
    const ohneProjekt = linksBereich.filter((l) => !l.projekt_id);
    const gruppen = projekteAktuell()
      .map((p) => ({ projekt: p, liste: linksBereich.filter((l) => l.projekt_id === p.id) }))
      .filter((g) => g.liste.length > 0);

    let html = "";
    if (ohneProjekt.length > 0) {
      html += `<div class="project-heading">Ohne Projekt</div><div class="task-list">${ohneProjekt.map(linkHtml).join("")}</div>`;
    }
    for (const g of gruppen) {
      html += `<div class="project-heading">${escapeHtml(g.projekt.name)}</div><div class="task-list">${g.liste.map(linkHtml).join("")}</div>`;
    }
    if (linksBereich.length === 0) {
      html = '<p class="empty-text">Noch keine Links gespeichert.</p>';
    }
    document.getElementById("links-bereich").innerHTML = html;
  }

  document.getElementById("btn-link-hinzufuegen").addEventListener("click", linkHinzufuegen);
  document.getElementById("neuer-link-titel").addEventListener("keydown", (e) => {
    if (e.key === "Enter") linkHinzufuegen();
  });
  document.getElementById("neuer-link-url").addEventListener("keydown", (e) => {
    if (e.key === "Enter") linkHinzufuegen();
  });

  // Speichert einen neuen Link im aktiven Bereich und leert das Formular
  async function linkHinzufuegen() {
    const titel = document.getElementById("neuer-link-titel").value.trim();
    const url = document.getElementById("neuer-link-url").value.trim();
    if (!titel || !url) return;
    const notiz = document.getElementById("neuer-link-notiz").value.trim() || null;
    const projekt_id = document.getElementById("link-projekt").value || null;

    await api("link_hinzufuegen", { titel, url, notiz, projekt_id, bereich: aktiverBereich });
    document.getElementById("neuer-link-titel").value = "";
    document.getElementById("neuer-link-url").value = "";
    document.getElementById("neuer-link-notiz").value = "";
    await ladeDaten();
  }

  // Löscht einen Link
  window.linkLoeschen = async function(id) {
    await api("link_loeschen", { id });
    await ladeDaten();
  };

  // ==========================================================
  // Reflexion
  // ==========================================================
  document.getElementById("reflex-datum").value = heuteISO();

  // Formatiert ein ISO-Datum lang auf Deutsch, z. B. "3. Oktober 2026"
  function formatDatumLang(iso) {
    const [j, m, t] = iso.split("-");
    const monate = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
    return `${parseInt(t,10)}. ${monate[parseInt(m,10)-1]} ${j}`;
  }

  // Rendert die Reflexionseinträge des aktiven Bereichs
  function renderReflexionen() {
    const bereich = document.getElementById("reflexion-bereich");
    const reflexionenBereich = reflexionen.filter((r) => bereichVon(r) === aktiverBereich);
    if (reflexionenBereich.length === 0) {
      bereich.innerHTML = '<p class="empty-text">Noch keine Einträge.</p>';
      return;
    }
    bereich.innerHTML = reflexionenBereich.map((r) => `
      <div class="reflex-item">
        <div class="reflex-datum">
          <span>${formatDatumLang(r.datum)}</span>
          <span>
            <button class="task-snooze" style="padding:0.2rem 0.5rem;" onclick="reflexionBearbeitenStart('${r.id}')" title="Bearbeiten" aria-label="Bearbeiten">${ic("stift")}</button>
            <button class="task-delete" style="font-size:1rem;" onclick="reflexionLoeschen('${r.id}')" aria-label="Löschen">${ic("x")}</button>
          </span>
        </div>
        <div class="reflex-text">${escapeHtml(r.text)}</div>
      </div>`).join("");
  }

  // Setzt das Reflexionsformular nach dem Eintragen zurück (heutiges Datum)
  function reflexFormZuruecksetzen() {
    document.getElementById("reflex-text").value = "";
    document.getElementById("reflex-datum").value = heuteISO();
  }

  // Bearbeiten einer Reflexion: seit Session 35 im Bearbeiten-Blatt
  window.reflexionBearbeitenStart = function(id) {
    window.blattOeffnen("reflexion", id);
  };

  document.getElementById("btn-reflex-hinzufuegen").addEventListener("click", reflexSpeichern);

  // Legt eine neue Reflexion im aktiven Bereich an
  async function reflexSpeichern() {
    const text = document.getElementById("reflex-text").value.trim();
    if (!text) return;
    const datum = document.getElementById("reflex-datum").value || heuteISO();

    await api("reflexion_hinzufuegen", { text, datum, bereich: aktiverBereich });
    reflexFormZuruecksetzen();
    await ladeDaten();
  }

  // Löscht eine Reflexion
  window.reflexionLoeschen = async function(id) {
    await api("reflexion_loeschen", { id });
    await ladeDaten();
  };

  // ==========================================================
  // Export (Excel & Word) – läuft komplett im Browser
  // ==========================================================
  function fA() {
    return aufgaben.map((a) => {
      const p = projekteAktuell().find((pr) => pr.id === a.projekt_id);
      return {
        Titel: a.titel,
        Projekt: p ? p.name : "",
        Erledigt: a.erledigt ? "Ja" : "Nein",
        "Fällig am": a.faellig_am || "",
        Beginn: a.uhrzeit ? a.uhrzeit.slice(0, 5) : "",
        Ende: a.ende_uhrzeit ? a.ende_uhrzeit.slice(0, 5) : "",
        "Erinnerung alle X Tage": a.erinnere_alle_tage || "",
        "Erstellt am": a.erstellt_am ? a.erstellt_am.slice(0, 10) : "",
      };
    });
  }
  // Bereitet Termine als Tabellenzeilen für den Export auf
  function fT() {
    return termine.map((t) => ({
      Titel: t.titel,
      Datum: t.datum,
      Beginn: t.uhrzeit ? t.uhrzeit.slice(0, 5) : "",
      Ende: t.ende_uhrzeit ? t.ende_uhrzeit.slice(0, 5) : "",
      Notiz: t.notiz || "",
    }));
  }
  // Bereitet Notizen (mit Projektname) als Tabellenzeilen für den Export auf
  function fN() {
    return notizen.map((n) => {
      const p = projekteAktuell().find((pr) => pr.id === n.projekt_id);
      return {
        Text: n.text,
        Projekt: p ? p.name : "",
        "Erstellt am": n.erstellt_am ? n.erstellt_am.slice(0, 10) : "",
      };
    });
  }
  // Bereitet Links (mit Projektname) als Tabellenzeilen für den Export auf
  function fL() {
    return links.map((l) => {
      const p = projekteAktuell().find((pr) => pr.id === l.projekt_id);
      return {
        Titel: l.titel,
        URL: l.url,
        Notiz: l.notiz || "",
        Projekt: p ? p.name : "",
      };
    });
  }
  // Bereitet Reflexionen als Tabellenzeilen für den Export auf
  function fR() {
    return reflexionen.map((r) => ({
      Datum: r.datum,
      Text: r.text,
    }));
  }
  // Bereitet die Einkaufsliste als Tabellenzeilen für den Export auf
  function fE() {
    return einkaufsliste.map((e) => ({
      Artikel: e.text,
      Erledigt: e.erledigt ? "Ja" : "Nein",
      "Erstellt am": e.erstellt_am ? e.erstellt_am.slice(0, 10) : "",
    }));
  }
  // Bereitet den Verlauf (mit Bereich und Zeitpunkt) als Tabellenzeilen für den Export auf
  function fV() {
    return verlauf.map((v) => ({
      Bereich: BEREICH_KNOPF_TEXT[bereichVon(v)] || bereichVon(v),
      Zeitpunkt: v.erstellt_am ? new Date(v.erstellt_am).toLocaleString("de-DE") : "",
      Kategorie: v.kategorie,
      Aktion: v.aktion,
      Beschreibung: v.beschreibung || "",
    }));
  }
  // Bereitet Ziele mit Zeitraum, übergeordnetem Ziel und Schritt-Fortschritt für den Export auf
  function fZ() {
    const TYP_LABEL = { woche: "Woche", monat: "Monat", jahr: "Jahr" };
    return ziele.map((z) => {
      const schritte = zielSchritte.filter((s) => s.ziel_id === z.id);
      const erledigtCount = schritte.filter((s) => s.erledigt).length;
      const parent = z.uebergeordnetes_ziel_id ? ziele.find((p) => p.id === z.uebergeordnetes_ziel_id) : null;
      return {
        Titel: z.titel,
        Zeitraum: TYP_LABEL[z.zeitraum_typ] || z.zeitraum_typ,
        "Zeitraum-Start": z.zeitraum_start,
        "Übergeordnetes Ziel": parent ? parent.titel : "",
        Fortschritt: schritte.length > 0 ? `${erledigtCount}/${schritte.length}` : "keine Schritte",
      };
    });
  }

  // Bereitet Rezepte als Tabellenzeilen für den Export auf
  function fRz() {
    return rezepte.map((r) => ({
      Bereich: BEREICH_KNOPF_TEXT[bereichVon(r)] || bereichVon(r),
      Titel: r.titel,
      Kategorie: r.kategorie || "",
      Portionen: r.portionen ?? "",
      "Zeit (Min.)": r.zeit_minuten ?? "",
      Favorit: r.favorit ? "Ja" : "Nein",
      "Zuletzt gekocht": r.zuletzt_gekocht || "",
      Foto: r.bild_pfad ? "Ja" : "Nein",
      Zutaten: r.zutaten || "",
      Zubereitung: r.zubereitung || "",
      Quelle: r.quelle || "",
      Notiz: r.notiz || "",
    }));
  }

  // Bereichsfilter für die Export-Funktionen: ohne Angabe alle Bereiche
  function exportImBereich(objekt, bereich) {
    return !bereich || bereichVon(objekt) === bereich;
  }

  // Bereitet Raumvermietungen (nach Datum sortiert) als Tabellenzeilen für den Export auf
  function fRaum(bereich) {
    const MAIL = { gesendet: "verschickt", fehler: "fehlgeschlagen", keine_empfaenger: "Verteiler leer", nicht_eingerichtet: "Versand nicht eingerichtet" };
    return raumVermietungen.filter((v) => exportImBereich(v, bereich))
      .sort((a, b) => (a.datum || "").localeCompare(b.datum || "") || String(a.von || "").localeCompare(String(b.von || "")))
      .map((v) => ({
        Bereich: BEREICH_KNOPF_TEXT[bereichVon(v)] || bereichVon(v),
        Raum: raumName(v.raum_id),
        Datum: v.datum,
        "Bis Datum": v.datum_bis && v.datum_bis !== v.datum ? v.datum_bis : "",
        Von: v.von ? String(v.von).slice(0, 5) : "",
        Bis: v.bis ? String(v.bis).slice(0, 5) : "",
        "Anlass / Belegung": v.mieter_name || "",
        Kontakt: v.mieter_kontakt || "",
        Zweck: v.zweck || "",
        Notiz: v.notiz || "",
        Serie: v.gruppe_id ? "Ja" : "Nein",
        Mail: MAIL[v.mail_status] || "",
      }));
  }

  // Namen der Zugänge eines Schlüssels – bereichsunabhängig, für den Export
  function schluesselZugangNamenAlle(k) {
    const ids = k.zugaenge || [];
    return schluesselZugaenge.filter((z) => ids.includes(z.id))
      .map((z) => z.name).sort((a, b) => a.localeCompare(b, "de"));
  }

  // Bereitet Schlüssel und Keys (nach Verein und Name sortiert) als Tabellenzeilen für den Export auf
  function fSchl(bereich) {
    return schluesselListe.filter((k) => exportImBereich(k, bereich))
      .sort((a, b) => (a.verein || "￿").localeCompare(b.verein || "￿", "de") || schluesselVergleich(a, b))
      .map((k) => ({
        Bereich: BEREICH_KNOPF_TEXT[bereichVon(k)] || bereichVon(k),
        Verein: k.verein || "",
        Name: k.inhaber || "",
        Art: k.art === "key" ? "Elektronischer Key" : "Schlüssel",
        Seriennummer: k.seriennummer,
        "Zugänge": schluesselZugangNamenAlle(k).join(", "),
        Notiz: k.notiz || "",
        "Geändert am": (k.aktualisiert_am || k.erstellt_am || "").slice(0, 10),
      }));
  }

  // Bereitet die Ausgabeprotokolle (ohne Unterschriftsbilder) als Tabellenzeilen für den Export auf
  function fAusg(bereich) {
    return schluesselAusgaben.filter((a) => exportImBereich(a, bereich))
      .sort((a, b) => (b.ausgegeben_am || "").localeCompare(a.ausgegeben_am || ""))
      .map((a) => ({
        Bereich: BEREICH_KNOPF_TEXT[bereichVon(a)] || bereichVon(a),
        Art: a.art === "key" ? "Elektronischer Key" : "Schlüssel",
        Seriennummer: a.seriennummer,
        Name: a.inhaber,
        Verein: a.verein || "",
        Kontakt: a.kontakt || "",
        "Ausgegeben am": a.ausgegeben_am || "",
        "Ausgegeben von": a.ausgegeben_von || "",
        "Rückgabe bis": a.rueckgabe_bis || "",
        "Zurück am": a.zurueck_am || "",
        "Zurückgenommen von": a.zurueck_von || "",
        "Unterschrift Ausgabe": a.hat_unterschrift_ausgabe ? "digital" : "",
        "Unterschrift Rückgabe": a.hat_unterschrift_rueckgabe ? "digital" : "",
        Notiz: a.notiz || "",
      }));
  }

  // Bereitet die Zugänge mit allen Schlüsseln/Keys, die sie öffnen, für den Export auf
  function fZug(bereich) {
    return schluesselZugaenge.filter((z) => exportImBereich(z, bereich))
      .sort((a, b) => a.name.localeCompare(b.name, "de"))
      .map((z) => {
        const keys = schluesselListe.filter((k) => (k.zugaenge || []).includes(z.id)).sort(schluesselVergleich);
        return {
          Bereich: BEREICH_KNOPF_TEXT[bereichVon(z)] || bereichVon(z),
          Zugang: z.name,
          Beschreibung: z.beschreibung || "",
          Anzahl: keys.length,
          "Schlüssel / Keys": keys.map((k) => `${k.inhaber || "ohne Name"}${k.verein ? " (" + k.verein + ")" : ""} – ${k.art === "key" ? "Key" : "Schlüssel"} ${k.seriennummer}`).join("; "),
        };
      });
  }

  const EXPORT_KATEGORIEN = [
    { id: "aufgaben", name: "Aufgaben", daten: fA },
    { id: "termine", name: "Termine", daten: fT },
    { id: "notizen", name: "Notizen", daten: fN },
    { id: "links", name: "Links", daten: fL },
    { id: "reflexion", name: "Reflexion", daten: fR },
    { id: "einkauf", name: "Einkaufsliste", daten: fE },
    { id: "rezepte", name: "Rezepte", daten: fRz },
    { id: "raumplanung", name: "Raumplanung", daten: () => fRaum() },
    { id: "schluessel", name: "Schlüssel", daten: () => fSchl() },
    { id: "zugaenge", name: "Zugänge", daten: () => fZug() },
    { id: "schluesselausgaben", name: "Schlüsselausgaben", daten: () => fAusg() },
    { id: "verlauf", name: "Verlauf", daten: fV },
    { id: "ziele", name: "Ziele", daten: fZ },
  ];

  // Lädt Inhalt als Datei im Browser herunter (über Blob-URL)
  function downloadDatei(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Wandelt Exportdaten in eine HTML-Tabelle mit Überschrift um
  function tabelleAlsHtml(titel, daten) {
    if (daten.length === 0) return `<h2>${escapeHtml(titel)}</h2><p>Keine Einträge.</p>`;
    const spalten = Object.keys(daten[0]);
    let html = `<h2>${escapeHtml(titel)}</h2><table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px;">`;
    html += `<tr>${spalten.map((s) => `<th style="background:var(--bg);text-align:left;">${escapeHtml(s)}</th>`).join("")}</tr>`;
    for (const row of daten) {
      html += `<tr>${spalten.map((s) => `<td>${escapeHtml(String(row[s] ?? ""))}</td>`).join("")}</tr>`;
    }
    html += `</table>`;
    return html;
  }

  // Verpackt HTML als Word-kompatibles Dokument (.doc)
  function wordDokument(titel, innerHtml) {
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${escapeHtml(titel)}</title></head>
      <body>${innerHtml}</body></html>`;
  }

  // Exportiert eine Kategorie als Excel-Datei (SheetJS)
  window.exportExcel = function(kategorieId) {
    if (typeof XLSX === "undefined") { alert("Export-Bibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen."); return; }
    const k = EXPORT_KATEGORIEN.find((k) => k.id === kategorieId);
    const daten = k.daten();
    const ws = XLSX.utils.json_to_sheet(daten.length ? daten : [{ Hinweis: "Keine Einträge" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, k.name.slice(0, 31));
    XLSX.writeFile(wb, `${k.name}.xlsx`);
  };

  // Exportiert eine Kategorie als Word-Datei
  window.exportWord = function(kategorieId) {
    const k = EXPORT_KATEGORIEN.find((k) => k.id === kategorieId);
    const html = wordDokument(k.name, tabelleAlsHtml(k.name, k.daten()));
    downloadDatei(`${k.name}.doc`, html, "application/msword");
  };

  // Exportiert alle Kategorien als Excel-Datei mit je einem Tabellenblatt
  window.exportAllesExcel = function() {
    if (typeof XLSX === "undefined") { alert("Export-Bibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen."); return; }
    const wb = XLSX.utils.book_new();
    for (const k of EXPORT_KATEGORIEN) {
      const daten = k.daten();
      const ws = XLSX.utils.json_to_sheet(daten.length ? daten : [{ Hinweis: "Keine Einträge" }]);
      XLSX.utils.book_append_sheet(wb, ws, k.name.slice(0, 31));
    }
    XLSX.writeFile(wb, "dashboard-export.xlsx");
  };

  // Exportiert alle Kategorien in ein gemeinsames Word-Dokument
  window.exportAllesWord = function() {
    const teile = EXPORT_KATEGORIEN.map((k) => tabelleAlsHtml(k.name, k.daten())).join("<br>");
    const html = wordDokument("Dashboard Export", `<h1>Dashboard Export</h1>${teile}`);
    downloadDatei("dashboard-export.doc", html, "application/msword");
  };

  // Export direkt aus einem Reiter, nur mit den Daten des aktiven Bereichs
  // (Schlüssel: zwei Tabellen – Schlüssel und Zugänge)
  const REITER_EXPORTE = {
    raumplanung: { datei: "Raumplanung", teile: [["Raumplanung", fRaum]] },
    schluessel: { datei: "Schluessel", teile: [["Schlüssel", fSchl], ["Zugänge", fZug], ["Ausgaben", fAusg]] },
  };
  // Exportiert die Daten eines Reiters im aktiven Bereich als Excel- oder Word-Datei
  window.reiterExport = function(reiter, format) {
    const e = REITER_EXPORTE[reiter];
    if (!e) return;
    const bereich = aktiverBereich;
    const zusatz = BEREICH_KNOPF_TEXT[bereich] || bereich;
    const datum = heuteISO();
    if (format === "excel") {
      if (typeof XLSX === "undefined") { alert("Export-Bibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen."); return; }
      const wb = XLSX.utils.book_new();
      for (const [name, fn] of e.teile) {
        const daten = fn(bereich);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daten.length ? daten : [{ Hinweis: "Keine Einträge" }]), name.slice(0, 31));
      }
      XLSX.writeFile(wb, `${e.datei}-${zusatz}-${datum}.xlsx`);
    } else {
      const teile = e.teile.map(([name, fn]) => tabelleAlsHtml(name, fn(bereich))).join("<br>");
      const titel = `${e.teile[0][0]} – ${zusatz} (Stand ${datum.split("-").reverse().join(".")})`;
      downloadDatei(`${e.datei}-${zusatz}-${datum}.doc`, wordDokument(titel, `<h1>${escapeHtml(titel)}</h1>${teile}`), "application/msword");
    }
  };

  // Rendert die Exportliste mit Excel-/Word-Knöpfen für alles und je Kategorie
  function renderExport() {
    let html = `
      <div class="export-row export-alle">
        <span class="export-name">Alles</span>
        <div class="export-buttons">
          <button onclick="exportAllesExcel()">Excel</button>
          <button onclick="exportAllesWord()">Word</button>
        </div>
      </div>`;
    for (const k of EXPORT_KATEGORIEN) {
      html += `
        <div class="export-row">
          <span class="export-name">${escapeHtml(k.name)}</span>
          <div class="export-buttons">
            <button onclick="exportExcel('${k.id}')">Excel</button>
            <button onclick="exportWord('${k.id}')">Word</button>
          </div>
        </div>`;
    }
    document.getElementById("export-liste").innerHTML = html;
  }

  // ==========================================================
  // Einkaufsliste
  // ==========================================================
  function renderEinkauf() {
    const einkaufBereich = einkaufsliste.filter((e) => bereichVon(e) === aktiverBereich);
    const offen = einkaufBereich.filter((e) => !e.erledigt);
    const erledigt = einkaufBereich.filter((e) => e.erledigt);

    let html = "";
    if (offen.length === 0 && erledigt.length === 0) {
      html = '<p class="empty-text">Nichts auf der Liste.</p>';
    } else {
      html += '<div class="task-list">' + offen.map((e) => `
        <div class="task-wisch wisch-zeile" data-wisch-typ="einkauf" data-wisch-id="${e.id}" data-wisch-links="loeschen">
        ${wischHinterHtml("ok-kreis", "Abhaken", "loeschen")}
        <div class="task wisch-vorne">
          <button class="task-check" onclick="einkaufUmschalten('${e.id}')"></button>
          <div class="task-info"><span class="task-titel">${escapeHtml(e.text)}</span></div>
          <button class="task-delete" onclick="einkaufLoeschen('${e.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>
        </div>`).join("") + '</div>';

      if (erledigt.length > 0) {
        html += `<div class="project-heading" style="margin-top:1.4rem;">Erledigt (${erledigt.length})</div><div class="task-list">` +
          erledigt.map((e) => `
            <div class="task-wisch wisch-zeile" data-wisch-typ="einkauf" data-wisch-id="${e.id}" data-wisch-links="loeschen">
            ${wischHinterHtml("wiederholen", "Wieder offen", "loeschen")}
            <div class="task wisch-vorne">
              <button class="task-check done" onclick="einkaufUmschalten('${e.id}')">✓</button>
              <div class="task-info"><span class="task-titel done">${escapeHtml(e.text)}</span></div>
              <button class="task-delete" onclick="einkaufLoeschen('${e.id}')" aria-label="Löschen">${ic("x")}</button>
            </div>
            </div>`).join("") + '</div>';
      }
    }
    document.getElementById("einkauf-bereich").innerHTML = html;
  }

  document.getElementById("btn-einkauf-hinzufuegen").addEventListener("click", einkaufHinzufuegen);
  document.getElementById("neuer-einkauf").addEventListener("keydown", (e) => {
    if (e.key === "Enter") einkaufHinzufuegen();
  });

  // Fügt einen Artikel zur Einkaufsliste des aktiven Bereichs hinzu
  async function einkaufHinzufuegen() {
    const text = document.getElementById("neuer-einkauf").value.trim();
    if (!text) return;
    await api("einkauf_hinzufuegen", { text, bereich: aktiverBereich });
    document.getElementById("neuer-einkauf").value = "";
    await ladeDaten();
  }

  // Hakt einen Einkaufsartikel ab bzw. wieder auf
  window.einkaufUmschalten = async function(id) {
    await api("einkauf_umschalten", { id });
    await ladeDaten();
  };

  // Löscht einen Einkaufsartikel
  window.einkaufLoeschen = async function(id) {
    await api("einkauf_loeschen", { id });
    await ladeDaten();
  };

  // ==========================================================
  // Verlauf
  // ==========================================================
  function renderVerlauf() {
    const bereich = document.getElementById("verlauf-bereich");
    // Verlauf je Bereich getrennt: nur Einträge des aktiven Bereichs
    const eintraege = verlauf.filter((v) => bereichVon(v) === aktiverBereich);
    if (eintraege.length === 0) {
      bereich.innerHTML = '<p class="empty-text">In diesem Bereich noch keine Aktivitäten aufgezeichnet.</p>';
      return;
    }
    bereich.innerHTML = eintraege.map((v) => {
      const dt = new Date(v.erstellt_am);
      const zeit = dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + " · " +
        dt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      return `
        <div class="verlauf-item">
          <span class="verlauf-zeit">${zeit}</span>
          <span class="verlauf-text"><span class="verlauf-kategorie">${escapeHtml(v.kategorie)}</span> ${escapeHtml(v.aktion)}${v.beschreibung ? ": " + escapeHtml(v.beschreibung) : ""}</span>
        </div>`;
    }).join("");
  }

  // ==========================================================
  // Planung (Wochen-, Monats-, Jahresziele)
  // ==========================================================
  function wochenStart(d) {
    const tag = (d.getDay() + 6) % 7; // Montag = 0
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    start.setDate(start.getDate() - tag);
    return start;
  }
  // Liefert den Monatsersten zum Datum
  function monatStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  // Liefert den 1. Januar des Jahres zum Datum
  function jahrStart(d) { return new Date(d.getFullYear(), 0, 1); }

  // Liefert den Start des Planungszeitraums (Woche/Monat/Jahr) zum Ankerdatum
  function periodStart(typ, anker) {
    if (typ === "woche") return wochenStart(anker);
    if (typ === "monat") return monatStart(anker);
    return jahrStart(anker);
  }
  // Liefert das Ende des Planungszeitraums (Woche/Monat/Jahr) ab dessen Start
  function periodEnd(typ, start) {
    if (typ === "woche") {
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return end;
    }
    if (typ === "monat") return new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return new Date(start.getFullYear(), 11, 31);
  }
  // Verschiebt den Planungsanker um eine Woche/einen Monat/ein Jahr vor oder zurück
  function planAnkerVerschieben(richtung) {
    const a = new Date(planAnker);
    if (planTyp === "woche") {
      a.setDate(a.getDate() + richtung * 7);
    } else if (planTyp === "monat") {
      // Erst auf Tag 1 setzen, dann Monat wechseln - verhindert, dass z.B.
      // der 31. beim Sprung in einen kürzeren Monat (Februar) überläuft.
      a.setDate(1);
      a.setMonth(a.getMonth() + richtung);
    } else {
      a.setDate(1);
      a.setFullYear(a.getFullYear() + richtung);
    }
    planAnker = a;
  }
  // Erzeugt die Überschrift des Planungszeitraums (Jahr, Monat oder Woche vom … bis …)
  function planLabel(typ, start, end) {
    if (typ === "jahr") return String(start.getFullYear());
    if (typ === "monat") return MONATSNAMEN[start.getMonth()] + " " + start.getFullYear();
    const fmt = (d) => d.getDate() + "." + (d.getMonth() + 1) + ".";
    return "Woche vom " + fmt(start) + "–" + fmt(end) + " " + end.getFullYear();
  }
  // Liefert den übergeordneten Zeitraumtyp (Woche → Monat → Jahr)
  function uebergeordneterTyp(typ) {
    if (typ === "woche") return "monat";
    if (typ === "monat") return "jahr";
    return null;
  }

  ["woche", "monat", "jahr"].forEach((t) => {
    document.getElementById("plantyp-" + t).addEventListener("click", () => {
      planTyp = t;
      renderPlanung();
    });
  });
  document.getElementById("plan-prev").addEventListener("click", () => {
    planAnkerVerschieben(-1);
    renderPlanung();
  });
  document.getElementById("plan-next").addEventListener("click", () => {
    planAnkerVerschieben(1);
    renderPlanung();
  });
  document.getElementById("toggle-ziel-form").addEventListener("click", (e) => {
    const form = document.getElementById("ziel-form");
    form.classList.toggle("hidden");
    e.target.textContent = (form.classList.contains("hidden") ? "▸" : "▾") + " Neues Ziel für diesen Zeitraum";
  });
  document.getElementById("btn-ziel-anlegen").addEventListener("click", zielAnlegen);
  document.getElementById("neues-ziel").addEventListener("keydown", (e) => {
    if (e.key === "Enter") zielAnlegen();
  });

  // Legt ein neues Ziel für den angezeigten Zeitraum an, optional mit übergeordnetem Ziel
  async function zielAnlegen() {
    const titel = document.getElementById("neues-ziel").value.trim();
    if (!titel) return;
    const start = periodStart(planTyp, planAnker);
    const startIso = dateToISO(start);
    const uebergeordnetesZielId = document.getElementById("ziel-uebergeordnet").value || null;
    await api("ziel_hinzufuegen", {
      titel,
      zeitraum_typ: planTyp,
      zeitraum_start: startIso,
      uebergeordnetes_ziel_id: uebergeordnetesZielId,
    });
    document.getElementById("neues-ziel").value = "";
    await ladeDaten();
  }

  // Löscht ein Ziel
  window.zielLoeschen = async function(id) {
    await api("ziel_loeschen", { id });
    await ladeDaten();
  };

  // Fügt einem Ziel einen neuen Schritt hinzu
  window.zielSchrittHinzufuegen = async function(zielId, inputEl) {
    const text = inputEl.value.trim();
    if (!text) return;
    await api("ziel_schritt_hinzufuegen", { ziel_id: zielId, text });
    await ladeDaten();
  };

  // Öffnet den Tab "frei" für den heutigen Tag
  window.heuteFreiOeffnen = function() {
    freiTag = new Date();
    tabWechseln("frei");
  };

  // Springt aus einer Ziel-Kachel zur Planung des Zeitraums, klappt das Ziel auf und scrollt hin
  window.zielKachelKlick = function(id) {
    const z = ziele.find((zz) => zz.id === id);
    if (!z) return;
    planTyp = z.zeitraum_typ;
    planAnker = new Date(z.zeitraum_start + "T00:00:00");
    zielExpandiert.add(id);
    tabWechseln("planung");
    requestAnimationFrame(() => {
      const el = document.getElementById("ziel-" + id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  // Klappt eine Zielkarte in der Planung auf bzw. zu
  window.zielKarteUmschalten = function(id) {
    if (zielExpandiert.has(id)) zielExpandiert.delete(id);
    else zielExpandiert.add(id);
    renderPlanung();
  };

  // Hakt einen Zielschritt ab bzw. wieder auf
  window.zielSchrittUmschalten = async function(id) {
    await api("ziel_schritt_umschalten", { id });
    await ladeDaten();
  };

  // Löscht einen Zielschritt
  window.zielSchrittLoeschen = async function(id) {
    await api("ziel_schritt_loeschen", { id });
    await ladeDaten();
  };

  // Baut die HTML-Karte eines Ziels mit Schritten, Fortschritt, übergeordnetem Ziel und Eingabe für neue Schritte
  function zielKarteHtml(z) {
    const schritte = zielSchritte.filter((s) => s.ziel_id === z.id);
    const erledigtCount = schritte.filter((s) => s.erledigt).length;
    const parent = z.uebergeordnetes_ziel_id ? ziele.find((p) => p.id === z.uebergeordnetes_ziel_id) : null;
    const offen = zielExpandiert.has(z.id);

    return `
      <div class="ziel-card" id="ziel-${z.id}">
        <div class="ziel-kopf">
          <button class="ziel-toggle" onclick="zielKarteUmschalten('${z.id}')" title="${offen ? "Einklappen" : "Ausklappen"}">${offen ? "▾" : "▸"}</button>
          <span class="ziel-titel" onclick="zielKarteUmschalten('${z.id}')" style="cursor:pointer;">${escapeHtml(z.titel)}</span>
          <span class="ziel-fortschritt">${schritte.length > 0 ? erledigtCount + "/" + schritte.length : ""}</span>
          <button class="task-delete" onclick="zielLoeschen('${z.id}')" aria-label="Löschen">${ic("x")}</button>
        </div>
        ${parent ? `<div class="ziel-uebergeordnet">→ ${escapeHtml(parent.titel)}</div>` : ""}
        <div class="ziel-details ${offen ? "" : "hidden"}">
          <div class="ziel-schritte">
            ${schritte.map((s) => `
              <div class="ziel-schritt">
                <button class="task-check ${s.erledigt ? "done" : ""}" onclick="zielSchrittUmschalten('${s.id}')">${s.erledigt ? "✓" : ""}</button>
                <span class="ziel-schritt-text ${s.erledigt ? "done" : ""}">${escapeHtml(s.text)}</span>
                <button class="task-delete" style="margin-left:auto;" onclick="zielSchrittLoeschen('${s.id}')" aria-label="Löschen">${ic("x")}</button>
              </div>`).join("")}
          </div>
          <div class="ziel-schritt-add">
            <input type="text" placeholder="Schritt hinzufügen …" onkeydown="if(event.key==='Enter') zielSchrittHinzufuegen('${z.id}', this)">
            <button onclick="zielSchrittHinzufuegen('${z.id}', this.previousElementSibling)">+</button>
          </div>
        </div>
      </div>`;
  }

  // Rendert die Planung für Woche/Monat/Jahr: Ziele des Zeitraums, Auswahl übergeordneter Ziele, Termine und Aufgaben
  function renderPlanung() {
    const start = periodStart(planTyp, planAnker);
    const end = periodEnd(planTyp, start);
    const startIso = dateToISO(start);
    const endIso = dateToISO(end);

    document.getElementById("plan-zeitraum-label").textContent = planLabel(planTyp, start, end);

    ["woche", "monat", "jahr"].forEach((t) => {
      document.getElementById("plantyp-" + t).classList.toggle("active", t === planTyp);
    });

    const parentTyp = uebergeordneterTyp(planTyp);
    const parentSelect = document.getElementById("ziel-uebergeordnet");
    if (!parentTyp) {
      parentSelect.innerHTML = '<option value="">Kein übergeordnetes Ziel</option>';
      parentSelect.disabled = true;
    } else {
      parentSelect.disabled = false;
      const parentZiele = ziele.filter((z) => z.zeitraum_typ === parentTyp);
      parentSelect.innerHTML = '<option value="">Kein übergeordnetes Ziel</option>' +
        parentZiele.map((z) => `<option value="${z.id}">${escapeHtml(z.titel)}</option>`).join("");
    }

    const zieleHier = ziele.filter((z) => z.zeitraum_typ === planTyp && z.zeitraum_start === startIso);
    const zieleBereich = document.getElementById("ziele-bereich");
    zieleBereich.innerHTML = zieleHier.length === 0
      ? '<p class="empty-text">Noch keine Ziele für diesen Zeitraum.</p>'
      : zieleHier.map(zielKarteHtml).join("");

    const termineImZeitraum = termine
      .filter((t) => t.datum >= startIso && t.datum <= endIso)
      .sort((a, b) => (a.datum + (a.uhrzeit || "99:99")).localeCompare(b.datum + (b.uhrzeit || "99:99")));
    const aufgabenImZeitraum = aufgaben
      .filter((a) => !a.erledigt && a.faellig_am && a.faellig_am >= startIso && a.faellig_am <= endIso)
      .map(enrich)
      .sort((a, b) => a.faellig_am.localeCompare(b.faellig_am));

    let overviewHtml = `<div class="plan-overview-heading">In diesem Zeitraum</div>`;
    if (termineImZeitraum.length === 0 && aufgabenImZeitraum.length === 0) {
      overviewHtml += '<p class="empty-text">Keine Termine oder fälligen Aufgaben in diesem Zeitraum.</p>';
    } else {
      if (termineImZeitraum.length > 0) {
        overviewHtml += '<div class="upcoming-list" style="margin-bottom:1rem;">' +
          termineImZeitraum.map((t) => `
            <div class="upcoming-item">
              <span class="upcoming-datum">${formatDatumKurz(t.datum)}${t.uhrzeit ? " · " + t.uhrzeit.slice(0,5) + (t.ende_uhrzeit ? "–" + t.ende_uhrzeit.slice(0,5) : "") : ""}</span>
              <span>${escapeHtml(t.titel)}</span>
            </div>`).join("") + '</div>';
      }
      if (aufgabenImZeitraum.length > 0) {
        overviewHtml += '<div class="task-list">' +
          aufgabenImZeitraum.map((a) => taskHtml(a, false)).join("") + '</div>';
      }
    }
    document.getElementById("plan-overview-bereich").innerHTML = overviewHtml;
  }

  // ==========================================================
  // Schlüsselverwaltung (seit Session 32): Schlüssel und elektronische
  // Keys mit Seriennummer, Name und Verein – gruppiert nach Verein.
  // Seit Session 32b: Zugänge (Türen) einmal anlegen und je Schlüssel
  // ankreuzen – ein Schlüssel/Key kann zu mehreren Türen gehören.
  // ==========================================================
  let schluesselSuche = "";
  let schluesselFilterArt = "alle";
  let schluesselFilterZugang = "alle";
  const SCHLUESSEL_ART = { schluessel: { icon: "schluessel", text: "Schlüssel" }, key: { icon: "funk", text: "Elektronischer Key" } };
  const SCHLUESSEL_OHNE_VEREIN = "Ohne Verein";

  // Liefert die Schlüssel/Keys des aktiven Bereichs
  function schluesselAktuell() {
    return schluesselListe.filter((k) => bereichVon(k) === aktiverBereich);
  }
  // Liefert die Zugänge (Türen) des aktiven Bereichs, alphabetisch sortiert
  function zugaengeAktuell() {
    return schluesselZugaenge.filter((z) => bereichVon(z) === aktiverBereich).sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  // Namen der Zugänge eines Schlüssels, in der Reihenfolge der Zugangsliste
  function schluesselZugangNamen(k) {
    const ids = k.zugaenge || [];
    return zugaengeAktuell().filter((z) => ids.includes(z.id)).map((z) => z.name);
  }
  // Sortiervergleich für Schlüssel: nach Inhaber, dann Art, dann Seriennummer (numerisch)
  function schluesselVergleich(a, b) {
    return (a.inhaber || "").localeCompare(b.inhaber || "", "de")
      || (a.art || "").localeCompare(b.art || "")
      || (a.seriennummer || "").localeCompare(b.seriennummer || "", "de", { numeric: true });
  }
  // Erzeugt die Select-Optionen für die Schlüsselart (Schlüssel/elektronischer Key) mit Vorauswahl
  function schluesselArtOptionen(gewaehlt) {
    return Object.entries(SCHLUESSEL_ART).map(([wert, a]) =>
      `<option value="${wert}" ${wert === gewaehlt ? "selected" : ""}>${a.text}</option>`).join("");
  }
  // Ankreuzfelder für die Zugänge; containerId bündelt sie für das Auslesen
  function schluesselZugangAuswahlHtml(containerId, gewaehlt) {
    const zugaenge = zugaengeAktuell();
    if (!zugaenge.length) {
      return `<span class="notiz-meta">Noch keine Zugänge – über ${ic("zahnrad")} oben („Zugänge verwalten“) anlegen.</span>`;
    }
    // Saubere Liste untereinander: je Zugang eine Zeile mit Häkchen links (Breite fest, sonst
    // zieht .ern-feld input die Checkbox auf 100 %), Beschreibung klein darunter
    const zeilen = zugaenge.map((z, i) => `
      <label style="display:flex; align-items:center; gap:0.7rem; padding:0.5rem 0.75rem; margin:0; cursor:pointer; font-weight:normal; color:var(--ink);${i < zugaenge.length - 1 ? " border-bottom:1px solid var(--border);" : ""}">
        <input type="checkbox" value="${z.id}" ${gewaehlt.includes(z.id) ? "checked" : ""} style="width:1.15rem; height:1.15rem; margin:0; flex:0 0 auto; accent-color:var(--accent);">
        <span style="flex:1; min-width:0; line-height:1.3;">${ic("tuer")} ${escapeHtml(z.name)}${z.beschreibung ? `<span class="notiz-meta" style="display:block; margin:0;">${escapeHtml(z.beschreibung)}</span>` : ""}</span>
      </label>`).join("");
    return `<div id="${containerId}" style="display:flex; flex-direction:column; border:1px solid var(--border); border-radius:8px; background:var(--panel); max-height:16rem; overflow-y:auto;">${zeilen}</div>`;
  }
  // Liest die angekreuzten Zugänge eines Auswahlfelds (null, wenn es keins gibt)
  function schluesselZugangAuswahlLesen(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return null; // keine Zugänge angelegt → Feld nicht mitschicken
    return [...el.querySelectorAll("input[type=checkbox]:checked")].map((c) => c.value);
  }

  // Rendert die Schlüsselverwaltung: Vorschläge, Zugangsauswahl, Filter, Zusammenfassung, Liste und Zugänge
  function renderSchluessel() {
    const liste = document.getElementById("schluessel-liste");
    if (!liste) return;
    const alle = schluesselAktuell();
    const zugaenge = zugaengeAktuell();

    // Vorschläge für Name und Verein aus den vorhandenen Einträgen
    const eindeutig = (feld) => [...new Set(alle.map((k) => (k[feld] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
    document.getElementById("schluessel-namen-vorschlaege").innerHTML = eindeutig("inhaber").map((n) => `<option value="${escapeAttr(n)}">`).join("");
    document.getElementById("schluessel-vereine-vorschlaege").innerHTML = eindeutig("verein").map((n) => `<option value="${escapeAttr(n)}">`).join("");

    // Zugänge im Formular – angekreuzte bleiben nach dem Neuladen erhalten
    const bisher = schluesselZugangAuswahlLesen("schluessel-neu-zugaenge-auswahl") || [];
    document.getElementById("schluessel-neu-zugaenge").innerHTML = schluesselZugangAuswahlHtml("schluessel-neu-zugaenge-auswahl", bisher);

    // Filter nach Zugang
    const filter = document.getElementById("schluessel-filter-zugang");
    if (schluesselFilterZugang !== "alle" && !zugaenge.some((z) => z.id === schluesselFilterZugang)) schluesselFilterZugang = "alle";
    filter.innerHTML = `<option value="alle">Alle Zugänge</option>` + zugaenge.map((z) =>
      `<option value="${z.id}" ${z.id === schluesselFilterZugang ? "selected" : ""}>${escapeHtml(z.name)}</option>`).join("");
    filter.classList.toggle("hidden", !zugaenge.length);

    const anzSchl = alle.filter((k) => k.art !== "key").length;
    const anzKey = alle.length - anzSchl;
    document.getElementById("schluessel-zusammenfassung").textContent = alle.length
      ? `${anzSchl} Schlüssel · ${anzKey} elektronische Key${anzKey === 1 ? "" : "s"}`
      : "";
    renderSchluesselListe();
    renderAusgabeProtokolle();

    // Zugänge verwalten
    document.getElementById("schluessel-zugaenge-liste").innerHTML = zugaenge.length
      ? `<div class="notiz-list">${zugaenge.map((z) => {
          const anzahl = alle.filter((k) => (k.zugaenge || []).includes(z.id)).length;
          return `
            <div class="notiz-item">
              <div style="flex:1;">
                <span class="notiz-text">${ic("tuer")} ${escapeHtml(z.name)}</span>
                <span class="notiz-meta" style="display:block;">${z.beschreibung ? escapeHtml(z.beschreibung) + " · " : ""}${anzahl} Schlüssel/Key${anzahl === 1 ? "" : "s"}</span>
              </div>
              <button class="task-edit-btn" onclick="zugangBearbeiten('${z.id}')" aria-label="Zugang bearbeiten" title="Bearbeiten">${ic("stift")}</button>
              <button class="task-delete" onclick="zugangLoeschen('${z.id}')" aria-label="Zugang löschen">${ic("x")}</button>
            </div>`;
        }).join("")}</div>`
      : `<p class="empty-text">Noch keine Zugänge.</p>`;
  }

  // Rendert die gefilterte Schlüsselliste nach Verein gruppiert (Bearbeiten öffnet das Blatt)
  function renderSchluesselListe() {
    const liste = document.getElementById("schluessel-liste");
    if (!liste) return;
    const alle = schluesselAktuell();
    if (!alle.length) {
      liste.innerHTML = `<p class="empty-text">Noch keine Schlüssel oder Keys eingetragen.</p>`;
      return;
    }
    const suche = schluesselSuche.trim().toLowerCase();
    const gefiltert = alle.filter((k) => {
      if (schluesselFilterArt !== "alle" && (k.art || "schluessel") !== schluesselFilterArt) return false;
      if (schluesselFilterZugang !== "alle" && !(k.zugaenge || []).includes(schluesselFilterZugang)) return false;
      if (schluesselFilterStatus === "ausgegeben" && !offeneAusgabe(k)) return false;
      if (schluesselFilterStatus === "ueberfaellig" && !ausgabeUeberfaellig(offeneAusgabe(k))) return false;
      if (schluesselFilterStatus === "bestand" && schluesselStatus(k) !== "bestand") return false;
      if (schluesselFilterStatus === "ohneprotokoll" && schluesselStatus(k) !== "zugeordnet") return false;
      if (!suche) return true;
      return [k.seriennummer, k.inhaber, k.verein, k.notiz, ...schluesselZugangNamen(k)].some((t) => (t || "").toLowerCase().includes(suche));
    });
    if (!gefiltert.length) {
      liste.innerHTML = `<p class="empty-text">Nichts gefunden.</p>`;
      return;
    }

    const gruppen = {};
    gefiltert.forEach((k) => {
      const v = schluesselStatus(k) === "bestand" ? SCHLUESSEL_BESTAND : ((k.verein || "").trim() || SCHLUESSEL_OHNE_VEREIN);
      (gruppen[v] = gruppen[v] || []).push(k);
    });
    // Reihenfolge: Vereine alphabetisch, dann „Ohne Verein“, zuletzt der Bestand
    const rang = (n) => (n === SCHLUESSEL_BESTAND ? 2 : n === SCHLUESSEL_OHNE_VEREIN ? 1 : 0);
    const namen = Object.keys(gruppen).sort((a, b) => rang(a) - rang(b) || a.localeCompare(b, "de"));

    const karte = (k) => {
      const art = SCHLUESSEL_ART[k.art] || SCHLUESSEL_ART.schluessel;
      if (schluesselAktion && schluesselAktion.id === k.id) {
        const offen = offeneAusgabe(k);
        if (schluesselAktion.modus === "zuruecknehmen" && offen) return ruecknahmeFormularHtml(k, offen);
        if (schluesselAktion.modus === "ausgeben" && !offen) return ausgabeFormularHtml(k);
      }
      const zug = schluesselZugangNamen(k);
      const meta = [art.text, k.notiz ? escapeHtml(k.notiz) : ""].filter(Boolean).join(" · ");
      return `
        <div class="notiz-item">
          <div style="flex:1; cursor:pointer;" onclick="schluesselBearbeitenStart('${k.id}')">
            <span class="notiz-text">${ic(art.icon)}<span class="nur-vorleser">${art.text}:</span> ${k.inhaber ? escapeHtml(k.inhaber) : (schluesselStatus(k) === "bestand" ? "frei" : `<em>ohne Name</em>`)}</span>
            <span class="notiz-meta" style="display:block;">Nr. <strong>${escapeHtml(k.seriennummer)}</strong> · ${meta}</span>
            ${zug.length ? `<span class="notiz-meta" style="display:block;">${ic("tuer")} ${zug.map(escapeHtml).join(", ")}</span>` : ""}
            ${schluesselStatusHtml(k)}
          </div>
          <div style="display:flex; flex-direction:column; gap:0.3rem; align-items:flex-end;">${schluesselKnoepfeHtml(k)}</div>
          <button class="task-delete" onclick="event.stopPropagation(); schluesselLoeschen('${k.id}')" aria-label="Eintrag löschen">${ic("x")}</button>
        </div>`;
    };

    liste.innerHTML = namen.map((v) => {
      const eintraege = gruppen[v].sort(schluesselVergleich);
      const s = eintraege.filter((k) => k.art !== "key").length;
      const kz = eintraege.length - s;
      const zahl = [s ? `<span title="Schlüssel">${ic("schluessel")} ${s}</span>` : "", kz ? `<span title="Elektronische Keys">${ic("funk")} ${kz}</span>` : ""].filter(Boolean).join(" ");
      return `
        <details class="spiel-gruppe" open>
          <summary class="spiel-gruppe-kopf">
            <span class="spiel-gruppe-titel">${v === SCHLUESSEL_BESTAND ? ic("eingang") + " " : ""}${escapeHtml(v)}</span>
            <span class="zl-gruppe-zahl">${zahl}</span>
          </summary>
          <div class="notiz-list">${eintraege.map(karte).join("")}</div>
        </details>`;
    }).join("");
    // Offenes Ausgabe-/Rücknahme-Formular: Unterschriftsfeld wieder zeichenbereit machen
    if (schluesselAktion) unterschriftAktivieren((schluesselAktion.modus === "ausgeben" ? "sa-sig-" : "sr-sig-") + schluesselAktion.id);
  }

  document.getElementById("btn-schluessel-neu").addEventListener("click", async () => {
    const status = document.getElementById("schluessel-status");
    const felder = {
      art: document.getElementById("schluessel-neu-art").value,
      seriennummer: document.getElementById("schluessel-neu-nr").value.trim(),
      inhaber: document.getElementById("schluessel-neu-name").value.trim(),
      verein: document.getElementById("schluessel-neu-verein").value.trim(),
      notiz: document.getElementById("schluessel-neu-notiz").value.trim(),
    };
    const zugaenge = schluesselZugangAuswahlLesen("schluessel-neu-zugaenge-auswahl");
    if (zugaenge) felder.zugaenge = zugaenge;
    if (!felder.seriennummer) { status.textContent = "Bitte die Seriennummer angeben."; return; }
    try {
      await api("schluessel_hinzufuegen", { ...felder, bereich: aktiverBereich });
      // Art, Verein und Zugänge bleiben stehen – praktisch beim Eintragen mehrerer gleicher Keys
      ["schluessel-neu-nr", "schluessel-neu-name", "schluessel-neu-notiz"].forEach((id) => { document.getElementById(id).value = ""; });
      status.textContent = `Eingetragen: Nr. ${felder.seriennummer}.`;
      await ladeDaten();
      // Mit Name oder Verein: gleich das Ausgabeprotokoll (mit Unterschriftsfeld) am neuen Eintrag öffnen
      const neu = (felder.inhaber || felder.verein) && schluesselAktuell().find((k) =>
        k.art === felder.art && (k.seriennummer || "").toLowerCase() === felder.seriennummer.toLowerCase());
      if (neu) {
        schluesselProtokollOeffnen(neu.id);
        status.textContent = `Eingetragen: Nr. ${felder.seriennummer}. Jetzt unten das Ausgabeprotokoll ausfüllen und unterschreiben lassen – oder „Abbrechen“, wenn kein Protokoll nötig ist.`;
        return;
      }
      document.getElementById("schluessel-neu-nr").focus();
    } catch (fehler) {
      status.textContent = fehler.message;
    }
  });
  document.getElementById("schluessel-suche").addEventListener("input", (e) => {
    schluesselSuche = e.target.value;
    renderSchluesselListe();
  });
  document.getElementById("schluessel-filter-art").addEventListener("change", (e) => {
    schluesselFilterArt = e.target.value;
    renderSchluesselListe();
  });
  document.getElementById("schluessel-filter-status").addEventListener("change", (e) => {
    schluesselFilterStatus = e.target.value;
    renderSchluesselListe();
  });
  document.getElementById("schluessel-filter-zugang").addEventListener("change", (e) => {
    schluesselFilterZugang = e.target.value;
    renderSchluesselListe();
  });
  // Bearbeiten eines Schlüssels/Keys: seit Session 35 im Bearbeiten-Blatt
  window.schluesselBearbeitenStart = function(id) {
    window.blattOeffnen("schluessel", id);
  };
  // Löscht einen Schlüssel/Key nach Rückfrage und lädt die Daten neu
  window.schluesselLoeschen = async function(id) {
    const k = schluesselListe.find((x) => x.id === id);
    const protokolle = k ? ausgabenVonSchluessel(k).length : 0;
    if (!confirm(`${k && k.art === "key" ? "Key" : "Schlüssel"} Nr. ${k ? k.seriennummer : ""} löschen?` +
      (protokolle ? ` ${protokolle === 1 ? "Das Ausgabeprotokoll bleibt" : `Die ${protokolle} Ausgabeprotokolle bleiben`} erhalten (unten unter „Ausgabeprotokolle“).` : ""))) return;
    try {
      await api("schluessel_loeschen", { id });
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  };

  document.getElementById("btn-schluessel-zugang").addEventListener("click", async () => {
    const name = document.getElementById("schluessel-zugang-name").value.trim();
    if (!name) return;
    try {
      await api("zugang_hinzufuegen", { name, beschreibung: document.getElementById("schluessel-zugang-beschreibung").value.trim(), bereich: aktiverBereich });
      document.getElementById("schluessel-zugang-name").value = "";
      document.getElementById("schluessel-zugang-beschreibung").value = "";
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  });
  // Bearbeiten eines Zugangs: seit Session 35 im Bearbeiten-Blatt (vorher zwei Abfragefenster)
  window.zugangBearbeiten = function(id) {
    window.blattOeffnen("zugang", id);
  };
  // Löscht einen Zugang nach Rückfrage (mit Anzahl betroffener Schlüssel) und lädt die Daten neu
  window.zugangLoeschen = async function(id) {
    const z = schluesselZugaenge.find((x) => x.id === id);
    const anzahl = schluesselAktuell().filter((k) => (k.zugaenge || []).includes(id)).length;
    const text = `Zugang „${z ? z.name : ""}“ löschen?` + (anzahl ? ` Er wird bei ${anzahl} Schlüssel/Key${anzahl === 1 ? "" : "s"} entfernt.` : "");
    if (!confirm(text)) return;
    try {
      await api("zugang_loeschen", { id });
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  };

  // ==========================================================
  // Schlüsselausgabe mit Protokoll (seit Session 33): Ausgeben und
  // Zurücknehmen mit optionaler Unterschrift (Finger/Maus) und
  // druckbarem Protokoll. Ohne digitale Unterschrift: Protokoll drucken
  // und auf Papier unterschreiben lassen.
  // ==========================================================
  let schluesselAktion = null; // { id: schluessel-id, modus: "ausgeben" | "zuruecknehmen" }
  let ausgabeBearbeitenId = null;
  let schluesselFilterStatus = "alle";
  const SCHLUESSEL_BESTAND = "Im Bestand";
  const PROTOKOLL_ALT_TAGE = 365;

  // Offene (noch nicht zurückgegebene) Ausgabe eines Schlüssels oder undefined
  function offeneAusgabe(k) {
    return schluesselAusgaben.find((a) => a.schluessel_id === k.id && !a.zurueck_am);
  }
  // Alle Ausgaben eines Schlüssels, neueste zuerst
  function ausgabenVonSchluessel(k) {
    return schluesselAusgaben.filter((a) => a.schluessel_id === k.id)
      .sort((a, b) => (b.ausgegeben_am || "").localeCompare(a.ausgegeben_am || ""));
  }
  // Ausgaben des aktiven Bereichs
  function ausgabenAktuell() {
    return schluesselAusgaben.filter((a) => bereichVon(a) === aktiverBereich);
  }
  // Status: "ausgegeben" (offenes Protokoll), "zugeordnet" (Name/Verein ohne Protokoll) oder "bestand"
  function schluesselStatus(k) {
    if (offeneAusgabe(k)) return "ausgegeben";
    return (k.inhaber || k.verein) ? "zugeordnet" : "bestand";
  }
  // Rückgabedatum überschritten?
  function ausgabeUeberfaellig(a) {
    return !!(a && !a.zurueck_am && a.rueckgabe_bis && a.rueckgabe_bis < heuteISO());
  }
  // JJJJ-MM-TT → TT.MM.JJJJ
  function datumDE(iso) {
    return iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "";
  }
  // Protokoll gilt als alt, wenn die Rückgabe länger als PROTOKOLL_ALT_TAGE her ist
  function ausgabeIstAlt(a) {
    if (!a.zurueck_am) return false;
    return (new Date(heuteISO() + "T00:00:00") - new Date(a.zurueck_am + "T00:00:00")) / 86400000 > PROTOKOLL_ALT_TAGE;
  }
  // Merkt sich, wer zuletzt ausgegeben hat (nur auf diesem Gerät)
  function letzterAusgeber() {
    try { return localStorage.getItem("schluessel-ausgeber") || ""; } catch (_e) { return ""; }
  }
  // Speichert den Namen der/des Ausgebenden für das nächste Formular (nur dieses Gerät)
  function ausgeberMerken(name) {
    try { if (name) localStorage.setItem("schluessel-ausgeber", name); } catch (_e) { /* egal */ }
  }

  // ---------- Unterschriftsfeld (Canvas) ----------
  // HTML für ein Unterschriftsfeld; weißer Hintergrund, damit es auch im Dunkelmodus und im Druck passt
  function unterschriftFeldHtml(id, titel) {
    return `
      <div class="ern-feld ern-feld-breit">
        <span>${escapeHtml(titel)} <span class="notiz-meta">(optional – mit Finger oder Maus)</span></span>
        <canvas id="${id}" width="600" height="180" style="width:100%; max-width:600px; height:auto; aspect-ratio:600/180; background:#fff; border:1px solid var(--border, #999); border-radius:6px; touch-action:none; cursor:crosshair; display:block;"></canvas>
        <button type="button" class="link-btn" style="align-self:flex-start;" onclick="unterschriftLeeren('${id}')">Unterschrift löschen</button>
      </div>`;
  }
  // Schaltet das Zeichnen auf einem Unterschriftsfeld frei
  function unterschriftAktivieren(id) {
    const c = document.getElementById(id);
    if (!c || c.dataset.aktiv) return;
    c.dataset.aktiv = "1";
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    let zeichnet = false;
    const punkt = (e) => {
      const r = c.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
    };
    c.addEventListener("pointerdown", (e) => {
      e.preventDefault(); zeichnet = true; c.setPointerCapture(e.pointerId);
      const p = punkt(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.1, p.y + 0.1); ctx.stroke();
      c.dataset.bemalt = "1";
    });
    c.addEventListener("pointermove", (e) => {
      if (!zeichnet) return;
      e.preventDefault(); const p = punkt(e); ctx.lineTo(p.x, p.y); ctx.stroke();
    });
    const ende = () => { zeichnet = false; };
    c.addEventListener("pointerup", ende);
    c.addEventListener("pointercancel", ende);
  }
  // Leert ein Unterschriftsfeld wieder auf Weiß
  window.unterschriftLeeren = function(id) {
    const c = document.getElementById(id);
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    delete c.dataset.bemalt;
  };
  // Liefert die Unterschrift als PNG-Data-URL oder null, wenn nichts gezeichnet wurde
  function unterschriftLesen(id) {
    const c = document.getElementById(id);
    if (!c || !c.dataset.bemalt) return null;
    return c.toDataURL("image/png");
  }

  // ---------- Formulare Ausgeben / Zurücknehmen ----------
  // Formular zum Ausgeben eines Schlüssels (in der Karte)
  function ausgabeFormularHtml(k) {
    const id = k.id;
    return `
      <div class="notiz-item" style="display:block;">
        <p class="notiz-text" style="margin:0 0 0.4rem;">${ic("ausgeben")} ${escapeHtml((SCHLUESSEL_ART[k.art] || SCHLUESSEL_ART.schluessel).text)} Nr. ${escapeHtml(k.seriennummer)} ausgeben</p>
        <div class="task-edit-felder">
          <label class="ern-feld">Name *<input type="text" id="sa-name-${id}" value="${escapeAttr(k.inhaber || "")}" maxlength="120" list="schluessel-namen-vorschlaege"></label>
          <label class="ern-feld">Verein<input type="text" id="sa-verein-${id}" value="${escapeAttr(k.verein || "")}" maxlength="120" list="schluessel-vereine-vorschlaege"></label>
          <label class="ern-feld">Kontakt (Tel./Mail)<input type="text" id="sa-kontakt-${id}" maxlength="200" oninput="schluesselKontaktZuMail('${id}')"></label>
          <label class="ern-feld">Ausgegeben am<input type="date" id="sa-am-${id}" value="${heuteISO()}"></label>
          <label class="ern-feld">Ausgegeben von<input type="text" id="sa-von-${id}" value="${escapeAttr(letzterAusgeber())}" maxlength="120"></label>
          <label class="ern-feld">Rückgabe bis (optional)<input type="date" id="sa-bis-${id}"></label>
          <label class="ern-feld ern-feld-breit">Notiz (optional)<input type="text" id="sa-notiz-${id}" maxlength="500"></label>
          ${unterschriftFeldHtml("sa-sig-" + id, "Unterschrift Empfänger/in")}
          ${mailFeldHtml("sa-mail-" + id, "")}
        </div>
        <p class="notiz-meta" style="margin:0.3rem 0;">Ohne Unterschrift hier: „Ausgeben &amp; drucken“ und das Protokoll auf Papier unterschreiben lassen.</p>
        <div class="row" style="margin:0.4rem 0 0; flex-wrap:wrap;">
          <button class="btn-primary" onclick="schluesselAusgebenSpeichern('${id}', false)">Ausgeben</button>
          <button class="btn-secondary" onclick="schluesselAusgebenSpeichern('${id}', true)">Ausgeben &amp; drucken</button>
          <button class="link-btn" onclick="schluesselAktionAbbrechen()">Abbrechen</button>
        </div>
      </div>`;
  }
  // Formular zum Zurücknehmen (in der Karte)
  function ruecknahmeFormularHtml(k, a) {
    const id = k.id;
    return `
      <div class="notiz-item" style="display:block;">
        <p class="notiz-text" style="margin:0 0 0.4rem;">${ic("eingang")} Nr. ${escapeHtml(k.seriennummer)} von ${escapeHtml(a.inhaber)} zurücknehmen</p>
        <div class="task-edit-felder">
          <label class="ern-feld">Zurück am<input type="date" id="sr-am-${id}" value="${heuteISO()}"></label>
          <label class="ern-feld">Zurückgenommen von<input type="text" id="sr-von-${id}" value="${escapeAttr(letzterAusgeber())}" maxlength="120"></label>
          ${unterschriftFeldHtml("sr-sig-" + id, "Unterschrift (Rückgabe bestätigt)")}
          ${mailFeldHtml("sr-mail-" + id, mailAusText(a.kontakt))}
        </div>
        <div class="row" style="margin:0.4rem 0 0; flex-wrap:wrap;">
          <button class="btn-primary" onclick="schluesselZuruecknehmenSpeichern('${id}', '${a.id}', false)">Zurücknehmen</button>
          <button class="btn-secondary" onclick="schluesselZuruecknehmenSpeichern('${id}', '${a.id}', true)">Zurücknehmen &amp; drucken</button>
          <button class="link-btn" onclick="schluesselAktionAbbrechen()">Abbrechen</button>
        </div>
      </div>`;
  }
  // Statuszeile einer Karte (ausgegeben / überfällig / im Bestand / ohne Protokoll)
  function schluesselStatusHtml(k) {
    const a = offeneAusgabe(k);
    if (a) {
      const sig = a.hat_unterschrift_ausgabe ? ` · <span title="digital unterschrieben">${ic("unterschrift")}<span class="nur-vorleser">digital unterschrieben</span></span>` : "";
      if (ausgabeUeberfaellig(a)) {
        return `<span class="notiz-meta" style="display:block; color:var(--accent); font-weight:600;">${ic("warnung")} Rückgabe überfällig seit ${datumDE(a.rueckgabe_bis)} · ausgegeben ${datumDE(a.ausgegeben_am)}${sig}</span>`;
      }
      return `<span class="notiz-meta" style="display:block;">${ic("ausgeben")} ausgegeben seit ${datumDE(a.ausgegeben_am)}${a.rueckgabe_bis ? " · bis " + datumDE(a.rueckgabe_bis) : ""}${sig}</span>`;
    }
    if (schluesselStatus(k) === "zugeordnet") return `<span class="notiz-meta" style="display:block;">ohne Ausgabeprotokoll</span>`;
    return `<span class="notiz-meta" style="display:block;">${ic("eingang")} im Bestand</span>`;
  }
  // Knöpfe einer Karte je nach Status
  function schluesselKnoepfeHtml(k) {
    const a = offeneAusgabe(k);
    const knopf = (text, aufruf, titel) => `<button class="btn-secondary" style="white-space:nowrap; padding:0.25rem 0.6rem;" title="${titel}" aria-label="${titel}" onclick="event.stopPropagation(); ${aufruf}">${text}</button>`;
    if (a) return knopf("Zurück", `schluesselAktionStart('${k.id}', 'zuruecknehmen')`, "Schlüssel zurücknehmen") +
      knopf(ic("drucken"), `ausgabeDrucken('${a.id}')`, "Protokoll drucken / als PDF") +
      (mailEingerichtet ? knopf(ic("mail"), `ausgabeMailen('${a.id}')`, "Protokoll per Mail senden") : "");
    if (schluesselStatus(k) === "zugeordnet") return knopf(ic("unterschrift") + "Protokoll", `schluesselAktionStart('${k.id}', 'ausgeben')`, "Ausgabeprotokoll mit Unterschrift nachtragen");
    return knopf("Ausgeben", `schluesselAktionStart('${k.id}', 'ausgeben')`, "Schlüssel ausgeben");
  }

  // Öffnet am Schlüssel das Formular zum Ausgeben bzw. Zurücknehmen
  // Übernimmt eine Mailadresse aus „Kontakt“ ins Mailfeld, solange dort nichts Eigenes steht
  window.schluesselKontaktZuMail = function(id) {
    const mailEl = document.getElementById("sa-mail-" + id);
    const kontakt = document.getElementById("sa-kontakt-" + id);
    if (!mailEl || !kontakt) return;
    if (!mailEl.value || mailEl.dataset.auto === "1") {
      mailEl.value = mailAusText(kontakt.value);
      mailEl.dataset.auto = "1";
    }
  };
  window.schluesselAktionStart = function(id, modus) {
    schluesselAktion = { id, modus };
    renderSchluesselListe();
    unterschriftAktivieren((modus === "ausgeben" ? "sa-sig-" : "sr-sig-") + id);
  };
  // Schließt das Ausgabe-/Rücknahme-Formular ohne zu speichern
  // Öffnet das Ausgabeformular eines Schlüssels sichtbar: Filter/Suche zurücksetzen, hinscrollen
  function schluesselProtokollOeffnen(id) {
    schluesselSuche = ""; schluesselFilterArt = "alle"; schluesselFilterStatus = "alle"; schluesselFilterZugang = "alle";
    [["schluessel-suche", ""], ["schluessel-filter-art", "alle"], ["schluessel-filter-status", "alle"], ["schluessel-filter-zugang", "alle"]]
      .forEach(([elId, wert]) => { const el = document.getElementById(elId); if (el) el.value = wert; });
    window.schluesselAktionStart(id, "ausgeben");
    const feld = document.getElementById("sa-kontakt-" + id);
    if (feld) {
      const karte = feld.closest(".notiz-item");
      if (karte && karte.scrollIntoView) karte.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  window.schluesselAktionAbbrechen = function() {
    schluesselAktion = null;
    renderSchluesselListe();
  };
  // Gibt den Schlüssel aus (legt das Protokoll an) und druckt es auf Wunsch gleich
  window.schluesselAusgebenSpeichern = async function(id, drucken) {
    const wert = (f) => document.getElementById(`sa-${f}-${id}`).value.trim();
    const daten = {
      schluessel_id: id, inhaber: wert("name"), verein: wert("verein"), kontakt: wert("kontakt"),
      ausgegeben_am: wert("am"), ausgegeben_von: wert("von"), rueckgabe_bis: wert("bis"), notiz: wert("notiz"),
      unterschrift: unterschriftLesen("sa-sig-" + id),
    };
    if (!daten.inhaber) { alert("Bitte den Namen der Person angeben."); return; }
    try {
      const mailEl = document.getElementById("sa-mail-" + id);
      const mail = mailEl ? mailEl.value.trim() : "";
      const antwort = await api("schluessel_ausgeben", daten);
      ausgeberMerken(daten.ausgegeben_von);
      schluesselAktion = null;
      await ladeDaten();
      if (antwort && antwort.id) await mailNachSpeichern(antwort.id, mail);
      if (drucken && antwort && antwort.id) await window.ausgabeDrucken(antwort.id);
    } catch (fehler) {
      alert(fehler.message);
    }
  };
  // Nimmt den Schlüssel zurück (Rückgabe ins Protokoll, Schlüssel wieder im Bestand)
  window.schluesselZuruecknehmenSpeichern = async function(id, ausgabeId, drucken) {
    const daten = {
      id: ausgabeId,
      zurueck_am: document.getElementById(`sr-am-${id}`).value,
      zurueck_von: document.getElementById(`sr-von-${id}`).value.trim(),
      unterschrift: unterschriftLesen("sr-sig-" + id),
    };
    const mailEl = document.getElementById("sr-mail-" + id);
    const mail = mailEl ? mailEl.value.trim() : "";
    try {
      await api("schluessel_zuruecknehmen", daten);
      ausgeberMerken(daten.zurueck_von);
      schluesselAktion = null;
      await ladeDaten();
      await mailNachSpeichern(ausgabeId, mail);
      if (drucken) await window.ausgabeDrucken(ausgabeId);
    } catch (fehler) {
      alert(fehler.message);
    }
  };

  // ---------- Protokoll drucken ----------
  // Baut das Protokoll als HTML (Muster-Texte – vom Vorstand prüfen lassen)
  function protokollHtml(a) {
    const org = (BEREICH_LOGO[bereichVon(a)] || {}).alt || (BEREICH_KNOPF_TEXT[bereichVon(a)] || "");
    const art = a.art === "key" ? "Elektronischer Key" : "Schlüssel";
    const zeile = (l, w) => `<tr><th style="text-align:left; width:38%; padding:4px 8px; border:1px solid #999; background:#f2f2f2;">${escapeHtml(l)}</th><td style="padding:4px 8px; border:1px solid #999;">${escapeHtml(w || "")}&nbsp;</td></tr>`;
    const tabelle = (zeilen) => `<table style="width:100%; border-collapse:collapse; margin:0 0 10px; font-size:12pt;">${zeilen}</table>`;
    const sigBox = (bild, beschriftung) => `
      <div style="flex:1; min-width:45%;">
        <div style="height:70px; border-bottom:1px solid #000; display:flex; align-items:flex-end;">${bild ? `<img src="${bild}" alt="Unterschrift" style="max-height:68px; max-width:100%;">` : ""}</div>
        <div style="font-size:10pt; margin-top:2px;">${escapeHtml(beschriftung)}</div>
      </div>`;
    return `
      <div style="font-family:Arial, Helvetica, sans-serif; color:#000; background:#fff; padding:10px; max-width:780px; margin:0 auto;">
        <div style="font-size:11pt;">${escapeHtml(org)}</div>
        <h1 style="font-size:18pt; margin:4px 0 12px;">Schlüsselausgabeprotokoll</h1>
        <h2 style="font-size:13pt; margin:8px 0 4px;">Schlüssel</h2>
        ${tabelle(zeile("Art", art) + zeile("Seriennummer", a.seriennummer) + zeile("Zugänge", a.zugaenge_text))}
        <h2 style="font-size:13pt; margin:8px 0 4px;">Empfänger/in</h2>
        ${tabelle(zeile("Name", a.inhaber) + zeile("Verein", a.verein) + zeile("Kontakt", a.kontakt))}
        <h2 style="font-size:13pt; margin:8px 0 4px;">Ausgabe</h2>
        ${tabelle(zeile("Ausgegeben am", datumDE(a.ausgegeben_am)) + zeile("Ausgegeben von", a.ausgegeben_von) + zeile("Rückgabe bis", datumDE(a.rueckgabe_bis)) + (a.notiz ? zeile("Notiz", a.notiz) : ""))}
        <p style="font-size:10.5pt; margin:8px 0;">Ich bestätige, den oben genannten Schlüssel bzw. Key erhalten zu haben. Ich gebe ihn nicht an Dritte weiter, lasse keine Nachschlüssel anfertigen, melde einen Verlust unverzüglich dem Vorstand und gebe ihn auf Verlangen, spätestens zum vereinbarten Rückgabedatum, zurück.</p>
        <div style="display:flex; gap:24px; margin:14px 0 6px; flex-wrap:wrap;">
          ${sigBox(a.unterschrift_ausgabe, "Ort, Datum, Unterschrift Empfänger/in")}
          ${sigBox(null, "Unterschrift Ausgebende/r")}
        </div>
        <h2 style="font-size:13pt; margin:18px 0 4px;">Rückgabe</h2>
        ${tabelle(zeile("Zurück am", datumDE(a.zurueck_am)) + zeile("Zurückgenommen von", a.zurueck_von))}
        <div style="display:flex; gap:24px; margin:14px 0 6px; flex-wrap:wrap;">
          ${sigBox(a.unterschrift_rueckgabe, "Unterschrift Empfänger/in (Rückgabe)")}
          ${sigBox(null, "Unterschrift Zurücknehmende/r")}
        </div>
        <p style="font-size:9pt; color:#333; margin-top:16px;">Datenschutz: Die Angaben werden ausschließlich zur Verwaltung der Schlüssel durch ${escapeHtml(org || "den Verein")} verarbeitet und gelöscht, sobald sie dafür nach der Rückgabe nicht mehr benötigt werden.</p>
      </div>`;
  }
  // Lädt ein Protokoll (mit Unterschriften) und öffnet den Druckdialog (dort auch „Als PDF speichern“)
  window.ausgabeDrucken = async function(id) {
    try {
      const antwort = await api("schluessel_ausgabe_laden", { id });
      htmlDrucken(protokollHtml(antwort.ausgabe));
    } catch (fehler) {
      alert(fehler.message);
    }
  };

  // Druckt fertiges HTML über den Druckdialog (dort auch „Als PDF speichern“) – seit Session 37 allgemein
  function htmlDrucken(html) {
    let bereich = document.getElementById("druck-bereich");
    if (!bereich) {
      bereich = document.createElement("div");
      bereich.id = "druck-bereich";
      document.body.appendChild(bereich);
    }
    if (!document.getElementById("druck-stil")) {
      const stil = document.createElement("style");
      stil.id = "druck-stil";
      stil.textContent = "@media screen { #druck-bereich { display:none; } } " +
        "@media print { body.druckmodus > *:not(#druck-bereich) { display:none !important; } " +
        "body.druckmodus { background:#fff !important; } #druck-bereich { display:block !important; } " +
        "@page { margin: 15mm; } }";
      document.head.appendChild(stil);
    }
    bereich.innerHTML = html;
    document.body.classList.add("druckmodus");
    const aufraeumen = () => { document.body.classList.remove("druckmodus"); window.removeEventListener("afterprint", aufraeumen); };
    window.addEventListener("afterprint", aufraeumen);
    // kurz warten, bis Bilder (z. B. Unterschriften) geladen sind
    setTimeout(() => { window.print(); setTimeout(aufraeumen, 1000); }, 150);
  }

  // ---------- Protokoll per Mail (seit Session 33) ----------
  // Erste Mailadresse aus einem Freitext (z. B. Feld Kontakt) oder ""
  function mailAusText(text) {
    const treffer = String(text || "").match(/[^\s@<>,;"']+@[^\s@<>,;"']+\.[^\s@<>,;"']{2,}/);
    return treffer ? treffer[0] : "";
  }
  // Schickt ein Protokoll an eine Adresse (Kopie geht an das eigene Postfach); liefert true bei Erfolg
  async function protokollMailSenden(id, email) {
    const organisation = (BEREICH_LOGO[aktiverBereich] || {}).alt || "";
    const antwort = await api("schluessel_protokoll_senden", { id, email, organisation });
    return antwort;
  }
  // Fragt die Adresse ab (Vorschlag aus Kontakt) und verschickt das Protokoll
  window.ausgabeMailen = async function(id) {
    if (!mailEingerichtet) { alert("Der Mail-Versand ist noch nicht eingerichtet (Secrets SMTP_USER und SMTP_PASS, siehe Anleitung Raumplanung)."); return; }
    const a = schluesselAusgaben.find((x) => x.id === id);
    const email = prompt("Protokoll als PDF per Mail senden an:", a ? mailAusText(a.kontakt) : "");
    if (email === null || !email.trim()) return;
    try {
      const antwort = await protokollMailSenden(id, email.trim());
      alert(`Protokoll als PDF an ${email.trim()} verschickt.${antwort && antwort.kopie ? " Eine Kopie ging an dein Postfach." : ""}`);
    } catch (fehler) {
      alert(fehler.message);
    }
  };
  // Lädt das Protokoll als PDF vom Server und speichert es (gleiches PDF wie im Mail-Anhang)
  window.ausgabePdf = async function(id) {
    try {
      const organisation = (BEREICH_LOGO[aktiverBereich] || {}).alt || "";
      const antwort = await api("schluessel_protokoll_pdf", { id, organisation });
      const bin = atob(antwort.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      downloadDatei(antwort.dateiname || "Schluesselprotokoll.pdf", bytes, "application/pdf");
    } catch (fehler) {
      alert(fehler.message);
    }
  };
  // Feld „Protokoll per Mail an“ für die Formulare Ausgeben/Zurücknehmen
  function mailFeldHtml(id, vorschlag) {
    if (!mailEingerichtet) return "";
    return `<label class="ern-feld ern-feld-breit">Protokoll per Mail an (optional)<input type="email" id="${id}" value="${escapeAttr(vorschlag || "")}" autocomplete="off" placeholder="leer lassen = keine Mail"></label>`;
  }
  // Nach dem Speichern: Protokoll verschicken, wenn eine Adresse eingetragen ist (Fehler nur melden)
  async function mailNachSpeichern(ausgabeId, email) {
    if (!email) return;
    try {
      const antwort = await protokollMailSenden(ausgabeId, email);
      alert(`Gespeichert. Protokoll als PDF an ${email} verschickt.${antwort && antwort.kopie ? " Eine Kopie ging an dein Postfach." : ""}`);
    } catch (fehler) {
      alert("Gespeichert, aber die Mail ging nicht raus: " + fehler.message + " – über das Mail-Symbol in den Ausgabeprotokollen erneut versuchen.");
    }
  }

  // ---------- Protokoll-Liste ----------
  // Rendert die Liste aller Ausgabeprotokolle des Bereichs (offene zuerst) inkl. Hinweis auf alte Protokolle
  function renderAusgabeProtokolle() {
    const ziel = document.getElementById("schluessel-protokolle");
    if (!ziel) return;
    const alle = ausgabenAktuell().sort((a, b) =>
      (a.zurueck_am ? 1 : 0) - (b.zurueck_am ? 1 : 0) || (b.ausgegeben_am || "").localeCompare(a.ausgegeben_am || ""));
    document.getElementById("schluessel-protokolle-zahl").textContent = alle.length ? `(${alle.length})` : "";
    if (!alle.length) { ziel.innerHTML = `<p class="empty-text">Noch keine Ausgaben protokolliert.</p>`; return; }
    const alt = alle.filter(ausgabeIstAlt);
    let html = alt.length ? `
      <p class="notiz-meta" style="color:var(--accent);">${alt.length} Protokoll${alt.length === 1 ? " ist" : "e sind"} seit mehr als einem Jahr abgeschlossen. Nicht mehr benötigte Protokolle bitte löschen (Datenschutz).
        <button class="link-btn" onclick="alteProtokolleLoeschen()">Alte löschen</button></p>` : "";
    html += `<div class="notiz-list">${alle.map((a) => {
      if (ausgabeBearbeitenId === a.id) return ausgabeBearbeitenHtml(a);
      const icon = ic(a.art === "key" ? "funk" : "schluessel");
      const status = a.zurueck_am
        ? `zurück ${datumDE(a.zurueck_am)}${a.hat_unterschrift_rueckgabe ? " " + ic("unterschrift") : ""}`
        : (ausgabeUeberfaellig(a) ? `<strong style="color:var(--accent);">überfällig seit ${datumDE(a.rueckgabe_bis)}</strong>` : "noch ausgegeben");
      return `
        <div class="notiz-item">
          <div style="flex:1; cursor:pointer;" onclick="ausgabeBearbeitenStart('${a.id}')">
            <span class="notiz-text">${icon} ${escapeHtml(a.seriennummer)} · ${escapeHtml(a.inhaber)}${a.verein ? " (" + escapeHtml(a.verein) + ")" : ""}</span>
            <span class="notiz-meta" style="display:block;">ausgegeben ${datumDE(a.ausgegeben_am)}${a.hat_unterschrift_ausgabe ? " " + ic("unterschrift") : ""}${a.ausgegeben_von ? " von " + escapeHtml(a.ausgegeben_von) : ""} · ${status}${ausgabeIstAlt(a) ? " · älter als 1 Jahr" : ""}</span>
          </div>
          <button class="task-edit-btn" onclick="event.stopPropagation(); ausgabeDrucken('${a.id}')" aria-label="Protokoll drucken" title="Drucken">${ic("drucken")}</button>
          <button class="task-edit-btn" onclick="event.stopPropagation(); ausgabePdf('${a.id}')" aria-label="Protokoll als PDF herunterladen" title="PDF herunterladen">${ic("export")}</button>
          ${mailEingerichtet ? `<button class="task-edit-btn" onclick="event.stopPropagation(); ausgabeMailen('${a.id}')" aria-label="Protokoll per Mail senden" title="Per Mail senden">${ic("mail")}</button>` : ""}
          <button class="task-delete" onclick="event.stopPropagation(); ausgabeLoeschen('${a.id}')" aria-label="Protokoll löschen">${ic("x")}</button>
        </div>`;
    }).join("")}</div>`;
    ziel.innerHTML = html;
  }
  // Bearbeiten-Formular eines Protokolls (Tippfehler korrigieren; Unterschriften bleiben)
  function ausgabeBearbeitenHtml(a) {
    const id = a.id;
    const feld = (f, label, wert, typ = "text", max = 120) =>
      `<label class="ern-feld">${label}<input type="${typ}" id="sp-${f}-${id}" value="${escapeAttr(wert || "")}"${typ === "text" ? ` maxlength="${max}"` : ""}></label>`;
    return `
      <div class="notiz-item" style="display:block;">
        <div class="task-edit-felder">
          ${feld("name", "Name *", a.inhaber)}
          ${feld("verein", "Verein", a.verein)}
          ${feld("kontakt", "Kontakt", a.kontakt, "text", 200)}
          ${feld("am", "Ausgegeben am", a.ausgegeben_am, "date")}
          ${feld("von", "Ausgegeben von", a.ausgegeben_von)}
          ${feld("bis", "Rückgabe bis", a.rueckgabe_bis, "date")}
          ${a.zurueck_am ? feld("zam", "Zurück am", a.zurueck_am, "date") + feld("zvon", "Zurückgenommen von", a.zurueck_von) : ""}
          ${feld("notiz", "Notiz", a.notiz, "text", 500)}
        </div>
        <p class="notiz-meta" style="margin:0.3rem 0;">Unterschriften und Schlüsseldaten lassen sich nicht ändern.</p>
        <div class="row" style="margin:0.4rem 0 0;">
          <button class="btn-primary" onclick="ausgabeSpeichern('${id}')">Speichern</button>
          <button class="link-btn" onclick="ausgabeBearbeitenAbbrechen()">Abbrechen</button>
        </div>
      </div>`;
  }
  // Öffnet ein Protokoll in der Liste zum Korrigieren
  window.ausgabeBearbeitenStart = function(id) {
    ausgabeBearbeitenId = id;
    renderAusgabeProtokolle();
  };
  // Schließt das Korrigieren eines Protokolls ohne zu speichern
  window.ausgabeBearbeitenAbbrechen = function() {
    ausgabeBearbeitenId = null;
    renderAusgabeProtokolle();
  };
  // Speichert die korrigierten Protokolldaten (Unterschriften bleiben unverändert)
  window.ausgabeSpeichern = async function(id) {
    const wert = (f) => { const el = document.getElementById(`sp-${f}-${id}`); return el ? el.value.trim() : ""; };
    try {
      await api("schluessel_ausgabe_aktualisieren", {
        id, inhaber: wert("name"), verein: wert("verein"), kontakt: wert("kontakt"), ausgegeben_am: wert("am"),
        ausgegeben_von: wert("von"), rueckgabe_bis: wert("bis"), zurueck_am: wert("zam"), zurueck_von: wert("zvon"), notiz: wert("notiz"),
      });
      ausgabeBearbeitenId = null;
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  };
  // Löscht ein Protokoll inkl. Unterschriften nach Rückfrage
  window.ausgabeLoeschen = async function(id) {
    const a = schluesselAusgaben.find((x) => x.id === id);
    const offen = a && !a.zurueck_am;
    if (!confirm(`Protokoll ${a ? a.seriennummer + " · " + a.inhaber : ""} inkl. Unterschriften löschen?` +
      (offen ? " Der Schlüssel ist noch ausgegeben – er steht danach wieder im Bestand." : ""))) return;
    try {
      await api("schluessel_ausgabe_loeschen", { id });
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  };
  // Löscht alle Protokolle, deren Rückgabe über ein Jahr zurückliegt
  window.alteProtokolleLoeschen = async function() {
    const alt = ausgabenAktuell().filter(ausgabeIstAlt);
    if (!alt.length) return;
    if (!confirm(`${alt.length} abgeschlossene Protokoll${alt.length === 1 ? "" : "e"} (Rückgabe vor über einem Jahr) inkl. Unterschriften löschen?`)) return;
    try {
      await api("schluessel_ausgabe_loeschen", { id: alt.map((a) => a.id) });
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  };

  // ==========================================================
  // Raumplanung (seit Session 29): Vermietungen je Raum, bei jedem neuen
  // Eintrag verschickt die Edge Function eine Mail (Brevo) an den Verteiler.
  // ==========================================================
  let raumBearbeitenId = null;
  let raumBearbeitenOrt = "liste";
  let raumVergangeneOffen = false;
  // Seit Session 30: Monatsgruppen klappbar (Zustand je Bereich|Monat gemerkt,
  // ohne Eintrag ist nur der aktuelle Monat offen) und Monatskalender
  const raumMonatOffen = {};
  try { Object.assign(raumMonatOffen, JSON.parse(localStorage.getItem("raum-monate-offen") || "{}")); } catch (_e) { /* leer lassen */ }
  function raumMonateMerken() {
    try { localStorage.setItem("raum-monate-offen", JSON.stringify(raumMonatOffen)); } catch (_e) { /* egal */ }
  }
  let raumKalMonat = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
  let raumKalTag = null; // ausgewähltes Datum "YYYY-MM-DD" oder null
  const RAUM_WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const RAUM_MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  // Liefert die Räume des aktiven Bereichs, alphabetisch sortiert
  function raeumeAktuell() {
    return raeume.filter((r) => bereichVon(r) === aktiverBereich).sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  // Liefert die Raumvermietungen des aktiven Bereichs
  function raumVermietungenAktuell() {
    return raumVermietungen.filter((v) => bereichVon(v) === aktiverBereich);
  }
  // Liefert die Mail-Empfänger des Raum-Verteilers im aktiven Bereich, nach E-Mail sortiert
  function raumEmpfaengerAktuell() {
    return raumMailEmpfaenger.filter((e) => bereichVon(e) === aktiverBereich).sort((a, b) => a.email.localeCompare(b.email));
  }
  // Gibt den Namen eines Raums zur ID zurück, sonst „ohne Raum“
  function raumName(id) {
    const r = raeume.find((x) => x.id === id);
    return r ? r.name : "ohne Raum";
  }
  // Formatiert ein ISO-Datum als „Wt, TT.MM.JJJJ“
  function raumDatumText(iso) {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return `${RAUM_WOCHENTAGE[d.getDay()]}, ${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
  }
  // Formatiert die Zeitangabe einer Vermietung (Zeitraum, von–bis, ab, bis oder ganztägig)
  function raumZeitText(v) {
    const von = v.von ? String(v.von).slice(0, 5) : null;
    const bis = v.bis ? String(v.bis).slice(0, 5) : null;
    // Zeitraum: von = Beginn am ersten Tag, bis = Ende am letzten Tag
    if (v.datum_bis && v.datum_bis !== v.datum) {
      return `${raumDatumText(v.datum)}${von ? " " + von : ""} – ${raumDatumText(v.datum_bis)}${bis ? " " + bis : ""}${von || bis ? " Uhr" : ""}`;
    }
    if (von && bis) return `${von}–${bis} Uhr`;
    if (von) return `ab ${von} Uhr`;
    if (bis) return `bis ${bis} Uhr`;
    return "ganztägig";
  }
  // Kopfzeile eines Eintrags: Datum + Zeit bzw. der ganze Zeitraum
  function raumWannText(v) {
    if (v.datum_bis && v.datum_bis !== v.datum) return raumZeitText(v);
    return `${raumDatumText(v.datum)} · ${raumZeitText(v)}`;
  }
  // Liefert das Enddatum einer Vermietung (datum_bis oder datum)
  function raumEnde(v) {
    return v.datum_bis || v.datum;
  }
  // Liefert alle Vermietungen derselben Serie (gruppe_id), nach Datum sortiert
  function raumSerie(v) {
    if (!v.gruppe_id) return [];
    return raumVermietungen.filter((x) => x.gruppe_id === v.gruppe_id).sort((a, b) => a.datum.localeCompare(b.datum));
  }
  // Erzeugt die Statuszeile zum Mailversand einer Vermietung, bei Fehlern mit „Erneut senden“
  function raumMailStatusHtml(v) {
    if (v.mail_status === "gesendet") {
      return `<span class="notiz-meta" style="display:block;">${ic("mail")} Mail verschickt${v.mail_gesendet_am ? " am " + new Date(v.mail_gesendet_am).toLocaleDateString("de-DE") : ""}</span>`;
    }
    const texte = {
      fehler: "Mail fehlgeschlagen" + (v.mail_fehler ? ": " + v.mail_fehler : ""),
      keine_empfaenger: "Keine Mail – der Verteiler war leer",
      nicht_eingerichtet: "Keine Mail – Versand ist noch nicht eingerichtet",
    };
    if (!texte[v.mail_status]) return "";
    return `<span class="notiz-meta" style="display:block; color:var(--accent);">${ic("warnung")} ${escapeHtml(texte[v.mail_status])}
      <button class="link-btn" onclick="event.stopPropagation(); raumMailErneut('${v.id}')">Erneut senden</button></span>`;
  }
  // Erzeugt den Rückmeldetext zum Mailversand nach dem Speichern einer Vermietung
  function raumMailErgebnisText(mail) {
    if (!mail) return "";
    if (mail.status === "gesendet") return `Mail an ${mail.anzahl} Adresse${mail.anzahl === 1 ? "" : "n"} verschickt.`;
    if (mail.status === "keine_empfaenger") return "Gespeichert – aber keine Mail, weil der Verteiler leer ist.";
    if (mail.status === "nicht_eingerichtet") return "Gespeichert – aber keine Mail, weil der Versand noch nicht eingerichtet ist.";
    return "Gespeichert – aber die Mail ist fehlgeschlagen" + (mail.fehler ? ": " + mail.fehler : ".");
  }

  // Rendert die Raumplanung: Hinweise, Formular, Kalender, Vermietungen nach Monat, Räume und Verteiler
  function renderRaumplanung() {
    const liste = document.getElementById("raum-vermietungen-liste");
    if (!liste) return;
    const raeumeListe = raeumeAktuell();
    const empfaenger = raumEmpfaengerAktuell();

    // Hinweise oben
    const hinweise = [];
    if (!mailEingerichtet) hinweise.push("Der Mail-Versand ist noch nicht eingerichtet (Secrets SMTP_USER und SMTP_PASS in der Edge Function, siehe Anleitung). Vermietungen lassen sich trotzdem eintragen.");
    if (!empfaenger.length) hinweise.push(`Der Mail-Verteiler ist noch leer – über ${ic("zahnrad")} oben unter „Mail-Verteiler“ Adressen eintragen.`);
    if (!raeumeListe.length) hinweise.push(`Noch keine Räume angelegt – über ${ic("zahnrad")} oben unter „Räume verwalten“ anlegen.`);
    document.getElementById("raum-hinweise").innerHTML = hinweise
      // feste Texte ohne Nutzereingaben – nicht escapen, sonst wird das Zahnrad-Icon zu Text
      .map((h) => `<p class="notiz-meta" style="color:var(--accent); margin:0 0 0.5rem;">${h}</p>`).join("");

    // Raum-Auswahl im Formular (Auswahl behalten)
    const auswahl = document.getElementById("raum-neu-raum");
    const bisher = auswahl.value;
    auswahl.innerHTML = raeumeListe.length
      ? raeumeListe.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join("")
      : `<option value="">– kein Raum angelegt –</option>`;
    if (bisher && raeumeListe.some((r) => r.id === bisher)) auswahl.value = bisher;
    const datumFeld = document.getElementById("raum-neu-datum");
    if (!datumFeld.value) datumFeld.value = heuteISO();

    // Vermietungen: kommende nach Monat, vergangene eingeklappt
    const heute = heuteISO();
    const alle = raumVermietungenAktuell().slice().sort((a, b) =>
      a.datum.localeCompare(b.datum) || String(a.von || "").localeCompare(String(b.von || "")));
    const kommend = alle.filter((v) => raumEnde(v) >= heute);
    const vergangen = alle.filter((v) => raumEnde(v) < heute).reverse();

    // ort: "liste" oder "kal" (Tagesansicht unter dem Kalender). Bearbeitet
    // wird nur an der Stelle, an der der Eintrag angetippt wurde – sonst
    // gäbe es die Eingabefelder doppelt mit denselben IDs.
    const karte = (v, ort = "liste") => {
      if (raumBearbeitenId === v.id && raumBearbeitenOrt === ort) {
        return `
          <div class="notiz-item">
            <div style="flex:1;">
              <div class="task-edit-felder">
                <label class="ern-feld">Raum<select id="raum-edit-raum-${v.id}">
                  <option value="">– ohne Raum –</option>
                  ${raeumeListe.map((r) => `<option value="${r.id}" ${r.id === v.raum_id ? "selected" : ""}>${escapeHtml(r.name)}</option>`).join("")}
                </select></label>
                <label class="ern-feld">Datum<input type="date" id="raum-edit-datum-${v.id}" value="${escapeAttr(v.datum)}"></label>
                ${v.gruppe_id ? "" : `<label class="ern-feld">Bis Datum (optional)<input type="date" id="raum-edit-datumbis-${v.id}" value="${escapeAttr(v.datum_bis || "")}"></label>`}
                <label class="ern-feld">Von<input type="time" id="raum-edit-von-${v.id}" value="${v.von ? String(v.von).slice(0, 5) : ""}"></label>
                <label class="ern-feld">Bis<input type="time" id="raum-edit-bis-${v.id}" value="${v.bis ? String(v.bis).slice(0, 5) : ""}"></label>
                <label class="ern-feld ern-feld-breit">Anlass / Belegung<input type="text" id="raum-edit-mieter-${v.id}" maxlength="200" value="${escapeAttr(v.mieter_name)}"></label>
                <label class="ern-feld ern-feld-breit">Kontakt (optional, nur wenn nötig)<input type="text" id="raum-edit-kontakt-${v.id}" maxlength="300" value="${escapeAttr(v.mieter_kontakt || "")}"></label>
                <label class="ern-feld ern-feld-breit">Zweck<input type="text" id="raum-edit-zweck-${v.id}" maxlength="300" value="${escapeAttr(v.zweck || "")}"></label>
                <label class="ern-feld ern-feld-breit">Notiz<textarea id="raum-edit-notiz-${v.id}" rows="2" maxlength="2000">${escapeHtml(v.notiz || "")}</textarea></label>
              </div>
              <div class="row" style="margin-bottom:0;">
                <button class="btn-primary" onclick="raumBearbeitenSpeichern('${v.id}')">Speichern</button>
                <button class="link-btn" onclick="raumBearbeitenAbbrechen()">Abbrechen</button>
                ${v.gruppe_id ? `<button class="link-btn" style="color:var(--accent);" onclick="raumSerieLoeschen('${v.id}')">Ganze Serie löschen (${raumSerie(v).length})</button>` : ""}
              </div>
              <p class="notiz-meta">Änderungen verschicken keine Mail.${v.gruppe_id ? " Bei einer Serie ändert sich nur dieser Termin." : " „Bis Datum“ leer lassen für einen einzelnen Tag."}</p>
            </div>
          </div>`;
      }
      return `
        <div class="notiz-item">
          <div style="flex:1; cursor:pointer;" onclick="raumBearbeitenStart('${v.id}', '${ort}')">
            <span class="notiz-text">${escapeHtml(raumWannText(v))} · ${escapeHtml(raumName(v.raum_id))}</span>
            ${(() => {
              const serie = raumSerie(v);
              if (serie.length < 2) return "";
              const nr = serie.findIndex((x) => x.id === v.id) + 1;
              return `<span class="notiz-meta" style="display:block;">${ic("serie")} Serie · Termin ${nr} von ${serie.length}</span>`;
            })()}
            <span class="notiz-meta" style="display:block;">${escapeHtml(v.mieter_name)}${v.mieter_kontakt ? " · " + escapeHtml(v.mieter_kontakt) : ""}${v.zweck ? " · " + escapeHtml(v.zweck) : ""}</span>
            ${v.notiz ? `<span class="notiz-meta" style="display:block;">${escapeHtml(v.notiz)}</span>` : ""}
            ${raumMailStatusHtml(v)}
          </div>
          <button class="task-delete" onclick="event.stopPropagation(); raumVermietungLoeschen('${v.id}')" aria-label="Vermietung löschen">${ic("x")}</button>
        </div>`;
    };

    raumKalenderRendern(alle, karte);

    let html = "";
    if (!kommend.length) {
      html += `<p class="empty-text">Keine kommenden Vermietungen.</p>`;
    } else {
      const monate = new Map();
      kommend.forEach((v) => {
        const k = v.datum.slice(0, 7);
        if (!monate.has(k)) monate.set(k, []);
        monate.get(k).push(v);
      });
      const aktMonat = heute.slice(0, 7);
      const gruppen = [];
      for (const [k, eintraege] of monate) {
        const titel = `${RAUM_MONATE[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;
        const schluessel = `${aktiverBereich}|${k}`;
        const gemerkt = raumMonatOffen[schluessel];
        const offen = (raumBearbeitenOrt === "liste" && eintraege.some((v) => v.id === raumBearbeitenId)) || (gemerkt === undefined ? k <= aktMonat : gemerkt);
        const ohneMail = eintraege.filter((v) => v.mail_status && v.mail_status !== "gesendet").length;
        gruppen.push(`
          <details class="spiel-gruppe" data-schluessel="${escapeAttr(schluessel)}" ${offen ? "open" : ""} ontoggle="raumMonatUmschalten(this)">
            <summary class="spiel-gruppe-kopf">
              <span class="spiel-gruppe-titel">${escapeHtml(titel)}</span>
              ${ohneMail ? `<span class="spiel-gruppe-info">${ohneMail} ohne Mail</span>` : ""}
              <span class="zl-gruppe-zahl">${eintraege.length}</span>
            </summary>
            <div class="notiz-list">${eintraege.map((v) => karte(v)).join("")}</div>
          </details>`);
      }
      if (gruppen.length > 1) {
        html += `
          <div class="row" style="margin:0.4rem 0 0.2rem; gap:0.8rem;">
            <button class="link-btn" onclick="raumAlleMonate(true)">Alle aufklappen</button>
            <button class="link-btn" onclick="raumAlleMonate(false)">Alle zuklappen</button>
          </div>`;
      }
      html += `<div class="spiel-gruppen">${gruppen.join("")}</div>`;
    }
    if (vergangen.length) {
      html += `
        <details class="spiel-gruppe" style="margin-top:1rem;" ${raumVergangeneOffen || (raumBearbeitenOrt === "liste" && vergangen.some((v) => v.id === raumBearbeitenId)) ? "open" : ""} ontoggle="raumVergangeneUmschalten(this)">
          <summary class="spiel-gruppe-kopf">
            <span class="spiel-gruppe-titel">Vergangene Vermietungen</span>
            <span class="zl-gruppe-zahl">${vergangen.length}</span>
          </summary>
          <div class="notiz-list">${vergangen.map((v) => karte(v)).join("")}</div>
        </details>`;
    }
    liste.innerHTML = html;

    // Räume
    document.getElementById("raum-raeume-liste").innerHTML = raeumeListe.length
      ? `<div class="notiz-list">${raeumeListe.map((r) => {
          const anzahl = raumVermietungenAktuell().filter((v) => v.raum_id === r.id && raumEnde(v) >= heute).length;
          return `
            <div class="notiz-item">
              <div style="flex:1;">
                <span class="notiz-text">${escapeHtml(r.name)}</span>
                <span class="notiz-meta" style="display:block;">${r.beschreibung ? escapeHtml(r.beschreibung) + " · " : ""}${anzahl} kommende Vermietung${anzahl === 1 ? "" : "en"}</span>
              </div>
              <button class="task-edit-btn" onclick="raumUmbenennen('${r.id}')" aria-label="Raum bearbeiten" title="Bearbeiten">${ic("stift")}</button>
              <button class="task-delete" onclick="raumLoeschen('${r.id}')" aria-label="Raum löschen">${ic("x")}</button>
            </div>`;
        }).join("")}</div>`
      : `<p class="empty-text">Noch keine Räume.</p>`;

    // Verteiler
    document.getElementById("raum-empfaenger-liste").innerHTML = empfaenger.length
      ? `<div class="notiz-list">${empfaenger.map((e) => `
          <div class="notiz-item">
            <div style="flex:1;">
              <span class="notiz-text">${escapeHtml(e.email)}</span>
              ${e.name ? `<span class="notiz-meta" style="display:block;">${escapeHtml(e.name)}</span>` : ""}
            </div>
            <button class="task-delete" onclick="raumEmpfaengerLoeschen('${e.id}')" aria-label="Adresse entfernen">${ic("x")}</button>
          </div>`).join("")}</div>
        <p class="notiz-meta">${empfaenger.length} Adresse${empfaenger.length === 1 ? "" : "n"} im Verteiler.</p>`
      : `<p class="empty-text">Noch keine Adressen.</p>`;
  }

  // Merkt sich, ob die vergangenen Vermietungen aufgeklappt sind
  window.raumVergangeneUmschalten = function(el) {
    raumVergangeneOffen = el.open;
  };

  // Merkt den Auf-/Zuklapp-Zustand einer Monatsgruppe und speichert ihn in localStorage
  window.raumMonatUmschalten = function(el) {
    raumMonatOffen[el.dataset.schluessel] = el.open;
    raumMonateMerken();
  };

  // Klappt alle Monatsgruppen kommender Vermietungen auf oder zu und rendert neu
  window.raumAlleMonate = function(auf) {
    const heute = heuteISO();
    raumVermietungenAktuell().filter((v) => raumEnde(v) >= heute)
      .forEach((v) => { raumMonatOffen[`${aktiverBereich}|${v.datum.slice(0, 7)}`] = auf; });
    raumMonateMerken();
    renderRaumplanung();
  };

  // Monatskalender: jeder belegte Tag ist markiert (Zeiträume über alle
  // ihre Tage). Tipp auf einen Tag zeigt darunter die Vermietungen
  // dieses Tages, mit Bearbeiten wie in der Liste.
  function raumBelegungNachTag(alle) {
    const tage = new Map();
    for (const v of alle) {
      let tag = v.datum;
      const ende = raumEnde(v);
      for (let i = 0; tag <= ende && i < 400; i++) {
        if (!tage.has(tag)) tage.set(tag, []);
        tage.get(tag).push(v);
        tag = addTage(tag, 1);
      }
    }
    return tage;
  }

  // Rendert den Monatskalender der Raumbelegung mit markierten Tagen und Tagespanel für den gewählten Tag
  function raumKalenderRendern(alle, karte) {
    const el = document.getElementById("raum-kalender");
    if (!el) return;
    const belegung = raumBelegungNachTag(alle);
    const jahr = raumKalMonat.getFullYear();
    const monat = raumKalMonat.getMonth();
    const anzahlTage = new Date(jahr, monat + 1, 0).getDate();
    const versatz = (new Date(jahr, monat, 1).getDay() + 6) % 7; // Montag zuerst
    const heute = heuteISO();
    const praefix = `${jahr}-${String(monat + 1).padStart(2, "0")}-`;
    let belegteTage = 0;

    let zellen = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((l) => `<div class="cal-daylabel">${l}</div>`).join("");
    for (let i = 0; i < versatz; i++) zellen += `<div class="cal-day empty"></div>`;
    for (let t = 1; t <= anzahlTage; t++) {
      const iso = praefix + String(t).padStart(2, "0");
      const liste = belegung.get(iso) || [];
      if (liste.length) belegteTage++;
      const klassen = ["cal-day"];
      if (iso === heute) klassen.push("today");
      // Button statt div (per Tastatur erreichbar) – Browser-Standards für Buttons neutralisieren.
      // Belegt = volle Akzentfarbe des Bereichs mit weißer Schrift (AWO-Rot,
      // Kontrast ca. 5,9:1). Ausgewählter Tag = dunkle Navigationsfarbe, damit
      // er sich von belegten Tagen abhebt. Heute bleibt am Rahmen erkennbar
      // (bei belegten Tagen zusätzlich ein heller Innenring).
      let stil = "padding:0; font-family:inherit;";
      if (iso === raumKalTag) {
        stil += " background:var(--nav-bg); color:var(--nav-ink); border-color:var(--nav-bg); font-weight:700;";
      } else if (liste.length) {
        stil += " background:var(--accent); color:var(--on-accent); border-color:var(--accent); font-weight:700;";
        if (iso === heute) stil += " box-shadow:inset 0 0 0 2px var(--panel);";
      }
      stil = ` style="${stil}"`;
      const punktStil = liste.length ? ` style="background:${iso === raumKalTag ? "var(--nav-ink)" : "#fff"};"` : "";
      const titel = liste.length
        ? liste.map((v) => `${raumName(v.raum_id)}: ${v.mieter_name}`).join("\n") : "frei";
      zellen += `<button type="button" class="${klassen.join(" ")}"${stil} onclick="raumKalTagWaehlen('${iso}')"
        title="${escapeAttr(titel)}" aria-label="${t}. – ${liste.length ? liste.length + " Vermietung" + (liste.length === 1 ? "" : "en") : "frei"}">
        <span>${t}</span>${liste.length ? `<span class="dot"${punktStil}></span>` : ""}
      </button>`;
    }

    let panel = "";
    if (raumKalTag) {
      const liste = (belegung.get(raumKalTag) || []).slice()
        .sort((a, b) => String(a.von || "").localeCompare(String(b.von || "")));
      panel = `
        <div class="cal-day-panel" style="margin-bottom:1.2rem;">
          <h3>${escapeHtml(raumDatumText(raumKalTag))}</h3>
          ${liste.length ? `<div class="notiz-list">${liste.map((v) => karte(v, "kal")).join("")}</div>`
            : `<p class="empty-text" style="margin:0 0 0.6rem;">An diesem Tag ist nichts vermietet.</p>`}
          <button class="link-btn" onclick="raumKalTagUebernehmen('${raumKalTag}')">＋ Neue Vermietung an diesem Tag</button>
        </div>`;
    }

    el.innerHTML = `
      <div class="cal-header" style="margin-top:1.2rem;">
        <div class="cal-nav"><button type="button" onclick="raumKalBlaettern(-1)" aria-label="Vormonat">${ic("zurueck")}</button></div>
        <h2 style="cursor:pointer;" onclick="raumKalHeute()" title="Zum aktuellen Monat">${RAUM_MONATE[monat]} ${jahr}</h2>
        <div class="cal-nav"><button type="button" onclick="raumKalBlaettern(1)" aria-label="Nächster Monat">${ic("weiter")}</button></div>
      </div>
      <p class="notiz-meta" style="margin:-0.5rem 0 0.6rem; text-align:center;">${belegteTage ? `${belegteTage} belegte${belegteTage === 1 ? "r Tag" : " Tage"}` : "Kein Tag belegt"}</p>
      <div class="cal-grid" style="margin-bottom:1rem;">${zellen}</div>
      ${panel}`;
  }

  // Blättert den Raumkalender um delta Monate und hebt die Tagesauswahl auf
  window.raumKalBlaettern = function(delta) {
    raumKalMonat = new Date(raumKalMonat.getFullYear(), raumKalMonat.getMonth() + delta, 1);
    raumKalTag = null;
    renderRaumplanung();
  };
  // Springt im Raumkalender zum aktuellen Monat
  window.raumKalHeute = function() {
    const d = new Date();
    raumKalMonat = new Date(d.getFullYear(), d.getMonth(), 1);
    raumKalTag = null;
    renderRaumplanung();
  };
  // Wählt einen Kalendertag aus bzw. hebt die Auswahl beim zweiten Tipp wieder auf
  window.raumKalTagWaehlen = function(iso) {
    raumKalTag = raumKalTag === iso ? null : iso;
    renderRaumplanung();
  };
  // Datum ins Formular oben übernehmen und dorthin springen
  window.raumKalTagUebernehmen = function(iso) {
    reiterFormularOeffnen("form-raumplanung");
    document.getElementById("raum-neu-datum").value = iso;
    const formular = document.getElementById("raum-formular");
    if (formular) formular.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Vermietung eintragen. Bei Überschneidung fragt die App nach und
  // schickt dann mit trotzdem = true erneut.
  async function raumVermietungSenden(action, daten) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, token, aktiver_bereich: aktiverBereich, ...daten }),
    });
    const antwort = await res.json().catch(() => ({}));
    if (res.status === 409 && antwort.konflikt) {
      const ok = confirm(`${antwort.error}:\n\n${(antwort.mit || []).join("\n")}\n\nTrotzdem speichern?`);
      if (!ok) return null;
      return api(action, { ...daten, trotzdem: true });
    }
    if (res.status === 401) {
      localStorage.removeItem("aufgaben-token");
      token = "";
      zeigeLogin("Bitte erneut anmelden.");
      throw new Error("unauthorized");
    }
    if (!res.ok) throw new Error(antwort.error || "Serverfehler");
    return antwort;
  }

  // Formular: Art der Vermietung (ein Tag / Zeitraum / mehrere Tage)
  let raumNeueTage = [];

  // Regelmäßige Termine (seit Session 30): aus erstem Datum, Rhythmus und
  // Enddatum die einzelnen Tage berechnen. Gespeichert wird danach genau wie
  // bei „Mehrere einzelne Tage“ (tage[], gemeinsame gruppe_id, eine Mail).
  //   woche / 2wochen: +7 bzw. +14 Tage
  //   monat_tag: gleicher Tag im Monat – Monate ohne diesen Tag (z. B. 31.)
  //     werden übersprungen, nicht auf den Monatsletzten verschoben
  //   monat_wochentag: gleicher Wochentag an gleicher Stelle (z. B. 2. Dienstag);
  //     beim 5. Wochentag fallen Monate ohne fünften weg
  const RAUM_REGEL_MAX = 60;
  const RAUM_ORDINAL = ["1.", "2.", "3.", "4.", "5."];
  function raumRegelTermine(start, bis, rhythmus) {
    const tage = [];
    if (!start || !bis || bis < start) return tage;
    const [j, m, t] = start.split("-").map(Number);
    const iso = (d) => datumLokalISO(d);
    if (rhythmus === "woche" || rhythmus === "2wochen") {
      const schritt = rhythmus === "woche" ? 7 : 14;
      for (let tag = start; tag <= bis && tage.length <= RAUM_REGEL_MAX; tag = addTage(tag, schritt)) tage.push(tag);
      return tage;
    }
    const wochentag = new Date(j, m - 1, t).getDay();
    const nr = Math.floor((t - 1) / 7); // 0 = erster … 4 = fünfter
    for (let k = 0; k < 400 && tage.length <= RAUM_REGEL_MAX; k++) {
      let d;
      if (rhythmus === "monat_tag") {
        d = new Date(j, m - 1 + k, t);
        if (d.getDate() !== t) continue; // Monat hat diesen Tag nicht
      } else {
        const erster = new Date(j, m - 1 + k, 1);
        const versatz = (wochentag - erster.getDay() + 7) % 7;
        d = new Date(erster.getFullYear(), erster.getMonth(), 1 + versatz + nr * 7);
        if (d.getMonth() !== erster.getMonth()) continue; // kein 5. Wochentag
      }
      const s = iso(d);
      if (s > bis) break;
      tage.push(s);
    }
    return tage;
  }
  // Beschreibt den Rhythmus einer Terminserie in Worten, z. B. „jeden zweiten Dienstag“
  function raumRegelBeschreibung(start, rhythmus) {
    if (!start) return "";
    const [j, m, t] = start.split("-").map(Number);
    const wt = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][new Date(j, m - 1, t).getDay()];
    if (rhythmus === "woche") return `jeden ${wt}`;
    if (rhythmus === "2wochen") return `jeden zweiten ${wt}`;
    if (rhythmus === "monat_tag") return `jeden ${t}. im Monat`;
    return `jeden ${RAUM_ORDINAL[Math.floor((t - 1) / 7)]} ${wt} im Monat`;
  }
  // Zeigt im Formular die Vorschau der Termine, die eine regelmäßige Serie erzeugen würde
  function raumRegelVorschau() {
    const el = document.getElementById("raum-neu-regel-vorschau");
    if (!el || document.getElementById("raum-neu-art").value !== "regel") return;
    const start = document.getElementById("raum-neu-datum").value;
    const bis = document.getElementById("raum-neu-datum-bis").value;
    const rhythmus = document.getElementById("raum-neu-rhythmus").value;
    if (!start || !bis) { el.textContent = "Erstes Datum und „Bis Datum“ wählen – dann steht hier, welche Termine entstehen."; return; }
    if (bis < start) { el.textContent = "„Bis Datum“ liegt vor dem ersten Termin."; return; }
    const tage = raumRegelTermine(start, bis, rhythmus);
    if (tage.length > RAUM_REGEL_MAX) {
      el.textContent = `Das wären mehr als ${RAUM_REGEL_MAX} Termine – bitte ein früheres „Bis Datum“ wählen und die Serie später verlängern.`;
      return;
    }
    const liste = tage.length <= 6 ? tage.map(raumDatumText).join(", ")
      : `${tage.slice(0, 3).map(raumDatumText).join(", ")} … ${raumDatumText(tage[tage.length - 1])}`;
    el.textContent = `${raumRegelBeschreibung(start, rhythmus)}: ${tage.length} Termin${tage.length === 1 ? "" : "e"} – ${liste}`;
  }

  // Passt Felder, Beschriftungen und Hinweis des Vermietungsformulars an die gewählte Art an
  function raumArtAnwenden() {
    const art = document.getElementById("raum-neu-art").value;
    document.getElementById("raum-neu-datum-bis-feld").classList.toggle("hidden", art !== "zeitraum" && art !== "regel");
    document.getElementById("raum-neu-rhythmus-feld").classList.toggle("hidden", art !== "regel");
    document.getElementById("raum-neu-regel-vorschau").classList.toggle("hidden", art !== "regel");
    document.getElementById("raum-neu-datum-bis-label").textContent = art === "regel" ? "Bis Datum (letzter Termin)" : "Bis Datum";
    document.getElementById("raum-neu-tage-feld").classList.toggle("hidden", art !== "mehrere");
    document.getElementById("raum-neu-datum-label").textContent = art === "zeitraum" ? "Von Datum" : art === "regel" ? "Erster Termin" : "Datum";
    document.getElementById("raum-neu-von-label").textContent = art === "zeitraum" ? "Beginn (1. Tag)" : "Von";
    document.getElementById("raum-neu-bis-label").textContent = art === "zeitraum" ? "Ende (letzter Tag)" : "Bis";
    const hinweise = {
      tag: "",
      zeitraum: "Durchgehend belegt – z. B. Freitag 18:00 bis Sonntag 14:00.",
      mehrere: "Datum wählen und „+ Tag hinzufügen“ – alle Tage bekommen dieselbe Uhrzeit. Es geht eine Mail für alle Termine raus.",
      regel: "Alle Termine bekommen dieselbe Uhrzeit. Es geht eine Mail für alle Termine raus. Einzelne Termine (z. B. in den Ferien) danach einfach löschen.",
    };
    document.getElementById("raum-neu-art-hinweis").textContent = hinweise[art] || "";
    raumRegelVorschau();
  }
  // Rendert die gewählten Einzeltage als entfernbare Chips
  function raumTageRendern() {
    const ziel = document.getElementById("raum-neu-tage-liste");
    if (!ziel) return;
    ziel.innerHTML = raumNeueTage.length
      ? raumNeueTage.map((t) => `<button type="button" class="chip" onclick="raumTagEntfernen('${t}')" title="Entfernen">${escapeHtml(raumDatumText(t))} ×</button>`).join("")
      : `<span class="notiz-meta">Noch keine Tage gewählt.</span>`;
  }
  // Entfernt einen Tag aus der Auswahl für mehrere Einzeltage
  window.raumTagEntfernen = function(t) {
    raumNeueTage = raumNeueTage.filter((x) => x !== t);
    raumTageRendern();
  };
  document.getElementById("raum-neu-art").addEventListener("change", raumArtAnwenden);
  ["raum-neu-datum", "raum-neu-datum-bis", "raum-neu-rhythmus"].forEach((id) =>
    document.getElementById(id).addEventListener("change", raumRegelVorschau));
  document.getElementById("btn-raum-tag-dazu").addEventListener("click", () => {
    const feld = document.getElementById("raum-neu-datum");
    const t = feld.value;
    if (!t) return;
    if (!raumNeueTage.includes(t)) {
      if (raumNeueTage.length >= 60) { alert("Höchstens 60 Termine auf einmal."); return; }
      raumNeueTage.push(t);
      raumNeueTage.sort();
    }
    // Vorschlag für den nächsten Termin: eine Woche später
    const d = new Date(t + "T00:00:00");
    d.setDate(d.getDate() + 7);
    feld.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    raumTageRendern();
  });
  raumArtAnwenden();
  raumTageRendern();

  document.getElementById("btn-raum-vermietung").addEventListener("click", async () => {
    const status = document.getElementById("raum-status");
    const knopf = document.getElementById("btn-raum-vermietung");
    const art = document.getElementById("raum-neu-art").value;
    const daten = {
      raum_id: document.getElementById("raum-neu-raum").value || null,
      datum: document.getElementById("raum-neu-datum").value,
      von: document.getElementById("raum-neu-von").value,
      bis: document.getElementById("raum-neu-bis").value,
      mieter_name: document.getElementById("raum-neu-mieter").value.trim(),
      mieter_kontakt: document.getElementById("raum-neu-kontakt").value.trim(),
      zweck: document.getElementById("raum-neu-zweck").value.trim(),
      notiz: document.getElementById("raum-neu-notiz").value.trim(),
      bereich: aktiverBereich,
    };
    if (art === "mehrere") {
      // Das gerade gewählte Datum zählt mit, auch ohne „+ Tag“
      if (daten.datum && !raumNeueTage.includes(daten.datum)) raumNeueTage.push(daten.datum);
      raumNeueTage.sort();
      raumTageRendern();
      if (raumNeueTage.length < 2) {
        status.textContent = "Bitte mindestens zwei Tage hinzufügen (oder „Ein Tag“ wählen).";
        return;
      }
      daten.tage = raumNeueTage.slice();
      daten.datum = raumNeueTage[0];
    } else if (art === "regel") {
      const bis = document.getElementById("raum-neu-datum-bis").value;
      const tage = raumRegelTermine(daten.datum, bis, document.getElementById("raum-neu-rhythmus").value);
      if (!bis || bis < daten.datum) { status.textContent = "Bitte ein „Bis Datum“ nach dem ersten Termin wählen."; return; }
      if (tage.length > RAUM_REGEL_MAX) { status.textContent = `Höchstens ${RAUM_REGEL_MAX} Termine auf einmal – bitte ein früheres „Bis Datum“ wählen.`; return; }
      if (tage.length < 2) { status.textContent = "Das ergibt nur einen Termin – dafür bitte „Ein Tag“ wählen."; return; }
      daten.tage = tage;
      daten.datum = tage[0];
    } else if (art === "zeitraum") {
      daten.datum_bis = document.getElementById("raum-neu-datum-bis").value;
      if (!daten.datum_bis || daten.datum_bis <= daten.datum) {
        status.textContent = "Beim Zeitraum muss „Bis Datum“ nach dem Startdatum liegen.";
        return;
      }
    }
    if (!daten.datum || !daten.mieter_name) {
      status.textContent = "Bitte mindestens Datum und Anlass / Belegung angeben.";
      return;
    }
    knopf.disabled = true;
    status.textContent = "Wird gespeichert …";
    try {
      const ergebnis = await raumVermietungSenden("vermietung_hinzufuegen", daten);
      if (!ergebnis) { status.textContent = "Nicht gespeichert."; return; }
      ["raum-neu-von", "raum-neu-bis", "raum-neu-datum-bis", "raum-neu-mieter", "raum-neu-kontakt", "raum-neu-zweck", "raum-neu-notiz"]
        .forEach((id) => { document.getElementById(id).value = ""; });
      raumNeueTage = [];
      raumTageRendern();
      await ladeDaten();
      const anzahl = ergebnis.anzahl || 1;
      status.textContent = (anzahl > 1 ? `${anzahl} Termine eingetragen. ` : "") + raumMailErgebnisText(ergebnis.mail);
    } catch (fehler) {
      if (fehler.message !== "unauthorized") status.textContent = "Fehler: " + fehler.message;
    } finally {
      knopf.disabled = false;
    }
  });

  // Öffnet die Bearbeiten-Ansicht einer Vermietung in der Liste oder im Kalender
  window.raumBearbeitenStart = function(id, ort) {
    raumBearbeitenId = id;
    raumBearbeitenOrt = ort === "kal" ? "kal" : "liste";
    renderRaumplanung();
  };
  // Bricht das Bearbeiten einer Vermietung ab
  window.raumBearbeitenAbbrechen = function() {
    raumBearbeitenId = null;
    renderRaumplanung();
  };
  // Speichert die bearbeitete Vermietung (mit Überschneidungsprüfung) und lädt die Daten neu
  window.raumBearbeitenSpeichern = async function(id) {
    const wert = (feld) => document.getElementById(`raum-edit-${feld}-${id}`).value;
    const daten = {
      id,
      raum_id: wert("raum") || null,
      datum: wert("datum"),
      datum_bis: document.getElementById(`raum-edit-datumbis-${id}`)?.value || null,
      von: wert("von"),
      bis: wert("bis"),
      mieter_name: wert("mieter").trim(),
      mieter_kontakt: wert("kontakt").trim(),
      zweck: wert("zweck").trim(),
      notiz: wert("notiz").trim(),
    };
    try {
      const ergebnis = await raumVermietungSenden("vermietung_aktualisieren", daten);
      if (!ergebnis) return;
      raumBearbeitenId = null;
      await ladeDaten();
    } catch (fehler) {
      if (fehler.message !== "unauthorized") alert("Speichern fehlgeschlagen: " + fehler.message);
    }
  };
  // Löscht eine Vermietung bzw. nur diesen Termin einer Serie nach Rückfrage, ohne Mail
  window.raumVermietungLoeschen = async function(id) {
    const v = raumVermietungen.find((x) => x.id === id);
    const serie = v ? raumSerie(v) : [];
    const frage = serie.length > 1
      ? `Nur den Termin am ${raumDatumText(v.datum)} löschen? Die anderen ${serie.length - 1} Termine der Serie bleiben.\n(Ganze Serie: Eintrag antippen → „Ganze Serie löschen“.) Es geht keine Mail raus.`
      : `Vermietung${v ? " am " + raumDatumText(v.datum) : ""} löschen? Es geht keine Mail raus.`;
    if (!confirm(frage)) return;
    try {
      await api("vermietung_loeschen", { id });
      await ladeDaten();
    } catch (fehler) {
      alert("Löschen fehlgeschlagen: " + fehler.message);
    }
  };
  // Löscht nach Rückfrage alle Termine einer Vermietungsserie, ohne Mail
  window.raumSerieLoeschen = async function(id) {
    const v = raumVermietungen.find((x) => x.id === id);
    const serie = v ? raumSerie(v) : [];
    if (!confirm(`Alle ${serie.length} Termine dieser Serie löschen? Es geht keine Mail raus.`)) return;
    try {
      await api("vermietung_loeschen", { id, ganze_serie: true });
      raumBearbeitenId = null;
      await ladeDaten();
    } catch (fehler) {
      alert("Löschen fehlgeschlagen: " + fehler.message);
    }
  };
  // Verschickt die Mail zu einer Vermietung erneut und meldet das Ergebnis
  window.raumMailErneut = async function(id) {
    try {
      const ergebnis = await api("vermietung_mail_senden", { id });
      await ladeDaten();
      alert(raumMailErgebnisText(ergebnis.mail).replace(/^Gespeichert – aber /, ""));
    } catch (fehler) {
      alert("Mail fehlgeschlagen: " + fehler.message);
    }
  };

  document.getElementById("btn-raum-raum").addEventListener("click", async () => {
    const name = document.getElementById("raum-raum-name").value.trim();
    if (!name) return;
    try {
      await api("raum_hinzufuegen", { name, beschreibung: document.getElementById("raum-raum-beschreibung").value.trim(), bereich: aktiverBereich });
      document.getElementById("raum-raum-name").value = "";
      document.getElementById("raum-raum-beschreibung").value = "";
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  });
  // Bearbeiten eines Raums: seit Session 35 im Bearbeiten-Blatt (vorher zwei Abfragefenster)
  window.raumUmbenennen = function(id) {
    window.blattOeffnen("raum", id);
  };
  // Löscht einen Raum nach Rückfrage; Vermietungen bleiben ohne Raum erhalten
  window.raumLoeschen = async function(id) {
    const r = raeume.find((x) => x.id === id);
    if (!confirm(`Raum „${r ? r.name : ""}“ löschen? Vorhandene Vermietungen bleiben erhalten, stehen dann aber ohne Raum.`)) return;
    try {
      await api("raum_loeschen", { id });
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  };

  document.getElementById("btn-raum-empf").addEventListener("click", async () => {
    const email = document.getElementById("raum-empf-email").value.trim();
    if (!email) return;
    try {
      await api("raum_empfaenger_hinzufuegen", { email, name: document.getElementById("raum-empf-name").value.trim(), bereich: aktiverBereich });
      document.getElementById("raum-empf-email").value = "";
      document.getElementById("raum-empf-name").value = "";
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  });
  // Entfernt eine Adresse nach Rückfrage aus dem Raum-Mailverteiler
  window.raumEmpfaengerLoeschen = async function(id) {
    const e = raumMailEmpfaenger.find((x) => x.id === id);
    if (!confirm(`${e ? e.email : "Adresse"} aus dem Verteiler entfernen?`)) return;
    try {
      await api("raum_empfaenger_loeschen", { id });
      await ladeDaten();
    } catch (fehler) {
      alert(fehler.message);
    }
  };

  // ==========================================================
  // Finanzen-Modul: Fixkosten + Sonderausgaben
  // ==========================================================
  function finEuro(n) {
    return Number(n || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  }
  // Wandelt einen Wert (auch mit Komma) in eine Zahl um, ungültig oder leer ergibt 0
  function finZahl(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  ["fixkosten", "sonderausgaben", "buchungen", "uebersicht", "prognose"].forEach((t) => {
    document.getElementById("fintyp-" + t).addEventListener("click", () => {
      finTyp = t;
      document.getElementById("fintyp-fixkosten").classList.toggle("active", t === "fixkosten");
      document.getElementById("fintyp-sonderausgaben").classList.toggle("active", t === "sonderausgaben");
      document.getElementById("fintyp-buchungen").classList.toggle("active", t === "buchungen");
      document.getElementById("fintyp-uebersicht").classList.toggle("active", t === "uebersicht");
      document.getElementById("fintyp-prognose").classList.toggle("active", t === "prognose");
      document.getElementById("fin-fixkosten-bereich").classList.toggle("hidden", t !== "fixkosten");
      document.getElementById("fin-sonderausgaben-bereich").classList.toggle("hidden", t !== "sonderausgaben");
      document.getElementById("fin-buchungen-bereich").classList.toggle("hidden", t !== "buchungen");
      document.getElementById("fin-uebersicht-bereich").classList.toggle("hidden", t !== "uebersicht");
      document.getElementById("fin-prognose-bereich").classList.toggle("hidden", t !== "prognose");
      renderFinanzen();
    });
  });

  // Rendert den aktiven Finanzen-Reiter (Fixkosten, Sonderausgaben, Buchungen, Übersicht oder Prognose)
  function renderFinanzen() {
    if (finTyp === "fixkosten") renderFinFixkosten();
    else if (finTyp === "sonderausgaben") renderFinSonderausgaben();
    else if (finTyp === "buchungen") renderFinBuchungen();
    else if (finTyp === "prognose") renderFinPrognose();
    else renderFinUebersicht();
  }

  // Kommende Monate (seit Session 31): Die Tabelle gilt immer für das
  // laufende Jahr. Monate nach dem aktuellen sind Planwerte und farblich
  // abgesetzt; der aktuelle Monat ist hervorgehoben. Ein Planwert, der vom
  // Vormonat abweicht, ist als Anpassung markiert (↑/↓). Sobald beim
  // CSV-Import eine Buchung für den Monat kommt, ersetzt sie den Planwert.
  function finMonatArt(i) {
    const aktuell = new Date().getMonth();
    if (i === aktuell) return "aktuell";
    return i > aktuell ? "kommend" : "vergangen";
  }
  // Liefert die CSS-Klasse für aktuellen/kommenden Monat, leer bei vergangenen
  function finMonatKlasse(i) {
    const art = finMonatArt(i);
    return art === "vergangen" ? "" : `fin-m-${art}`;
  }
  // Farben inline (style.css bleibt unverändert), passend zur Bereichsfarbe.
  // basis = Hintergrund der Zeile (--panel, Summenzeile --bg)
  const FIN_ANPASSUNG_STIL = "color:var(--accent); font-weight:600;";
  function finMonatFarbe(art, basis = "var(--panel)") {
    if (art === "aktuell") return `color-mix(in srgb, var(--accent) 16%, ${basis})`;
    if (art === "kommend") return `color-mix(in srgb, var(--accent) 7%, ${basis})`;
    return "";
  }
  // Erzeugt das style-Attribut für eine Monatszelle aus Monatsfarbe und Zusatzstil
  function finMonatStil(i, basis, zusatz = "") {
    const farbe = finMonatFarbe(finMonatArt(i), basis);
    const stil = (farbe ? `background:${farbe};` : "") + zusatz;
    return stil ? ` style="${stil}"` : "";
  }

  // Erzeugt eine Fixkosten-Monatszelle; kommende Abweichungen zum Vormonat werden mit ↑/↓ markiert
  function fixkostenZelleHtml(f, i) {
    const m = FIN_MONATE[i];
    const wert = finZahl(f[m]);
    const klassen = [finMonatKlasse(i)];
    let titel = "";
    let pfeil = "";
    if (finMonatArt(i) === "kommend" && wert && i > 0) {
      const vorher = finZahl(f[FIN_MONATE[i - 1]]);
      if (vorher && Math.abs(wert - vorher) > 0.004) {
        klassen.push("fin-anpassung");
        pfeil = wert > vorher ? "↑ " : "↓ ";
        titel = ` title="Anpassung: vorher ${escapeAttr(finEuro(vorher))}"`;
      }
    }
    const k = klassen.filter(Boolean).join(" ");
    const stil = finMonatStil(i, "var(--panel)", pfeil ? FIN_ANPASSUNG_STIL : "");
    return `<td${k ? ` class="${k}"` : ""}${stil}${titel}>${wert ? pfeil + finEuro(wert) : "–"}</td>`;
  }

  // Erzeugt eine Fixkosten-Tabellenzeile, wahlweise als Bearbeiten-Zeile mit Eingabefeldern
  function fixkostenZeileHtml(f, istBearbeitet) {
    const summe = FIN_MONATE.reduce((s, m) => s + finZahl(f[m]), 0);
    if (istBearbeitet) {
      return `
        <tr data-fk-id="${f.id}">
          <td class="fin-bez">
            <input type="text" id="fk-bez-${f.id}" value="${escapeAttr(f.bezeichnung)}">
            <label class="fin-folge-check" style="display:flex; align-items:center; gap:0.35rem; margin-top:0.35rem; font-size:0.75rem; color:var(--ink-dim); white-space:normal; min-height:32px;"><input type="checkbox" id="fk-folge-${f.id}" checked style="width:1rem; height:1rem;"> Geänderten Betrag auch für die Folgemonate</label>
          </td>
          ${FIN_MONATE.map((m, i) => `<td class="${finMonatKlasse(i)}"${finMonatStil(i)}><input type="number" step="0.01" id="fk-${m}-${f.id}" value="${finZahl(f[m])}" aria-label="${FIN_MONATSNAMEN_KURZ[i]}"></td>`).join("")}
          <td>${finEuro(summe)}</td>
          <td>
            <button class="fin-loesch-btn" onclick="fixkostenSpeichern('${f.id}')" title="Speichern">✓</button>
            <button class="fin-loesch-btn" onclick="fixkostenBearbeitenAbbrechen()" title="Abbrechen" aria-label="Abbrechen">${ic("x")}</button>
          </td>
        </tr>`;
    }
    return `
      <tr data-fk-id="${f.id}">
        <td class="fin-bez" style="cursor:pointer;" onclick="fixkostenBearbeitenStart('${f.id}')">${escapeHtml(f.bezeichnung)}</td>
        ${FIN_MONATE.map((_m, i) => fixkostenZelleHtml(f, i)).join("")}
        <td><strong>${finEuro(summe)}</strong></td>
        <td><button class="fin-loesch-btn" onclick="fixkostenLoeschen('${f.id}')" title="Löschen" aria-label="Löschen">${ic("x")}</button></td>
      </tr>`;
  }

  // Erzeugt die Fixkosten-Tabelle eines Typs (Ausgabe/Einnahme) mit Monatssummen
  function fixkostenTabelleHtml(typ, titel) {
    const zeilen = fixkostenAktuell().filter((f) => f.typ === typ);
    const summenProMonat = FIN_MONATE.map((m) => zeilen.reduce((s, f) => s + finZahl(f[m]), 0));
    const summeGesamt = summenProMonat.reduce((s, x) => s + x, 0);
    return `
      <div class="fin-tabelle-wrap">
        <table class="fin-tabelle">
          <thead>
            <tr>
              <th class="fin-bez-th">${titel} ${new Date().getFullYear()}</th>
              ${FIN_MONATSNAMEN_KURZ.map((m, i) => `<th class="${finMonatKlasse(i)}"${finMonatStil(i, "var(--panel)", finMonatArt(i) === "aktuell" ? "color:var(--ink); font-weight:700;" : "")}${finMonatArt(i) === "aktuell" ? ' aria-current="date"' : ""}>${m}</th>`).join("")}
              <th>Summe</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${zeilen.length
              ? zeilen.map((f) => fixkostenZeileHtml(f, f.id === finBearbeitetesFixkosten)).join("")
              : `<tr><td class="fin-bez" colspan="15"><span class="empty-text">Noch keine Einträge.</span></td></tr>`}
            <tr class="fin-tabelle-summe">
              <td class="fin-bez">Summe ${titel}</td>
              ${summenProMonat.map((s, i) => `<td class="${finMonatKlasse(i)}"${finMonatStil(i, "var(--bg)")}>${finEuro(s)}</td>`).join("")}
              <td>${finEuro(summeGesamt)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  // Rendert den Fixkosten-Reiter mit beiden Tabellen, Legende, Neu-Formular und Aufräumen-Knopf
  function renderFinFixkosten() {
    const el = document.getElementById("fin-fixkosten-bereich");
    el.innerHTML = `
      ${fixkostenTabelleHtml("ausgabe", "Fixkosten")}
      ${fixkostenTabelleHtml("einnahme", "Feste Einnahmen")}
      <p class="notiz-meta" style="margin:-0.9rem 0 1.4rem; line-height:1.6;">
        <span style="display:inline-block; width:0.9rem; height:0.9rem; border-radius:3px; border:1px solid var(--border); vertical-align:-0.12rem; margin-right:0.2rem; background:${finMonatFarbe("aktuell")};"></span>aktueller Monat ·
        <span style="display:inline-block; width:0.9rem; height:0.9rem; border-radius:3px; border:1px solid var(--border); vertical-align:-0.12rem; margin-right:0.2rem; background:${finMonatFarbe("kommend")};"></span>kommende Monate (Planwerte) ·
        <span style="${FIN_ANPASSUNG_STIL}">↑ ↓</span> Anpassung zum Vormonat.<br>
        Neuer Beitrag: Zeile antippen, Betrag im Monat ändern, ✓ – gilt dann auch für die Folgemonate. Kommt die Buchung per CSV-Import, ersetzt der echte Betrag den Planwert.
      </p>

      <button class="link-btn" id="toggle-fixkosten-form">▸ Neue Position anlegen</button>
      <button class="link-btn" id="btn-fixkosten-aufraeumen" title="Doppelte Positionen zusammenführen und Monatswerte aus den Buchungen übernehmen">${ic("funkeln")}Doppelte zusammenführen &amp; Monate aktualisieren</button>
      <div class="row hidden fin-neu-form" id="fixkosten-form" style="margin-top:0.6rem;">
        <select id="neue-fk-typ">
          <option value="ausgabe">Ausgabe</option>
          <option value="einnahme">Einnahme</option>
        </select>
        <input type="text" id="neue-fk-bezeichnung" placeholder="Bezeichnung">
        <input type="number" step="0.01" id="neue-fk-betrag" placeholder="Betrag/Monat">
        <button class="btn-primary" id="btn-fixkosten-anlegen">Anlegen</button>
      </div>
    `;
    document.getElementById("toggle-fixkosten-form").addEventListener("click", () => {
      document.getElementById("fixkosten-form").classList.toggle("hidden");
    });
    document.getElementById("btn-fixkosten-anlegen").addEventListener("click", fixkostenHinzufuegen);
    document.getElementById("btn-fixkosten-aufraeumen").addEventListener("click", finFixkostenAufraeumen);
  }

  // Legt eine neue Fixkosten-Position mit gleichem Betrag für alle Monate an
  async function fixkostenHinzufuegen() {
    const bezeichnung = document.getElementById("neue-fk-bezeichnung").value.trim();
    if (!bezeichnung) return;
    const typ = document.getElementById("neue-fk-typ").value;
    const betrag = document.getElementById("neue-fk-betrag").value;
    const zahlung = {};
    FIN_MONATE.forEach((m) => { zahlung[m] = betrag; });
    await api("fixkosten_hinzufuegen", { bezeichnung, typ, ...zahlung, bereich: aktiverBereich });
    await ladeDaten();
    renderFinanzen();
  }

  // Öffnet die Bearbeiten-Zeile einer Fixkosten-Position
  window.fixkostenBearbeitenStart = function (id) {
    finBearbeitetesFixkosten = id;
    renderFinFixkosten();
  };
  // Bricht das Bearbeiten einer Fixkosten-Position ab
  window.fixkostenBearbeitenAbbrechen = function () {
    finBearbeitetesFixkosten = null;
    renderFinFixkosten();
  };
  // Speichert eine Fixkosten-Position; geänderte Beträge gelten optional auch für die Folgemonate
  window.fixkostenSpeichern = async function (id) {
    const bezeichnung = document.getElementById("fk-bez-" + id).value.trim();
    if (!bezeichnung) return;
    const zahlung = { id, bezeichnung };
    // Erkennungsschlüssel vor einer Umbenennung sichern (ältere Zeilen haben
    // ihn noch nicht) – sonst passt die Position nach dem Kürzen des Namens
    // nicht mehr zu ihren Buchungen. Kategorie unverändert mitschicken.
    const alt = fixkosten.find((f) => f.id === id);
    if (alt) {
      const schluessel = finFixSchluessel(alt);
      if (schluessel) zahlung.erkennung = schluessel;
      zahlung.kategorie = alt.kategorie || null;
    }
    const neu = FIN_MONATE.map((m) => finZahl(document.getElementById("fk-" + m + "-" + id).value));
    // Beitragsanpassung: ein geänderter aktueller/kommender Monat gilt auch
    // für die Folgemonate, die du nicht selbst geändert hast
    const folge = document.getElementById("fk-folge-" + id);
    if (alt && folge && folge.checked) {
      const vorher = FIN_MONATE.map((m) => finZahl(alt[m]));
      const geaendert = neu.map((w, i) => Math.abs(w - vorher[i]) > 0.004);
      const ab = new Date().getMonth();
      for (let i = ab; i < 12; i++) {
        if (!geaendert[i]) continue;
        for (let j = i + 1; j < 12 && !geaendert[j]; j++) neu[j] = neu[i];
      }
    }
    FIN_MONATE.forEach((m, i) => { zahlung[m] = neu[i]; });
    await api("fixkosten_aktualisieren", zahlung);
    finBearbeitetesFixkosten = null;
    await ladeDaten();
    renderFinanzen();
  };
  // Löscht eine Fixkosten-Position und rendert die Finanzen neu
  window.fixkostenLoeschen = async function (id) {
    await api("fixkosten_loeschen", { id });
    await ladeDaten();
    renderFinanzen();
  };

  // Erzeugt die Karte einer Sonderausgabe, wahlweise in der Bearbeiten-Ansicht
  function sonderausgabeKarteHtml(s) {
    const bearbeitet = s.id === finBearbeiteteSonderausgabe;
    if (bearbeitet) {
      return `
        <div class="fin-card">
          <div class="fin-card-info">
            <input type="text" id="sa-bez-${s.id}" value="${escapeAttr(s.bezeichnung)}" style="margin-bottom:0.4rem;">
            <div class="row" style="margin-bottom:0;">
              <input type="number" step="0.01" id="sa-betrag-${s.id}" value="${finZahl(s.betrag)}" placeholder="Betrag">
              <select id="sa-monat-${s.id}">
                <option value="">(kein Monat)</option>
                ${FIN_MONATSNAMEN_KURZ.map((m, i) => `<option value="${i + 1}" ${s.monat === i + 1 ? "selected" : ""}>${m}</option>`).join("")}
              </select>
              <input type="text" id="sa-notiz-${s.id}" value="${escapeAttr(s.notiz || "")}" placeholder="Notiz (optional)">
            </div>
          </div>
          <button class="fin-loesch-btn" onclick="sonderausgabeSpeichern('${s.id}')" title="Speichern">✓</button>
          <button class="fin-loesch-btn" onclick="sonderausgabeBearbeitenAbbrechen()" title="Abbrechen" aria-label="Abbrechen">${ic("x")}</button>
        </div>`;
    }
    const monatLabel = s.monat ? FIN_MONATSNAMEN_KURZ[s.monat - 1] + " " + s.jahr : String(s.jahr);
    return `
      <div class="fin-card">
        <div class="fin-card-info" style="cursor:pointer;" onclick="sonderausgabeBearbeitenStart('${s.id}')">
          <div class="fin-card-titel">${escapeHtml(s.bezeichnung)}</div>
          <div class="fin-card-meta">${monatLabel}${s.notiz ? " · " + escapeHtml(s.notiz) : ""}</div>
        </div>
        <div class="fin-betrag">${finEuro(s.betrag)}</div>
        <button class="fin-loesch-btn" onclick="sonderausgabeLoeschen('${s.id}')" title="Löschen" aria-label="Löschen">${ic("x")}</button>
      </div>`;
  }

  // Rendert die Sonderausgaben des laufenden Jahres mit Summe und Neu-Formular
  function renderFinSonderausgaben() {
    const el = document.getElementById("fin-sonderausgaben-bereich");
    const jahr = new Date().getFullYear();
    const zeilen = sonderausgabenAktuell().filter((s) => Number(s.jahr) === jahr);
    const summe = zeilen.reduce((s, x) => s + finZahl(x.betrag), 0);
    el.innerHTML = `
      <div class="fin-summary-row">
        <div class="fin-summary-item">
          <div class="fin-summary-label">Summe ${jahr}</div>
          <div class="fin-summary-value">${finEuro(summe)}</div>
        </div>
      </div>
      ${zeilen.length ? zeilen.map(sonderausgabeKarteHtml).join("") : '<p class="empty-text">Noch keine Sonderausgaben für dieses Jahr.</p>'}

      <button class="link-btn" id="toggle-sonderausgabe-form" style="margin-top:0.8rem;">▸ Neue Sonderausgabe anlegen</button>
      <div class="row hidden fin-neu-form" id="sonderausgabe-form" style="margin-top:0.6rem;">
        <input type="text" id="neue-sa-bezeichnung" placeholder="Bezeichnung">
        <input type="number" step="0.01" id="neue-sa-betrag" placeholder="Betrag">
        <select id="neue-sa-monat">
          <option value="">(kein Monat)</option>
          ${FIN_MONATSNAMEN_KURZ.map((m, i) => `<option value="${i + 1}">${m}</option>`).join("")}
        </select>
        <input type="text" id="neue-sa-notiz" placeholder="Notiz (optional)">
        <button class="btn-primary" id="btn-sonderausgabe-anlegen">Anlegen</button>
      </div>
    `;
    document.getElementById("toggle-sonderausgabe-form").addEventListener("click", () => {
      document.getElementById("sonderausgabe-form").classList.toggle("hidden");
    });
    document.getElementById("btn-sonderausgabe-anlegen").addEventListener("click", sonderausgabeHinzufuegen);
  }

  // Legt eine neue Sonderausgabe für das laufende Jahr an
  async function sonderausgabeHinzufuegen() {
    const bezeichnung = document.getElementById("neue-sa-bezeichnung").value.trim();
    if (!bezeichnung) return;
    const betrag = document.getElementById("neue-sa-betrag").value;
    const monat = document.getElementById("neue-sa-monat").value;
    const notiz = document.getElementById("neue-sa-notiz").value.trim();
    await api("sonderausgabe_hinzufuegen", { bezeichnung, betrag, monat, notiz, jahr: new Date().getFullYear(), bereich: aktiverBereich });
    await ladeDaten();
    renderFinanzen();
  }

  // Öffnet die Bearbeiten-Ansicht einer Sonderausgabe
  window.sonderausgabeBearbeitenStart = function (id) {
    finBearbeiteteSonderausgabe = id;
    renderFinSonderausgaben();
  };
  // Bricht das Bearbeiten einer Sonderausgabe ab
  window.sonderausgabeBearbeitenAbbrechen = function () {
    finBearbeiteteSonderausgabe = null;
    renderFinSonderausgaben();
  };
  // Speichert die bearbeitete Sonderausgabe und lädt die Daten neu
  window.sonderausgabeSpeichern = async function (id) {
    const s = sonderausgaben.find((x) => x.id === id);
    const bezeichnung = document.getElementById("sa-bez-" + id).value.trim();
    if (!bezeichnung) return;
    const betrag = document.getElementById("sa-betrag-" + id).value;
    const monat = document.getElementById("sa-monat-" + id).value;
    const notiz = document.getElementById("sa-notiz-" + id).value.trim();
    await api("sonderausgabe_aktualisieren", { id, bezeichnung, betrag, monat, notiz, jahr: s ? s.jahr : new Date().getFullYear() });
    finBearbeiteteSonderausgabe = null;
    await ladeDaten();
    renderFinanzen();
  };
  // Löscht eine Sonderausgabe und rendert die Finanzen neu
  window.sonderausgabeLoeschen = async function (id) {
    await api("sonderausgabe_loeschen", { id });
    await ladeDaten();
    renderFinanzen();
  };

  // ==========================================================
  // Finanzen-Modul: Buchungen (Schnellerfassung, Liste, CSV-Import)
  // ==========================================================
  const MONATSNAMEN_FIN = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  function heuteISOFin() {
    return heuteISO();
  }

  // Wählt Ausgabe/Einnahme für die Schnellerfassung und setzt die erste passende Kategorie
  window.buchungTypWaehlen = function (typ) {
    buchungTypAusgewaehlt = typ;
    buchungKategorieAusgewaehlt = (typ === "einnahme" ? FIN_KAT_EINNAHME : FIN_KAT_AUSGABE)[0];
    renderFinBuchungen();
  };
  // Wählt die Kategorie für die Schnellerfassung einer Buchung
  window.buchungKategorieWaehlen = function (kat) {
    buchungKategorieAusgewaehlt = kat;
    renderFinBuchungen();
  };
  // Blättert die Buchungsliste um delta Monate (mit Jahreswechsel)
  window.finBuchungMonatVerschieben = function (delta) {
    finBuchMonat += delta;
    if (finBuchMonat < 1) { finBuchMonat = 12; finBuchJahr--; }
    if (finBuchMonat > 12) { finBuchMonat = 1; finBuchJahr++; }
    renderFinBuchungen();
  };

  // Rendert den Buchungen-Reiter: Schnellerfassung, CSV-Import, Monatssummen und Buchungsliste
  function renderFinBuchungen() {
    const el = document.getElementById("fin-buchungen-bereich");
    const istAktuellerMonat = finBuchMonat === new Date().getMonth() + 1 && finBuchJahr === new Date().getFullYear();

    const buchungenMonat = buchungenAktuell()
      .filter((b) => {
        const [j, m] = (b.datum || "").split("-");
        return Number(j) === finBuchJahr && Number(m) === finBuchMonat;
      })
      .sort((a, b) => b.datum.localeCompare(a.datum));

    const summeAusgaben = buchungenMonat.filter((b) => b.typ !== "einnahme").reduce((s, b) => s + finZahl(b.betrag), 0);
    const summeEinnahmen = buchungenMonat.filter((b) => b.typ === "einnahme").reduce((s, b) => s + finZahl(b.betrag), 0);

    const listeHtml = buchungenMonat.length
      ? buchungenMonat.map((b) => {
          const istEinnahme = b.typ === "einnahme";
          if (b.id === finBearbeiteteBuchung) {
            return `
              <div class="fin-card" data-buchung-id="${b.id}">
                <div class="fin-card-info">
                  <div class="row" style="margin-bottom:0.4rem;">
                    <input type="date" id="edit-buchung-datum-${b.id}" value="${b.datum}">
                    <input type="number" step="0.01" id="edit-buchung-betrag-${b.id}" value="${finZahl(b.betrag)}">
                  </div>
                  <div class="row" style="margin-bottom:0;">
                    <select id="edit-buchung-typ-${b.id}">
                      <option value="ausgabe" ${!istEinnahme ? "selected" : ""}>Ausgabe</option>
                      <option value="einnahme" ${istEinnahme ? "selected" : ""}>Einnahme</option>
                    </select>
                    <input type="text" id="edit-buchung-kategorie-${b.id}" value="${escapeAttr(b.kategorie || "")}" placeholder="Kategorie">
                    <input type="text" id="edit-buchung-notiz-${b.id}" value="${escapeAttr(b.notiz || "")}" placeholder="Notiz">
                  </div>
                </div>
                <button class="fin-loesch-btn" onclick="buchungAktualisieren('${b.id}')" title="Speichern">✓</button>
                <button class="fin-loesch-btn" onclick="buchungBearbeitenAbbrechen()" title="Abbrechen" aria-label="Abbrechen">${ic("x")}</button>
              </div>`;
          }
          return `
            <div class="fin-card" data-buchung-id="${b.id}">
              <div class="fin-card-info" style="cursor:pointer;" onclick="buchungBearbeitenStart('${b.id}')">
                <div class="fin-card-titel">${escapeHtml(b.kategorie || "Sonstiges")}</div>
                <div class="fin-card-meta">${formatDatumKurz(b.datum)}${b.herkunft === "import" ? " · Import" : ""}</div>
                ${b.notiz ? `<div class="fin-buchung-notiz">${escapeHtml(b.notiz)}</div>` : ""}
              </div>
              <div class="fin-betrag ${istEinnahme ? "fin-betrag-einnahme" : ""}">${istEinnahme ? "+" : "−"}${finEuro(b.betrag)}</div>
              <button class="fin-loesch-btn" onclick="buchungLoeschen('${b.id}')" title="Löschen" aria-label="Löschen">${ic("x")}</button>
            </div>`;
        }).join("")
      : `<p class="empty-text">Keine Buchungen in ${MONATSNAMEN_FIN[finBuchMonat - 1]} ${finBuchJahr}.</p>`;

    const kategorien = buchungTypAusgewaehlt === "einnahme" ? FIN_KAT_EINNAHME : FIN_KAT_AUSGABE;

    el.innerHTML = `
      <div class="fin-quick-form">
        <div class="plan-typ-tabs">
          <button type="button" class="plan-typ-btn ${buchungTypAusgewaehlt === "ausgabe" ? "active" : ""}" onclick="buchungTypWaehlen('ausgabe')">Ausgabe</button>
          <button type="button" class="plan-typ-btn ${buchungTypAusgewaehlt === "einnahme" ? "active" : ""}" onclick="buchungTypWaehlen('einnahme')">Einnahme</button>
        </div>

        <input type="number" step="0.01" id="neue-buchung-betrag" class="fin-quick-betrag" placeholder="0,00 €" inputmode="decimal">

        <div class="fin-kat-grid">
          ${kategorien.map((k) => `
            <button type="button" class="fin-kat-btn ${k === buchungKategorieAusgewaehlt ? "active" : ""}"
              onclick="buchungKategorieWaehlen('${escapeAttr(k)}')">${escapeHtml(k)}</button>
          `).join("")}
        </div>

        <div class="row">
          <input type="date" id="neue-buchung-datum" value="${heuteISOFin()}">
          <input type="text" id="neue-buchung-notiz" placeholder="Notiz (optional)">
        </div>

        <button class="btn-primary fin-quick-save" id="btn-buchung-speichern">Speichern</button>
      </div>

      <button class="fin-csv-btn" id="btn-csv-import">${ic("import")}CSV importieren</button>
      <input type="file" id="csv-import-input" accept=".csv" class="hidden">

      ${finRegelnHtml()}

      <div class="fin-summary-row">
        <div class="fin-summary-item">
          <div class="fin-summary-label">Ausgaben</div>
          <div class="fin-summary-value">${finEuro(summeAusgaben)}</div>
        </div>
        <div class="fin-summary-item">
          <div class="fin-summary-label">Einnahmen</div>
          <div class="fin-summary-value">${finEuro(summeEinnahmen)}</div>
        </div>
      </div>

      <div class="cal-header">
        <div class="cal-nav"><button onclick="finBuchungMonatVerschieben(-1)" aria-label="Vormonat">${ic("zurueck")}</button></div>
        <h2>${MONATSNAMEN_FIN[finBuchMonat - 1]} ${finBuchJahr}${istAktuellerMonat ? " · aktuell" : ""}</h2>
        <div class="cal-nav"><button onclick="finBuchungMonatVerschieben(1)" aria-label="Nächster Monat">${ic("weiter")}</button></div>
      </div>

      ${listeHtml}
    `;

    document.getElementById("btn-buchung-speichern").addEventListener("click",
      finBearbeiteteBuchung ? () => buchungAktualisieren(finBearbeiteteBuchung) : buchungHinzufuegen);

    const regelBlock = document.getElementById("fin-regeln");
    if (regelBlock) regelBlock.addEventListener("toggle", () => { finRegelnOffen = regelBlock.open; });

    document.getElementById("btn-csv-import").addEventListener("click", () => {
      document.getElementById("csv-import-input").click();
    });
    document.getElementById("csv-import-input").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const btn = document.getElementById("btn-csv-import");
      btn.textContent = "Importiere …";
      btn.disabled = true;
      try {
        await csvImportieren(file);
      } catch (err) {
        console.error(err);
        alert("Import fehlgeschlagen: " + (err.message || err));
      } finally {
        btn.innerHTML = `${ic("import")}CSV importieren`;
        btn.disabled = false;
      }
    });
  }

  // Speichert eine neue Buchung aus der Schnellerfassung (Betrag muss > 0 sein)
  async function buchungHinzufuegen() {
    const betragFeld = document.getElementById("neue-buchung-betrag");
    const betrag = betragFeld.value;
    if (!betrag || finZahl(betrag) <= 0) { betragFeld.focus(); return; }
    const datum = document.getElementById("neue-buchung-datum").value || heuteISOFin();
    const notiz = document.getElementById("neue-buchung-notiz").value.trim();
    await api("buchung_hinzufuegen", {
      datum, betrag, notiz,
      typ: buchungTypAusgewaehlt,
      kategorie: buchungKategorieAusgewaehlt,
      bereich: aktiverBereich,
    });
    await ladeDaten();
    renderFinanzen();
  }

  // Öffnet die Bearbeiten-Ansicht einer Buchung
  window.buchungBearbeitenStart = function (id) {
    finBearbeiteteBuchung = id;
    renderFinBuchungen();
  };
  // Bricht das Bearbeiten einer Buchung ab
  window.buchungBearbeitenAbbrechen = function () {
    finBearbeiteteBuchung = null;
    renderFinBuchungen();
  };
  // Speichert die bearbeitete Buchung und lädt die Daten neu
  window.buchungAktualisieren = async function (id) {
    const datum = document.getElementById("edit-buchung-datum-" + id).value;
    const betrag = document.getElementById("edit-buchung-betrag-" + id).value;
    const typ = document.getElementById("edit-buchung-typ-" + id).value;
    const kategorie = document.getElementById("edit-buchung-kategorie-" + id).value.trim();
    const notiz = document.getElementById("edit-buchung-notiz-" + id).value.trim();
    const vorher = buchungen.find((b) => String(b.id) === String(id));
    await api("buchung_aktualisieren", { id, datum, betrag, typ, kategorie, notiz });
    finBearbeiteteBuchung = null;
    await ladeDaten();
    renderFinanzen();
    // Kategorie geändert? Dann anbieten, das als Regel für diesen Empfänger zu merken (seit Session 36)
    const muster = finEmpfSchluessel(notiz);
    const regel = kategorieRegeln !== null && muster.length >= 2 && finRegelFuer(notiz, typ === "einnahme" ? "einnahme" : "ausgabe", kategorieRegelnAktuell());
    if (kategorieRegeln !== null && vorher && kategorie && kategorie !== (vorher.kategorie || "") && muster.length >= 2 && !(regel && regel.kategorie === kategorie)) {
      hinweisZeigen(`Kategorie „${kategorie}“ gespeichert`, () => window.finRegelNeu({ muster, typ, kategorie }), "Als Regel merken");
    }
  };
  // Löscht eine Buchung und rendert die Finanzen neu
  window.buchungLoeschen = async function (id) {
    await api("buchung_loeschen", { id });
    await ladeDaten();
    renderFinanzen();
  };

  // ---- CSV-Import ----
  function findeSpalte(header, aliase) {
    for (const alias of aliase) {
      const idx = header.findIndex((h) => h.trim().toLowerCase() === alias.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  }

  // Zerlegt CSV-Text in Kopfzeile und Zeilen; Trennzeichen (; oder ,) wird automatisch erkannt
  function parseCsvText(text) {
    const erstenZeilen = text.split(/\r?\n/).slice(0, 5).join("\n");
    const anzahlSemikolon = (erstenZeilen.match(/;/g) || []).length;
    const anzahlKomma = (erstenZeilen.match(/,/g) || []).length;
    const trenner = anzahlSemikolon >= anzahlKomma ? ";" : ",";

    const zeilen = text.split(/\r?\n/).filter((z) => z.trim().length > 0);
    const parseZeile = (z) => z.split(trenner).map((f) => f.trim().replace(/^"|"$/g, ""));

    const header = parseZeile(zeilen[0]);
    const rows = zeilen.slice(1).map(parseZeile);
    return { header, rows };
  }

  // Wandelt einen CSV-Betrag (deutsches oder englisches Format) in eine Zahl um, sonst null
  function parseCsvBetrag(raw) {
    let s = (raw || "").trim();
    if (!s) return null;
    if (s.includes(".") && s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (s.includes(",")) s = s.replace(",", ".");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  // Wandelt ein CSV-Datum (TT.MM.JJJJ, TT.MM.JJ, JJJJ-MM-TT, TT/MM/JJJJ) in ISO um, sonst null
  function parseCsvDatum(raw) {
    const s = (raw || "").trim();
    let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
    if (m) return `20${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return null;
  }

  // Liest eine CSV-Datei als Text: UTF-8 (BOM entfernt), sonst Fallback auf Windows-1252
  function liesCsvDatei(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
      reader.onload = () => {
        const buffer = reader.result;
        const bytes = new Uint8Array(buffer);
        // UTF-8-BOM prüfen
        const hatBom = bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
        try {
          const utf8Text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
          resolve(hatBom ? utf8Text.slice(1) : utf8Text);
        } catch {
          // Kein gültiges UTF-8 -> vermutlich Windows-1252 (typisch für Bank-Exporte)
          resolve(new TextDecoder("windows-1252").decode(buffer));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Importiert Bank-CSV als Buchungen, gleicht Fixkosten-Monate ab und schlägt wiederkehrende Posten vor
  async function csvImportieren(file) {
    const text = await liesCsvDatei(file);
    const { header, rows } = parseCsvText(text);

    const idxDatum = findeSpalte(header, CSV_DATUM_SPALTEN);
    const idxBetrag = findeSpalte(header, CSV_BETRAG_SPALTEN);
    const idxPartner = findeSpalte(header, CSV_PARTNER_SPALTEN);
    const idxZweck = findeSpalte(header, CSV_ZWECK_SPALTEN);

    if (idxDatum === -1 || idxBetrag === -1) {
      alert("Datum- oder Betrag-Spalte wurde in der CSV nicht gefunden.\n\nGefundene Spalten: " + header.join(", "));
      return;
    }

    const zeilen = [];
    let nichtLesbar = 0;
    for (const r of rows) {
      const datum = parseCsvDatum(r[idxDatum]);
      const betrag = parseCsvBetrag(r[idxBetrag]);
      if (!datum || betrag === null || betrag === 0) { nichtLesbar++; continue; }
      const partner = idxPartner !== -1 ? (r[idxPartner] || "").trim() : "";
      const zweck = idxZweck !== -1 ? (r[idxZweck] || "").trim() : "";
      const notiz = `${partner} ${zweck}`.trim().slice(0, 200);
      zeilen.push({ datum, betrag, notiz });
    }

    if (!zeilen.length) {
      alert("Keine verwertbaren Buchungen in der Datei gefunden.");
      return;
    }

    const ergebnis = await api("buchungen_batch_import", { zeilen, bereich: aktiverBereich });

    // Seit Session 27 übernimmt der Import jede Kontozeile als Buchung – auch
    // solche, die zu einer Fixkosten-Position passen. Die Übersicht rechnet
    // nur mit Buchungen; eine übersprungene Zeile fehlte dort sonst.
    // Fixkosten-Treffer sind nur noch eine Info. Ein älteres Backend meldet
    // noch „uebersprungen_fixkosten“ – dann steht das ehrlich so da.
    const alteUebersprungen = Number(ergebnis.uebersprungen_fixkosten) || 0;
    const fixErkannt = Number(ergebnis.fixkosten_erkannt) || 0;
    let meldung = "Import abgeschlossen\n\n" +
      `Neue Ausgaben: ${ergebnis.importiert_ausgaben}\n` +
      `Neue Einnahmen: ${ergebnis.importiert_einnahmen}\n` +
      `Bereits vorhanden (Duplikate): ${ergebnis.uebersprungen_duplikate}\n` +
      (fixErkannt ? `Davon passend zu Fixkosten (trotzdem übernommen): ${fixErkannt}\n` : "") +
      (Number(ergebnis.nach_regel) ? `Kategorie aus deinen Regeln: ${ergebnis.nach_regel}\n` : "") +
      (alteUebersprungen ? `Als Fixkosten übersprungen: ${alteUebersprungen} – bitte index.ts (Edge Function) aktualisieren!\n` : "") +
      (nichtLesbar ? `Nicht lesbare Zeilen: ${nichtLesbar}\n` : "");

    const treffer = Object.entries(ergebnis.fixkosten_treffer || {});
    if (treffer.length) {
      treffer.sort((a, b) => b[1] - a[1]);
      meldung += "\nPassende Fixkosten (Beispiele):\n" + treffer.slice(0, 8).map(([k, v]) => `  ${k}: ${v}x`).join("\n");
    }

    await ladeDaten();

    // Seit Session 29: vorhandene Fixkosten-Positionen bekommen die Beträge
    // der neu gebuchten Monate (laufendes Jahr) eingetragen, statt dass die
    // Erkennung dafür neue Zeilen vorschlägt. Löscht nichts – doppelte Zeilen
    // legt der Knopf im Reiter Fixkosten zusammen.
    try {
      const plan = finFixAbgleichPlanen({ zusammenfuehren: false });
      if (plan.aenderungen.length) {
        await api("fixkosten_abgleich", { aenderungen: plan.aenderungen, loeschen: [], bereich: aktiverBereich });
        await ladeDaten();
        if (plan.monateAktualisiert) {
          meldung += `\n\nFixkosten: Monatswerte ${plan.jahr} bei ${plan.monateAktualisiert} Position(en) aus den Buchungen aktualisiert.`;
        }
      }
    } catch (fehler) {
      meldung += `\n\nFixkosten-Monate konnten nicht aktualisiert werden: ${fehler.message}`;
    }
    alert(meldung);

    const kandidaten = erkennKandidatenFin(buchungenAktuell(), fixkostenAktuell());
    if (kandidaten.length) {
      zeigeErkennungsModal(kandidaten);
    } else {
      renderFinanzen();
    }
  }

  // ---- Wiederkehrend-Erkennung (portiert aus erkennung.py) ----
  const FIN_NOISE_WORDS = [
    "KARTENZAHLUNG", "LASTSCHRIFT", "UEBERWEISUNG", "ÜBERWEISUNG",
    "GUTSCHRIFT", "DAUERAUFTRAG", "ECHTZEITUEBERWEISUNG", "SEPA",
  ];

  // Bildet aus einem Buchungstext einen Schlüssel: ohne Füllwörter/Zahlen, max. 4 Wörter
  function finNormalizeKey(notiz) {
    let text = (notiz || "").toUpperCase();
    FIN_NOISE_WORDS.forEach((w) => { text = text.split(w).join(" "); });
    text = text.replace(/[0-9]+/g, " ");
    text = text.replace(/[^A-ZÄÖÜẞ\s]/g, " ");
    text = text.replace(/\s+/g, " ").trim();
    return text.split(" ").filter(Boolean).slice(0, 4).join(" ");
  }

  // ---- Kategorie-Regeln (seit Session 36) ----
  // Text für den Regel-Vergleich – identisch zu regelText in index.ts:
  // Großbuchstaben, ohne Füllwörter, Zahlen und Satzzeichen
  function finRegelText(notiz) {
    let text = String(notiz || "").toUpperCase();
    FIN_NOISE_WORDS.forEach((w) => { text = text.split(w).join(" "); });
    return text.replace(/[0-9]+/g, " ").replace(/[^A-ZÄÖÜẞ\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  // Empfänger-Schlüssel wie in der Prognose (3 Wörter, empfaengerSchluessel in index.ts)
  function finEmpfSchluessel(notiz) {
    return finRegelText(notiz).split(" ").filter(Boolean).slice(0, 3).join(" ");
  }
  // Passende Regel: Muster beginnt an einer Wortgrenze, das längste gewinnt (wie regelFuer in index.ts)
  function finRegelFuer(notiz, typ, regeln) {
    const text = " " + finRegelText(notiz) + " ";
    let beste = null;
    for (const r of regeln) {
      if (r.typ !== typ || !r.muster) continue;
      if (text.includes(" " + r.muster) && (!beste || r.muster.length > beste.muster.length)) beste = r;
    }
    return beste;
  }
  function kategorieRegelnAktuell() {
    return (kategorieRegeln || []).filter((r) => bereichVon(r) === aktiverBereich);
  }
  function finBuchungTyp(b) {
    return b.typ === "einnahme" ? "einnahme" : "ausgabe";
  }

  // Wie viele Buchungen eine (neue oder geänderte) Regel träfe – für die Vorschau im Blatt
  function finRegelTreffer(w) {
    const muster = finRegelText(w.muster);
    if (muster.length < 2) return null;
    const neu = { id: blatt && blatt.id, typ: w.typ, muster, kategorie: String(w.kategorie || "").trim() };
    const regeln = kategorieRegelnAktuell()
      .filter((r) => String(r.id) !== String(neu.id) && !(r.typ === neu.typ && r.muster === neu.muster))
      .concat([neu]);
    const ergebnis = { treffer: 0, aendern: 0, bisher: new Map(), beispiele: [] };
    for (const b of buchungenAktuell()) {
      if (finRegelFuer(b.notiz, finBuchungTyp(b), regeln) !== neu) continue;
      ergebnis.treffer++;
      const kat = b.kategorie || "Sonstiges";
      if (kat !== neu.kategorie) {
        ergebnis.aendern++;
        ergebnis.bisher.set(kat, (ergebnis.bisher.get(kat) || 0) + 1);
      }
      const text = String(b.notiz || "").trim();
      if (text && ergebnis.beispiele.length < 3 && !ergebnis.beispiele.includes(text)) ergebnis.beispiele.push(text);
    }
    return ergebnis;
  }

  function finRegelVorschauHtml(w) {
    const t = finRegelTreffer(w);
    if (!t) return `<p class="blatt-hinweis">Mindestens 2 Buchstaben eingeben.</p>`;
    if (!t.treffer) return `<p class="blatt-hinweis">Passt zu keiner vorhandenen Buchung – greift beim nächsten CSV-Import.</p>`;
    const bisher = [...t.bisher.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([k, n]) => `${n}× ${escapeHtml(k)}`).join(", ");
    let satz = `<strong>${t.treffer} ${t.treffer === 1 ? "Buchung" : "Buchungen"}</strong>`;
    if (!t.aendern) satz += t.treffer === 1 ? ", schon in dieser Kategorie" : ", alle schon in dieser Kategorie";
    else {
      satz += `, davon ${t.aendern} bisher anders (${bisher})`;
      satz += w.rueckwirkend === "ja" ? " – werden geändert" : " – bleiben so";
    }
    const kurz = (s) => (s.length > 70 ? s.slice(0, 69) + "…" : s);
    return `<p class="fin-regel-vorschau">${satz}.</p>
      <ul class="fin-regel-beispiele">${t.beispiele.map((b) => `<li>${escapeHtml(kurz(b))}</li>`).join("")}</ul>`;
  }

  // Vorschläge für das Kategorie-Feld: Standardliste, schon benutzte und Regel-Kategorien
  function finKategorieListeFuellen(typ) {
    const liste = document.getElementById("fin-kategorie-liste");
    if (!liste) return;
    const kats = new Set(typ === "einnahme" ? FIN_KAT_EINNAHME : FIN_KAT_AUSGABE);
    buchungenAktuell().forEach((b) => { if (finBuchungTyp(b) === typ && b.kategorie) kats.add(b.kategorie); });
    kategorieRegelnAktuell().forEach((r) => { if (r.typ === typ) kats.add(r.kategorie); });
    liste.innerHTML = [...kats].sort((a, b) => a.localeCompare(b, "de"))
      .map((k) => `<option value="${escapeAttr(k)}"></option>`).join("");
  }

  // Neue Regel – gibt es für den Suchtext schon eine, öffnet sie stattdessen
  window.finRegelNeu = function(vorlage = {}) {
    if (kategorieRegeln === null) {
      alert("Für Kategorie-Regeln bitte zuerst kategorie_regeln_setup.sql in Supabase ausführen und die neue index.ts einspielen.");
      return;
    }
    const typ = vorlage.typ === "einnahme" ? "einnahme" : "ausgabe";
    const muster = finRegelText(vorlage.muster);
    const vorhanden = muster && kategorieRegelnAktuell().find((r) => r.typ === typ && r.muster === muster);
    if (vorhanden) { window.blattOeffnen("katregel", vorhanden.id); return; }
    window.blattNeu("katregel", { muster, typ, kategorie: vorlage.kategorie || "" });
  };
  // Stift an einem Empfänger in „Wo geht das Geld hin?“
  window.finRegelAusPrognose = function(knopf) {
    const kat = knopf.dataset.kategorie || "";
    window.finRegelNeu({ muster: knopf.dataset.muster, typ: "ausgabe", kategorie: kat === "Sonstiges" ? "" : kat });
  };

  window.finRegelLoeschen = async function(id) {
    const r = (kategorieRegeln || []).find((x) => String(x.id) === String(id));
    if (!r || !confirm(BLATT_ARTEN.katregel.loeschFrage(r))) return;
    await api("kategorie_regel_loeschen", { id });
    hinweisZeigen("Regel gelöscht");
    await ladeDaten();
    finNachRegelAenderung();
  };

  // Alle Regeln auf die vorhandenen Buchungen des Bereichs anwenden
  window.finRegelnAnwenden = async function() {
    const regeln = kategorieRegelnAktuell();
    const n = buchungenAktuell().filter((b) => {
      const r = finRegelFuer(b.notiz, finBuchungTyp(b), regeln);
      return r && (b.kategorie || "") !== r.kategorie;
    }).length;
    if (!n) { hinweisZeigen("Alle Buchungen passen schon zu ihren Regeln"); return; }
    if (!confirm(`${n} ${n === 1 ? "Buchung bekommt" : "Buchungen bekommen"} die Kategorie ihrer Regel. Fortfahren?`)) return;
    const erg = await api("kategorie_regeln_anwenden", { bereich: aktiverBereich });
    hinweisZeigen(`${erg.geaendert || 0} ${erg.geaendert === 1 ? "Buchung" : "Buchungen"} geändert`);
    await ladeDaten();
    finNachRegelAenderung();
  };

  // Nach Änderungen an Regeln: offene Finanz-Ansicht neu zeichnen (Prognose mit frischen Summen)
  function finNachRegelAenderung() {
    if (aktiverTab !== "finanzen") return;
    if (finTyp === "prognose") renderFinPrognose(true);
    else renderFinanzen();
  }

  // Block „Kategorie-Regeln“ im Reiter Buchungen
  function finRegelnHtml() {
    if (kategorieRegeln === null) {
      return `<details class="anleitung-abschnitt fin-regeln" id="fin-regeln"${finRegelnOffen ? " open" : ""}>
        <summary>Kategorie-Regeln</summary>
        <div class="anleitung-text"><p class="empty-text" style="margin:0;">Für Kategorie-Regeln bitte zuerst <code>kategorie_regeln_setup.sql</code> in Supabase ausführen und die neue <code>index.ts</code> einspielen.</p></div>
      </details>`;
    }
    const regeln = kategorieRegelnAktuell();
    const zaehler = new Map(regeln.map((r) => [r, { treffer: 0, anders: 0 }]));
    buchungenAktuell().forEach((b) => {
      const r = finRegelFuer(b.notiz, finBuchungTyp(b), regeln);
      if (!r) return;
      const z = zaehler.get(r);
      z.treffer++;
      if ((b.kategorie || "") !== r.kategorie) z.anders++;
    });
    const sortiert = [...regeln].sort((a, b) => a.kategorie.localeCompare(b.kategorie, "de") || a.muster.localeCompare(b.muster, "de"));
    const anders = [...zaehler.values()].reduce((s, z) => s + z.anders, 0);
    const zeilen = sortiert.map((r) => {
      const z = zaehler.get(r);
      const meta = `${r.typ === "einnahme" ? "Einnahmen" : "Ausgaben"} · ${z.treffer ? `passt zu ${z.treffer} ${z.treffer === 1 ? "Buchung" : "Buchungen"}` : "noch kein Treffer"}` +
        (z.anders ? ` · ${z.anders} noch anders` : "");
      return `
        <div class="fin-regel">
          <button type="button" class="fin-regel-info" onclick="blattOeffnen('katregel','${escapeAttr(String(r.id))}')">
            <span class="fin-regel-zeile"><span class="fin-regel-muster">${escapeHtml(finNameAusSchluessel(r.muster))}</span>
              <span class="fin-regel-pfeil" aria-hidden="true">→</span> <strong>${escapeHtml(r.kategorie)}</strong></span>
            <span class="notiz-meta">${meta}</span>
          </button>
          <button type="button" class="fin-loesch-btn" onclick="finRegelLoeschen('${escapeAttr(String(r.id))}')" title="Regel löschen" aria-label="Regel löschen">${ic("x")}</button>
        </div>`;
    }).join("");
    return `
      <details class="anleitung-abschnitt fin-regeln" id="fin-regeln"${finRegelnOffen ? " open" : ""}>
        <summary>Kategorie-Regeln${regeln.length ? ` (${regeln.length})` : ""}</summary>
        <div class="anleitung-text">
          <p class="notiz-meta" style="margin-top:0;">Beginnt ein Buchungstext mit dem Suchtext, bekommt die Buchung beim CSV-Import diese Kategorie – vor der automatischen Schätzung. Passen mehrere Regeln, gilt die genaueste.</p>
          ${zeilen ? `<div class="fin-regel-liste">${zeilen}</div>` : `<p class="empty-text">Noch keine Regeln. Tipp: In der Prognose unter „Wo geht das Geld hin?“ legt der Stift an einem Empfänger direkt eine Regel an.</p>`}
          <div class="row fin-regel-knoepfe">
            <button type="button" class="btn-secondary" onclick="finRegelNeu()">${ic("plus")}Neue Regel</button>
            ${anders ? `<button type="button" class="btn-secondary" onclick="finRegelnAnwenden()">${ic("wiederholen")}Auf ${anders} bisherige ${anders === 1 ? "Buchung" : "Buchungen"} anwenden</button>` : ""}
          </div>
        </div>
      </details>`;
  }

  // Berechnet den Median einer Zahlenliste
  function finMedian(zahlen) {
    const sortiert = [...zahlen].sort((a, b) => a - b);
    const mitte = Math.floor(sortiert.length / 2);
    return sortiert.length % 2 !== 0 ? sortiert[mitte] : (sortiert[mitte - 1] + sortiert[mitte]) / 2;
  }

  // Stichwörter wie im Backend (index.ts, fixkostenStichwoerter): Bezeichnung
  // bis zur ersten Klammer, ab 4 Zeichen, in Großbuchstaben.
  function finFixkostenStichwoerter(fixkostenListe) {
    return (fixkostenListe || [])
      .map((f) => (f.bezeichnung || "").split("(")[0].trim().toUpperCase())
      .filter((w) => w.length >= 4);
  }

  // ---- Fester Erkennungsschlüssel je Fixkosten-Position (seit Session 29) ----
  // Schlüssel = bereinigter Kern des Buchungstexts (finNormalizeKey: ohne
  // Zahlen, Datum, Referenzen, max. 4 Wörter). Gespeichert in der Spalte
  // fixkosten.erkennung; bei älteren Zeilen aus der Bezeichnung abgeleitet.
  // Bis Session 28 war die Bezeichnung der komplette Kontotext mit Monat und
  // Referenz („… 08/2026 EREF …“) – im Folgemonat passte sie nicht mehr, und
  // die Erkennung legte für dieselben Kosten jedes Mal eine neue Zeile an.
  function finFixSchluessel(f) {
    return String(f.erkennung || "").trim() || finNormalizeKey(f.bezeichnung);
  }

  // Macht aus einem Erkennungsschlüssel einen lesbaren Namen (Wörter großgeschrieben)
  function finNameAusSchluessel(schluessel) {
    return String(schluessel || "").toLowerCase().split(" ").filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  // Ist-Beträge je Monat aus den Buchungen eines Jahres, je typ|Schlüssel
  function finIstMonate(alleBuchungen, jahr) {
    const ergebnis = new Map();
    for (const b of alleBuchungen) {
      const datum = String(b.datum || "");
      if (Number(datum.slice(0, 4)) !== jahr) continue;
      const monat = Number(datum.slice(5, 7));
      if (!(monat >= 1 && monat <= 12)) continue;
      const schluessel = finNormalizeKey(b.notiz);
      if (!schluessel) continue;
      const key = (b.typ || "ausgabe") + "|" + schluessel;
      if (!ergebnis.has(key)) ergebnis.set(key, new Array(12).fill(0));
      ergebnis.get(key)[monat - 1] += finZahl(b.betrag);
    }
    for (const werte of ergebnis.values()) {
      for (let i = 0; i < 12; i++) werte[i] = Math.round(werte[i] * 100) / 100;
    }
    return ergebnis;
  }

  // Plant den Abgleich der Fixkosten des aktiven Bereichs:
  // - zusammenfuehren: Zeilen mit gleichem Typ und Schlüssel werden zu einer
  //   (die mit der kürzesten Bezeichnung bleibt, meist die von Hand gekürzte)
  // - Monatswerte: Gibt es für den Schlüssel Buchungen im laufenden Jahr,
  //   stehen danach die gebuchten Monate drin, vergangene ohne Buchung auf 0,
  //   kommende behalten ihren Planwert (finMonateMitPlan, seit Session 31).
  //   Ohne Buchungen im Jahr bleiben die Werte unverändert (z. B. von Hand
  //   angelegte Planwerte)
  // - fehlt erkennung, wird der Schlüssel gespeichert – dann darf die
  //   Bezeichnung danach frei gekürzt werden
  // Monatswerte einer Position aus Ist (Buchungen) und Plan (seit Session 31):
  // - gebuchter Monat: Ist-Betrag (überschreibt einen Planwert, z. B. eine
  //   eingetragene Beitragsanpassung, sobald die echte Buchung da ist)
  // - vergangener Monat ohne Buchung: 0
  // - aktueller oder kommender Monat ohne Buchung: Planwert bleibt. Ist er
  //   leer und wurde die Position in den letzten beiden Monaten jeweils
  //   gebucht (monatlich, zuletzt im Vor- oder aktuellen Monat), wird der
  //   zuletzt gebuchte Betrag vorgemerkt. Jährliche oder vierteljährliche
  //   Zahlungen werden so nicht hochgerechnet.
  function finMonateMitPlan(istWerte, planWerte, aktuellerMonat) {
    let zuletzt = -1;
    for (let i = 11; i >= 0; i--) { if (istWerte[i]) { zuletzt = i; break; } }
    const monatlich = zuletzt >= 1 && zuletzt >= aktuellerMonat - 1 && !!istWerte[zuletzt - 1];
    return istWerte.map((w, i) => {
      if (w) return w;
      if (i < aktuellerMonat) return 0;
      const plan = finZahl(planWerte[i]);
      if (plan) return plan;
      return monatlich && i > zuletzt ? istWerte[zuletzt] : 0;
    });
  }

  // Plant den Fixkosten-Abgleich: Duplikate zusammenführen, Monatswerte aus Buchungen, Schlüssel, Kurznamen
  function finFixAbgleichPlanen({ zusammenfuehren }) {
    const jahr = new Date().getFullYear();
    const aktuellerMonat = new Date().getMonth();
    const ist = finIstMonate(buchungenAktuell(), jahr);
    const einheiten = [];
    const gruppen = new Map();
    for (const f of fixkostenAktuell()) {
      const schluessel = finFixSchluessel(f);
      if (!schluessel || !zusammenfuehren) {
        einheiten.push({ schluessel, zeilen: [f] });
        continue;
      }
      const key = f.typ + "|" + schluessel;
      if (!gruppen.has(key)) {
        const einheit = { schluessel, zeilen: [] };
        gruppen.set(key, einheit);
        einheiten.push(einheit);
      }
      gruppen.get(key).zeilen.push(f);
    }

    const aenderungen = [];
    const loeschen = [];
    const zusammengelegt = [];
    const umbenannt = [];
    let monateAktualisiert = 0;
    for (const { schluessel, zeilen } of einheiten) {
      const behalten = zeilen.length > 1
        ? [...zeilen].sort((a, b) => (a.bezeichnung || "").length - (b.bezeichnung || "").length)[0]
        : zeilen[0];
      const vorher = FIN_MONATE.map((m) => finZahl(behalten[m]));
      let monate = zeilen.length > 1
        ? FIN_MONATE.map((m) => Math.max(...zeilen.map((z) => finZahl(z[m]))))
        : vorher.slice();
      if (zeilen.length > 1) {
        zeilen.filter((z) => z.id !== behalten.id).forEach((z) => loeschen.push(z.id));
        zusammengelegt.push({ bezeichnung: behalten.bezeichnung, anzahl: zeilen.length });
      }
      const istWerte = schluessel ? ist.get(behalten.typ + "|" + schluessel) : null;
      if (istWerte) monate = finMonateMitPlan(istWerte, monate, aktuellerMonat);
      const monateGeaendert = monate.some((w, i) => Math.abs(w - vorher[i]) > 0.004);
      if (istWerte && monateGeaendert) monateAktualisiert++;
      const erkennungFehlt = !!schluessel && String(behalten.erkennung || "").trim() !== schluessel;
      const umbenennen = zusammenfuehren && !!schluessel && /\d/.test(behalten.bezeichnung || "");
      if (!monateGeaendert && !erkennungFehlt && !umbenennen && zeilen.length === 1) continue;
      const aenderung = { id: behalten.id };
      if (schluessel) aenderung.erkennung = schluessel;
      FIN_MONATE.forEach((m, i) => { aenderung[m] = monate[i]; });
      // Beim Aufräumen: Rohtext vom Konto („… 08/2026 EREF …“) durch einen
      // kurzen Namen ersetzen. Von Hand vergebene Namen (ohne Ziffern)
      // bleiben unangetastet.
      if (umbenennen) {
        aenderung.bezeichnung = finNameAusSchluessel(schluessel).slice(0, 60);
        umbenannt.push({ alt: behalten.bezeichnung, neu: aenderung.bezeichnung });
      }
      aenderungen.push(aenderung);
    }
    return { jahr, aenderungen, loeschen, zusammengelegt, monateAktualisiert, umbenannt };
  }

  // Führt doppelte Fixkosten zusammen und aktualisiert Monatswerte nach Rückfrage über fixkosten_abgleich
  async function finFixkostenAufraeumen() {
    const plan = finFixAbgleichPlanen({ zusammenfuehren: true });
    if (!plan.zusammengelegt.length && !plan.monateAktualisiert && !plan.umbenannt.length) {
      try {
        if (plan.aenderungen.length) {
          // Nur Erkennungsschlüssel nachtragen, sichtbar ändert sich nichts
          await api("fixkosten_abgleich", { aenderungen: plan.aenderungen, loeschen: [], bereich: aktiverBereich });
          await ladeDaten();
        }
        alert("Alles aufgeräumt: keine doppelten Positionen, Monatswerte sind aktuell.");
      } catch (fehler) {
        alert("Aufräumen fehlgeschlagen: " + fehler.message);
      }
      renderFinanzen();
      return;
    }
    const kurz = (t) => (String(t || "").length > 45 ? String(t).slice(0, 44) + "…" : String(t || ""));
    let text = "";
    if (plan.zusammengelegt.length) {
      text += "Zusammenführen:\n" + plan.zusammengelegt
        .map((z) => `• ${kurz(z.bezeichnung)} (${z.anzahl} Zeilen → 1)`).join("\n") + "\n\n";
    }
    if (plan.umbenannt.length) {
      text += "Kürzere Namen (später frei änderbar):\n" + plan.umbenannt
        .map((u) => `• ${kurz(u.alt)} → ${u.neu}`).join("\n") + "\n\n";
    }
    if (plan.monateAktualisiert) {
      text += `Monatswerte ${plan.jahr} aus den Buchungen: ${plan.monateAktualisiert} Position(en). ` +
        "Gebuchte Monate bekommen den echten Betrag, kommende Monate behalten ihren Planwert.\n\n";
    }
    if (!confirm(text + "Fortfahren?")) return;
    try {
      const ergebnis = await api("fixkosten_abgleich", {
        aenderungen: plan.aenderungen, loeschen: plan.loeschen, bereich: aktiverBereich,
      });
      await ladeDaten();
      renderFinanzen();
      alert(`Fertig: ${ergebnis.aktualisiert ?? plan.aenderungen.length} aktualisiert, ${ergebnis.geloescht ?? plan.loeschen.length} doppelte Zeile(n) entfernt.`);
    } catch (fehler) {
      alert("Aufräumen fehlgeschlagen: " + fehler.message);
    }
  }

  // Erkennt wiederkehrende Buchungen (gleicher Schlüssel in mehreren Monaten) als Fixkosten-Kandidaten
  function erkennKandidatenFin(alleBuchungen, fixkostenListe = [], minMonate = 2, varianzSchwelle = 0.2) {
    // Buchungen, die schon zu einer Fixkosten-Position passen, gar nicht erst
    // vorschlagen – über den Erkennungsschlüssel (seit Session 29) oder wie
    // bisher über die Bezeichnung als Stichwort.
    const fixWoerter = finFixkostenStichwoerter(fixkostenListe);
    const fixSchluessel = new Set(fixkostenListe.map((f) => (f.typ || "ausgabe") + "|" + finFixSchluessel(f)));
    const passtZuFixkosten = (notiz) => {
      const text = (notiz || "").toUpperCase();
      return fixWoerter.some((w) => text.includes(w));
    };
    const jahr = new Date().getFullYear();
    const gruppen = new Map();
    for (const b of alleBuchungen) {
      if (passtZuFixkosten(b.notiz)) continue;
      const schluesselText = finNormalizeKey(b.notiz);
      if (!schluesselText) continue;
      const key = (b.typ || "ausgabe") + "|" + schluesselText;
      if (fixSchluessel.has(key)) continue;
      if (!gruppen.has(key)) gruppen.set(key, []);
      gruppen.get(key).push(b);
    }

    const ist = finIstMonate(alleBuchungen, jahr);
    const kandidaten = [];
    for (const [key, eintraege] of gruppen.entries()) {
      const typ = key.split("|")[0];
      const schluessel = key.slice(key.indexOf("|") + 1);
      const monate = new Set(eintraege.map((e) => (e.datum || "").slice(0, 7)).filter(Boolean));
      if (monate.size < minMonate) continue;
      // Nur, was im laufenden Jahr gebucht wurde – daraus kommen die Monatswerte
      const monatsWerte = ist.get(key);
      if (!monatsWerte || !monatsWerte.some((w) => w)) continue;

      const betraege = eintraege.map((e) => finZahl(e.betrag)).filter((b) => b);
      if (!betraege.length) continue;
      const median = finMedian(betraege);
      const spanne = median ? (Math.max(...betraege) - Math.min(...betraege)) / median : 0;

      kandidaten.push({
        typ,
        schluessel,
        jahr,
        monate: monatsWerte,
        bezeichnungVorschlag: finNameAusSchluessel(schluessel).slice(0, 60),
        anzahlMonate: monate.size,
        anzahlBuchungen: eintraege.length,
        betragMedian: Math.round(median * 100) / 100,
        variabel: spanne > varianzSchwelle,
        buchungIds: eintraege.map((e) => e.id).filter(Boolean),
        ausgewaehlt: true,
      });
    }

    kandidaten.sort((a, b) => b.anzahlMonate - a.anzahlMonate || a.bezeichnungVorschlag.localeCompare(b.bezeichnungVorschlag));
    return kandidaten;
  }

  let finErkennungKandidaten = [];

  // Öffnet das Modal mit den erkannten Fixkosten-Kandidaten
  function zeigeErkennungsModal(kandidaten) {
    finErkennungKandidaten = kandidaten;
    const overlay = document.createElement("div");
    overlay.className = "fin-modal-overlay";
    overlay.id = "fin-erkennung-overlay";
    document.body.appendChild(overlay);
    renderErkennungsModal();
  }

  // Rendert das Erkennungs-Modal mit editierbaren Kandidaten (Bezeichnung, Typ, Auswahl)
  function renderErkennungsModal() {
    const overlay = document.getElementById("fin-erkennung-overlay");
    if (!overlay) return;
    overlay.innerHTML = `
      <div class="fin-modal">
        <div class="fin-modal-kopf">
          <h2>Wiederkehrende Buchungen erkannt</h2>
          <p class="hero-text" style="margin:0;">${finErkennungKandidaten.length} Kandidat(en) gefunden – als Fixkosten übernehmen?</p>
        </div>
        <div class="fin-modal-body">
          ${finErkennungKandidaten.map((k, i) => `
            <div class="fin-kandidat">
              <input type="checkbox" ${k.ausgewaehlt ? "checked" : ""} onchange="finKandidatUmschalten(${i})">
              <div class="fin-kandidat-felder">
                <input type="text" id="fin-kand-bez-${i}" value="${escapeAttr(k.bezeichnungVorschlag)}">
                <div class="row">
                  <select id="fin-kand-typ-${i}">
                    <option value="ausgabe" ${k.typ === "ausgabe" ? "selected" : ""}>Ausgabe</option>
                    <option value="einnahme" ${k.typ === "einnahme" ? "selected" : ""}>Einnahme</option>
                  </select>
                </div>
                <div class="fin-kandidat-meta">
                  ${k.anzahlBuchungen}× über ${k.anzahlMonate} Monate${k.variabel ? " · Betrag schwankt" : ""}<br>
                  Gebucht ${k.jahr}: ${k.monate.map((w, m) => (w ? `${FIN_MONATSNAMEN_KURZ[m]} ${finEuro(w)}` : "")).filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="fin-modal-fuss">
          <span style="font-size:0.85rem; color:var(--ink-dim);">Eingetragen werden nur die gebuchten Monate. Weitere Monate ergänzt der nächste Import von selbst. Die Bezeichnung darfst du frei wählen.</span>
          <div style="display:flex; gap:0.5rem;">
            <button class="link-btn" id="fin-erkennung-verwerfen">Verwerfen</button>
            <button class="btn-primary" id="fin-erkennung-uebernehmen">Übernehmen</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("fin-erkennung-verwerfen").addEventListener("click", schliesseErkennungsModal);
    document.getElementById("fin-erkennung-uebernehmen").addEventListener("click", erkennungUebernehmen);
  }

  // Schaltet die Auswahl eines Fixkosten-Kandidaten um
  window.finKandidatUmschalten = function (i) {
    finErkennungKandidaten[i].ausgewaehlt = !finErkennungKandidaten[i].ausgewaehlt;
  };

  // Schließt das Erkennungs-Modal, leert die Kandidaten und rendert die Finanzen neu
  function schliesseErkennungsModal() {
    const overlay = document.getElementById("fin-erkennung-overlay");
    if (overlay) overlay.remove();
    finErkennungKandidaten = [];
    renderFinanzen();
  }

  // Legt die ausgewählten Kandidaten als Fixkosten an (mit Monatswerten und Erkennungsschlüssel)
  async function erkennungUebernehmen() {
    // Seit Session 27 werden hier keine Einzelbuchungen mehr gelöscht: Die
    // Übersicht rechnet nur mit Buchungen – gelöschte Kontozeilen fehlten
    // dort, und der Kontostand stimmte nicht mehr. Fixkosten sind reine Planung.
    // Seit Session 29: Monatswerte = tatsächlich gebuchte Monate des laufenden
    // Jahres, dazu der Erkennungsschlüssel, damit spätere Importe dieselbe
    // Position ergänzen statt eine neue vorzuschlagen.
    let angelegt = 0;

    try {
      for (let i = 0; i < finErkennungKandidaten.length; i++) {
        const k = finErkennungKandidaten[i];
        if (!k.ausgewaehlt) continue;
        const bezeichnung = document.getElementById("fin-kand-bez-" + i).value.trim();
        const typ = document.getElementById("fin-kand-typ-" + i).value;
        if (!bezeichnung) continue;

        const zahlung = { bezeichnung, typ, erkennung: k.schluessel };
        // Seit Session 31: monatlich gebuchte Kosten gleich für die kommenden
        // Monate vormerken (Planwerte, beim Import durch echte Beträge ersetzt)
        const ist = FIN_MONATE.map((_m, idx) => finZahl(k.monate[idx]));
        const monate = finMonateMitPlan(ist, new Array(12).fill(0), new Date().getMonth());
        FIN_MONATE.forEach((m, idx) => { zahlung[m] = monate[idx]; });
        await api("fixkosten_hinzufuegen", { ...zahlung, bereich: aktiverBereich });
        angelegt++;
      }
    } catch (fehler) {
      alert("Anlegen fehlgeschlagen: " + fehler.message);
    }

    schliesseErkennungsModal();
    await ladeDaten();
    renderFinanzen();
    if (angelegt) alert(`${angelegt} Fixkosten-Position(en) angelegt.`);
  }

  // ==========================================================
  // Finanzen-Modul: Jahresübersicht (Kontostand-Kette + Charts)
  // ==========================================================
  window.finUebJahrVerschieben = function (delta) {
    finUebJahr += delta;
    renderFinUebersicht();
  };

  // Lädt die Jahresübersicht der Finanzen des aktiven Bereichs und rendert Summen und Diagramme
  async function renderFinUebersicht() {
    const el = document.getElementById("fin-uebersicht-bereich");
    el.innerHTML = `<p class="empty-text">Lade Jahresübersicht …</p>`;

    const einstellung = finanzEinstellungen.find((e) => Number(e.jahr) === finUebJahr && bereichVon(e) === aktiverBereich);
    const startkapital = einstellung ? finZahl(einstellung.start_kontostand) : 0;

    let daten;
    try {
      daten = await api("finanzen_jahresuebersicht", { jahr: finUebJahr, bereich: aktiverBereich });
    } catch (err) {
      el.innerHTML = `<p class="empty-text">Übersicht konnte nicht geladen werden.</p>`;
      return;
    }
    finUebersichtDaten = daten;
    const zeilen = daten.zeilen || [];

    const jahresEinnahmen = zeilen.reduce((s, z) => s + finZahl(z.einnahmen_gesamt), 0);
    const jahresAusgaben = zeilen.reduce((s, z) => s + finZahl(z.ausgaben_gesamt), 0);
    const kontostandEnde = zeilen.length ? zeilen[zeilen.length - 1].kontostand_ende : startkapital;

    el.innerHTML = `
      <div class="cal-header">
        <div class="cal-nav"><button onclick="finUebJahrVerschieben(-1)" aria-label="Vorjahr">${ic("zurueck")}</button></div>
        <h2>${finUebJahr}</h2>
        <div class="cal-nav"><button onclick="finUebJahrVerschieben(1)" aria-label="Nächstes Jahr">${ic("weiter")}</button></div>
      </div>

      <div class="fin-startkapital-row">
        Startkapital ${finUebJahr}:
        <input type="number" step="0.01" id="fin-startkapital-input" value="${startkapital}">
        <button class="link-btn" id="fin-startkapital-speichern">speichern</button>
      </div>

      <div class="fin-summary-row">
        <div class="fin-summary-item">
          <div class="fin-summary-label">Einnahmen ${finUebJahr}</div>
          <div class="fin-summary-value">${finEuro(jahresEinnahmen)}</div>
        </div>
        <div class="fin-summary-item">
          <div class="fin-summary-label">Ausgaben ${finUebJahr}</div>
          <div class="fin-summary-value">${finEuro(jahresAusgaben)}</div>
        </div>
        <div class="fin-summary-item">
          <div class="fin-summary-label">Kontostand Ende ${finUebJahr}</div>
          <div class="fin-summary-value">${finEuro(kontostandEnde)}</div>
        </div>
      </div>

      <div class="fin-chart-wrap">
        <h3>Einnahmen &amp; Ausgaben pro Monat</h3>
        ${finChartEinnahmenAusgaben(zeilen)}
        <div class="fin-chart-legende">
          <span><span class="fin-legende-punkt" style="background:var(--einnahme);"></span>Einnahmen</span>
          <span><span class="fin-legende-punkt" style="background:var(--mod-finanzen);"></span>Ausgaben</span>
        </div>
      </div>

      <div class="fin-chart-wrap">
        <h3>Kontostand-Verlauf</h3>
        ${finChartKontostand(zeilen, startkapital)}
      </div>

      <div class="fin-chart-wrap">
        <h3>Ausgaben nach Kategorie (${finUebJahr})</h3>
        ${finChartKategorien(finUebJahr)}
      </div>

      <div class="fin-tabelle-wrap">
        <table class="fin-tabelle">
          <thead>
            <tr>
              <th class="fin-bez-th">Monat</th>
              <th>Einnahmen</th>
              <th>Ausgaben</th>
              <th>Differenz</th>
              <th>Kontostand Ende</th>
            </tr>
          </thead>
          <tbody>
            ${zeilen.map((z) => `
              <tr>
                <td class="fin-bez">${FIN_MONATSNAMEN_KURZ[z.monat - 1]}</td>
                <td>${finEuro(z.einnahmen_gesamt)}</td>
                <td>${finEuro(z.ausgaben_gesamt)}</td>
                <td style="${z.differenz < 0 ? "color:var(--overdue-text);" : ""}">${finEuro(z.differenz)}</td>
                <td><strong>${finEuro(z.kontostand_ende)}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      ${finMassenloeschungHtml()}
    `;

    document.getElementById("fin-startkapital-speichern").addEventListener("click", async () => {
      const wert = document.getElementById("fin-startkapital-input").value;
      await api("startkapital_speichern", { jahr: finUebJahr, start_kontostand: wert, bereich: aktiverBereich });
      await ladeDaten();
      renderFinUebersicht();
    });

    finMassenloeschungBinden();
  }

  // ==========================================================
  // Finanzen-Modul: Prognose (seit Session 35)
  // „Wenn ich so weitermache wie bisher“: Durchschnitt der Einnahmen und
  // Ausgaben der letzten vollen Monate (nur Buchungen, wie die Übersicht),
  // ab dem heutigen Kontostand fortgeschrieben. Optional geplante
  // Sonderausgaben abziehen und eine Anpassung pro Monat durchspielen.
  // ==========================================================
  const FIN_PROGNOSE_STANDARD = { basis: 12, horizont: 12, sonder: true, anpassung: 0 };
  let finPrognoseOpt = { ...FIN_PROGNOSE_STANDARD };
  try { Object.assign(finPrognoseOpt, JSON.parse(localStorage.getItem("fin-prognose") || "{}")); } catch (_e) { /* Standard */ }
  let finPrognoseDaten = null; // letzte Antwort von finanzen_monatssummen (+ Bereich)

  // "2026-10" → "Okt 26"
  function finMonatLabel(schluessel) {
    const [j, m] = schluessel.split("-").map(Number);
    return `${FIN_MONATSNAMEN_KURZ[m - 1]} ${String(j).slice(2)}`;
  }
  // Verschiebt einen Monatsschlüssel "YYYY-MM" um n Monate
  function finMonatPlus(schluessel, n) {
    const [j, m] = schluessel.split("-").map(Number);
    const d = new Date(j, m - 1 + n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  // Reine Rechnung (ohne DOM), damit sie sich einzeln prüfen lässt.
  // daten: { heute, jahr, monate:[{monat,einnahmen,ausgaben}], startkapital, erste_buchung }
  // sonderListe: [{ jahr, monat, betrag, bezeichnung }]
  function finPrognoseRechnen(daten, opt, sonderListe) {
    const aktMonat = daten.heute.slice(0, 7);
    const summe = new Map((daten.monate || []).map((m) => [m.monat, m]));
    const wert = (k, feld) => (summe.get(k) ? finZahl(summe.get(k)[feld]) : 0);

    // Ab wann gibt es Daten? Der erste Monat zählt nur, wenn die erste Buchung
    // in den ersten 10 Tagen liegt – sonst wäre er nur ein angebrochener Monat.
    let ersterVoller = null;
    if (daten.erste_buchung) {
      const k = daten.erste_buchung.slice(0, 7);
      ersterVoller = Number(daten.erste_buchung.slice(8, 10)) <= 10 ? k : finMonatPlus(k, 1);
    }
    const basisMonate = [];
    for (let i = opt.basis; i >= 1; i--) {
      const k = finMonatPlus(aktMonat, -i);
      if (ersterVoller && k >= ersterVoller) basisMonate.push(k);
    }
    const n = basisMonate.length;
    const oE = n ? basisMonate.reduce((s, k) => s + wert(k, "einnahmen"), 0) / n : 0;
    const oA = n ? basisMonate.reduce((s, k) => s + wert(k, "ausgaben"), 0) / n : 0;

    // Kontostand heute: Startkapital + alle Buchungen des laufenden Jahres
    const jahrPrefix = `${daten.jahr}-`;
    const imJahr = (daten.monate || []).filter((m) => m.monat.startsWith(jahrPrefix));
    const heuteStand = finZahl(daten.startkapital) + imJahr.reduce((s, m) => s + finZahl(m.einnahmen) - finZahl(m.ausgaben), 0);

    // Geplante Sonderausgaben je Monat (nur ab dem laufenden Monat, nur mit Monat)
    const sonder = new Map();
    const sonderOhneMonat = [];
    (sonderListe || []).forEach((s) => {
      if (!s.monat) { sonderOhneMonat.push(s); return; }
      const k = `${s.jahr}-${String(s.monat).padStart(2, "0")}`;
      if (k < aktMonat) return;
      sonder.set(k, (sonder.get(k) || 0) + finZahl(s.betrag));
    });
    const sonderIn = (k) => (opt.sonder ? sonder.get(k) || 0 : 0);

    // Vergangene Monatsenden rückwärts vom heutigen Stand (für das Diagramm)
    const zeilen = [];
    let stand = heuteStand - (wert(aktMonat, "einnahmen") - wert(aktMonat, "ausgaben"));
    for (let i = basisMonate.length - 1; i >= 0; i--) {
      const k = basisMonate[i];
      zeilen.unshift({ monat: k, art: "ist", einnahmen: wert(k, "einnahmen"), ausgaben: wert(k, "ausgaben"), sonder: 0, kontostand: stand });
      stand -= wert(k, "einnahmen") - wert(k, "ausgaben");
    }
    // Laufender Monat: Gebuchtes zählt, der Rest bis zum Durchschnitt wird ergänzt
    const gebE = wert(aktMonat, "einnahmen");
    const gebA = wert(aktMonat, "ausgaben");
    const restE = Math.max(0, oE - gebE);
    const restA = Math.max(0, oA - gebA);
    let laufend = heuteStand + restE - restA - sonderIn(aktMonat);
    zeilen.push({ monat: aktMonat, art: "jetzt", einnahmen: gebE + restE, ausgaben: gebA + restA, sonder: sonderIn(aktMonat), kontostand: laufend,
      gebuchtE: gebE, gebuchtA: gebA });
    const anpassung = finZahl(opt.anpassung);
    for (let i = 1; i <= opt.horizont; i++) {
      const k = finMonatPlus(aktMonat, i);
      laufend += oE - oA - sonderIn(k) + anpassung;
      zeilen.push({ monat: k, art: "prognose", einnahmen: oE, ausgaben: oA - anpassung, sonder: sonderIn(k), kontostand: laufend });
    }
    const prognose = zeilen.filter((z) => z.art !== "ist");
    const minus = prognose.find((z) => z.kontostand < 0);
    return {
      n, basisMonate, oE, oA, saldo: oE - oA + anpassung, heuteStand, zeilen, ende: prognose[prognose.length - 1],
      ersterMinusMonat: heuteStand >= 0 && minus ? minus.monat : null, schonImMinus: heuteStand < 0,
      sonderSumme: [...sonder.entries()].filter(([k]) => k <= finMonatPlus(aktMonat, opt.horizont)).reduce((s, [, v]) => s + v, 0),
      sonderOhneMonat, startkapitalFehlt: daten.startkapital === null || daten.startkapital === undefined,
    };
  }

  // ---- „Wo geht das Geld hin?“ (seit Session 36) ----
  // Ausgaben je Kategorie und Empfänger über dieselben Grundlage-Monate wie die
  // Prognose. Reine Rechnung ohne DOM.
  // daten.kategorien: [{monat, kategorie, betrag, anzahl}]
  // daten.empfaenger: [{monat, kategorie, schluessel, betrag, anzahl}]
  // Liefert null, wenn das Backend die Felder (noch) nicht schickt.
  function finKategorienRechnen(daten, basisMonate) {
    if (!Array.isArray(daten.kategorien) || !Array.isArray(daten.empfaenger)) return null;
    const n = basisMonate.length;
    if (!n) return { liste: [], gesamt: 0, n: 0 };
    const inBasis = new Set(basisMonate);
    const letzte3 = new Set(n >= 6 ? basisMonate.slice(-3) : []);
    const map = new Map();
    daten.kategorien.forEach((k) => {
      if (!inBasis.has(k.monat)) return;
      const e = map.get(k.kategorie) || { kategorie: k.kategorie, summe: 0, summeLetzte: 0, anzahl: 0 };
      e.summe += finZahl(k.betrag);
      e.anzahl += Number(k.anzahl || 0);
      if (letzte3.has(k.monat)) e.summeLetzte += finZahl(k.betrag);
      map.set(k.kategorie, e);
    });
    const gesamt = [...map.values()].reduce((s, e) => s + e.summe, 0);

    // Empfänger je Kategorie: Summe und in wie vielen Monaten sie vorkommen
    const empf = new Map();
    daten.empfaenger.forEach((e) => {
      if (!inBasis.has(e.monat)) return;
      const key = `${e.kategorie}|${e.schluessel}`;
      const x = empf.get(key) || { kategorie: e.kategorie, schluessel: e.schluessel, summe: 0, anzahl: 0, monate: new Set() };
      x.summe += finZahl(e.betrag);
      x.anzahl += Number(e.anzahl || 0);
      x.monate.add(e.monat);
      empf.set(key, x);
    });

    const liste = [...map.values()].map((e) => {
      const oMonat = e.summe / n;
      let trend = null;
      if (n >= 6) {
        const oLetzte = e.summeLetzte / 3;
        const oFrueher = (e.summe - e.summeLetzte) / (n - 3);
        if (oFrueher <= 0 && oLetzte > 0) trend = { art: "neu", oLetzte, oFrueher };
        else if (oFrueher > 0) {
          const diff = oLetzte - oFrueher;
          if (Math.abs(diff) >= Math.max(10, oFrueher * 0.15)) {
            trend = { art: diff > 0 ? "hoch" : "runter", prozent: Math.round((diff / oFrueher) * 100), oLetzte, oFrueher };
          }
        }
      }
      const alleEmpf = [...empf.values()].filter((x) => x.kategorie === e.kategorie).sort((a, b) => b.summe - a.summe);
      const top = alleEmpf.slice(0, 5).map((x) => ({
        name: x.schluessel ? finNameAusSchluessel(x.schluessel) : "ohne Buchungstext", schluessel: x.schluessel || "",
        oMonat: x.summe / n, summe: x.summe, anzahl: x.anzahl, monate: x.monate.size,
      }));
      const rest = alleEmpf.slice(5).reduce((s, x) => s + x.summe, 0);
      return {
        kategorie: e.kategorie, summe: e.summe, oMonat, anzahl: e.anzahl,
        anteil: gesamt > 0 ? e.summe / gesamt : 0, trend, top, rest, weitere: Math.max(0, alleEmpf.length - 5),
        spar10: Math.max(1, Math.round(oMonat * 0.1)),
      };
    }).sort((a, b) => b.summe - a.summe);
    return { liste, gesamt, n };
  }

  let finKatOffen = new Set(); // aufgeklappte Kategorien (bis zum Neuladen)

  // HTML des Abschnitts „Wo geht das Geld hin?“
  function finKategorienHtml(k, r) {
    if (k === null) {
      return `<div class="fin-chart-wrap fin-kat"><h3>Wo geht das Geld hin?</h3>
        <p class="empty-text" style="margin:0;">Für diese Auswertung muss die neue <code>index.ts</code> eingespielt werden (Supabase → Edge Functions).</p></div>`;
    }
    if (!k.liste.length) return "";
    const max = Math.max(...k.liste.map((e) => e.oMonat)) || 1;
    const prozent = (x) => `${Math.round(x * 100)} %`;
    const sonstiges = k.liste.find((e) => e.kategorie === "Sonstiges");
    const hinweisSonstiges = sonstiges && sonstiges.anteil >= 0.35
      ? `<p class="fin-prognose-hinweis">${ic("warnung")} ${prozent(sonstiges.anteil)} der Ausgaben stehen unter „Sonstiges“. Die Kategorie rät der CSV-Import aus dem Buchungstext – aufklappen zeigt, welche Empfänger drinstecken. Der Stift an einem Empfänger legt eine Kategorie-Regel an, die auch die bisherigen Buchungen umstellt.</p>`
      : "";
    const trendHtml = (t) => {
      if (!t) return "";
      if (t.art === "neu") return `<span class="fin-kat-trend hoch" title="In den letzten 3 Monaten neu dazugekommen">neu</span>`;
      const hoch = t.art === "hoch";
      return `<span class="fin-kat-trend ${hoch ? "hoch" : "runter"}" title="Letzte 3 Monate Ø ${escapeAttr(finEuro(t.oLetzte))}, davor Ø ${escapeAttr(finEuro(t.oFrueher))}">${hoch ? "↑" : "↓"} ${Math.abs(t.prozent)} %</span>`;
    };
    const wieOft = (x) => {
      if (x.monate >= k.n) return "jeden Monat";
      if (x.anzahl === 1) return "einmal";
      return `in ${x.monate} von ${k.n} Monaten`;
    };
    const zeilen = k.liste.map((e) => {
      const offen = finKatOffen.has(e.kategorie);
      // Stift: Kategorie-Regel für diesen Empfänger (seit Session 36)
      const regelKnopf = (x) => (kategorieRegeln !== null && x.schluessel
        ? `<button type="button" class="fin-kat-empf-regel" data-muster="${escapeAttr(x.schluessel)}" data-kategorie="${escapeAttr(e.kategorie)}"
            onclick="finRegelAusPrognose(this)" title="Kategorie-Regel" aria-label="Kategorie-Regel für ${escapeAttr(x.name)}">${ic("stift")}</button>`
        : "");
      const empf = e.top.map((x) => `
        <li class="fin-kat-empf">
          <span class="fin-kat-empf-name">${escapeHtml(x.name)}<span class="notiz-meta">${wieOft(x)} · ${x.anzahl} ${x.anzahl === 1 ? "Buchung" : "Buchungen"}</span></span>
          <span class="fin-kat-empf-betrag">${finEuro(x.oMonat)}</span>
          ${regelKnopf(x)}
        </li>`).join("");
      const rest = e.weitere ? `<li class="fin-kat-empf fin-kat-empf-rest"><span class="fin-kat-empf-name">${e.weitere} weitere</span><span class="fin-kat-empf-betrag">${finEuro(e.rest / k.n)}</span></li>` : "";
      return `
        <details class="fin-kat-zeile" data-kategorie="${escapeAttr(e.kategorie)}"${offen ? " open" : ""}>
          <summary>
            <span class="fin-kat-kopf">
              <span class="fin-kat-name">${escapeHtml(e.kategorie)}</span>
              ${trendHtml(e.trend)}
              <span class="fin-kat-betrag">${finEuro(e.oMonat)}</span>
            </span>
            <span class="fin-kat-balken" aria-hidden="true"><span style="width:${Math.max(2, Math.round((e.oMonat / max) * 100))}%;"></span></span>
            <span class="fin-kat-meta">${prozent(e.anteil)} der Ausgaben · ${e.anzahl} ${e.anzahl === 1 ? "Buchung" : "Buchungen"}</span>
          </summary>
          <div class="fin-kat-inhalt">
            <div class="fin-prognose-wahl-label">Größte Empfänger · Ø pro Monat</div>
            <ul class="fin-kat-empf-liste">${empf}${rest}</ul>
            <p class="fin-kat-spar">10 % weniger bei „${escapeHtml(e.kategorie)}“ wären etwa <strong>${finEuro(e.spar10)} im Monat</strong>
              – ${finEuro(e.spar10 * finPrognoseOpt.horizont)} in ${finPrognoseOpt.horizont} Monaten.</p>
            <button type="button" class="btn-secondary" onclick="finKatSparen(this.closest('.fin-kat-zeile').dataset.kategorie)">In der Prognose durchrechnen</button>
          </div>
        </details>`;
    }).join("");
    return `
      <div class="fin-chart-wrap fin-kat" id="fin-kat">
        <h3>Wo geht das Geld hin?</h3>
        <p class="notiz-meta" style="margin:0 0 0.7rem;">Ausgaben je Kategorie, Ø pro Monat über dieselben ${k.n} ${k.n === 1 ? "Monat" : "Monate"} wie die Prognose
          (${finMonatLabel(r.basisMonate[0])} bis ${finMonatLabel(r.basisMonate[r.n - 1])}).${k.n >= 6 ? " Pfeile: letzte 3 Monate gegenüber den Monaten davor." : ""} Antippen zeigt die größten Empfänger.</p>
        ${hinweisSonstiges}
        <div class="fin-kat-liste">${zeilen}</div>
      </div>`;
  }

  // „In der Prognose durchrechnen“: 10 % der Kategorie als Anpassung setzen
  window.finKatSparen = function(kategorie) {
    if (!finPrognoseDaten) return;
    const r = finPrognoseRechnen(finPrognoseDaten, finPrognoseOpt, sonderausgabenAktuell());
    const k = finKategorienRechnen(finPrognoseDaten, r.basisMonate);
    const e = k && k.liste.find((x) => x.kategorie === kategorie);
    if (!e) return;
    const vorher = finZahl(finPrognoseOpt.anpassung);
    window.finPrognoseSetzen("anpassung", e.spar10);
    const aussage = document.querySelector("#fin-prognose-bereich .fin-prognose-aussage");
    if (aussage) aussage.scrollIntoView({ behavior: "smooth", block: "center" });
    hinweisZeigen(`Prognose mit ${finEuro(e.spar10)} weniger „${kategorie}“ pro Monat`, () => {
      window.finPrognoseSetzen("anpassung", vorher);
    });
  };

  // ---- Sparziele (seit Session 37) ----
  // Ein Ziel ist ein Kontostand am Ende des Ziel-Monats: bei „Zurücklegen“
  // Start-Kontostand + Betrag, bei „Kontostand erreichen“ der Betrag selbst.
  // Der erwartete Stand kommt aus der Prognose (inkl. Anpassung); liegt der
  // Monat hinter dem Prognose-Zeitraum, wird mit dem Ø pro Monat weitergerechnet.
  function sparzieleAktuell() {
    return (sparziele || []).filter((s) => bereichVon(s) === aktiverBereich)
      .sort((a, b) => String(a.bis).localeCompare(String(b.bis)));
  }
  function finMonateZwischen(von, bis) {
    const [ja, ma] = von.split("-").map(Number);
    const [jb, mb] = bis.split("-").map(Number);
    return (jb - ja) * 12 + (mb - ma);
  }
  function finSparzielRechnen(z, r) {
    const aktMonat = r.zeilen.find((x) => x.art === "jetzt").monat;
    const betrag = finZahl(z.betrag);
    const kontostandArt = z.art === "kontostand";
    const basis = kontostandArt ? 0 : finZahl(z.start_stand);
    const zielStand = kontostandArt ? betrag : basis + betrag;
    const zielMonat = String(z.bis || "").slice(0, 7);
    const diff = finMonateZwischen(aktMonat, zielMonat);
    const gespart = r.heuteStand - basis;
    const anteil = Math.max(0, Math.min(1, gespart / (zielStand - basis || 1)));
    const erreicht = r.heuteStand >= zielStand;
    const e = { z, kontostandArt, betrag, basis, zielStand, zielMonat, diff, gespart, anteil, erreicht,
      standZiel: null, fehlt: null, proMonat: null, ausserhalb: false, status: "" };
    if (erreicht) { e.status = "geschafft"; return e; }
    if (diff < 0) { e.status = "abgelaufen"; return e; }
    const zeile = r.zeilen.find((x) => x.monat === zielMonat && x.art !== "ist");
    if (zeile) e.standZiel = zeile.kontostand;
    else {
      e.standZiel = r.ende.kontostand + r.saldo * finMonateZwischen(r.ende.monat, zielMonat);
      e.ausserhalb = true;
    }
    e.fehlt = zielStand - e.standZiel;
    if (e.fehlt <= 0) e.status = "aufKurs";
    else {
      e.status = "fehlt";
      if (diff > 0) e.proMonat = Math.ceil(e.fehlt / diff / 5) * 5;
    }
    return e;
  }

  function finSparzieleHtml(r) {
    if (sparziele === null) {
      return `<div class="fin-chart-wrap fin-ziele" id="fin-ziele"><h3>Sparziele</h3>
        <p class="empty-text" style="margin:0;">Für Sparziele bitte zuerst <code>sparziele_setup.sql</code> in Supabase ausführen und die neue <code>index.ts</code> einspielen.</p></div>`;
    }
    // Offene Ziele zuerst (nach Datum), danach geschaffte und abgelaufene
    const erledigt = (e) => (e.status === "geschafft" || e.status === "abgelaufen" ? 1 : 0);
    const liste = sparzieleAktuell().map((z) => finSparzielRechnen(z, r)).sort((a, b) => erledigt(a) - erledigt(b));
    const monat = (k) => finMonatLabel(k);
    const zeilen = liste.map((e) => {
      const z = e.z;
      const kopf = e.kontostandArt
        ? `Kontostand ${finEuro(e.betrag)} bis ${monat(e.zielMonat)}`
        : `${finEuro(e.betrag)} zurücklegen bis ${monat(e.zielMonat)}`;
      const fortschritt = e.kontostandArt
        ? `heute ${finEuro(r.heuteStand)} von ${finEuro(e.zielStand)}`
        : `${finEuro(Math.max(0, e.gespart))} von ${finEuro(e.betrag)} zurückgelegt`;
      const weiter = e.ausserhalb ? " (über den Prognose-Zeitraum hinaus mit dem Ø weitergerechnet)" : "";
      let text = "";
      let knopf = "";
      if (e.status === "geschafft") text = `${ic("ok-kreis")} Geschafft – heute ${finEuro(r.heuteStand)}.`;
      else if (e.status === "abgelaufen") text = `Zieldatum vorbei – heute fehlen ${finEuro(e.zielStand - r.heuteStand)}.`;
      else if (e.status === "aufKurs") text = `Wie bisher klappt es: Ende ${monat(e.zielMonat)} etwa ${finEuro(e.standZiel)}, ${finEuro(-e.fehlt)} Puffer${weiter}.`;
      else if (e.proMonat) {
        text = `Wie bisher fehlen Ende ${monat(e.zielMonat)} etwa <strong>${finEuro(e.fehlt)}</strong>${weiter}. Dafür bräuchtest du rund <strong>${finEuro(e.proMonat)} mehr pro Monat</strong>.`;
        knopf = `<button type="button" class="btn-secondary" onclick="finSparzielDurchrechnen('${escapeAttr(String(z.id))}')">In der Prognose durchrechnen</button>`;
      } else text = `Bis Ende ${monat(e.zielMonat)} fehlen etwa <strong>${finEuro(e.fehlt)}</strong> – in diesem Monat kaum noch aufzuholen.`;
      return `
        <div class="fin-ziel fin-ziel-${e.status}">
          <button type="button" class="fin-ziel-info" onclick="blattOeffnen('sparziel','${escapeAttr(String(z.id))}')">
            <span class="fin-ziel-titel">${escapeHtml(z.titel)}</span>
            <span class="notiz-meta">${kopf}</span>
          </button>
          <span class="fin-kat-balken fin-ziel-balken" aria-hidden="true"><span style="width:${Math.max(2, Math.round(e.anteil * 100))}%;"></span></span>
          <span class="fin-kat-meta fin-ziel-meta">${fortschritt} · ${Math.round(e.anteil * 100)} %</span>
          <p class="fin-ziel-text">${text}</p>
          ${knopf}
        </div>`;
    }).join("");
    const offen = liste.filter((e) => e.status !== "geschafft" && e.status !== "abgelaufen").length;
    const hinweise = [];
    if (offen > 1) hinweise.push("Jedes Ziel ist einzeln gerechnet – alle teilen sich dasselbe Konto.");
    if (finZahl(finPrognoseOpt.anpassung)) hinweise.push(`Mit deiner Anpassung von ${finEuro(finZahl(finPrognoseOpt.anpassung))} pro Monat gerechnet.`);
    return `
      <div class="fin-chart-wrap fin-ziele" id="fin-ziele">
        <div class="fin-ziele-kopf">
          <h3>Sparziele</h3>
          <button type="button" class="btn-secondary" onclick="finSparzielNeu()">${ic("plus")}Sparziel</button>
        </div>
        ${zeilen || `<p class="notiz-meta" style="margin:0;">Zum Beispiel „Urlaub: 1.500 € bis Juli“ – die App rechnet mit der Prognose, ob es klappt und was dafür pro Monat fehlt.</p>`}
        ${hinweise.map((h) => `<p class="notiz-meta fin-ziele-hinweis">${escapeHtml(h)}</p>`).join("")}
      </div>`;
  }

  window.finSparzielNeu = function() {
    if (sparziele === null) {
      alert("Für Sparziele bitte zuerst sparziele_setup.sql in Supabase ausführen und die neue index.ts einspielen.");
      return;
    }
    const r = finPrognoseDaten ? finPrognoseRechnen(finPrognoseDaten, finPrognoseOpt, sonderausgabenAktuell()) : null;
    const heute = new Date();
    const bis = new Date(heute.getFullYear(), heute.getMonth() + 7, 0); // Ende des Monats in 6 Monaten
    const bisIso = `${bis.getFullYear()}-${String(bis.getMonth() + 1).padStart(2, "0")}-${String(bis.getDate()).padStart(2, "0")}`;
    window.blattNeu("sparziel", { art: "zuruecklegen", bis: bisIso, start_stand: r ? Math.round(r.heuteStand) : "" });
  };

  // Setzt die Anpassung so, dass das Ziel erreicht würde (mit Rückgängig)
  window.finSparzielDurchrechnen = function(id) {
    if (!finPrognoseDaten) return;
    const z = (sparziele || []).find((s) => String(s.id) === String(id));
    if (!z) return;
    const r = finPrognoseRechnen(finPrognoseDaten, finPrognoseOpt, sonderausgabenAktuell());
    const e = finSparzielRechnen(z, r);
    if (!e.proMonat) return;
    const vorher = finZahl(finPrognoseOpt.anpassung);
    window.finPrognoseSetzen("anpassung", vorher + e.proMonat);
    const aussage = document.querySelector("#fin-prognose-bereich .fin-prognose-aussage");
    if (aussage) aussage.scrollIntoView({ behavior: "smooth", block: "center" });
    hinweisZeigen(`Prognose mit ${finEuro(e.proMonat)} mehr pro Monat für „${z.titel}“`, () => {
      window.finPrognoseSetzen("anpassung", vorher);
    });
  };

  // Liniendiagramm: Ist (durchgezogen) und Prognose (gestrichelt), Null-Linie
  function finChartPrognose(zeilen) {
    // Schmale Zeichenfläche, damit die Schrift am Handy lesbar bleibt
    const breite = 360, hoehe = 200, unten = 22, oben = 22, rand = 10;
    const werte = zeilen.map((z) => z.kontostand);
    const minWert = Math.min(0, ...werte);
    const maxWert = Math.max(1, ...werte);
    const spanne = maxWert - minWert || 1;
    const schrittX = (breite - rand * 2) / Math.max(1, zeilen.length - 1);
    const x = (i) => rand + i * schrittX;
    const y = (w) => oben + (hoehe - oben - unten) * (1 - (w - minWert) / spanne);
    const iJetzt = zeilen.findIndex((z) => z.art === "jetzt");
    const pkt = (von, bis) => zeilen.slice(von, bis + 1).map((z, j) => `${x(von + j).toFixed(1)},${y(z.kontostand).toFixed(1)}`).join(" ");
    const ist = iJetzt > 0 ? `<polyline points="${pkt(0, iJetzt)}" fill="none" stroke="var(--ink-dim)" stroke-width="2"></polyline>` : "";
    const prog = `<polyline points="${pkt(Math.max(0, iJetzt), zeilen.length - 1)}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="6,4"></polyline>`;
    const jede = Math.max(1, Math.ceil(zeilen.length / 6));
    // Beschriftung: „heute“ immer; sonst jeder n-te Monat, aber nicht zu nah an „heute“
    const anker = (i) => (i === 0 ? "start" : i === zeilen.length - 1 ? "end" : "middle");
    const labels = zeilen.map((z, i) => {
      const zeigen = i === iJetzt || (i % jede === 0 && Math.abs(i - iJetzt) >= Math.max(2, jede / 2));
      if (!zeigen) return "";
      return `<text x="${x(i).toFixed(1)}" y="${hoehe - 7}" font-size="10" fill="var(--ink-dim)" text-anchor="${anker(i)}"${i === iJetzt ? ' font-weight="700"' : ""}>${i === iJetzt ? "heute" : finMonatLabel(z.monat)}</text>`;
    }).join("");
    const nullLinie = minWert < 0
      ? `<line x1="0" y1="${y(0).toFixed(1)}" x2="${breite}" y2="${y(0).toFixed(1)}" stroke="var(--overdue-text)" stroke-width="1" stroke-dasharray="3,3"></line>
         <text x="${breite - 4}" y="${(y(0) - 4).toFixed(1)}" font-size="10" fill="var(--overdue-text)" text-anchor="end">0 €</text>` : "";
    const punktJetzt = iJetzt >= 0 ? `<circle cx="${x(iJetzt).toFixed(1)}" cy="${y(zeilen[iJetzt].kontostand).toFixed(1)}" r="4" fill="var(--accent)"></circle>` : "";
    const ende = zeilen[zeilen.length - 1];
    const endeText = `<text x="${(x(zeilen.length - 1) - 2).toFixed(1)}" y="${(y(ende.kontostand) - 8).toFixed(1)}" font-size="11" font-weight="700" fill="var(--ink)" text-anchor="end">${escapeHtml(finEuro(ende.kontostand))}</text>`;
    return `<svg viewBox="0 0 ${breite} ${hoehe}" style="width:100%; height:auto; display:block;" role="img"
        aria-label="Kontostand: bisher und Prognose bis ${finMonatLabel(ende.monat)}, am Ende etwa ${escapeAttr(finEuro(ende.kontostand))}">
      <line x1="0" y1="${hoehe - unten}" x2="${breite}" y2="${hoehe - unten}" stroke="var(--border)" stroke-width="1"></line>
      ${nullLinie}${ist}${prog}${punktJetzt}${endeText}${labels}
    </svg>`;
  }

  // Auswahl-Chips der Prognose (Grundlage, Zeitraum)
  function finPrognoseChips(key, optionen, label) {
    return `<div class="fin-prognose-wahl"><span class="fin-prognose-wahl-label">${label}</span><div class="schnell-chips" role="group" aria-label="${escapeAttr(label)}">` +
      optionen.map((n) => `<button type="button" class="schnell-chip${finPrognoseOpt[key] === n ? " aktiv" : ""}" aria-pressed="${finPrognoseOpt[key] === n}"
        onclick="finPrognoseSetzen('${key}', ${n})">${n} Mon.</button>`).join("") + `</div></div>`;
  }

  window.finPrognoseSetzen = function(key, wert) {
    finPrognoseOpt[key] = wert;
    try { localStorage.setItem("fin-prognose", JSON.stringify(finPrognoseOpt)); } catch (_e) { /* egal */ }
    renderFinPrognose(false);
  };

  // Lädt (bei Bedarf) die Monatssummen und zeichnet die Prognose
  async function renderFinPrognose(neuLaden = true) {
    const el = document.getElementById("fin-prognose-bereich");
    if (!el) return;
    if (neuLaden || !finPrognoseDaten || finPrognoseDaten.bereich !== aktiverBereich) {
      el.innerHTML = `<p class="empty-text">Rechne Prognose …</p>`;
      try {
        const daten = await api("finanzen_monatssummen", { bereich: aktiverBereich, monate: 24 });
        if (!finPrognoseDaten || finPrognoseDaten.bereich !== aktiverBereich) finKatOffen = new Set();
        finPrognoseDaten = { ...daten, bereich: aktiverBereich };
      } catch (err) {
        el.innerHTML = `<p class="empty-text">Prognose konnte nicht geladen werden${err && err.message ? ": " + escapeHtml(err.message) : ""}.</p>`;
        return;
      }
    }
    const r = finPrognoseRechnen(finPrognoseDaten, finPrognoseOpt, sonderausgabenAktuell());
    const steuerung = `
      <div class="fin-prognose-steuerung">
        <h3>Annahmen</h3>
        ${finPrognoseChips("basis", [3, 6, 12, 24], "Grundlage: die letzten")}
        ${finPrognoseChips("horizont", [6, 12, 24, 36], "Blick nach vorn")}
        <label class="fin-prognose-haken"><input type="checkbox" id="fin-prognose-sonder" ${finPrognoseOpt.sonder ? "checked" : ""}> geplante Sonderausgaben abziehen</label>
        <label class="fin-prognose-anpassung">Was wäre, wenn ich pro Monat
          <input type="number" id="fin-prognose-anpassung" step="10" inputmode="decimal" value="${finZahl(finPrognoseOpt.anpassung) || ""}" placeholder="0"> € mehr spare?
          <span class="blatt-hinweis">minus = mehr ausgeben</span></label>
      </div>`;

    if (!r.n) {
      el.innerHTML = steuerung + `<p class="empty-text">Für eine Prognose braucht es mindestens einen vollen Monat mit Buchungen.
        Importiere die Kontoauszüge (Buchungen → CSV-Import) oder erfasse Buchungen – dann rechnet die Prognose.</p>`;
      finPrognoseBinden();
      return;
    }

    const ende = r.ende;
    const saldoText = `${r.saldo >= 0 ? "+" : "−"}${finEuro(Math.abs(r.saldo))}`;
    let aussage;
    if (r.schonImMinus) {
      aussage = r.saldo > 0
        ? `Dein Konto ist im Minus. Wie bisher kämen pro Monat ${saldoText} dazu – Ende ${finMonatLabel(ende.monat)} stündest du bei etwa <strong>${finEuro(ende.kontostand)}</strong>.`
        : `Dein Konto ist im Minus, und wie bisher ginge es pro Monat um ${finEuro(Math.abs(r.saldo))} weiter nach unten – Ende ${finMonatLabel(ende.monat)} etwa <strong>${finEuro(ende.kontostand)}</strong>.`;
    } else if (r.ersterMinusMonat) {
      aussage = `Machst du weiter wie bisher, sinkt dein Kontostand um etwa ${finEuro(Math.abs(r.saldo))} im Monat. <strong>Im ${finMonatLabel(r.ersterMinusMonat)} wärst du im Minus.</strong>`;
    } else if (r.saldo < 0) {
      aussage = `Machst du weiter wie bisher, sinkt dein Kontostand um etwa ${finEuro(Math.abs(r.saldo))} im Monat – Ende ${finMonatLabel(ende.monat)} noch etwa <strong>${finEuro(ende.kontostand)}</strong>.`;
    } else {
      aussage = `Machst du weiter wie bisher, legst du etwa ${finEuro(r.saldo)} im Monat zurück – Ende ${finMonatLabel(ende.monat)} etwa <strong>${finEuro(ende.kontostand)}</strong>.`;
    }

    const hinweise = [];
    if (r.startkapitalFehlt) hinweise.push(`Für ${finPrognoseDaten.jahr} ist kein Startkapital eingetragen – die Rechnung beginnt deshalb bei 0 €. Eintragen unter „Übersicht“.`);
    if (r.n < finPrognoseOpt.basis) hinweise.push(`Es liegen erst ${r.n} volle ${r.n === 1 ? "Monat" : "Monate"} mit Buchungen vor – der Durchschnitt beruht nur darauf.`);
    if (finPrognoseOpt.sonder && r.sonderOhneMonat.length) hinweise.push(`${r.sonderOhneMonat.length} Sonderausgabe${r.sonderOhneMonat.length === 1 ? "" : "n"} ohne Monat ${r.sonderOhneMonat.length === 1 ? "ist" : "sind"} nicht eingerechnet.`);

    const zeile = (z) => `
      <tr class="fin-prognose-${z.art}">
        <td class="fin-bez">${z.art === "jetzt" ? `${finMonatLabel(z.monat)} <span class="fin-prognose-marke">jetzt</span>` : finMonatLabel(z.monat)}</td>
        <td>${finEuro(z.einnahmen)}</td>
        <td>${finEuro(z.ausgaben)}</td>
        <td>${z.sonder ? "−" + finEuro(z.sonder) : "–"}</td>
        <td><strong${z.kontostand < 0 ? ' style="color:var(--overdue-text);"' : ""}>${finEuro(z.kontostand)}</strong></td>
      </tr>`;

    el.innerHTML = `
      <div class="fin-prognose-aussage">${aussage}</div>
      ${hinweise.map((h) => `<p class="fin-prognose-hinweis">${ic("warnung")} ${escapeHtml(h)}</p>`).join("")}
      <div class="fin-summary-row">
        <div class="fin-summary-item">
          <div class="fin-summary-label">Kontostand heute</div>
          <div class="fin-summary-value">${finEuro(r.heuteStand)}</div>
        </div>
        <div class="fin-summary-item">
          <div class="fin-summary-label">Ø pro Monat</div>
          <div class="fin-summary-value" style="color:${r.saldo < 0 ? "var(--overdue-text)" : "var(--einnahme)"};">${saldoText}</div>
        </div>
        <div class="fin-summary-item">
          <div class="fin-summary-label">Ende ${finMonatLabel(ende.monat)}</div>
          <div class="fin-summary-value"${ende.kontostand < 0 ? ' style="color:var(--overdue-text);"' : ""}>${finEuro(ende.kontostand)}</div>
        </div>
      </div>

      ${finSparzieleHtml(r)}

      <div class="fin-chart-wrap">
        <h3>Kontostand: bisher und Prognose</h3>
        ${finChartPrognose(r.zeilen)}
        <div class="fin-chart-legende">
          <span><span class="fin-legende-linie"></span>bisher</span>
          <span><span class="fin-legende-linie gestrichelt"></span>Prognose</span>
        </div>
      </div>
      ${steuerung}
      ${finKategorienHtml(finKategorienRechnen(finPrognoseDaten, r.basisMonate), r)}

      <div class="fin-tabelle-wrap">
        <table class="fin-tabelle fin-prognose-tabelle">
          <thead><tr><th class="fin-bez-th">Monat</th><th>Einnahmen</th><th>Ausgaben</th><th>Sonder</th><th>Kontostand Ende</th></tr></thead>
          <tbody>${r.zeilen.map(zeile).join("")}</tbody>
        </table>
      </div>

      <details class="fin-prognose-erklaerung">
        <summary>So wird gerechnet</summary>
        <ul>
          <li><strong>Grundlage:</strong> ${r.n} volle ${r.n === 1 ? "Monat" : "Monate"} (${finMonatLabel(r.basisMonate[0])} bis ${finMonatLabel(r.basisMonate[r.n - 1])}) –
            im Schnitt ${finEuro(r.oE)} Einnahmen und ${finEuro(r.oA)} Ausgaben pro Monat. Gezählt werden nur Buchungen, wie in der Übersicht.</li>
          <li><strong>Heute:</strong> Startkapital ${finPrognoseDaten.jahr} plus alle Buchungen seit 1. Januar = ${finEuro(r.heuteStand)}.</li>
          <li><strong>Laufender Monat:</strong> bereits gebucht ${finEuro(r.zeilen.find((z) => z.art === "jetzt").gebuchtE)} rein / ${finEuro(r.zeilen.find((z) => z.art === "jetzt").gebuchtA)} raus; was zum Durchschnitt noch fehlt, wird ergänzt.</li>
          <li><strong>Danach</strong> jeden Monat der Durchschnitt${finPrognoseOpt.sonder ? ", abzüglich geplanter Sonderausgaben mit Monat" : ""}${finZahl(finPrognoseOpt.anpassung) ? `, plus deine Anpassung von ${finEuro(finZahl(finPrognoseOpt.anpassung))}` : ""}.</li>
          <li><strong>Sparziele:</strong> Ziel ist der Kontostand am Ende des Ziel-Monats – bei „Zurücklegen“ der Stand beim Anlegen plus Betrag. Verglichen wird mit dem Prognose-Kontostand in diesem Monat (inkl. Anpassung); liegt er hinter dem gewählten Zeitraum, mit dem Ø pro Monat weitergerechnet. „Pro Monat mehr“ = Fehlbetrag geteilt durch die Monate bis dahin, auf 5 € aufgerundet.</li>
          <li><strong>Wo geht das Geld hin?</strong> Gleiche Grundlage-Monate, nur Ausgaben, nach der Kategorie der Buchung. Empfänger = die ersten Wörter des Buchungstexts ohne Zahlen. „In der Prognose durchrechnen“ setzt 10 % der Kategorie als Anpassung oben ein.</li>
          <li><strong>Grenzen:</strong> Es ist eine Fortschreibung, kein Versprechen. Jährliche Zahlungen (Versicherung, Steuer) verteilt der Durchschnitt gleichmäßig – mit 12 oder 24 Monaten Grundlage sind sie am besten abgebildet. Einmalige große Posten der Grundlage-Monate ziehen den Schnitt mit.</li>
        </ul>
      </details>`;
    finPrognoseBinden();
  }

  // Bindet Häkchen und Anpassungsfeld (ohne neu zu laden)
  function finPrognoseBinden() {
    // Auf-/Zuklappen der Kategorien merken, damit es beim Neuzeichnen bleibt
    document.querySelectorAll("#fin-prognose-bereich .fin-kat-zeile").forEach((d) => {
      d.addEventListener("toggle", () => {
        if (d.open) finKatOffen.add(d.dataset.kategorie); else finKatOffen.delete(d.dataset.kategorie);
      });
    });
    const haken = document.getElementById("fin-prognose-sonder");
    if (haken) haken.addEventListener("change", () => window.finPrognoseSetzen("sonder", haken.checked));
    const feld = document.getElementById("fin-prognose-anpassung");
    if (feld) feld.addEventListener("change", () => {
      window.finPrognoseSetzen("anpassung", finZahl(feld.value));
      const neu = document.getElementById("fin-prognose-anpassung");
      if (neu) neu.focus();
    });
  }

  // ==========================================================
  // Finanzen-Modul: Massenlöschung (Buchungen / Fixkosten / Sonderausgaben)
  // ==========================================================
  let finMlVorschauAktuell = null; // merkt sich die zuletzt geprüften Filter, damit "Löschen" nur nach frischer Vorschau geht

  function finMlAlleKategorien() {
    return Array.from(new Set([...FIN_KAT_AUSGABE, ...FIN_KAT_EINNAHME])).sort((a, b) => a.localeCompare(b, "de"));
  }

  // Baut das HTML für die Massenlöschung von Buchungen, Fixkosten und Sonderausgaben mit Filtern
  function finMassenloeschungHtml() {
    const kategorien = finMlAlleKategorien();
    return `
      <details class="fin-massenloeschung" id="fin-ml-details">
        <summary>${ic("warnung")} Daten löschen (Buchungen / Fixkosten / Sonderausgaben)</summary>
        <div class="fin-ml-body">
          <p class="fin-ml-hinweis">
            Löscht endgültig und ohne Papierkorb. Zeitraum gilt für Buchungen (Datum)
            und Sonderausgaben (Jahr) – Fixkosten haben kein Datum und werden nur nach
            Typ/Kategorie gefiltert. Leer gelassene Filter wirken nicht einschränkend.
          </p>

          <div class="fin-ml-bereiche">
            <label><input type="checkbox" id="fin-ml-bereich-buchungen" checked> Buchungen</label>
            <label><input type="checkbox" id="fin-ml-bereich-fixkosten"> Fixkosten</label>
            <label><input type="checkbox" id="fin-ml-bereich-sonderausgaben"> Sonderausgaben</label>
          </div>

          <div class="fin-ml-filter-row">
            <label>Von<br><input type="date" id="fin-ml-von"></label>
            <label>Bis<br><input type="date" id="fin-ml-bis"></label>
            <label>Typ<br>
              <select id="fin-ml-typ">
                <option value="">Alle</option>
                <option value="ausgabe">Ausgabe</option>
                <option value="einnahme">Einnahme</option>
              </select>
            </label>
            <label>Kategorie<br>
              <select id="fin-ml-kategorie">
                <option value="">Alle</option>
                ${kategorien.map((k) => `<option value="${escapeAttr(k)}">${escapeHtml(k)}</option>`).join("")}
              </select>
            </label>
          </div>

          <button class="btn-primary" id="fin-ml-vorschau-btn">Vorschau anzeigen</button>
          <div id="fin-ml-ergebnis"></div>
        </div>
      </details>
    `;
  }

  // Liefert die in der Massenlöschung angehakten Datenarten
  function finMlAusgewaehlteBereiche() {
    const bereiche = [];
    if (document.getElementById("fin-ml-bereich-buchungen").checked) bereiche.push("buchungen");
    if (document.getElementById("fin-ml-bereich-fixkosten").checked) bereiche.push("fixkosten");
    if (document.getElementById("fin-ml-bereich-sonderausgaben").checked) bereiche.push("sonderausgaben");
    return bereiche;
  }

  // Sammelt die aktuellen Filter der Massenlöschung inkl. aktivem Bereich
  function finMlAktuelleFilter() {
    return {
      bereiche: finMlAusgewaehlteBereiche(),
      von: document.getElementById("fin-ml-von").value || null,
      bis: document.getElementById("fin-ml-bis").value || null,
      typ: document.getElementById("fin-ml-typ").value || null,
      kategorie: document.getElementById("fin-ml-kategorie").value || null,
      bereich: aktiverBereich,
    };
  }

  const FIN_ML_LABELS = { buchungen: "Buchungen", fixkosten: "Fixkosten", sonderausgaben: "Sonderausgaben" };

  // Bindet Vorschau- und Lösch-Buttons der Massenlöschung an die API finanzen_massenloeschung
  function finMassenloeschungBinden() {
    const vorschauBtn = document.getElementById("fin-ml-vorschau-btn");
    const ergebnisEl = document.getElementById("fin-ml-ergebnis");

    vorschauBtn.addEventListener("click", async () => {
      const filter = finMlAktuelleFilter();
      if (!filter.bereiche.length) {
        ergebnisEl.innerHTML = `<div class="fin-ml-ergebnis">Bitte mindestens einen Bereich auswählen.</div>`;
        return;
      }
      vorschauBtn.disabled = true;
      vorschauBtn.textContent = "Prüfe …";
      try {
        const res = await api("finanzen_massenloeschung", { ...filter, vorschau: true });
        finMlVorschauAktuell = JSON.stringify(filter);
        const gesamt = Object.values(res.anzahl).reduce((s, n) => s + n, 0);
        ergebnisEl.innerHTML = `
          <div class="fin-ml-ergebnis">
            <strong>${gesamt}</strong> Einträge treffen auf die Filter zu:
            <ul>
              ${Object.entries(res.anzahl).map(([k, n]) => `<li>${FIN_ML_LABELS[k] || k}: ${n}</li>`).join("")}
            </ul>
            ${gesamt > 0 ? `<button class="btn-danger" id="fin-ml-loeschen-btn">Endgültig löschen (${gesamt})</button>` : ""}
          </div>
        `;
        const loeschenBtn = document.getElementById("fin-ml-loeschen-btn");
        if (loeschenBtn) {
          loeschenBtn.addEventListener("click", async () => {
            if (finMlVorschauAktuell !== JSON.stringify(finMlAktuelleFilter())) {
              alert("Die Filter haben sich geändert – bitte erst erneut auf 'Vorschau anzeigen' klicken.");
              return;
            }
            if (!confirm(`Wirklich ${gesamt} Einträge endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) return;
            loeschenBtn.disabled = true;
            loeschenBtn.textContent = "Lösche …";
            try {
              const res2 = await api("finanzen_massenloeschung", { ...finMlAktuelleFilter(), vorschau: false });
              const gesamt2 = Object.values(res2.anzahl).reduce((s, n) => s + n, 0);
              ergebnisEl.innerHTML = `<div class="fin-ml-ergebnis">✓ ${gesamt2} Einträge gelöscht.</div>`;
              finMlVorschauAktuell = null;
              await ladeDaten();
              renderFinanzen();
            } catch (err) {
              console.error(err);
              ergebnisEl.innerHTML += `<div class="fin-ml-ergebnis">Fehler beim Löschen: ${escapeHtml(err.message || String(err))}</div>`;
            }
          });
        }
      } catch (err) {
        console.error(err);
        ergebnisEl.innerHTML = `<div class="fin-ml-ergebnis">Fehler bei der Vorschau: ${escapeHtml(err.message || String(err))}</div>`;
      } finally {
        vorschauBtn.disabled = false;
        vorschauBtn.textContent = "Vorschau anzeigen";
      }
    });
  }

  // Zeichnet das SVG-Balkendiagramm Einnahmen vs. Ausgaben je Monat
  function finChartEinnahmenAusgaben(zeilen) {
    const breite = 700, hoehe = 220, unten = 30, oben = 12, linksrand = 6;
    const maxWert = Math.max(1, ...zeilen.map((z) => Math.max(finZahl(z.einnahmen_gesamt), finZahl(z.ausgaben_gesamt))));
    const gruppenBreite = (breite - linksrand * 2) / 12;
    const balkenBreite = gruppenBreite * 0.32;

    let balken = "";
    zeilen.forEach((z, i) => {
      const x0 = linksrand + i * gruppenBreite + gruppenBreite * 0.14;
      const hE = ((hoehe - oben - unten) * finZahl(z.einnahmen_gesamt)) / maxWert;
      const hA = ((hoehe - oben - unten) * finZahl(z.ausgaben_gesamt)) / maxWert;
      balken += `<rect x="${x0}" y="${hoehe - unten - hE}" width="${balkenBreite}" height="${hE}" fill="#2f9e6f" rx="1.5"></rect>`;
      balken += `<rect x="${x0 + balkenBreite + 2}" y="${hoehe - unten - hA}" width="${balkenBreite}" height="${hA}" fill="var(--mod-finanzen)" rx="1.5"></rect>`;
      balken += `<text x="${x0 + balkenBreite}" y="${hoehe - 10}" font-size="9" fill="var(--ink-dim)" text-anchor="middle">${FIN_MONATSNAMEN_KURZ[i]}</text>`;
    });

    return `<svg viewBox="0 0 ${breite} ${hoehe}" style="width:100%; height:auto; display:block;">
      <line x1="0" y1="${hoehe - unten}" x2="${breite}" y2="${hoehe - unten}" stroke="var(--border)" stroke-width="1"></line>
      ${balken}
    </svg>`;
  }

  // Zeichnet das SVG-Liniendiagramm des Kontostands über das Jahr ab Startkapital
  function finChartKontostand(zeilen, startkapital) {
    const breite = 700, hoehe = 200, unten = 24, oben = 16;
    const werte = [startkapital, ...zeilen.map((z) => finZahl(z.kontostand_ende))];
    const minWert = Math.min(0, ...werte);
    const maxWert = Math.max(1, ...werte);
    const spanne = maxWert - minWert || 1;
    const schrittX = (breite - 20) / (werte.length - 1 || 1);
    const yVon = (w) => oben + (hoehe - oben - unten) * (1 - (w - minWert) / spanne);

    const punkte = werte.map((w, i) => `${10 + i * schrittX},${yVon(w).toFixed(1)}`).join(" ");
    const nullY = yVon(0).toFixed(1);

    const labels = ["Start", ...zeilen.map((z) => FIN_MONATSNAMEN_KURZ[z.monat - 1])];
    let labelSvg = "";
    werte.forEach((w, i) => {
      if (i % 2 === 0 || werte.length <= 7) {
        labelSvg += `<text x="${10 + i * schrittX}" y="${hoehe - 6}" font-size="9" fill="var(--ink-dim)" text-anchor="middle">${labels[i]}</text>`;
      }
    });

    return `<svg viewBox="0 0 ${breite} ${hoehe}" style="width:100%; height:auto; display:block;">
      <line x1="0" y1="${nullY}" x2="${breite}" y2="${nullY}" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"></line>
      <polyline points="${punkte}" fill="none" stroke="var(--accent)" stroke-width="2"></polyline>
      ${werte.map((w, i) => `<circle cx="${10 + i * schrittX}" cy="${yVon(w).toFixed(1)}" r="2.6" fill="var(--accent)"></circle>`).join("")}
      ${labelSvg}
    </svg>`;
  }

  // Zeichnet die Top-8-Ausgabenkategorien des Jahres als SVG-Balkendiagramm
  function finChartKategorien(jahr) {
    const summenProKategorie = {};
    buchungenAktuell()
      .filter((b) => b.typ !== "einnahme" && (b.datum || "").slice(0, 4) === String(jahr))
      .forEach((b) => {
        const kat = b.kategorie || "Sonstiges";
        summenProKategorie[kat] = (summenProKategorie[kat] || 0) + finZahl(b.betrag);
      });

    const eintraege = Object.entries(summenProKategorie).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!eintraege.length) return `<p class="empty-text">Keine Ausgaben-Buchungen für ${jahr}.</p>`;

    const breite = 700;
    const zeilenHoehe = 26;
    const hoehe = eintraege.length * zeilenHoehe + 10;
    const maxWert = Math.max(...eintraege.map(([, w]) => w));
    const labelBreite = 130;
    const balkenMax = breite - labelBreite - 60;

    const balken = eintraege.map(([kat, wert], i) => {
      const y = i * zeilenHoehe + 6;
      const b = (balkenMax * wert) / maxWert;
      return `
        <text x="0" y="${y + 13}" font-size="10" fill="var(--ink)">${escapeHtml(kat.length > 16 ? kat.slice(0, 15) + "…" : kat)}</text>
        <rect x="${labelBreite}" y="${y}" width="${Math.max(2, b)}" height="16" rx="3" fill="var(--mod-finanzen)"></rect>
        <text x="${labelBreite + b + 6}" y="${y + 13}" font-size="10" fill="var(--ink-dim)">${finEuro(wert)}</text>
      `;
    }).join("");

    return `<svg viewBox="0 0 ${breite} ${hoehe}" style="width:100%; height:auto; display:block;">${balken}</svg>`;
  }


  // ==========================================================
  // Ernährung (Kalorien-Tagebuch) – nur Bereich Privat
  // Tagesdaten kommen NICHT mit "liste", sondern je Tag über
  // "ernaehrung_tag" (das Tagebuch wächst jeden Tag).
  // Aufbau: Kopf (Datum, Summen) und Mahlzeiten-Liste werden neu
  // gezeichnet, das Hinzufügen-Feld (#ern-hinzu) steht fest im HTML
  // und wird nie mitgezeichnet – sonst ginge Getipptes verloren.
  // ==========================================================
  const ERN_MAHLZEITEN = [
    ["fruehstueck", "Frühstück", "sonnenaufgang"],
    ["mittag", "Mittag", "besteck"],
    ["abend", "Abend", "mond"],
    ["snack", "Snacks", "apfel"],
  ];
  const ERN_MAHLZEIT_NAME = Object.fromEntries(ERN_MAHLZEITEN.map(([k, n]) => [k, n]));

  let ernDatum = null;            // "YYYY-MM-DD"; null = heute
  let ernGeladenFuer = null;      // für welches Datum ernEintraege gilt
  let ernEintraege = [];
  let ernZuletzt = [];            // zuletzt verwendete Lebensmittel (mit letzte_menge, mahlzeiten)
  let ernLaedt = false;
  let ernFehler = "";
  let ernHinzuMahlzeit = null;    // offenes Hinzufügen-Feld für diese Mahlzeit
  let ernListe = [];              // gerade angezeigte Treffer/Zuletzt-Liste (Auswahl per Index)
  let ernAuswahl = null;          // gewähltes Lebensmittel für die Mengeneingabe
  let ernSucheTimer = null;
  let ernSucheNr = 0;             // verhindert, dass alte Antworten neue überschreiben
  let ernBearbeitenId = null;
  let ernVortag = {};             // { mahlzeit: {anzahl, kcal} } für den Tag vor ernGeladenFuer
  let ernKopiertGerade = false;   // Doppeltippen beim Kopieren verhindern
  let ernStartStand = null;       // { datum, kcal } oder { datum, fehler } für die Start-Kachel
  let ernStartLaedt = false;
  let ernWoche = null;            // { start, tage: { datum: {anzahl, kcal, eiweiss, …} } }
  let ernWocheLaedt = false;
  let ernWocheFehler = "";

  // Liefert das gewählte Ernährungsdatum oder heute
  function ernAktDatum() { return ernDatum || heuteISO(); }
  // Formatiert einen Grammwert, "–" wenn leer
  function ernGramm(v) { return v === null || v === undefined ? "–" : ernZahl(v) + " g"; }

  // Formatiert eine Zahl deutsch mit max. n Nachkommastellen, "–" wenn leer
  function ernZahl(v, stellen = 1) {
    if (v === null || v === undefined || v === "") return "–";
    return Number(v).toLocaleString("de-DE", { maximumFractionDigits: stellen });
  }

  // Liefert das Datumslabel (Heute/Gestern/Morgen oder Wochentag) für die Ernährungsansicht
  function ernDatumLabel(iso) {
    const diff = tageSeitIso(iso, heuteISO());
    const wochentag = new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long" });
    if (diff === 0) return `Heute, ${datumDe(iso)}`;
    if (diff === 1) return `Gestern, ${datumDe(iso)}`;
    if (diff === -1) return `Morgen, ${datumDe(iso)}`;
    return `${wochentag}, ${datumDe(iso)}`;
  }

  // Vorschlag nach Uhrzeit, wenn oben "+ Essen eintragen" getippt wird
  function ernStandardMahlzeit() {
    const d = new Date();
    const min = d.getHours() * 60 + d.getMinutes();
    if (min < 10 * 60 + 30) return "fruehstueck";
    if (min < 14 * 60 + 30) return "mittag";
    if (min >= 17 * 60 + 30 && min < 21 * 60 + 30) return "abend";
    return "snack";
  }

  // Zusatzwerte (Session 22): bei älteren Einträgen und BLS oft leer, daher
  // eigene Zählung statt „luecken“ – sonst stünde fast jeder Tag als lückenhaft da
  const ERN_ZUSATZ = [["zucker", "Zucker", 1], ["ges_fett", "Ges. Fettsäuren", 1], ["salz", "Salz", 2]];

  function ernSumme(liste) {
    const s = { kcal: 0, eiweiss: 0, fett: 0, kohlenhydrate: 0, ballaststoffe: 0, luecken: false, anzahl: liste.length, zusatz: {} };
    for (const [f] of ERN_ZUSATZ) s.zusatz[f] = { summe: 0, mit: 0 };
    for (const e of liste) {
      s.kcal += Number(e.kcal) || 0;
      for (const f of ["eiweiss", "fett", "kohlenhydrate", "ballaststoffe"]) {
        if (e[f] === null || e[f] === undefined) s.luecken = true;
        else s[f] += Number(e[f]);
      }
      for (const [f] of ERN_ZUSATZ) {
        if (e[f] !== null && e[f] !== undefined && e[f] !== "") { s.zusatz[f].summe += Number(e[f]); s.zusatz[f].mit += 1; }
      }
    }
    return s;
  }

  // Zeile unter den Makros: Zucker · gesättigte Fettsäuren · Salz (mit
  // DGE-Orientierungswert höchstens 6 g Salz am Tag). Nur, wenn überhaupt
  // ein Wert vorliegt.
  const ERN_SALZ_RICHTWERT = 6;
  function ernZusatzHtml(s) {
    if (!s.anzahl || !ERN_ZUSATZ.some(([f]) => s.zusatz[f].mit > 0)) return "";
    const kacheln = ERN_ZUSATZ.map(([f, label, stellen]) => {
      const z = s.zusatz[f];
      const teilweise = z.mit && z.mit < s.anzahl
        ? `<sup class="ern-teilweise" title="nur aus ${z.mit} von ${s.anzahl} Einträgen">*</sup>` : "";
      const wert = z.mit ? `${ernZahl(z.summe, stellen)} g${teilweise}` : "–";
      if (f !== "salz") {
        return `<div class="ern-makro"><span class="ern-makro-label">${label}</span><span class="ern-makro-wert">${wert}</span></div>`;
      }
      const ueber = z.summe > ERN_SALZ_RICHTWERT;
      const breite = Math.min(100, Math.round((z.summe / ERN_SALZ_RICHTWERT) * 100));
      return `
        <div class="ern-makro">
          <span class="ern-makro-label">${label}</span>
          <span class="ern-makro-wert${ueber ? " ern-ueber" : ""}">${wert}${z.mit ? ` <span class="ern-makro-ziel">/ max. ${ERN_SALZ_RICHTWERT} g</span>` : ""}</span>
          ${z.mit ? `<span class="ern-makro-balken"><span class="${ueber ? "ern-balken-ueber" : "ern-balken-salz"}" style="width:${breite}%"></span></span>` : ""}
        </div>`;
    });
    const unvollstaendig = ERN_ZUSATZ.some(([f]) => s.zusatz[f].mit > 0 && s.zusatz[f].mit < s.anzahl);
    return `<div class="ern-makros ern-zusatz">${kacheln.join("")}</div>
      ${unvollstaendig ? `<p class="notiz-meta" style="margin:0.4rem 0 0;">* nur aus den Einträgen mit Wert (z. B. fehlen sie bei älteren Einträgen oder einzelnen Produkten) – die echte Menge liegt eher höher.</p>` : ""}`;
  }

  // Lädt die Ernährungseinträge, zuletzt verwendete Lebensmittel und Vortag für das gewählte Datum
  async function ernTagLaden() {
    const datum = ernAktDatum();
    ernLaedt = true;
    ernFehler = "";
    renderErnaehrung();
    try {
      const res = await api("ernaehrung_tag", { datum });
      if (datum !== ernAktDatum()) return; // inzwischen anderer Tag gewählt
      ernEintraege = res.eintraege || [];
      ernZuletzt = res.zuletzt || [];
      ernVortag = res.vortag || {};
      ernGeladenFuer = datum;
    } catch (e) {
      ernFehler = e.message === "unauthorized" ? "" : "Konnte den Tag nicht laden: " + e.message;
    } finally {
      ernLaedt = false;
      renderErnaehrung();
    }
  }

  // Zugeklappte Mahlzeiten (Schlüssel), bleibt im Browser gespeichert
  let ernZugeklappt = new Set();
  try { ernZugeklappt = new Set(JSON.parse(localStorage.getItem("ern-zugeklappt") || "[]")); } catch (_e) { /* leer lassen */ }
  function ernZugeklapptSpeichern() {
    try { localStorage.setItem("ern-zugeklappt", JSON.stringify([...ernZugeklappt])); } catch (_e) { /* egal */ }
  }
  // Klappt eine Mahlzeit auf/zu, merkt den Zustand und rendert neu
  window.ernMahlzeitKlappen = function(schluessel) {
    if (ernZugeklappt.has(schluessel)) ernZugeklappt.delete(schluessel); else ernZugeklappt.add(schluessel);
    ernZugeklapptSpeichern();
    renderErnaehrung();
  };

  // Rendert die Ernährungs-Tagesansicht (Summe, Ziele, Mahlzeiten); lädt Profil/Tag bei Bedarf nach
  function renderErnaehrung() {
    const kopfEl = document.getElementById("ern-summe");
    const listeEl = document.getElementById("ern-mahlzeiten");
    if (!kopfEl || !listeEl) return;
    const datum = ernAktDatum();
    if (!ernProfilGeladen && !ernProfilLaedt && !ernProfilFehlgeschlagen) ernProfilLaden();
    if (ernGeladenFuer !== datum && !ernLaedt && !ernFehler) { ernTagLaden(); return; }

    document.getElementById("ern-datum-text").textContent = ernDatumLabel(datum);
    document.getElementById("ern-datum-wahl").value = datum;
    ernHinzuTitelAktualisieren();
    ernKopRendern();

    if (ernFehler) {
      kopfEl.innerHTML = `<p class="empty-text">${escapeHtml(ernFehler)} <button class="link-btn" onclick="ernNeuLaden()">Nochmal versuchen</button></p>`;
      listeEl.innerHTML = "";
      return;
    }
    if (ernGeladenFuer !== datum) {
      kopfEl.innerHTML = `<p class="empty-text">Lädt …</p>`;
      listeEl.innerHTML = "";
      return;
    }

    const s = ernSumme(ernEintraege);
    kopfEl.innerHTML = ernSummeHtml(s, ernZiele(datum));
    ernSchritteRendern();
    if (datum === heuteISO()) ernStartStand = { datum, kcal: s.kcal };

    listeEl.innerHTML = ERN_MAHLZEITEN.map(([schluessel, name, icon]) => {
      const eintraege = ernEintraege.filter((e) => e.mahlzeit === schluessel);
      const summe = ernSumme(eintraege);
      // Klappbar nur mit Einträgen; eine leere Mahlzeit zeigt ggf. „Wie gestern“
      const zu = eintraege.length > 0 && ernZugeklappt.has(schluessel) && !eintraege.some((e) => e.id === ernBearbeitenId);
      const kcalText = eintraege.length
        ? ernZahl(summe.kcal, 0) + " kcal" + (zu ? ` · ${eintraege.length}×` : "")
        : "";
      const titel = eintraege.length
        ? `<button class="ern-mahlzeit-toggle" onclick="ernMahlzeitKlappen('${schluessel}')" aria-expanded="${zu ? "false" : "true"}" aria-controls="ern-mz-${schluessel}">
             <span class="ern-mahlzeit-pfeil${zu ? " zu" : ""}" aria-hidden="true">▾</span>
             <span class="ern-mahlzeit-titel">${ic(icon)} ${name}</span>
             <span class="ern-mahlzeit-kcal">${kcalText}</span>
           </button>`
        : `<h3>${ic(icon)} ${name}</h3>`;
      return `
        <section class="ern-mahlzeit${zu ? " zugeklappt" : ""}">
          <div class="ern-mahlzeit-kopf">
            ${titel}
            <button class="btn-secondary ern-plus" onclick="ernHinzuOeffnen('${schluessel}')">+ Hinzufügen</button>
          </div>
          ${eintraege.length
            ? `<div class="task-list${zu ? " hidden" : ""}" id="ern-mz-${schluessel}">${eintraege.map(ernEintragHtml).join("")}</div>`
            : ernKopierenHtml(schluessel)}
        </section>`;
    }).join("");
    ernWocheRendern();
  }

  // Baut das HTML eines Ernährungseintrags (oder dessen Bearbeitungsformular)
  function ernEintragHtml(e) {
    if (e.id === ernBearbeitenId) return ernBearbeitenHtml(e);
    const teile = [];
    if (e.menge_g !== null && e.menge_g !== undefined) teile.push(`${ernZahl(e.menge_g)} g`);
    teile.push(`E ${ernZahl(e.eiweiss)} · F ${ernZahl(e.fett)} · KH ${ernZahl(e.kohlenhydrate)}`);
    if (!e.lebensmittel_id && (e.menge_g === null || e.menge_g === undefined)) teile.push("freier Eintrag");
    return `
      <div class="task ern-eintrag">
        <div class="task-info">
          <span class="task-titel">${escapeHtml(e.name)}</span>
          <span class="notiz-meta">${teile.join(" · ")}</span>
        </div>
        <span class="ern-eintrag-kcal">${ernZahl(e.kcal, 0)} kcal</span>
        <button class="task-edit-btn" onclick="ernBearbeiten('${e.id}')" aria-label="Bearbeiten">${ic("stift")}</button>
        <button class="task-delete" onclick="ernLoeschen('${e.id}')" aria-label="Löschen">${ic("x")}</button>
      </div>`;
  }

  // Baut das Bearbeitungsformular eines Eintrags: Menge bzw. bei freien Einträgen alle Nährwerte
  function ernBearbeitenHtml(e) {
    const mahlzeitSelect = `<select id="ern-edit-mahlzeit" aria-label="Mahlzeit">${ERN_MAHLZEITEN.map(([k, n]) =>
      `<option value="${k}" ${k === e.mahlzeit ? "selected" : ""}>${n}</option>`).join("")}</select>`;
    const mitMenge = e.menge_g !== null && e.menge_g !== undefined;
    const felder = mitMenge
      ? `<label class="ern-feld">Menge (g)<input type="number" id="ern-edit-menge" min="1" max="5000" step="any" inputmode="decimal" value="${Number(e.menge_g)}"></label>`
      : `<label class="ern-feld ern-feld-breit">Bezeichnung<input type="text" id="ern-edit-name" maxlength="120" value="${escapeHtml(e.name)}"></label>
         <label class="ern-feld">kcal<input type="number" id="ern-edit-kcal" min="0" max="20000" step="any" inputmode="decimal" value="${e.kcal ?? ""}"></label>
         <label class="ern-feld">Eiweiß g<input type="number" id="ern-edit-eiweiss" min="0" step="any" inputmode="decimal" value="${e.eiweiss ?? ""}"></label>
         <label class="ern-feld">Fett g<input type="number" id="ern-edit-fett" min="0" step="any" inputmode="decimal" value="${e.fett ?? ""}"></label>
         <label class="ern-feld">KH g<input type="number" id="ern-edit-kh" min="0" step="any" inputmode="decimal" value="${e.kohlenhydrate ?? ""}"></label>
         <label class="ern-feld">davon gesättigte g<input type="number" id="ern-edit-gesfett" min="0" step="any" inputmode="decimal" value="${e.ges_fett ?? ""}"></label>
         <label class="ern-feld">davon Zucker g<input type="number" id="ern-edit-zucker" min="0" step="any" inputmode="decimal" value="${e.zucker ?? ""}"></label>
         <label class="ern-feld">Ballastst. g<input type="number" id="ern-edit-bal" min="0" step="any" inputmode="decimal" value="${e.ballaststoffe ?? ""}"></label>
         <label class="ern-feld">Salz g<input type="number" id="ern-edit-salz" min="0" step="any" inputmode="decimal" value="${e.salz ?? ""}"></label>`;
    return `
      <div class="task task-edit ern-eintrag">
        <div class="task-info">
          ${mitMenge ? `<span class="task-titel">${escapeHtml(e.name)}</span>` : ""}
          <div class="task-edit-felder">
            ${felder}
            <label class="ern-feld">Mahlzeit${mahlzeitSelect}</label>
          </div>
          <div class="row" style="margin-bottom:0;">
            <button class="btn-primary" onclick="ernBearbeitenSpeichern('${e.id}')">Speichern</button>
            <button class="btn-secondary" onclick="ernBearbeitenAbbrechen()">Abbrechen</button>
          </div>
        </div>
      </div>`;
  }

  // "Wie gestern": nur bei leerer Mahlzeit, wenn der Vortag dort Einträge hat
  function ernKopierenHtml(mahlzeit) {
    const v = ernVortag[mahlzeit];
    if (!v || !v.anzahl) return "";
    const tag = ernAktDatum() === heuteISO() ? "gestern" : "am Vortag";
    return `
      <button class="ern-kopieren" onclick="ernKopieren('${mahlzeit}', this)">
        ${ic("kopieren")} Wie ${tag} <span class="notiz-meta">· ${v.anzahl} ${v.anzahl === 1 ? "Eintrag" : "Einträge"} · ${ernZahl(v.kcal, 0)} kcal</span>
      </button>`;
  }

  // Kopiert eine Mahlzeit vom Vortag auf das gewählte Datum
  window.ernKopieren = async function(mahlzeit, btn) {
    if (ernKopiertGerade) return;
    const nach = ernAktDatum();
    ernKopiertGerade = true;
    if (btn) btn.disabled = true;
    try {
      const res = await api("ernaehrung_kopieren", { von: addTage(nach, -1), nach, mahlzeit });
      if (nach === ernAktDatum()) {
        ernEintraege = ernEintraege.concat(res.eintraege || []);
      }
    } catch (err) {
      if (err.message !== "unauthorized") alert(err.message);
      // Stand vom Server holen (z.B. wenn schon kopiert war)
      ernGeladenFuer = null;
    } finally {
      ernKopiertGerade = false;
      renderErnaehrung();
    }
  };

  // ---- ⧉ Kopieren: ganzer Tag oder eine Mahlzeit, auch in gefüllte ----
  // Ziel ist immer der oben gewählte Tag. Die Vorschau für den Quelltag
  // kommt aus ernaehrung_uebersicht; ist Quelle = gewählter Tag, direkt aus
  // ernEintraege (immer aktuell).
  let ernKopZielTag = null;       // Tag, für den "Von" zuletzt vorbelegt wurde
  let ernKopCache = {};           // { datum: { mahlzeit: {anzahl, kcal} } }
  let ernKopLaedt = null;         // Datum, das gerade geladen wird
  let ernKopFehler = "";
  let ernKopStatus = "";
  let ernKopLaeuft = false;

  // Liest Quelltag, Zieltag und Mahlzeit(en) aus dem Kopieren-Block
  function ernKopAuswahl() {
    const mahlzeit = document.getElementById("ern-kop-mahlzeit").value;
    return {
      von: document.getElementById("ern-kop-von").value,
      nach: ernAktDatum(),
      mahlzeit,
      zielMahlzeit: mahlzeit === "alle" ? null : document.getElementById("ern-kop-ziel").value,
    };
  }

  // Anzahl/kcal je Mahlzeit für ein Datum, oder null (noch nicht geladen)
  function ernKopUebersicht(datum) {
    if (datum === ernGeladenFuer) {
      const u = {};
      for (const e of ernEintraege) {
        const m = u[e.mahlzeit] || (u[e.mahlzeit] = { anzahl: 0, kcal: 0 });
        m.anzahl += 1;
        m.kcal += Number(e.kcal) || 0;
      }
      return u;
    }
    return ernKopCache[datum] || null;
  }

  // Lädt die Mahlzeiten-Übersicht eines Tages für den Kopieren-Block in den Cache
  async function ernKopLaden(datum) {
    ernKopLaedt = datum;
    ernKopFehler = "";
    try {
      const res = await api("ernaehrung_uebersicht", { datum });
      ernKopCache[datum] = res.mahlzeiten || {};
    } catch (e) {
      if (datum === ernKopAuswahl().von) {
        ernKopFehler = e.message === "unauthorized" ? "" : "Konnte den Tag nicht laden: " + e.message;
      }
    } finally {
      if (ernKopLaedt === datum) ernKopLaedt = null;
      ernKopRendern();
    }
  }

  // Rendert den Block "Mahlzeiten kopieren" mit Vorschau von Quell- und Zieltag
  function ernKopRendern() {
    const block = document.getElementById("ern-kopieren-block");
    if (!block || !block.open) return;
    const vonFeld = document.getElementById("ern-kop-von");
    const nach = ernAktDatum();
    if (ernKopZielTag !== nach) {
      // Anderer Zieltag: Vortag vorschlagen, Zwischenstände verwerfen
      ernKopZielTag = nach;
      vonFeld.value = addTage(nach, -1);
      ernKopCache = {};
      ernKopFehler = "";
      ernKopStatus = "";
    }
    const { von, mahlzeit, zielMahlzeit } = ernKopAuswahl();
    document.getElementById("ern-kop-ziel-feld").classList.toggle("hidden", mahlzeit === "alle");
    document.getElementById("ern-kop-ziel-text").innerHTML =
      `Kopiert Einträge in: <strong>${escapeHtml(ernDatumLabel(nach))}</strong> (oben gewählter Tag).`;
    const vorschauEl = document.getElementById("ern-kop-vorschau");
    const btn = document.getElementById("btn-ern-kop");
    document.getElementById("ern-kop-status").textContent = ernKopStatus;
    const aus = (text, klasse = "notiz-meta") => {
      vorschauEl.innerHTML = text ? `<p class="${klasse}">${text}</p>` : "";
      btn.disabled = true;
      btn.textContent = "Kopieren";
    };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(von)) return aus("Bitte einen Tag wählen.");
    if (von === nach && (mahlzeit === "alle" || mahlzeit === zielMahlzeit)) {
      return aus("Quelle und Ziel sind gleich – anderen Tag oder andere Ziel-Mahlzeit wählen.");
    }
    if (ernKopFehler) {
      vorschauEl.innerHTML = `<p class="empty-text">${escapeHtml(ernKopFehler)} <button class="link-btn" onclick="ernKopNeu()">Nochmal versuchen</button></p>`;
      btn.disabled = true;
      return;
    }
    const quelle = ernKopUebersicht(von);
    if (!quelle) {
      if (ernKopLaedt !== von) ernKopLaden(von);
      return aus("Lädt …");
    }
    const zielGeladen = ernGeladenFuer === nach;
    const ziel = zielGeladen ? ernKopUebersicht(nach) : {};
    const wt = new Date(von + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
    const vonText = `${wt} ${datumDe(von).slice(0, 6)}`;

    // Welche Mahlzeiten gehen wohin
    const paare = (mahlzeit === "alle" ? ERN_MAHLZEITEN.map(([k]) => k) : [mahlzeit])
      .filter((k) => quelle[k] && quelle[k].anzahl)
      .map((k) => ({ von: k, nach: mahlzeit === "alle" ? k : zielMahlzeit, ...quelle[k] }));
    if (!paare.length) {
      return aus(`${vonText}${mahlzeit === "alle" ? "" : " · " + ERN_MAHLZEIT_NAME[mahlzeit]}: nichts eingetragen.`);
    }
    const anzahl = paare.reduce((a, p) => a + p.anzahl, 0);
    const kcal = paare.reduce((a, p) => a + p.kcal, 0);
    const zeilen = paare.map((p) =>
      `${ERN_MAHLZEIT_NAME[p.von]}${p.von !== p.nach ? " → " + ERN_MAHLZEIT_NAME[p.nach] : ""}: ${p.anzahl}× · ${ernZahl(p.kcal, 0)} kcal`);
    const gefuellt = [...new Set(paare.map((p) => p.nach))].filter((k) => ziel[k] && ziel[k].anzahl);
    let html = `<p class="notiz-meta">Aus ${vonText}:<br>${zeilen.join("<br>")}${paare.length > 1 ? `<br>Zusammen ${ernZahl(kcal, 0)} kcal` : ""}</p>`;
    if (gefuellt.length) {
      html += `<p class="ern-kop-hinweis">${ic("warnung")} ${gefuellt.map((k) => ERN_MAHLZEIT_NAME[k]).join(", ")} ${gefuellt.length === 1 ? "hat" : "haben"} schon Einträge – die kopierten kommen dazu.</p>`;
    }
    vorschauEl.innerHTML = html;
    btn.disabled = !zielGeladen || ernKopLaeuft;
    btn.textContent = `${anzahl} ${anzahl === 1 ? "Eintrag" : "Einträge"} kopieren`;
  }

  // Leert Cache und Fehler des Kopieren-Blocks und rendert ihn neu
  window.ernKopNeu = function() { ernKopCache = {}; ernKopFehler = ""; ernKopRendern(); };

  // Kopiert die gewählten Mahlzeiten auf den Zieltag, nach Rückfrage bei schon belegten Mahlzeiten
  async function ernKopAusfuehren() {
    if (ernKopLaeuft) return;
    const { von, nach, mahlzeit, zielMahlzeit } = ernKopAuswahl();
    if (ernGeladenFuer !== nach) return;
    const quelle = ernKopUebersicht(von) || {};
    const ziel = ernKopUebersicht(nach) || {};
    const zielMahlzeiten = mahlzeit === "alle"
      ? ERN_MAHLZEITEN.map(([k]) => k).filter((k) => quelle[k] && quelle[k].anzahl)
      : [zielMahlzeit];
    const gefuellt = zielMahlzeiten.filter((k) => ziel[k] && ziel[k].anzahl);
    if (gefuellt.length && !confirm(
      `${gefuellt.map((k) => ERN_MAHLZEIT_NAME[k]).join(", ")} ${gefuellt.length === 1 ? "hat" : "haben"} am Zieltag schon Einträge. Kopierte Einträge dazulegen?`)) return;

    ernKopLaeuft = true;
    ernKopStatus = "Kopiert …";
    ernKopRendern();
    try {
      const res = await api("ernaehrung_kopieren", {
        von, nach, mahlzeit,
        ...(mahlzeit === "alle" ? {} : { ziel_mahlzeit: zielMahlzeit }),
        ergaenzen: gefuellt.length > 0,
      });
      const neu = res.eintraege || [];
      if (nach === ernGeladenFuer) ernEintraege = ernEintraege.concat(neu);
      // Kopierte Mahlzeiten aufklappen, damit man sieht, was dazukam
      for (const k of new Set(neu.map((e) => e.mahlzeit))) ernZugeklappt.delete(k);
      ernZugeklapptSpeichern();
      ernKopStatus = `✓ ${neu.length} ${neu.length === 1 ? "Eintrag" : "Einträge"} kopiert`;
    } catch (err) {
      ernKopStatus = "";
      if (err.message !== "unauthorized") alert(err.message);
      ernGeladenFuer = null; // Stand vom Server holen
    } finally {
      ernKopLaeuft = false;
      renderErnaehrung();
    }
  }

  document.getElementById("ern-kopieren-block").addEventListener("toggle", (e) => {
    if (e.target.open) { ernKopZielTag = null; ernKopRendern(); }
  });
  document.getElementById("ern-kop-von").addEventListener("change", () => { ernKopStatus = ""; ernKopFehler = ""; ernKopRendern(); });
  document.getElementById("ern-kop-mahlzeit").addEventListener("change", (e) => {
    if (e.target.value !== "alle") document.getElementById("ern-kop-ziel").value = e.target.value;
    ernKopStatus = "";
    ernKopRendern();
  });
  document.getElementById("ern-kop-ziel").addEventListener("change", () => { ernKopStatus = ""; ernKopRendern(); });
  document.getElementById("btn-ern-kop").addEventListener("click", ernKopAusfuehren);

  // ---- Start-Kachel "noch X kcal" (nur Privat) ----
  async function ernStartLaden() {
    const datum = heuteISO();
    ernStartLaedt = true;
    try {
      const res = await api("ernaehrung_tag", { datum });
      ernStartStand = { datum, kcal: ernSumme(res.eintraege || []).kcal };
      // Gleich ans Tagebuch übergeben – sonst lädt ein Tipp auf die Kachel
      // denselben Tag ein zweites Mal. Nur wenn dort gerade nichts anderes läuft.
      if (!ernLaedt && ernGeladenFuer !== datum && ernAktDatum() === datum) {
        ernEintraege = res.eintraege || [];
        ernZuletzt = res.zuletzt || [];
        ernVortag = res.vortag || {};
        ernGeladenFuer = datum;
        ernFehler = "";
      }
    } catch (e) {
      ernStartStand = { datum, fehler: true };
    } finally {
      ernStartLaedt = false;
      if (aktiverTab === "heute") renderHeute();
    }
  }

  // Baut die Startseiten-Kachel mit kcal heute bzw. Rest zum Tagesziel (nur Privat)
  function ernStartKachelHtml() {
    if (aktiverBereich !== "privat" || !reiterIstSichtbar("privat", "ernaehrung")) return "";
    const datum = heuteISO();
    if (!ernProfilGeladen && !ernProfilLaedt && !ernProfilFehlgeschlagen) ernProfilLaden();
    let kcal = null;
    if (ernGeladenFuer === datum) kcal = ernSumme(ernEintraege).kcal;
    else if (ernStartStand && ernStartStand.datum === datum) kcal = ernStartStand.fehler ? null : ernStartStand.kcal;
    else if (!ernStartLaedt) ernStartLaden();

    let zahl = "…", label = "kcal heute";
    const z = ernProfilGeladen ? ernZiele(datum) : null;
    if (ernStartStand && ernStartStand.datum === datum && ernStartStand.fehler && kcal === null) {
      zahl = "–"; label = "Ernährung nicht geladen";
    } else if (kcal !== null && z) {
      const rest = Math.round(z.ziel - kcal);
      zahl = ernZahl(Math.abs(rest), 0);
      label = rest >= 0 ? "kcal übrig" : "kcal über Ziel";
    } else if (kcal !== null) {
      zahl = ernZahl(kcal, 0);
    }
    return kennzahlHtml(zahl, label, "ernStartKachelKlick()");
  }

  // Öffnet beim Klick auf die Startkachel den Ernährungsreiter auf heute
  window.ernStartKachelKlick = function() {
    ernDatum = null;
    ernBearbeitenId = null;
    tabWechseln("ernaehrung");
  };

  // ---- Wochenübersicht (📊 Woche, Mo–So der gewählten Woche) ----
  function ernKw(iso) {
    // ISO-Kalenderwoche: Donnerstag der Woche bestimmt das Jahr
    const [j, m, t] = iso.split("-").map(Number);
    const d = new Date(Date.UTC(j, m - 1, t));
    const wt = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - wt);
    const jahrStart = Date.UTC(d.getUTCFullYear(), 0, 1);
    return Math.ceil(((d - jahrStart) / 86400000 + 1) / 7);
  }

  // Lädt die Ernährungssummen einer Woche (Mo–So) und rendert die Wochenübersicht
  async function ernWocheLaden(start) {
    ernWocheLaedt = true;
    ernWocheFehler = "";
    try {
      const res = await api("ernaehrung_woche", { von: start, bis: addTage(start, 6) });
      ernWoche = { start, tage: res.tage || {} };
    } catch (e) {
      ernWocheFehler = e.message === "unauthorized" ? "" : "Konnte die Woche nicht laden: " + e.message;
    } finally {
      ernWocheLaedt = false;
      if (wochenstartISO(ernAktDatum()) === start) ernWocheRendern();
    }
  }

  // Rendert die Wochenübersicht der Ernährung mit KW und Tageswerten
  function ernWocheRendern() {
    const block = document.getElementById("ern-woche-block");
    const el = document.getElementById("ern-woche");
    if (!block || !el || !block.open) return;
    const gewaehlt = ernAktDatum();
    const start = wochenstartISO(gewaehlt);
    const ende = addTage(start, 6);
    document.getElementById("ern-woche-titel").textContent =
      `KW ${ernKw(start)} · ${datumDe(start).slice(0, 6)}–${datumDe(ende).slice(0, 6)}`;

    if (ernWocheFehler) {
      el.innerHTML = `<p class="empty-text">${escapeHtml(ernWocheFehler)} <button class="link-btn" onclick="ernWocheNeu()">Nochmal versuchen</button></p>`;
      return;
    }
    if (!ernWoche || ernWoche.start !== start) {
      el.innerHTML = `<p class="empty-text">Lädt …</p>`;
      if (!ernWocheLaedt) ernWocheLaden(start);
      return;
    }
    // Den gerade geladenen Tag aus dem Tagebuch übernehmen – der ist aktueller
    if (ernGeladenFuer && ernGeladenFuer >= start && ernGeladenFuer <= ende) {
      if (ernEintraege.length) ernWoche.tage[ernGeladenFuer] = { anzahl: ernEintraege.length, ...ernSumme(ernEintraege) };
      else delete ernWoche.tage[ernGeladenFuer];
    }

    const heute = heuteISO();
    let tageMit = 0, kcalSumme = 0, eiweissSumme = 0, zielSumme = 0, eiweissZielSumme = 0, tageMitZiel = 0, luecken = false;
    const zeilen = [];
    for (let i = 0; i < 7; i++) {
      const d = addTage(start, i);
      const t = ernWoche.tage[d];
      const z = ernProfilGeladen ? ernZiele(d) : null;
      const wt = new Date(d + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
      const klassen = ["ern-woche-tag"];
      if (d === gewaehlt) klassen.push("gewaehlt");
      if (d > heute) klassen.push("zukunft");
      let mitte, rechts = "";
      if (t && t.anzahl) {
        tageMit++; kcalSumme += t.kcal; eiweissSumme += t.eiweiss;
        if (t.luecken) luecken = true;
        if (z) { tageMitZiel++; zielSumme += z.ziel; eiweissZielSumme += z.eiweiss; }
        const prozent = z ? Math.min(100, Math.round((t.kcal / z.ziel) * 100)) : 0;
        const diff = z ? Math.round(t.kcal - z.ziel) : null;
        mitte = `
          <span class="ern-woche-kcal">${ernZahl(t.kcal, 0)}${z ? ` <span class="ern-makro-ziel">/ ${ernZahl(z.ziel, 0)}</span>` : ""} kcal</span>
          ${z ? `<span class="ern-kcal-balken${diff > 0 ? " ueber" : ""}"><span style="width:${prozent}%"></span></span>` : ""}
          <span class="notiz-meta">E ${ernZahl(t.eiweiss, 0)} · F ${ernZahl(t.fett, 0)} · KH ${ernZahl(t.kohlenhydrate, 0)} g</span>`;
        if (diff !== null) rechts = `<span class="ern-woche-diff${diff > 0 ? " ueber" : ""}">${diff > 0 ? "+" : diff < 0 ? "−" : "±"}${ernZahl(Math.abs(diff), 0)}</span>`;
      } else {
        mitte = `<span class="notiz-meta">${d > heute ? "" : "nichts eingetragen"}</span>`;
      }
      zeilen.push(`
        <button class="${klassen.join(" ")}" onclick="ernWocheTag('${d}')" aria-label="${wt} ${datumDe(d)} öffnen">
          <span class="ern-woche-datum"><strong>${wt}</strong> ${datumDe(d).slice(0, 6)}</span>
          <span class="ern-woche-mitte">${mitte}</span>
          ${rechts}
        </button>`);
    }

    let kopf;
    if (!tageMit) {
      kopf = `<p class="notiz-meta" style="margin-top:0;">In dieser Woche ist noch nichts eingetragen.</p>`;
    } else {
      const teile = [`Ø <strong>${ernZahl(kcalSumme / tageMit, 0)} kcal</strong> an ${tageMit} ${tageMit === 1 ? "Tag" : "Tagen"}`];
      if (tageMitZiel) {
        const bilanz = Math.round(kcalSumme - zielSumme);
        teile.push(`Ziel Ø ${ernZahl(zielSumme / tageMitZiel, 0)} kcal`);
        teile.push(bilanz === 0 ? "Summe genau im Ziel"
          : `Summe ${ernZahl(Math.abs(bilanz), 0)} kcal ${bilanz > 0 ? "über" : "unter"} Ziel`);
        teile.push(`Eiweiß Ø ${ernZahl(eiweissSumme / tageMit, 0)} / ${ernZahl(eiweissZielSumme / tageMitZiel, 0)} g`);
      } else {
        teile.push(`Eiweiß Ø ${ernZahl(eiweissSumme / tageMit, 0)} g`);
      }
      kopf = `<p class="ern-woche-kopf">${teile.join(" · ")}</p>
        <p class="notiz-meta" style="margin:0 0 0.6rem;">Tage ohne Einträge zählen nicht mit.${luecken ? " Bei einzelnen Einträgen fehlen Werte – Makros dort etwas zu niedrig." : ""}</p>`;
    }
    el.innerHTML = kopf + `<div class="ern-woche-liste">${zeilen.join("")}</div>`;
  }

  // Springt aus der Wochenübersicht zum gewählten Tag
  window.ernWocheTag = function(iso) {
    ernDatumSetzen(iso);
    document.getElementById("ern-summe").scrollIntoView({ block: "start", behavior: "smooth" });
  };
  // Verwirft die geladene Woche und lädt die Wochenübersicht neu
  window.ernWocheNeu = function() { ernWoche = null; ernWocheFehler = ""; ernWocheRendern(); };
  document.getElementById("ern-woche-block").addEventListener("toggle", (e) => {
    if (e.target.open) { ernWoche = null; ernWocheFehler = ""; ernWocheRendern(); }
  });
  document.getElementById("ern-woche-zurueck").addEventListener("click", () => ernDatumSetzen(addTage(ernAktDatum(), -7)));
  document.getElementById("ern-woche-vor").addEventListener("click", () => ernDatumSetzen(addTage(ernAktDatum(), 7)));

  // ---- Export (⬇️ Export): Excel mit Einträgen, Tagessummen, Gewicht ----
  const ERN_QUELLE_TEXT = { bls: "BLS 4.0", off: "Open Food Facts", eigen: "eigen", frei: "freier Eintrag" };

  function ernExportZeitraumSetzen(art) {
    const bis = heuteISO();
    let von;
    if (art === "jahr") von = bis.slice(0, 4) + "-01-01";
    else von = addTage(bis, -(Number(art) - 1));
    document.getElementById("ern-export-von").value = von;
    document.getElementById("ern-export-bis").value = bis;
  }

  // Rundet einen Wert für den Excel-Export auf eine Nachkommastelle, leer wenn kein Wert
  function ernWert(v) {
    // leer statt 0, wenn kein Wert vorliegt; sonst echte Zahl (für Excel)
    return v === null || v === undefined || v === "" ? "" : Math.round(Number(v) * 10) / 10;
  }

  // Baut die Excel-Mappe des Ernährungsexports (Einträge, Tagessummen, Gewicht)
  function ernExportMappe(von, bis, eintraege, gewichte) {
    const zeilenEintraege = eintraege.map((e) => ({
      Datum: e.datum,
      Mahlzeit: ERN_MAHLZEIT_NAME[e.mahlzeit] || e.mahlzeit,
      Lebensmittel: e.name,
      "Menge (g)": ernWert(e.menge_g),
      kcal: ernWert(e.kcal),
      "Eiweiß (g)": ernWert(e.eiweiss),
      "Fett (g)": ernWert(e.fett),
      "Kohlenhydrate (g)": ernWert(e.kohlenhydrate),
      "Ballaststoffe (g)": ernWert(e.ballaststoffe),
      "Zucker (g)": ernWert(e.zucker),
      "ges. Fettsäuren (g)": ernWert(e.ges_fett),
      "Salz (g)": e.salz === null || e.salz === undefined || e.salz === "" ? "" : Math.round(Number(e.salz) * 100) / 100,
      Quelle: e.quelle ? (ERN_QUELLE_TEXT[e.quelle] || e.quelle) : "Lebensmittel gelöscht",
    }));

    // Tagessummen – nur Tage mit Einträgen
    const jeTag = new Map();
    for (const e of eintraege) {
      if (!jeTag.has(e.datum)) jeTag.set(e.datum, []);
      jeTag.get(e.datum).push(e);
    }
    const zeilenTage = [...jeTag.keys()].sort().map((d) => {
      const s = ernSumme(jeTag.get(d));
      const z = ernZiele(d);
      return {
        Datum: d,
        Wochentag: new Date(d + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""),
        "Einträge": jeTag.get(d).length,
        kcal: ernWert(s.kcal),
        "Ziel kcal": z ? Math.round(z.ziel) : "",
        "Differenz kcal": z ? Math.round(s.kcal - z.ziel) : "",
        "davon Training (angerechnet)": z ? Math.round(z.trainingZuschlag) : "",
        Schritte: ernSchritteAm(d) === null ? "" : ernSchritteAm(d),
        "davon Schritte (angerechnet)": z && z.schritte && z.schritte.kcal !== null ? Math.round(z.schritteZuschlag) : "",
        "Eiweiß (g)": ernWert(s.eiweiss),
        "Ziel Eiweiß (g)": z ? Math.round(z.eiweiss) : "",
        "Fett (g)": ernWert(s.fett),
        "Kohlenhydrate (g)": ernWert(s.kohlenhydrate),
        "Ballaststoffe (g)": ernWert(s.ballaststoffe),
        "Zucker (g)": s.zusatz.zucker.mit ? ernWert(s.zusatz.zucker.summe) : "",
        "ges. Fettsäuren (g)": s.zusatz.ges_fett.mit ? ernWert(s.zusatz.ges_fett.summe) : "",
        "Salz (g)": s.zusatz.salz.mit ? Math.round(s.zusatz.salz.summe * 100) / 100 : "",
        "Werte unvollständig": s.luecken ? "ja" : "",
        "Zucker/ges. Fett/Salz aus": ERN_ZUSATZ.some(([f]) => s.zusatz[f].mit > 0 && s.zusatz[f].mit < s.anzahl)
          ? `nur teilweise (${Math.max(...ERN_ZUSATZ.map(([f]) => s.zusatz[f].mit))} von ${s.anzahl} Einträgen)` : "",
        "Ziel-Einstellung": z && z.profil ? ernZielKurz(z.profil) : "",
      };
    });

    const zeilenGewicht = gewichte.map((g) => ({ Datum: g.datum, "Gewicht (kg)": ernWert(g.gewicht_kg) }));

    const info = [
      { Punkt: "Zeitraum", Wert: `${datumDe(von)} bis ${datumDe(bis)}` },
      { Punkt: "Erstellt", Wert: new Date().toLocaleString("de-DE") },
      { Punkt: "Werte", Wert: "Je Eintrag für die gegessene Menge, so wie beim Eintragen gespeichert. Leere Zelle = kein Wert vorhanden (nicht 0)." },
      { Punkt: "Zucker, ges. Fett, Salz", Wert: "Erst ab Session 22 (September 2026) erfasst. BLS-Lebensmittel haben Zucker seit dem Import, Salz und gesättigte Fettsäuren seit Session 24; ältere Einträge können leer sein. Tagessummen zählen nur Einträge mit Wert. Salz: DGE-Orientierungswert höchstens 6 g am Tag." },
      { Punkt: "Ziele", Wert: !ernProfil ? "Kein Profil hinterlegt – daher keine Ziele."
        : ernZielVersionen && ernZielVersionen.length
          ? "Je Tag mit den Ziel-Einstellungen, die an diesem Tag galten (Spalte „Ziel-Einstellung“ im Blatt Tage), Mifflin-St Jeor × Aktivität ± Ziel, Gewicht bis zum jeweiligen Tag, Trainings und Schritte über dem Sockel eingerechnet. Geschlecht, Geburtsdatum und Größe: aktueller Stand."
          : "Berechnet mit dem aktuellen Profil (Mifflin-St Jeor × Aktivität ± Ziel, Gewicht bis zum jeweiligen Tag, Trainings eingerechnet). Profil-Historie noch nicht eingerichtet." },
      { Punkt: "Schritte", Wert: "Manuell eingetragen. Nur Schritte über dem Sockel zählen: Schrittlänge ≈ 0,415 × Körpergröße, ≈ 0,5 kcal je kg Körpergewicht und km (Schätzung, etwa ±20 %), angerechnet wie Trainings. An Tagen mit Lauf- oder Wander-Training können Schritte doppelt zählen." },
      { Punkt: "Nährwerte", Wert: "Max Rubner-Institut (2025), Bundeslebensmittelschlüssel (BLS) 4.0, Lizenz CC BY 4.0" },
      { Punkt: "Markenprodukte", Wert: "Open Food Facts, Lizenz ODbL (Datenbank) / DbCL (Inhalte)" },
      { Punkt: "Datenschutz", Wert: "Enthält Gesundheitsdaten – Datei nicht unverschlüsselt weitergeben oder in fremden Clouds ablegen." },
    ];

    const wb = XLSX.utils.book_new();
    const blatt = (zeilen, name, breiten) => {
      const ws = XLSX.utils.json_to_sheet(zeilen.length ? zeilen : [{ Hinweis: "Keine Einträge im Zeitraum" }]);
      if (zeilen.length && breiten) ws["!cols"] = breiten.map((w) => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    blatt(zeilenEintraege, "Einträge", [11, 11, 40, 10, 8, 10, 8, 16, 16, 10, 18, 8, 18]);
    blatt(zeilenTage, "Tage", [11, 9, 9, 8, 9, 13, 14, 9, 14, 10, 14, 8, 16, 16, 10, 18, 8, 18, 30, 80]);
    blatt(zeilenGewicht, "Gewicht", [11, 12]);
    blatt(info, "Info", [16, 110]);
    return wb;
  }

  document.getElementById("ern-export-schnell").addEventListener("click", (e) => {
    const knopf = e.target.closest("[data-zeitraum]");
    if (knopf) ernExportZeitraumSetzen(knopf.dataset.zeitraum);
  });
  document.getElementById("ern-export-block").addEventListener("toggle", (e) => {
    if (e.target.open && !document.getElementById("ern-export-von").value) ernExportZeitraumSetzen("30");
  });

  document.getElementById("btn-ern-export").addEventListener("click", async () => {
    const status = document.getElementById("ern-export-status");
    const knopf = document.getElementById("btn-ern-export");
    const von = document.getElementById("ern-export-von").value;
    const bis = document.getElementById("ern-export-bis").value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(von) || !/^\d{4}-\d{2}-\d{2}$/.test(bis)) { status.textContent = "Bitte Von und Bis wählen."; return; }
    if (von > bis) { status.textContent = "„Von“ liegt nach „Bis“."; return; }
    if (typeof XLSX === "undefined") { status.textContent = "Export-Bibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen."; return; }
    knopf.disabled = true;
    status.textContent = "Wird erstellt …";
    try {
      if (!ernProfilGeladen && !ernProfilFehlgeschlagen) await ernProfilLaden();
      const res = await api("ernaehrung_export", { von, bis });
      const eintraege = res.eintraege || [];
      const wb = ernExportMappe(von, bis, eintraege, res.gewichte || []);
      XLSX.writeFile(wb, `ernaehrung_${von}_bis_${bis}.xlsx`);
      status.textContent = eintraege.length
        ? (() => {
          const tage = new Set(eintraege.map((e) => e.datum)).size;
          return `Fertig: ${eintraege.length} ${eintraege.length === 1 ? "Eintrag" : "Einträge"} an ${tage} ${tage === 1 ? "Tag" : "Tagen"}.`;
        })()
        : "Fertig – im Zeitraum gibt es keine Einträge.";
    } catch (err) {
      status.textContent = err.message === "unauthorized" ? "" : "Export fehlgeschlagen: " + err.message;
    } finally {
      knopf.disabled = false;
    }
  });

  // Erzwingt das Neuladen von Ernährungstag und Profil
  window.ernNeuLaden = function() { ernGeladenFuer = null; ernFehler = ""; ernProfilFehlgeschlagen = false; ernTagLaden(); };

  // Öffnet einen Ernährungseintrag zum Bearbeiten
  window.ernBearbeiten = function(id) { ernBearbeitenId = id; renderErnaehrung(); };
  // Bricht das Bearbeiten eines Ernährungseintrags ab
  window.ernBearbeitenAbbrechen = function() { ernBearbeitenId = null; renderErnaehrung(); };

  // Speichert den bearbeiteten Ernährungseintrag (Menge bzw. freie Nährwerte)
  window.ernBearbeitenSpeichern = async function(id) {
    const e = ernEintraege.find((x) => x.id === id);
    if (!e) return;
    const daten = { id, mahlzeit: document.getElementById("ern-edit-mahlzeit").value };
    const mengeEl = document.getElementById("ern-edit-menge");
    if (mengeEl) {
      daten.menge_g = mengeEl.value;
    } else {
      daten.name = document.getElementById("ern-edit-name").value;
      daten.kcal = document.getElementById("ern-edit-kcal").value;
      daten.eiweiss = document.getElementById("ern-edit-eiweiss").value;
      daten.fett = document.getElementById("ern-edit-fett").value;
      daten.kohlenhydrate = document.getElementById("ern-edit-kh").value;
      daten.ges_fett = document.getElementById("ern-edit-gesfett").value;
      daten.zucker = document.getElementById("ern-edit-zucker").value;
      daten.ballaststoffe = document.getElementById("ern-edit-bal").value;
      daten.salz = document.getElementById("ern-edit-salz").value;
    }
    try {
      const res = await api("ernaehrung_eintrag_aktualisieren", daten);
      const idx = ernEintraege.findIndex((x) => x.id === id);
      if (idx >= 0 && res.eintrag) ernEintraege[idx] = res.eintrag;
      ernBearbeitenId = null;
      renderErnaehrung();
    } catch (err) {
      if (err.message !== "unauthorized") alert(err.message);
    }
  };

  // Löscht nach Rückfrage einen Eintrag aus dem Ernährungstagebuch
  window.ernLoeschen = async function(id) {
    const e = ernEintraege.find((x) => x.id === id);
    if (!e || !confirm(`„${e.name}“ aus dem Tagebuch löschen?`)) return;
    try {
      await api("ernaehrung_eintrag_loeschen", { id });
      ernEintraege = ernEintraege.filter((x) => x.id !== id);
      renderErnaehrung();
    } catch (err) {
      if (err.message !== "unauthorized") alert(err.message);
    }
  };

  // ---- Datum wechseln ----
  function ernDatumSetzen(iso) {
    ernDatum = iso === heuteISO() ? null : iso;
    ernBearbeitenId = null;
    ernFehler = "";
    renderErnaehrung();
  }
  document.getElementById("ern-tag-zurueck").addEventListener("click", () => ernDatumSetzen(addTage(ernAktDatum(), -1)));
  document.getElementById("ern-tag-vor").addEventListener("click", () => ernDatumSetzen(addTage(ernAktDatum(), 1)));
  document.getElementById("ern-datum-text").addEventListener("click", () => ernDatumSetzen(heuteISO()));
  document.getElementById("ern-kalender-btn").addEventListener("click", () => {
    const feld = document.getElementById("ern-datum-wahl");
    try { feld.showPicker(); } catch (e) { feld.focus(); feld.click(); }
  });
  document.getElementById("ern-datum-wahl").addEventListener("change", (e) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) ernDatumSetzen(e.target.value);
  });

  // ---- Hinzufügen-Feld ----
  function ernHinzuTitelAktualisieren() {
    const titel = document.getElementById("ern-hinzu-titel");
    if (titel && ernHinzuMahlzeit) {
      titel.textContent = `Eintragen · ${ernDatumLabel(ernAktDatum()).split(",")[0]}`;
      document.getElementById("ern-hinzu-mahlzeit").value = ernHinzuMahlzeit;
    }
  }

  // Schaltet im Hinzufügen-Panel zwischen Suche, Menge, frei, eigen und zuordnen um
  function ernAnsicht(welche) {
    // "suche" | "menge" | "frei"
    document.getElementById("ern-such-bereich").classList.toggle("hidden", welche !== "suche");
    document.getElementById("ern-menge-bereich").classList.toggle("hidden", welche !== "menge");
    document.getElementById("ern-frei-bereich").classList.toggle("hidden", welche !== "frei");
    document.getElementById("ern-eigen-bereich").classList.toggle("hidden", welche !== "eigen");
    document.getElementById("ern-zuordnen-bereich").classList.toggle("hidden", welche !== "zuordnen");
  }

  // Öffnet das Hinzufügen-Panel für eine Mahlzeit (sonst Vorschlag nach Uhrzeit)
  window.ernHinzuOeffnen = function(mahlzeit) {
    ernHinzuMahlzeit = mahlzeit || ernStandardMahlzeit();
    if (mahlzeit && ernZugeklappt.delete(mahlzeit)) { ernZugeklapptSpeichern(); renderErnaehrung(); }
    const panel = document.getElementById("ern-hinzu");
    panel.classList.remove("hidden");
    ernHinzuTitelAktualisieren();
    ernAuswahl = null;
    ernMeineModus = false;
    document.getElementById("ern-hinzu-mahlzeit").classList.remove("hidden");
    ernAnsicht("suche");
    document.getElementById("ern-hinzu-status").textContent = "";
    const suche = document.getElementById("ern-suche");
    suche.value = "";
    ernZuletztZeigen();
    panel.scrollIntoView({ block: "start", behavior: "smooth" });
    suche.focus({ preventScroll: true });
  };

  // Schließt das Hinzufügen-Panel und setzt die Auswahl zurück
  function ernHinzuSchliessen() {
    document.getElementById("ern-hinzu").classList.add("hidden");
    ernHinzuMahlzeit = null;
    ernAuswahl = null;
    ernMeineModus = false;
  }

  document.getElementById("btn-ern-eintragen-oben").addEventListener("click", () => window.ernHinzuOeffnen(null));
  document.getElementById("ern-hinzu-schliessen").addEventListener("click", ernHinzuSchliessen);
  document.getElementById("ern-hinzu-mahlzeit").addEventListener("change", (e) => {
    ernHinzuMahlzeit = e.target.value;
    ernHinzuTitelAktualisieren();
    if (!document.getElementById("ern-suche").value.trim()) ernZuletztZeigen();
  });

  // Baut eine Trefferzeile eines Lebensmittels mit Nährwerten je 100 g
  function ernTrefferZeile(l, i) {
    const zusatz = [l.marke, ernQuelleLabel(l)].filter(Boolean).join(" · ");
    const marke = zusatz ? ` <span class="notiz-meta">(${escapeHtml(zusatz)})</span>` : "";
    return `
      <button class="ern-treffer-zeile" onclick="ernAuswaehlen(${i})">
        <span class="ern-treffer-name">${escapeHtml(l.name)}${marke}</span>
        <span class="notiz-meta">${ernZahl(l.kcal, 0)} kcal · E ${ernZahl(l.eiweiss)} · F ${ernZahl(l.fett)} · KH ${ernZahl(l.kohlenhydrate)} je 100 g${l.letzte_menge ? ` · zuletzt ${ernZahl(l.letzte_menge)} g` : ""}</span>
      </button>`;
  }

  // Zeigt zuletzt verwendete Lebensmittel, passende zur gewählten Mahlzeit zuerst
  function ernZuletztZeigen() {
    const el = document.getElementById("ern-treffer");
    // Was in dieser Mahlzeit schon gegessen wurde, zuerst
    ernListe = ernZuletzt.slice().sort((a, b) =>
      (b.mahlzeiten.includes(ernHinzuMahlzeit) ? 1 : 0) - (a.mahlzeiten.includes(ernHinzuMahlzeit) ? 1 : 0)).slice(0, 12);
    el.innerHTML = ernListe.length
      ? `<p class="ern-liste-titel">Zuletzt verwendet</p>${ernListe.map(ernTrefferZeile).join("")}`
      : `<p class="notiz-meta">Tippe mindestens 2 Buchstaben, z. B. „Haferflocken“ oder „Apfel roh“.</p>`;
  }

  document.getElementById("ern-suche").addEventListener("input", (e) => {
    clearTimeout(ernSucheTimer);
    const q = e.target.value.trim();
    if (q.length < 2) { ernSucheNr++; ernZuletztZeigen(); return; }
    ernSucheTimer = setTimeout(() => ernSuchen(q), 250);
  });

  // Sucht Lebensmittel über die API und zeigt die Treffer mit letzter Menge
  async function ernSuchen(q) {
    const nr = ++ernSucheNr;
    const el = document.getElementById("ern-treffer");
    try {
      const res = await api("lebensmittel_suche", { q });
      if (nr !== ernSucheNr) return;
      // Letzte Menge aus "zuletzt verwendet" übernehmen, falls bekannt
      const letzte = new Map(ernZuletzt.map((z) => [z.id, z.letzte_menge]));
      ernListe = (res.treffer || []).map((t) => ({ ...t, letzte_menge: letzte.get(t.id) || null }));
      el.innerHTML = ernListe.length
        ? ernListe.map(ernTrefferZeile).join("")
        : `<p class="notiz-meta">Nichts gefunden. Tipp: kürzer oder anders suchen (z. B. „Quark“ statt „Magerquark“) – oder unten einen freien Eintrag machen.</p>`;
    } catch (err) {
      if (nr === ernSucheNr && err.message !== "unauthorized") el.innerHTML = `<p class="notiz-meta">Suche fehlgeschlagen: ${escapeHtml(err.message)}</p>`;
    }
  }

  // Wählt ein Lebensmittel aus und öffnet die Mengeneingabe mit Schnellauswahl
  window.ernAuswaehlen = function(i) {
    const l = ernListe[i];
    if (!l) return;
    ernAuswahl = l;
    document.getElementById("ern-auswahl-name").textContent = l.marke ? `${l.name} (${l.marke})` : l.name;
    const quelle = ernQuelleLabel(l);
    ernAuswahlInfoZeigen();
    // Korrigieren nur bei eigenen/OFF-Lebensmitteln (BLS bleibt unverändert)
    document.getElementById("btn-ern-lm-bearbeiten").classList.toggle("hidden", !l.quelle || l.quelle === "bls");
    const menge = document.getElementById("ern-menge");
    menge.value = l.letzte_menge ? Number(l.letzte_menge) : (l.portion_g ? Number(l.portion_g) : 100);
    const schnell = [50, 100, 150, 200, 250];
    document.getElementById("ern-menge-schnell").innerHTML =
      (l.portion_g ? `<button class="chip ern-chip" onclick="ernMengeSetzen(${Number(l.portion_g)})">${escapeHtml(l.portion_name && !/^\s*[\d.,]+\s*g\s*$/i.test(l.portion_name) ? l.portion_name : "1 Portion")} (${ernZahl(l.portion_g)} g)</button>` : "") +
      schnell.map((g) => `<button class="chip ern-chip" onclick="ernMengeSetzen(${g})">${g} g</button>`).join("");
    ernAnsicht("menge");
    ernVorschau();
    menge.focus();
    menge.select();
  };

  // Zeigt die Nährwerte je 100 g des gewählten Lebensmittels; OFF-Nachladen bei fehlenden Werten
  function ernAuswahlInfoZeigen() {
    const l = ernAuswahl;
    if (!l) return;
    const quelle = ernQuelleLabel(l);
    const hat = (v) => v !== null && v !== undefined;
    const fett = `Fett ${ernGramm(l.fett)}${hat(l.ges_fett) ? ` (davon gesättigte ${ernGramm(l.ges_fett)})` : ""}`;
    const kh = `KH ${ernGramm(l.kohlenhydrate)}${hat(l.zucker) ? ` (davon Zucker ${ernGramm(l.zucker)})` : ""}`;
    const salz = hat(l.salz) ? ` · Salz ${ernZahl(l.salz, 2)} g` : "";
    document.getElementById("ern-auswahl-info").textContent =
      `je 100 g: ${ernZahl(l.kcal, 0)} kcal · Eiweiß ${ernGramm(l.eiweiss)} · ${fett} · ${kh}${salz}${quelle ? ` · Quelle: ${quelle}` : ""}${l.quelle === "eigen" && l.quell_code ? ` · Barcode ${l.quell_code}` : ""}`;
    // Open-Food-Facts-Produkte von vor Session 22: Salz/ges. Fett fehlen noch
    const fehlt = l.quelle === "off" && l.quell_code && (l.salz === null || l.salz === undefined) && (l.ges_fett === null || l.ges_fett === undefined);
    document.getElementById("btn-ern-off-nachladen").classList.toggle("hidden", !fehlt);
  }

  document.getElementById("btn-ern-off-nachladen").addEventListener("click", async (ev) => {
    const knopf = ev.currentTarget;
    const status = document.getElementById("ern-hinzu-status");
    if (!ernAuswahl) return;
    knopf.disabled = true;
    status.textContent = "Frage Open Food Facts …";
    try {
      const res = await api("off_nachladen", { id: ernAuswahl.id });
      const neu = res.lebensmittel;
      ernAuswahl = { ...ernAuswahl, ...neu };
      ernZuletzt = ernZuletzt.map((z) => (z.id === neu.id ? { ...z, ...neu } : z));
      ernListe = ernListe.map((z) => (z.id === neu.id ? { ...z, ...neu } : z));
      const namen = { ballaststoffe: "Ballaststoffe", zucker: "Zucker", ges_fett: "gesättigte Fettsäuren", salz: "Salz" };
      status.textContent = res.ergaenzt && res.ergaenzt.length
        ? `✓ Ergänzt: ${res.ergaenzt.map((f) => namen[f] || f).join(", ")}`
        : "Open Food Facts hat für dieses Produkt keine weiteren Werte. Du kannst sie über „Werte … korrigieren“ (Stift) selbst eintragen.";
      ernAuswahlInfoZeigen();
      if (!res.ergaenzt || !res.ergaenzt.length) knopf.classList.add("hidden");
      ernVorschau();
    } catch (e) {
      if (e.message !== "unauthorized") status.textContent = e.message;
    } finally {
      knopf.disabled = false;
    }
  });

  // Setzt die Menge per Schnellauswahl und aktualisiert die Vorschau
  window.ernMengeSetzen = function(g) {
    document.getElementById("ern-menge").value = g;
    ernVorschau();
  };

  // Zeigt eine Nährwert-Vorschau für die eingegebene Menge
  function ernVorschau() {
    const el = document.getElementById("ern-vorschau");
    const g = Number(String(document.getElementById("ern-menge").value).replace(",", "."));
    if (!ernAuswahl || !(g > 0)) { el.textContent = ""; return; }
    const f = g / 100;
    const w = (v) => (v === null || v === undefined ? "–" : ernZahl(Number(v) * f) + " g");
    const extra = [["zucker", "Zucker", 1], ["salz", "Salz", 2]]
      .filter(([k]) => ernAuswahl[k] !== null && ernAuswahl[k] !== undefined)
      .map(([k, label, stellen]) => ` · ${label} ${ernZahl(Number(ernAuswahl[k]) * f, stellen)} g`).join("");
    el.innerHTML = `<strong>${ernZahl(Number(ernAuswahl.kcal) * f, 0)} kcal</strong> · Eiweiß ${w(ernAuswahl.eiweiss)} · Fett ${w(ernAuswahl.fett)} · KH ${w(ernAuswahl.kohlenhydrate)}${extra}`;
  }
  document.getElementById("ern-menge").addEventListener("input", ernVorschau);
  document.getElementById("ern-menge").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btn-ern-eintragen").click();
  });
  document.getElementById("btn-ern-menge-zurueck").addEventListener("click", () => {
    ernAuswahl = null;
    ernAnsicht("suche");
    document.getElementById("ern-suche").focus();
  });

  // Nach dem Eintragen bleibt das Feld offen (für das nächste Lebensmittel
  // derselben Mahlzeit), die Suche wird geleert.
  function ernNachEintragen(eintrag, text) {
    if (ernGeladenFuer === eintrag.datum) ernEintraege.push(eintrag);
    renderErnaehrung();
    document.getElementById("ern-hinzu-status").textContent = text;
    ernAuswahl = null;
    ernAnsicht("suche");
    const suche = document.getElementById("ern-suche");
    suche.value = "";
    ernZuletztZeigen();
    suche.focus({ preventScroll: true });
  }

  document.getElementById("btn-ern-eintragen").addEventListener("click", async (ev) => {
    const knopf = ev.currentTarget;
    const g = Number(String(document.getElementById("ern-menge").value).replace(",", "."));
    if (!ernAuswahl) return;
    if (!(g > 0 && g <= 5000)) { document.getElementById("ern-hinzu-status").textContent = "Bitte eine Menge zwischen 1 und 5000 g eingeben."; return; }
    knopf.disabled = true;
    try {
      const res = await api("ernaehrung_eintrag_hinzufuegen", {
        datum: ernAktDatum(), mahlzeit: ernHinzuMahlzeit, lebensmittel_id: ernAuswahl.id, menge_g: g,
      });
      // "Zuletzt verwendet" lokal nachziehen (Menge + Mahlzeit merken)
      const gewaehlt = ernAuswahl;
      const alt = ernZuletzt.find((z) => z.id === gewaehlt.id);
      const mahlzeiten = alt ? Array.from(new Set([ernHinzuMahlzeit, ...alt.mahlzeiten])) : [ernHinzuMahlzeit];
      ernZuletzt = [{ ...gewaehlt, letzte_menge: g, mahlzeiten }, ...ernZuletzt.filter((z) => z.id !== gewaehlt.id)].slice(0, 30);
      ernNachEintragen(res.eintrag, `✓ ${res.eintrag.name} (${ernZahl(g)} g) eingetragen`);
    } catch (err) {
      if (err.message !== "unauthorized") document.getElementById("ern-hinzu-status").textContent = err.message;
    } finally {
      knopf.disabled = false;
    }
  });

  // ---- Freier Eintrag ----
  document.getElementById("btn-ern-frei-oeffnen").addEventListener("click", () => {
    ["ern-frei-name", "ern-frei-kcal", "ern-frei-eiweiss", "ern-frei-fett", "ern-frei-kh",
      "ern-frei-gesfett", "ern-frei-zucker", "ern-frei-bal", "ern-frei-salz"].forEach((id) => { document.getElementById(id).value = ""; });
    document.getElementById("ern-frei-mehr").open = false;
    const q = document.getElementById("ern-suche").value.trim();
    if (q) document.getElementById("ern-frei-name").value = q;
    ernAnsicht("frei");
    document.getElementById(q ? "ern-frei-kcal" : "ern-frei-name").focus();
  });
  document.getElementById("btn-ern-frei-zurueck").addEventListener("click", () => {
    ernAnsicht("suche");
    document.getElementById("ern-suche").focus();
  });
  document.getElementById("btn-ern-frei-speichern").addEventListener("click", async (ev) => {
    const knopf = ev.currentTarget;
    const name = document.getElementById("ern-frei-name").value.trim();
    const kcal = document.getElementById("ern-frei-kcal").value;
    if (!name || kcal === "") { document.getElementById("ern-hinzu-status").textContent = "Bitte mindestens Bezeichnung und Kalorien angeben."; return; }
    knopf.disabled = true;
    try {
      const res = await api("ernaehrung_eintrag_hinzufuegen", {
        datum: ernAktDatum(), mahlzeit: ernHinzuMahlzeit, name, kcal,
        eiweiss: document.getElementById("ern-frei-eiweiss").value,
        fett: document.getElementById("ern-frei-fett").value,
        kohlenhydrate: document.getElementById("ern-frei-kh").value,
        ges_fett: document.getElementById("ern-frei-gesfett").value,
        zucker: document.getElementById("ern-frei-zucker").value,
        ballaststoffe: document.getElementById("ern-frei-bal").value,
        salz: document.getElementById("ern-frei-salz").value,
      });
      ernNachEintragen(res.eintrag, `✓ ${res.eintrag.name} eingetragen`);
    } catch (err) {
      if (err.message !== "unauthorized") document.getElementById("ern-hinzu-status").textContent = err.message;
    } finally {
      knopf.disabled = false;
    }
  });

  // ==========================================================
  // Ernährung Etappe 2: Profil, Bedarf, Ziel, Gewicht
  // Bedarf = Grundumsatz (Mifflin-St Jeor) × PAL für den Alltag OHNE
  // Sport; Trainingskalorien kommen später einzeln dazu (sonst doppelt).
  // ==========================================================
  let ernProfil = null;
  let ernGewichte = [];          // [{datum, gewicht_kg}] aufsteigend
  let ernProfilGeladen = false;
  let ernProfilLaedt = false;
  let ernProfilFehlgeschlagen = false; // kein automatisches Neuladen nach Fehler (sonst Endlosschleife)
  let ernMet = [];               // [{sportart_key, sportart, met}]
  // Profil-Historie: Ziel-Stände [{gueltig_ab, pal, ziel, …}] aufsteigend.
  // null = Tabelle fehlt noch (Migration nicht eingespielt) → wie bisher
  // mit dem aktuellen Profil rechnen.
  let ernZielVersionen = null;
  // Schritte je Tag [{datum, schritte}] aufsteigend; null = Tabelle fehlt
  // noch (schritte_setup.sql nicht eingespielt)
  let ernSchritte = null;
  const ERN_SCHRITTE_SOCKEL_STANDARD = 5000;

  // Lädt Ernährungsprofil, Gewichte, MET-Werte, Zielstände und Schritte
  async function ernProfilLaden() {
    ernProfilLaedt = true;
    try {
      const res = await api("ernaehrung_profil");
      ernProfil = res.profil;
      ernGewichte = res.gewichte || [];
      ernMet = res.met || [];
      ernZielVersionen = Array.isArray(res.versionen) ? res.versionen : null;
      ernSchritte = Array.isArray(res.schritte) ? res.schritte : null;
      ernProfilGeladen = true;
      ernProfilFormFuellen();
      ernGewichtRendern();
      ernMetRendern();
      // Ohne Profil das Formular gleich aufklappen
      if (!ernProfil) document.getElementById("ern-profil-block").open = true;
    } catch (e) {
      ernProfilFehlgeschlagen = true;
      if (e.message !== "unauthorized") document.getElementById("ern-profil-status").textContent = "Profil konnte nicht geladen werden: " + e.message;
    } finally {
      ernProfilLaedt = false;
      if (aktiverTab === "ernaehrung") renderErnaehrung();
      if (aktiverTab === "training") renderTraining();
      if (aktiverTab === "heute") renderHeute();
    }
  }

  // Letztes Gewicht bis einschließlich "datum", sonst das früheste
  function ernGewichtFuer(datum) {
    if (!ernGewichte.length) return null;
    let treffer = null;
    for (const g of ernGewichte) { if (g.datum <= datum) treffer = g; }
    return treffer || ernGewichte[0];
  }

  // Berechnet das Alter an einem Datum aus dem Geburtsdatum
  function ernAlterAm(geburt, datum) {
    const [gj, gm, gt] = geburt.split("-").map(Number);
    const [j, m, t] = datum.split("-").map(Number);
    return j - gj - (m < gm || (m === gm && t < gt) ? 1 : 0);
  }

  // Reine Rechnung, damit Formular-Vorschau und Tagesansicht dieselbe nutzen
  function ernBedarfRechnen(p, gewicht, datum, trainingKcal = 0, schritteKcal = 0) {
    if (!p || !gewicht || !p.geburtsdatum || !p.geschlecht || !p.groesse_cm) return null;
    const kg = Number(gewicht);
    const alter = ernAlterAm(p.geburtsdatum, datum);
    const grundumsatz = 10 * kg + 6.25 * Number(p.groesse_cm) - 5 * alter + (p.geschlecht === "m" ? 5 : -161);
    const bedarf = grundumsatz * Number(p.pal);
    // Trainingskalorien anteilig aufschlagen (Profil: 0/50/75/100 %)
    const anrechnung = p.training_anrechnung === undefined || p.training_anrechnung === null ? 100 : Number(p.training_anrechnung);
    const trainingZuschlag = trainingKcal * anrechnung / 100;
    // Schritte über dem Sockel: gleiche Anrechnung wie Trainings (auch eine Schätzung)
    const schritteZuschlag = schritteKcal * anrechnung / 100;
    const ziel = bedarf + Number(p.ziel_kcal_diff) + trainingZuschlag + schritteZuschlag;
    const eiweiss = kg * Number(p.eiweiss_g_pro_kg);
    const fett = (ziel * Number(p.fett_prozent) / 100) / 9;
    const kh = Math.max(0, (ziel - eiweiss * 4 - fett * 9) / 4);
    return { kg, alter, grundumsatz, bedarf, ziel, eiweiss, fett, kh, trainingZuschlag, schritteZuschlag, anrechnung,
      unterGrundumsatz: ziel - trainingZuschlag - schritteZuschlag < grundumsatz };
  }

  // Ziel-Stand, der an einem Tag gilt: größtes gueltig_ab <= Tag, sonst der
  // erste (wie beim Gewicht). null, wenn es keine Stände gibt.
  function ernZielVersionFuer(datum) {
    if (!ernZielVersionen || !ernZielVersionen.length) return null;
    let treffer = null;
    for (const v of ernZielVersionen) { if (v.gueltig_ab <= datum) treffer = v; }
    return treffer || ernZielVersionen[0];
  }

  // Profil für einen Tag: Angaben zur Person immer aktuell, Ziel-Einstellungen
  // aus dem Stand, der an dem Tag galt
  function ernProfilFuer(datum) {
    if (!ernProfil) return null;
    const v = ernZielVersionFuer(datum);
    if (!v) return ernProfil;
    return {
      ...ernProfil,
      pal: v.pal, ziel: v.ziel, ziel_kcal_diff: v.ziel_kcal_diff,
      eiweiss_g_pro_kg: v.eiweiss_g_pro_kg, fett_prozent: v.fett_prozent,
      training_anrechnung: v.training_anrechnung,
      schritte_sockel: v.schritte_sockel,
      gueltig_ab: v.gueltig_ab,
    };
  }

  // Berechnet die Tagesziele aus Profil, Gewicht, Trainings und Schritten
  function ernZiele(datum) {
    const g = ernGewichtFuer(datum);
    const trainings = ernTrainingsAm(datum);
    const summe = trainings.reduce((a, t) => a + (t.kcal || 0), 0);
    const p = ernProfilFuer(datum);
    const schritte = ernSchritteKcal(datum, p);
    const r = ernBedarfRechnen(p, g && g.gewicht_kg, datum, summe, schritte && schritte.kcal ? schritte.kcal : 0);
    return r ? { ...r, datum, gewichtDatum: g.datum, trainings, trainingSumme: summe, schritte, profil: p } : null;
  }

  // ---- Schritte ----
  // Manuell eingetragen (eine PWA kommt nicht an Health Connect). Nur die
  // Schritte über dem Sockel zählen – darunter steckt die Bewegung schon im
  // Aktivitätswert (PAL). Schätzung: Schrittlänge ≈ 0,415 × Körpergröße,
  // netto ≈ 0,5 kcal je kg und km Gehen. Grob, etwa ±20 %.
  const ERN_SCHRITT_FAKTOR = 0.415;
  const ERN_KCAL_JE_KG_KM = 0.5;

  // Liefert die eingetragenen Schritte eines Tages oder null
  function ernSchritteAm(datum) {
    if (!ernSchritte) return null;
    const e = ernSchritte.find((x) => x.datum === datum);
    return e ? Number(e.schritte) : null;
  }

  // Liefert den Schritte-Sockel aus dem Profil oder den Standardwert
  function ernSockelVon(p) {
    return p && p.schritte_sockel !== undefined && p.schritte_sockel !== null ? Number(p.schritte_sockel) : ERN_SCHRITTE_SOCKEL_STANDARD;
  }

  // null = an dem Tag keine Schritte eingetragen
  function ernSchritteKcal(datum, p) {
    const schritte = ernSchritteAm(datum);
    if (schritte === null) return null;
    const sockel = ernSockelVon(p);
    const ueber = Math.max(0, schritte - sockel);
    const g = ernGewichtFuer(datum);
    if (!p || !p.groesse_cm) return { schritte, sockel, ueber, kcal: null, grund: "keine Größe im Profil" };
    if (!g) return { schritte, sockel, ueber, kcal: null, grund: "kein Gewicht eingetragen" };
    const schrittM = ERN_SCHRITT_FAKTOR * Number(p.groesse_cm) / 100;
    const km = ueber * schrittM / 1000;
    const kcal = Math.round(ERN_KCAL_JE_KG_KM * Number(g.gewicht_kg) * km);
    return { schritte, sockel, ueber, km, schrittM, kcal };
  }

  // Lauf-, Wander- und Geh-Trainings am Tag: deren Schritte zählt die
  // Handy-/Uhr-App meist mit → möglicherweise doppelt. Nur Hinweis, keine Kürzung.
  const ERN_GEH_SPORT = /lauf|jogg|renn|run|wander|hik|trail|geh|walk|spazier|marsch|hindernis|mud/i;
  function ernGehTrainingsAm(datum) {
    return (training || []).filter((t) => t.bereich === "privat" && t.datum === datum && ERN_GEH_SPORT.test(String(t.sportart || "")));
  }

  // Baut die Schritte-Zeile unter der Tagessumme mit geschätzten kcal und Zuschlag
  function ernSchritteZeileHtml(z) {
    const sc = z.schritte;
    if (!sc) return "";
    const basis = `${ic("schritte")} ${ernZahl(sc.schritte, 0)} Schritte`;
    if (!sc.ueber) return `<p class="ern-training-zeile">${basis} – nicht über dem Sockel von ${ernZahl(sc.sockel, 0)}, zählt nichts extra</p>`;
    if (sc.kcal === null) return `<p class="ern-training-zeile">${basis}: <span class="ern-ohne-wert">? (${sc.grund})</span></p>`;
    const zuschlag = z.anrechnung === 100
      ? `+${ernZahl(z.schritteZuschlag, 0)} kcal aufs Ziel`
      : `davon ${z.anrechnung} % = +${ernZahl(z.schritteZuschlag, 0)} kcal aufs Ziel`;
    const doppelt = ernGehTrainingsAm(z.datum).length
      ? ` <span class="ern-ohne-wert">· Lauf/Wanderung am Tag: evtl. doppelt gezählt</span>` : "";
    return `<p class="ern-training-zeile">${basis}, davon ${ernZahl(sc.ueber, 0)} über dem Sockel ≈ ${ernZahl(sc.km)} km: ≈ ${ernZahl(sc.kcal, 0)} kcal → ${zuschlag}${doppelt}</p>`;
  }

  // Eingabe unter der Tagessumme. Das Feld wird nur beim Tageswechsel
  // (oder nach dem Laden) neu gefüllt – sonst ginge Getipptes verloren.
  function ernSchritteRendern() {
    const block = document.getElementById("ern-schritte-block");
    if (!block) return;
    const datum = ernAktDatum();
    const feld = document.getElementById("ern-schritte-wert");
    const knopf = document.getElementById("btn-ern-schritte");
    const info = document.getElementById("ern-schritte-info");
    if (!ernProfilGeladen) { block.classList.add("hidden"); return; }
    block.classList.remove("hidden");
    if (ernSchritte === null) {
      feld.disabled = true; knopf.disabled = true;
      info.textContent = "Für Schritte bitte einmal schritte_setup.sql im Supabase SQL-Editor ausführen.";
      return;
    }
    const zukunft = datum > heuteISO();
    feld.disabled = zukunft; knopf.disabled = zukunft;
    const wert = ernSchritteAm(datum);
    if (feld.dataset.datum !== datum) {
      feld.value = wert === null ? "" : String(wert);
      feld.dataset.datum = datum;
    }
    if (zukunft) { info.textContent = "Schritte gehen nur bis heute."; return; }
    const p = ernProfilFuer(datum);
    const sockel = ernSockelVon(p);
    const teile = [];
    const sc = ernSchritteKcal(datum, p);
    if (!sc) {
      teile.push(`Von der Handy- oder Uhr-App ablesen und eintragen. Zählt ab ${ernZahl(sockel, 0)} Schritten (Sockel, im Profil einstellbar).`);
    } else if (!sc.ueber) {
      teile.push(`Unter dem Sockel von ${ernZahl(sockel, 0)} – steckt schon im Aktivitätswert, zählt nichts extra.`);
    } else if (sc.kcal === null) {
      teile.push(`${ernZahl(sc.ueber, 0)} über dem Sockel – für die Umrechnung fehlt: ${sc.grund}.`);
    } else {
      teile.push(`${ernZahl(sc.ueber, 0)} über dem Sockel von ${ernZahl(sockel, 0)} ≈ ${ernZahl(sc.km)} km ≈ ${ernZahl(sc.kcal, 0)} kcal (Schätzung, etwa ±20 %).`);
    }
    const geh = ernGehTrainingsAm(datum);
    if (geh.length && sc && sc.ueber) {
      const namen = [...new Set(geh.map((t) => t.sportart))].join(", ");
      teile.push(`Achtung: An dem Tag steht auch ${namen} im Training. Zählt deine Schritt-App die Einheit mit, werden diese Schritte doppelt gerechnet – dann am besten die Schritte ohne die Einheit eintragen.`);
    }
    info.textContent = teile.join(" ");
  }

  // Speichert (oder löscht bei leerem Feld) die Schritte des gewählten Tages
  async function ernSchritteSpeichern() {
    const feld = document.getElementById("ern-schritte-wert");
    const knopf = document.getElementById("btn-ern-schritte");
    const info = document.getElementById("ern-schritte-info");
    const datum = ernAktDatum();
    const roh = feld.value.trim();
    if (roh === "" && ernSchritteAm(datum) === null) { info.textContent = "Bitte eine Zahl eingeben."; return; }
    knopf.disabled = true;
    try {
      const res = await api("schritte_speichern", { datum, schritte: roh === "" ? null : roh });
      ernSchritte = (ernSchritte || []).filter((x) => x.datum !== datum);
      if (res.schritte) ernSchritte = ernSchritte.concat([res.schritte]).sort((a, b) => a.datum.localeCompare(b.datum));
      feld.dataset.datum = "";
      renderErnaehrung();
      const text = info.textContent;
      info.textContent = (res.schritte ? `✓ ${ernZahl(res.schritte.schritte, 0)} Schritte gespeichert. ` : "✓ Schritte für den Tag entfernt. ") + text;
      if (aktiverTab === "heute") renderHeute();
    } catch (e) {
      if (e.message !== "unauthorized") info.textContent = e.message;
    } finally {
      knopf.disabled = ernAktDatum() > heuteISO();
    }
  }
  document.getElementById("btn-ern-schritte").addEventListener("click", ernSchritteSpeichern);
  document.getElementById("ern-schritte-wert").addEventListener("keydown", (e) => {
    if (e.key === "Enter") ernSchritteSpeichern();
  });

  // Kurzbeschreibung eines Ziel-Stands, z. B. „Abnehmen −500 · Aktivität 1,6 · …“
  function ernZielKurz(v) {
    const diff = Number(v.ziel_kcal_diff);
    const ziel = diff === 0 ? "Halten" : diff < 0 ? `Abnehmen −${ernZahl(-diff, 0)}` : `Aufbauen +${ernZahl(diff, 0)}`;
    const anr = v.training_anrechnung === null || v.training_anrechnung === undefined ? 100 : Number(v.training_anrechnung);
    return `${ziel} · Aktivität ${ernZahl(v.pal)} · Eiweiß ${ernZahl(v.eiweiss_g_pro_kg)} g/kg · Fett ${v.fett_prozent} % · Training ${anr} % · Schritte ab ${ernZahl(ernSockelVon(v), 0)}`;
  }

  // ---- Trainingskalorien ----
  // Netto-Schätzung: (MET − 1) × kg × Stunden. Das "− 1" zieht den
  // Ruheumsatz ab, der im Grundumsatz schon steckt.
  function ernMetFuer(sportart) {
    const key = String(sportart || "").trim().toLowerCase();
    const e = ernMet.find((m) => m.sportart_key === key);
    return e ? Number(e.met) : null;
  }

  // Ermittelt die kcal eines Trainings: eigener Wert oder Schätzung aus MET, Dauer und Gewicht
  function ernTrainingKcal(t) {
    if (t.kcal !== null && t.kcal !== undefined) return { kcal: Number(t.kcal), art: "eigen" };
    const met = ernMetFuer(t.sportart);
    if (met === null) return { kcal: null, grund: "kein MET-Wert für diese Sportart" };
    if (!t.dauer_minuten) return { kcal: null, grund: "keine Dauer eingetragen" };
    const g = ernGewichtFuer(t.datum);
    if (!g) return { kcal: null, grund: "kein Gewicht eingetragen" };
    const kcal = Math.max(0, (met - 1) * Number(g.gewicht_kg) * (Number(t.dauer_minuten) / 60));
    return { kcal: Math.round(kcal), art: "schaetzung", met };
  }

  // Nur Trainings aus Privat zählen – Ernährung gibt es nur dort
  function ernTrainingsAm(datum) {
    return (training || [])
      .filter((t) => t.bereich === "privat" && t.datum === datum)
      .map((t) => ({ t, ...ernTrainingKcal(t) }));
  }

  // Baut die Tagessummen-Karte mit kcal und Makros, mit Zielen falls vorhanden
  function ernSummeHtml(s, z) {
    if (!z) {
      const hinweis = !ernProfilGeladen ? ""
        : !ernProfil ? "Für ein Tagesziel unten „Profil &amp; Ziel“ ausfüllen."
        : "Für ein Tagesziel unten unter „Gewicht“ dein Gewicht eintragen.";
      return `
        <div class="ern-summe-karte">
          <div class="ern-kcal-gross"><span>${ernZahl(s.kcal, 0)}</span> kcal</div>
          <div class="ern-makros">
            ${ernMakroHtml("Eiweiß", s.eiweiss, null, "ern-balken-eiweiss")}
            ${ernMakroHtml("Fett", s.fett, null, "ern-balken-fett")}
            ${ernMakroHtml("Kohlenhydrate", s.kohlenhydrate, null, "ern-balken-kh")}
            ${ernMakroHtml("Ballaststoffe", s.ballaststoffe, null, "")}
          </div>
          ${ernZusatzHtml(s)}
          ${hinweis ? `<p class="notiz-meta" style="margin:0.6rem 0 0;">${hinweis}</p>` : ""}
          ${s.luecken ? `<p class="notiz-meta" style="margin:0.5rem 0 0;">Bei einzelnen Einträgen fehlen Werte (–) – die Summe ist dort etwas zu niedrig.</p>` : ""}
        </div>`;
    }
    const rest = z.ziel - s.kcal;
    const prozent = Math.min(100, Math.round((s.kcal / z.ziel) * 100));
    const restText = rest >= 0
      ? `noch <strong>${ernZahl(rest, 0)} kcal</strong>`
      : `<strong>${ernZahl(-rest, 0)} kcal</strong> über dem Ziel`;
    return `
      <div class="ern-summe-karte">
        <div class="ern-kcal-gross"><span>${ernZahl(s.kcal, 0)}</span> / ${ernZahl(z.ziel, 0)} kcal</div>
        <div class="ern-kcal-balken${rest < 0 ? " ueber" : ""}"><span style="width:${prozent}%"></span></div>
        <p class="ern-rest">${restText}</p>
        ${ernTrainingZeileHtml(z)}
        ${ernSchritteZeileHtml(z)}
        <div class="ern-makros">
          ${ernMakroHtml("Eiweiß", s.eiweiss, z.eiweiss, "ern-balken-eiweiss")}
          ${ernMakroHtml("Fett", s.fett, z.fett, "ern-balken-fett")}
          ${ernMakroHtml("Kohlenhydrate", s.kohlenhydrate, z.kh, "ern-balken-kh")}
          ${ernMakroHtml("Ballaststoffe", s.ballaststoffe, null, "")}
        </div>
        ${ernZusatzHtml(s)}
        ${s.luecken ? `<p class="notiz-meta" style="margin:0.5rem 0 0;">Bei einzelnen Einträgen fehlen Werte (–) – die Summe ist dort etwas zu niedrig.</p>` : ""}
        <p class="notiz-meta" style="margin:0.5rem 0 0;">Gewicht ${ernZahl(z.kg)} kg vom ${datumDe(z.gewichtDatum)}</p>
      </div>`;
  }

  // Baut die Anzeige eines Makronährstoffs mit optionalem Ziel und Fortschrittsbalken
  function ernMakroHtml(label, g, ziel, klasse) {
    const mitZiel = ziel !== null && ziel > 0;
    const breite = mitZiel ? Math.min(100, Math.round((g / ziel) * 100)) : 0;
    return `
      <div class="ern-makro">
        <span class="ern-makro-label">${label}</span>
        <span class="ern-makro-wert">${ernZahl(g)} g${mitZiel ? ` <span class="ern-makro-ziel">/ ${ernZahl(ziel, 0)} g</span>` : ""}</span>
        ${mitZiel ? `<span class="ern-makro-balken"><span class="${klasse}" style="width:${breite}%"></span></span>` : ""}
      </div>`;
  }

  // ---- Profil-Formular ----
  function ernProfilAusFormular() {
    const [ziel, diff] = document.getElementById("ern-p-ziel").value.split(":");
    return {
      geschlecht: document.getElementById("ern-p-geschlecht").value,
      geburtsdatum: document.getElementById("ern-p-geburt").value,
      groesse_cm: document.getElementById("ern-p-groesse").value,
      pal: Number(document.getElementById("ern-p-pal").value),
      ziel, ziel_kcal_diff: Number(diff),
      eiweiss_g_pro_kg: Number(document.getElementById("ern-p-eiweiss").value),
      fett_prozent: Number(document.getElementById("ern-p-fett").value),
      training_anrechnung: Number(document.getElementById("ern-p-anrechnung").value),
      schritte_sockel: document.getElementById("ern-p-sockel").value === "" ? ERN_SCHRITTE_SOCKEL_STANDARD : Number(document.getElementById("ern-p-sockel").value),
    };
  }

  // Füllt das Profilformular mit dem heute gültigen Zielstand
  function ernProfilFormFuellen() {
    // Ziel-Einstellungen: der Stand, der heute gilt
    const p = ernProfilFuer(heuteISO());
    document.getElementById("ern-p-gueltig").value = heuteISO();
    document.getElementById("ern-p-gueltig-feld").classList.toggle("hidden", !ernProfil || ernZielVersionen === null);
    ernZielVerlaufRendern();
    document.getElementById("ern-p-geschlecht").value = p ? p.geschlecht : "";
    document.getElementById("ern-p-geburt").value = p ? p.geburtsdatum : "";
    document.getElementById("ern-p-groesse").value = p ? Number(p.groesse_cm) : "";
    document.getElementById("ern-p-pal").value = p ? Number(p.pal).toFixed(1) : "1.6";
    document.getElementById("ern-p-ziel").value = p ? `${p.ziel}:${p.ziel_kcal_diff}` : "halten:0";
    document.getElementById("ern-p-eiweiss").value = p ? Number(p.eiweiss_g_pro_kg).toFixed(1) : "1.2";
    document.getElementById("ern-p-fett").value = p ? String(p.fett_prozent) : "30";
    document.getElementById("ern-p-anrechnung").value = p && p.training_anrechnung !== undefined && p.training_anrechnung !== null ? String(p.training_anrechnung) : "100";
    document.getElementById("ern-p-sockel").value = String(ernSockelVon(p));
    ernProfilRechnungZeigen();
  }

  // Live-Rechnung unter dem Formular (mit den gerade eingestellten Werten)
  function ernProfilRechnungZeigen() {
    const el = document.getElementById("ern-profil-rechnung");
    const heute = heuteISO();
    const g = ernGewichtFuer(heute);
    const p = ernProfilAusFormular();
    if (!g) { el.innerHTML = `<p class="notiz-meta">Trag unter „Gewicht“ dein aktuelles Gewicht ein, dann steht hier die Rechnung.</p>`; return; }
    const r = ernBedarfRechnen(p, g.gewicht_kg, heute);
    if (!r) { el.innerHTML = `<p class="notiz-meta">Geschlecht, Geburtsdatum und Größe ausfüllen, dann steht hier die Rechnung.</p>`; return; }
    const diff = Number(p.ziel_kcal_diff);
    el.innerHTML = `
      <table class="ern-rechnung-tabelle">
        <tr><td>Grundumsatz (Mifflin-St Jeor, ${r.alter} J., ${ernZahl(r.kg)} kg)</td><td>${ernZahl(r.grundumsatz, 0)} kcal</td></tr>
        <tr><td>× Aktivität ${ernZahl(p.pal)} = Bedarf ohne Sport</td><td>${ernZahl(r.bedarf, 0)} kcal</td></tr>
        <tr><td>${diff === 0 ? "Ziel: halten" : (diff < 0 ? `Ziel: abnehmen −${ernZahl(-diff, 0)} kcal` : `Ziel: aufbauen +${ernZahl(diff, 0)} kcal`)}</td><td><strong>${ernZahl(r.ziel, 0)} kcal</strong></td></tr>
        <tr><td>Eiweiß ${ernZahl(p.eiweiss_g_pro_kg)} g × ${ernZahl(r.kg)} kg</td><td>${ernZahl(r.eiweiss, 0)} g</td></tr>
        <tr><td>Fett ${p.fett_prozent} % der Energie</td><td>${ernZahl(r.fett, 0)} g</td></tr>
        <tr><td>Kohlenhydrate (Rest)</td><td>${ernZahl(r.kh, 0)} g</td></tr>
      </table>
      <p class="notiz-meta">Schritte: ${(() => {
        const sm = ERN_SCHRITT_FAKTOR * Number(p.groesse_cm) / 100;
        const je1000 = ERN_KCAL_JE_KG_KM * r.kg * sm;
        return `ab ${ernZahl(p.schritte_sockel, 0)} Schritten zählt jeder weitere mit – Schrittlänge ≈ ${ernZahl(sm * 100, 0)} cm, je 1.000 Schritte ≈ ${ernZahl(je1000, 0)} kcal (grob, etwa ±20 %). Angerechnet wie Trainings`;
      })()}.</p>
      <p class="notiz-meta">An Trainingstagen kommen ${p.training_anrechnung === 0 ? "keine Trainingskalorien dazu (nur Anzeige)" : `${p.training_anrechnung === 100 ? "die" : p.training_anrechnung + " % der"} Trainingskalorien dazu – die Makroziele wachsen mit (Fett anteilig, der Rest als Kohlenhydrate)`}.</p>
      ${r.unterGrundumsatz ? `<p class="ern-warnung">Das Ziel liegt unter deinem Grundumsatz. Auf Dauer ist das nicht zu empfehlen – wähle lieber ein langsameres Tempo oder sprich es mit ärztlicher oder ernährungsfachlicher Begleitung ab.</p>` : ""}
      <p class="notiz-meta">Das ist eine Schätzung: Formeln liegen bei Einzelnen oft um rund 10 % daneben. Genauer wird es, wenn du ein paar Wochen isst, trackst und wiegst – dein Gewichtstrend zeigt dann, wo dein echter Bedarf liegt.</p>`;
  }
  ["ern-p-geschlecht", "ern-p-geburt", "ern-p-groesse", "ern-p-pal", "ern-p-ziel", "ern-p-eiweiss", "ern-p-fett", "ern-p-anrechnung", "ern-p-sockel"].forEach((id) => {
    document.getElementById(id).addEventListener("input", ernProfilRechnungZeigen);
    document.getElementById(id).addEventListener("change", ernProfilRechnungZeigen);
  });

  document.getElementById("btn-ern-profil-speichern").addEventListener("click", async (ev) => {
    const knopf = ev.currentTarget;
    const status = document.getElementById("ern-profil-status");
    knopf.disabled = true;
    const gueltigFeld = document.getElementById("ern-p-gueltig");
    // Beim ersten Profil gibt es noch keinen Verlauf – dann gilt es ab heute
    // (und über den ersten Stand ohnehin auch für frühere Tage)
    const gueltigAb = ernProfil && ernZielVersionen !== null ? (gueltigFeld.value || heuteISO()) : heuteISO();
    try {
      const res = await api("ernaehrung_profil_speichern", { ...ernProfilAusFormular(), gueltig_ab: gueltigAb });
      ernProfil = res.profil;
      if (Array.isArray(res.versionen)) ernZielVersionen = res.versionen;
      const ab = res.gueltig_ab || gueltigAb;
      status.textContent = res.staende === "unveraendert"
        ? "✓ Gespeichert – Ziel-Einstellungen unverändert, kein neuer Stand"
        : ab === heuteISO()
          ? `✓ Gespeichert – gilt ab heute${res.staende === "ersetzt" ? " (heutigen Stand ersetzt)" : ""}`
          : `✓ Gespeichert – gilt ab ${datumDe(ab)}${ab < heuteISO() ? ", Tage davor bleiben unverändert" : ""}${res.staende === "ersetzt" ? " (Stand dieses Tages ersetzt)" : ""}`;
      ernProfilFormFuellen();
      renderErnaehrung();
      if (aktiverTab === "heute") renderHeute();
    } catch (e) {
      if (e.message !== "unauthorized") status.textContent = e.message;
    } finally {
      knopf.disabled = false;
    }
  });

  // ---- Verlauf der Ziel-Einstellungen (Profil-Historie) ----
  function ernZielVerlaufRendern() {
    const el = document.getElementById("ern-ziel-verlauf");
    if (!el) return;
    if (!ernProfil || ernZielVersionen === null || !ernZielVersionen.length) { el.innerHTML = ""; return; }
    const heute = heuteISO();
    const aktuell = ernZielVersionFuer(heute);
    // Neueste zuerst; „bis“ = Tag vor dem nächsten Stand
    const zeilen = ernZielVersionen.map((v, i) => {
      const naechster = ernZielVersionen[i + 1];
      const von = i === 0 ? "Von Anfang an" : `Ab ${datumDe(v.gueltig_ab)}`;
      const bis = naechster ? ` bis ${datumDe(addTage(naechster.gueltig_ab, -1))}` : "";
      const markierung = v === aktuell ? " <span class=\"badge\">gilt heute</span>" : (v.gueltig_ab > heute ? " <span class=\"badge\">geplant</span>" : "");
      const loeschen = ernZielVersionen.length > 1
        ? `<button class="task-delete" onclick="ernZielVersionLoeschen('${v.gueltig_ab}')" aria-label="Stand ab ${datumDe(v.gueltig_ab)} löschen">${ic("x")}</button>`
        : "";
      return `
        <div class="ern-ziel-stand">
          <div class="ern-ziel-stand-text"><span><strong>${von}${bis}</strong>${markierung}</span><span class="notiz-meta">${escapeHtml(ernZielKurz(v))}</span></div>
          ${loeschen}
        </div>`;
    }).reverse().join("");
    el.innerHTML = `
      <p class="ern-liste-titel" style="margin-top:0.8rem;">Verlauf der Ziel-Einstellungen</p>
      <div class="ern-ziel-verlauf-liste">${zeilen}</div>
      <p class="notiz-meta">Jeder Tag wird mit dem Stand gerechnet, der an diesem Tag galt – in der Tagessumme, der Woche und im Export. Geschlecht, Geburtsdatum und Größe gelten immer für alle Tage.</p>`;
  }

  // Löscht nach Rückfrage einen Zielstand (gültig ab Datum) und rendert neu
  window.ernZielVersionLoeschen = async function(gueltigAb) {
    const i = (ernZielVersionen || []).findIndex((v) => v.gueltig_ab === gueltigAb);
    if (i < 0) return;
    const text = i === 0
      ? `Den ersten Stand löschen? Dann gilt der Stand ab ${datumDe(ernZielVersionen[1].gueltig_ab)} auch für alle Tage davor.`
      : `Stand ab ${datumDe(gueltigAb)} löschen? Ab dann gilt wieder der vorherige Stand.`;
    if (!confirm(text)) return;
    const status = document.getElementById("ern-profil-status");
    try {
      const res = await api("ernaehrung_ziel_version_loeschen", { gueltig_ab: gueltigAb });
      ernZielVersionen = res.versionen || [];
      status.textContent = "✓ Stand gelöscht";
      ernProfilFormFuellen();
      renderErnaehrung();
      if (aktiverTab === "heute") renderHeute();
    } catch (e) {
      if (e.message !== "unauthorized") status.textContent = e.message;
    }
  };

  // ---- Gewicht ----
  document.getElementById("btn-ern-gewicht").addEventListener("click", async (ev) => {
    const knopf = ev.currentTarget;
    const status = document.getElementById("ern-gewicht-status");
    const datum = document.getElementById("ern-g-datum").value || heuteISO();
    const kg = document.getElementById("ern-g-kg").value;
    if (!kg) { status.textContent = "Bitte ein Gewicht eingeben."; return; }
    knopf.disabled = true;
    try {
      const res = await api("gewicht_speichern", { datum, gewicht_kg: kg });
      ernGewichte = ernGewichte.filter((g) => g.datum !== datum).concat([res.gewicht])
        .sort((a, b) => a.datum.localeCompare(b.datum));
      document.getElementById("ern-g-kg").value = "";
      status.textContent = `✓ ${ernZahl(res.gewicht.gewicht_kg)} kg am ${datumDe(datum)} gespeichert`;
      ernGewichtRendern();
      ernProfilRechnungZeigen();
      renderErnaehrung();
    } catch (e) {
      if (e.message !== "unauthorized") status.textContent = e.message;
    } finally {
      knopf.disabled = false;
    }
  });
  document.getElementById("ern-g-kg").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btn-ern-gewicht").click();
  });

  // Löscht nach Rückfrage einen Gewichtseintrag
  window.ernGewichtLoeschen = async function(datum) {
    if (!confirm(`Gewicht vom ${datumDe(datum)} löschen?`)) return;
    try {
      await api("gewicht_loeschen", { datum });
      ernGewichte = ernGewichte.filter((g) => g.datum !== datum);
      ernGewichtRendern();
      ernProfilRechnungZeigen();
      renderErnaehrung();
    } catch (e) {
      if (e.message !== "unauthorized") alert(e.message);
    }
  };

  // Veränderung gegenüber dem letzten Wert, der mindestens "tage" zurückliegt
  function ernGewichtVeraenderung(tage) {
    if (ernGewichte.length < 2) return null;
    const letzter = ernGewichte[ernGewichte.length - 1];
    const grenze = addTage(letzter.datum, -tage);
    const vorher = ernGewichte.filter((g) => g.datum <= grenze).pop();
    if (!vorher) return null;
    return { kg: Number(letzter.gewicht_kg) - Number(vorher.gewicht_kg), datum: vorher.datum };
  }

  // Rendert den Gewichtsverlauf mit Veränderungen (7/30 Tage) und Diagramm der letzten 90 Tage
  function ernGewichtRendern() {
    document.getElementById("ern-g-datum").value = heuteISO();
    const el = document.getElementById("ern-gewicht-verlauf");
    if (!ernGewichte.length) { el.innerHTML = `<p class="notiz-meta">Noch kein Gewicht eingetragen.</p>`; return; }
    const letzter = ernGewichte[ernGewichte.length - 1];
    // Vergleich mit dem letzten Wert, der mind. 7 bzw. 30 Tage zurückliegt –
    // mit dem echten Vergleichsdatum, weil nicht jeden Tag gewogen wird
    const vergleiche = [ernGewichtVeraenderung(7), ernGewichtVeraenderung(30)]
      .filter((x, i, a) => x && (i === 0 || !a[0] || a[0].datum !== x.datum));
    const vText = vergleiche.map((x) => ` · seit ${datumDe(x.datum)}: ${x.kg > 0 ? "+" : x.kg < 0 ? "−" : "±"}${ernZahl(Math.abs(x.kg))} kg`).join("");
    // Diagramm: letzte 90 Tage
    const grenze = addTage(heuteISO(), -90);
    const punkte = ernGewichte.filter((g) => g.datum >= grenze);
    let svg = "";
    if (punkte.length >= 2) {
      const tag = (iso) => tageSeitIso(punkte[0].datum, iso);
      const spanne = Math.max(1, tag(punkte[punkte.length - 1].datum));
      const werte = punkte.map((p) => Number(p.gewicht_kg));
      const min = Math.min(...werte) - 0.5, max = Math.max(...werte) + 0.5;
      const B = 320, H = 120, R = 8;
      const x = (iso) => R + (tag(iso) / spanne) * (B - 2 * R);
      const y = (kg) => R + (1 - (kg - min) / (max - min)) * (H - 2 * R);
      const linie = punkte.map((p) => `${x(p.datum).toFixed(1)},${y(Number(p.gewicht_kg)).toFixed(1)}`).join(" ");
      svg = `<svg class="ern-gewicht-svg" viewBox="0 0 ${B} ${H + 22}" role="img" aria-label="Gewichtsverlauf der letzten 90 Tage">
        <polyline points="${linie}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"></polyline>
        ${punkte.map((p) => `<circle cx="${x(p.datum).toFixed(1)}" cy="${y(Number(p.gewicht_kg)).toFixed(1)}" r="2.5" fill="var(--accent)"></circle>`).join("")}
        <text x="${R}" y="${H + 18}" font-size="10" fill="var(--ink-dim)">${datumDe(punkte[0].datum)}</text>
        <text x="${B - R}" y="${H + 18}" font-size="10" fill="var(--ink-dim)" text-anchor="end">${datumDe(punkte[punkte.length - 1].datum)}</text>
        <text x="${R}" y="${R + 4}" font-size="10" fill="var(--ink-dim)">${ernZahl(max - 0.5)} kg</text>
        <text x="${R}" y="${H - 2}" font-size="10" fill="var(--ink-dim)">${ernZahl(min + 0.5)} kg</text>
      </svg>`;
    }
    const liste = ernGewichte.slice(-8).reverse().map((g) => `
      <div class="ern-gewicht-zeile">
        <span>${datumDe(g.datum)}</span><strong>${ernZahl(g.gewicht_kg)} kg</strong>
        <button class="task-delete" onclick="ernGewichtLoeschen('${g.datum}')" aria-label="Gewicht vom ${datumDe(g.datum)} löschen">${ic("x")}</button>
      </div>`).join("");
    el.innerHTML = `
      <p class="ern-gewicht-aktuell">Zuletzt <strong>${ernZahl(letzter.gewicht_kg)} kg</strong> am ${datumDe(letzter.datum)}${vText}</p>
      ${svg}
      <div class="ern-gewicht-liste">${liste}</div>
      <p class="notiz-meta">Tipp: morgens nach dem Aufstehen wiegen, gleiche Bedingungen. Einzelwerte schwanken um 1–2 kg (Wasser, Salz, Verdauung) – aussagekräftig ist der Trend über Wochen.</p>`;
  }

  // Baut die Trainingszeile unter der Tagessumme mit kcal je Training und Zuschlag
  function ernTrainingZeileHtml(z) {
    if (!z.trainings.length) return "";
    const teile = z.trainings.map(({ t, kcal, art, grund }) => {
      const name = escapeHtml(t.sportart) + (t.dauer_minuten ? ` ${t.dauer_minuten} Min.` : "");
      if (kcal === null) return `${name}: <span class="ern-ohne-wert">? (${grund})</span>`;
      return `${name}: ${art === "eigen" ? "" : "≈ "}${ernZahl(kcal, 0)} kcal${art === "eigen" ? " (eigener Wert)" : ""}`;
    });
    const zuschlag = z.anrechnung === 100
      ? `+${ernZahl(z.trainingZuschlag, 0)} kcal aufs Ziel`
      : `davon ${z.anrechnung} % = +${ernZahl(z.trainingZuschlag, 0)} kcal aufs Ziel`;
    return `<p class="ern-training-zeile">${ic("aktivitaet")} ${teile.join(" · ")}${z.trainingSumme > 0 ? ` → ${zuschlag}` : ""}</p>`;
  }

  // ---- MET-Werte je Sportart (Block „🏃 Trainingskalorien“) ----
  // Richtwerte nach dem Compendium of Physical Activities (Brutto-METs)
  const ERN_MET_VORSCHLAEGE = [
    [3.5, "Rücken/Gymnastik, leicht bis moderat"],
    [8.0, "Calisthenics/Bodyweight, kräftig"],
    [3.5, "Krafttraining, moderat"],
    [6.0, "Krafttraining, kräftig"],
    [4.8, "Zügiges Gehen (ca. 5,6–6,3 km/h)"],
    [6.0, "Wandern im Gelände"],
    [7.0, "Joggen, allgemein"],
    [9.3, "Laufen, ca. 10 km/h"],
    [4.0, "Radfahren gemütlich (unter 16 km/h)"],
    [8.0, "Radfahren zügig (ca. 19–22 km/h)"],
  ];

  // Sammelt alle Sportarten (Privat-Trainings, Stammdaten, MET-Werte) sortiert und ohne Dubletten
  function ernSportartenFuerMet() {
    const namen = new Map();
    const merken = (n) => {
      const name = String(n || "").trim();
      if (name && !namen.has(name.toLowerCase())) namen.set(name.toLowerCase(), name);
    };
    (training || []).filter((t) => t.bereich === "privat").forEach((t) => merken(t.sportart));
    if (typeof trainingStammdatenAktuell === "function" && aktiverBereich === "privat") {
      trainingStammdatenAktuell("sportart").forEach((s) => merken(s.name));
    }
    ernMet.forEach((m) => merken(m.sportart));
    return [...namen.values()].sort((a, b) => a.localeCompare(b, "de"));
  }

  // Rendert die MET-Liste je Sportart mit Vorschlägen und kcal pro Stunde
  function ernMetRendern() {
    const el = document.getElementById("ern-met-liste");
    if (!el) return;
    const sportarten = ernSportartenFuerMet();
    const g = ernGewichtFuer(heuteISO());
    if (!sportarten.length) {
      el.innerHTML = `<p class="notiz-meta">Noch keine Sportarten – sobald du im Reiter Training (Privat) etwas einträgst, erscheint die Sportart hier.</p>`;
      return;
    }
    el.innerHTML = sportarten.map((name, i) => {
      const met = ernMetFuer(name);
      const optionen = ERN_MET_VORSCHLAEGE.map(([wert, label], j) =>
        `<option value="${j}">${escapeHtml(label)} – ${ernZahl(wert)}</option>`).join("");
      const proStunde = met !== null && g ? `≈ ${ernZahl((met - 1) * Number(g.gewicht_kg), 0)} kcal pro Stunde bei ${ernZahl(g.gewicht_kg)} kg` : (met === null ? "noch kein Wert – Trainings zählen dann nicht" : "");
      return `
        <div class="ern-met-zeile">
          <div class="ern-met-kopf"><strong>${escapeHtml(name)}</strong><span class="notiz-meta">${proStunde}</span></div>
          <div class="row" style="margin-bottom:0;">
            <select aria-label="Vorschlag für ${escapeAttr(name)}" onchange="ernMetVorschlag(${i}, this.value)">
              <option value="">Vorschlag wählen …</option>${optionen}
            </select>
            <input type="number" id="ern-met-wert-${i}" min="1" max="25" step="0.1" inputmode="decimal" placeholder="MET" value="${met !== null ? met : ""}" aria-label="MET-Wert für ${escapeAttr(name)}">
            <button class="btn-secondary" onclick="ernMetSpeichern(${i})">Speichern</button>
          </div>
        </div>`;
    }).join("");
    el.dataset.sportarten = JSON.stringify(sportarten);
  }

  // Übernimmt einen MET-Vorschlag in das Eingabefeld der Sportart
  window.ernMetVorschlag = function(i, index) {
    if (index === "") return;
    document.getElementById(`ern-met-wert-${i}`).value = ERN_MET_VORSCHLAEGE[Number(index)][0];
  };

  // Speichert oder entfernt den MET-Wert einer Sportart
  window.ernMetSpeichern = async function(i) {
    const el = document.getElementById("ern-met-liste");
    const sportart = JSON.parse(el.dataset.sportarten || "[]")[i];
    if (!sportart) return;
    const wert = document.getElementById(`ern-met-wert-${i}`).value;
    const status = document.getElementById("ern-met-status");
    try {
      const res = await api("training_met_speichern", { sportart, met: wert });
      const key = sportart.toLowerCase();
      ernMet = ernMet.filter((m) => m.sportart_key !== key);
      if (res.met) ernMet.push(res.met);
      status.textContent = res.met ? `✓ ${sportart}: MET ${ernZahl(res.met.met)} gespeichert` : `✓ MET-Wert für ${sportart} entfernt`;
      ernMetRendern();
      if (aktiverTab === "ernaehrung") renderErnaehrung();
    } catch (e) {
      if (e.message !== "unauthorized") status.textContent = e.message;
    }
  };

  // Kalorien in der Trainingsliste (nur Privat – Ernährung gibt es nur dort)
  function trainingKcalAnzeige(t) {
    if (t.bereich !== "privat") return "";
    if (t.kcal !== null && t.kcal !== undefined) return ` · ${t.kcal} kcal`;
    if (!ernProfilGeladen) return "";
    const r = ernTrainingKcal(t);
    return r.kcal === null ? "" : ` · ≈ ${r.kcal} kcal`;
  }

  // ==========================================================
  // Ernährung Etappe 4: Barcode (Open Food Facts), Markensuche,
  // eigene Lebensmittel. OFF läuft über die Edge Function (eigener
  // User-Agent, Cache in "lebensmittel"); gescannt wird im Browser mit
  // BarcodeDetector (Chrome auf Android), sonst Barcode abtippen.
  // ==========================================================
  let ernLmBearbeiten = null;     // Lebensmittel, das im Eigen-Formular bearbeitet wird
  let ernMeineModus = false;      // Formular aus „Meine Lebensmittel“ geöffnet: danach schließen statt eintragen
  let ernMeineListe = [];
  let ernMeineLaedt = false;
  let ernScanStream = null;
  let ernScanLaeuft = false;
  let ernScanLicht = false;       // Taschenlampe an/aus (falls die Kamera das kann)
  let ernScanHistorie = false;
  let ernScanZiel = null;         // "feld" = Scan füllt das Barcode-Feld im Eigen-Formular

  // Liefert das Quellen-Label eines Lebensmittels (Open Food Facts/eigenes)
  function ernQuelleLabel(l) {
    return l.quelle === "off" ? "Open Food Facts" : l.quelle === "eigen" ? "eigenes" : "";
  }

  // Ein Lebensmittel (z. B. frisch gescannt) direkt zur Mengeneingabe öffnen
  function ernLebensmittelWaehlen(l) {
    const letzte = ernZuletzt.find((z) => z.id === l.id);
    ernListe = [{ ...l, letzte_menge: letzte ? letzte.letzte_menge : null }];
    window.ernAuswaehlen(0);
  }

  // Ergebnis von Scanner/Abtippen: ins Barcode-Feld oder als Suche
  function ernScanErgebnis(code, ziel) {
    if (ziel === "feld") {
      const feld = document.getElementById("ern-eigen-barcode");
      feld.value = String(code || "").replace(/\D/g, "");
      feld.focus();
      return;
    }
    ernBarcodeSuchen(code);
  }

  // ---- Open Food Facts: Barcode ----
  async function ernBarcodeSuchen(code) {
    const status = document.getElementById("ern-hinzu-status");
    const ziffern = String(code || "").replace(/\D/g, "");
    if (ziffern.length < 8 || ziffern.length > 14) { status.textContent = "Ein Barcode hat 8 bis 14 Ziffern."; return; }
    status.textContent = "Suche Barcode " + ziffern + " …";
    try {
      const res = await api("off_barcode", { code: ziffern });
      if (res.gefunden) {
        status.textContent = res.aus_cache ? "" : "✓ Bei Open Food Facts gefunden und gespeichert – Werte kurz mit der Packung vergleichen.";
        ernLebensmittelWaehlen(res.lebensmittel);
        return;
      }
      // Nicht (vollständig) gefunden: eigenes Lebensmittel anbieten
      status.textContent = res.grund === "keine_naehrwerte"
        ? `„${res.name}“ steht bei Open Food Facts, aber ohne Kalorien je 100 g. Trag die Werte von der Packung ein:`
        : `Barcode ${ziffern} ist bei Open Food Facts nicht bekannt. Trag die Werte von der Packung ein:`;
      ernEigenOeffnen(null, res.name || "", ziffern);
    } catch (e) {
      if (e.message !== "unauthorized") status.textContent = e.message;
    }
  }

  // ---- Open Food Facts: Textsuche (nur auf Knopfdruck) ----
  document.getElementById("btn-ern-off-suche").addEventListener("click", async (ev) => {
    const knopf = ev.currentTarget;
    const q = document.getElementById("ern-suche").value.trim();
    const el = document.getElementById("ern-treffer");
    if (q.length < 2) {
      document.getElementById("ern-hinzu-status").textContent = "Erst oben Produkt oder Marke eintippen, z. B. „skyr natur“, dann hier suchen.";
      document.getElementById("ern-suche").focus();
      return;
    }
    clearTimeout(ernSucheTimer);
    ernSucheNr++;
    knopf.disabled = true;
    el.innerHTML = `<p class="notiz-meta">Suche bei Open Food Facts …</p>`;
    try {
      const res = await api("off_suche", { q });
      const treffer = res.treffer || [];
      el.innerHTML = treffer.length
        ? `<p class="ern-liste-titel">Open Food Facts</p>` + treffer.map((t) => `
            <button class="ern-treffer-zeile" onclick="ernOffTrefferWaehlen('${escapeAttr(t.code)}')">
              <span class="ern-treffer-name">${escapeHtml(t.name)}${t.marke ? ` <span class="notiz-meta">(${escapeHtml(t.marke)})</span>` : ""}</span>
              <span class="notiz-meta">${t.kcal !== null && t.kcal !== undefined ? ernZahl(t.kcal, 0) + " kcal je 100 g · " : ""}Barcode ${escapeHtml(t.code)}</span>
            </button>`).join("")
        : `<p class="notiz-meta">Bei Open Food Facts nichts gefunden. Tipp: Barcode scannen oder ein eigenes Lebensmittel anlegen.</p>`;
    } catch (e) {
      if (e.message !== "unauthorized") el.innerHTML = `<p class="notiz-meta">${escapeHtml(e.message)}</p>`;
    } finally {
      knopf.disabled = false;
    }
  });

  // Sucht ein Open-Food-Facts-Treffer per Barcode
  window.ernOffTrefferWaehlen = function(code) { ernBarcodeSuchen(code); };

  // ---- Eigenes Lebensmittel anlegen / korrigieren ----
  const ERN_EIGEN_FELDER = ["name", "marke", "kcal", "fett", "gesfett", "kh", "zucker", "bal", "eiweiss", "salz", "portion-name", "portion-g"];
  // Barcode aus einem erfolglosen Scan: wird beim Anlegen mitgespeichert
  let ernEigenBarcode = null;
  function ernEigenOeffnen(l, vorschlagName, barcode) {
    ernLmBearbeiten = l;
    ernEigenBarcode = !l && barcode ? barcode : null;
    const werte = l ? {
      name: l.name, marke: l.marke || "", kcal: l.kcal, eiweiss: l.eiweiss, fett: l.fett, kh: l.kohlenhydrate,
      bal: l.ballaststoffe, gesfett: l.ges_fett, zucker: l.zucker, salz: l.salz,
      "portion-name": l.portion_name || "", "portion-g": l.portion_g,
    } : { name: vorschlagName || "" };
    ERN_EIGEN_FELDER.forEach((f) => {
      const v = werte[f];
      document.getElementById(`ern-eigen-${f}`).value = v === null || v === undefined ? "" : v;
    });
    document.getElementById("ern-eigen-hinweis").textContent = l
      ? `Werte je 100 g korrigieren (Quelle: ${ernQuelleLabel(l)}). Bereits eingetragene Tage bleiben unverändert.`
      : ernEigenBarcode
        ? `Werte je 100 g von der Nährwerttabelle der Packung. Barcode ${ernEigenBarcode} wird mitgespeichert – beim nächsten Scan kommt das Produkt direkt aus deinen Lebensmitteln.`
        : "Werte je 100 g, z. B. von der Nährwerttabelle auf der Packung. Das Lebensmittel steht danach in der Suche.";
    document.getElementById("btn-ern-eigen-loeschen").classList.toggle("hidden", !l);
    // Barcode: bei neuen und eigenen Lebensmitteln änderbar, bei Open Food
    // Facts fest (dort ist der Code der OFF-Barcode)
    const barcodeFeld = document.getElementById("ern-eigen-barcode");
    const barcodeAn = !l || l.quelle === "eigen";
    document.getElementById("ern-eigen-barcode-feld").classList.toggle("hidden", !barcodeAn);
    barcodeFeld.value = l ? (l.quelle === "eigen" && l.quell_code ? l.quell_code : "") : (ernEigenBarcode || "");
    document.getElementById("btn-ern-eigen-zuordnen").classList.toggle("hidden", !ernEigenBarcode);
    ernAnsicht("eigen");
    document.getElementById(werte.name ? "ern-eigen-kcal" : "ern-eigen-name").focus();
  }

  document.getElementById("btn-ern-eigen-neu").addEventListener("click", () => {
    document.getElementById("ern-hinzu-status").textContent = "";
    ernEigenOeffnen(null, document.getElementById("ern-suche").value.trim());
  });
  document.getElementById("btn-ern-lm-bearbeiten").addEventListener("click", () => {
    if (ernAuswahl) ernEigenOeffnen(ernAuswahl);
  });
  document.getElementById("btn-ern-eigen-zurueck").addEventListener("click", () => {
    if (ernMeineModus) { ernLmBearbeiten = null; ernEigenBarcode = null; ernHinzuSchliessen(); ernMeineZeigen(); return; }
    if (ernLmBearbeiten && ernAuswahl) { ernAnsicht("menge"); return; }
    ernLmBearbeiten = null;
    ernEigenBarcode = null;
    ernAnsicht("suche");
    document.getElementById("ern-suche").focus();
  });

  document.getElementById("btn-ern-eigen-speichern").addEventListener("click", async (ev) => {
    const knopf = ev.currentTarget;
    const wert = (f) => document.getElementById(`ern-eigen-${f}`).value;
    const status = document.getElementById("ern-hinzu-status");
    if (!wert("name").trim() || wert("kcal") === "") { status.textContent = "Bitte mindestens Bezeichnung und kcal je 100 g angeben."; return; }
    knopf.disabled = true;
    try {
      const res = await api("lebensmittel_speichern", {
        id: ernLmBearbeiten ? ernLmBearbeiten.id : undefined,
        name: wert("name"), marke: wert("marke"), kcal: wert("kcal"),
        eiweiss: wert("eiweiss"), fett: wert("fett"), kohlenhydrate: wert("kh"), ballaststoffe: wert("bal"),
        ges_fett: wert("gesfett"), zucker: wert("zucker"), salz: wert("salz"),
        portion_name: wert("portion-name"), portion_g: wert("portion-g"),
        // Neu: leer = ohne Barcode. Eigenes bearbeiten: leer = Barcode entfernen.
        // Open Food Facts: nicht mitschicken (Feld ist ausgeblendet).
        barcode: ernLmBearbeiten && ernLmBearbeiten.quelle !== "eigen" ? undefined : wert("barcode").trim(),
      });
      const l = res.lebensmittel;
      // Zuletzt-Liste mit den korrigierten Werten aktualisieren
      ernZuletzt = ernZuletzt.map((z) => (z.id === l.id ? { ...z, ...l } : z));
      status.textContent = ernLmBearbeiten ? "✓ Werte korrigiert"
        : l.quell_code ? "✓ Lebensmittel mit Barcode angelegt" : "✓ Lebensmittel angelegt";
      ernLmBearbeiten = null;
      ernEigenBarcode = null;
      if (ernMeineBlockOffen()) ernMeineLaden();
      if (ernMeineModus) {
        const text = status.textContent + ` („${l.name}“)`;
        status.textContent = "";
        ernHinzuSchliessen();
        ernMeineZeigen(text);
        return;
      }
      ernLebensmittelWaehlen(l);
    } catch (e) {
      if (e.message !== "unauthorized") status.textContent = e.message;
    } finally {
      knopf.disabled = false;
    }
  });

  // ---- Barcode einem vorhandenen eigenen Lebensmittel zuordnen ----
  let ernZuordnenListe = [];
  let ernZuordnenCode = null;

  // Rendert die gefilterte Liste eigener Lebensmittel zum Zuordnen eines Barcodes
  function ernZuordnenRendern() {
    const el = document.getElementById("ern-zuordnen-liste");
    const q = document.getElementById("ern-zuordnen-filter").value.trim().toLowerCase();
    const woerter = q.split(/\s+/).filter(Boolean);
    const treffer = ernZuordnenListe.filter((l) => {
      const text = `${l.name} ${l.marke || ""}`.toLowerCase();
      return woerter.every((w) => text.includes(w));
    });
    if (!ernZuordnenListe.length) {
      el.innerHTML = `<p class="notiz-meta">Du hast noch keine eigenen Lebensmittel. Geh zurück und leg es mit den Werten von der Packung an.</p>`;
      return;
    }
    el.innerHTML = treffer.length
      ? treffer.slice(0, 60).map((l) => `
          <button class="ern-treffer-zeile" onclick="ernBarcodeZuordnen('${escapeAttr(l.id)}')">
            <span class="ern-treffer-name">${escapeHtml(l.name)}${l.marke ? ` <span class="notiz-meta">(${escapeHtml(l.marke)})</span>` : ""}</span>
            <span class="notiz-meta">${ernZahl(l.kcal, 0)} kcal je 100 g · ${l.quell_code ? `hat schon Barcode ${escapeHtml(l.quell_code)}` : "noch ohne Barcode"}</span>
          </button>`).join("")
      : `<p class="notiz-meta">Kein eigenes Lebensmittel passt zum Filter.</p>`;
  }

  document.getElementById("btn-ern-eigen-zuordnen").addEventListener("click", async () => {
    const code = document.getElementById("ern-eigen-barcode").value.replace(/\D/g, "") || ernEigenBarcode;
    const status = document.getElementById("ern-hinzu-status");
    if (!code) return;
    ernZuordnenCode = code;
    document.getElementById("ern-zuordnen-hinweis").textContent =
      `Barcode ${code}: Tipp das eigene Lebensmittel an, zu dem er gehört. Beim nächsten Scan kommt es dann direkt.`;
    document.getElementById("ern-zuordnen-filter").value = "";
    document.getElementById("ern-zuordnen-liste").innerHTML = `<p class="notiz-meta">Lade deine eigenen Lebensmittel …</p>`;
    status.textContent = "";
    ernAnsicht("zuordnen");
    try {
      const res = await api("lebensmittel_eigene");
      ernZuordnenListe = res.lebensmittel || [];
      // Ohne Barcode zuerst – das sind die Kandidaten
      ernZuordnenListe.sort((a, b) => (a.quell_code ? 1 : 0) - (b.quell_code ? 1 : 0) || a.name.localeCompare(b.name, "de"));
      ernZuordnenRendern();
      document.getElementById("ern-zuordnen-filter").focus();
    } catch (e) {
      if (e.message !== "unauthorized") document.getElementById("ern-zuordnen-liste").innerHTML = `<p class="notiz-meta">${escapeHtml(e.message)}</p>`;
    }
  });

  document.getElementById("ern-zuordnen-filter").addEventListener("input", ernZuordnenRendern);
  document.getElementById("btn-ern-zuordnen-zurueck").addEventListener("click", () => {
    document.getElementById("ern-hinzu-status").textContent = "";
    ernAnsicht("eigen");
  });

  // Ordnet den gescannten Barcode einem eigenen Lebensmittel zu (nach Rückfrage bei vorhandenem)
  window.ernBarcodeZuordnen = async function(id) {
    const l = ernZuordnenListe.find((x) => x.id === id);
    const status = document.getElementById("ern-hinzu-status");
    if (!l || !ernZuordnenCode) return;
    if (l.quell_code && l.quell_code !== ernZuordnenCode
      && !confirm(`„${l.name}“ hat schon den Barcode ${l.quell_code}. Durch ${ernZuordnenCode} ersetzen?`)) return;
    try {
      const res = await api("lebensmittel_barcode_zuordnen", { id, barcode: ernZuordnenCode });
      const neu = res.lebensmittel;
      ernZuletzt = ernZuletzt.map((z) => (z.id === neu.id ? { ...z, ...neu } : z));
      ernEigenBarcode = null;
      ernZuordnenCode = null;
      status.textContent = `✓ Barcode ${neu.quell_code} gehört jetzt zu „${neu.name}“`;
      ernLebensmittelWaehlen(neu);
    } catch (e) {
      if (e.message !== "unauthorized") status.textContent = e.message;
    }
  };

  document.getElementById("btn-ern-eigen-loeschen").addEventListener("click", async () => {
    const l = ernLmBearbeiten;
    if (!l || !confirm(`„${l.name}“ aus deinen Lebensmitteln löschen? Bereits eingetragene Tage bleiben erhalten.`)) return;
    try {
      await api("lebensmittel_loeschen", { id: l.id });
      ernZuletzt = ernZuletzt.filter((z) => z.id !== l.id);
      ernLmBearbeiten = null;
      ernAuswahl = null;
      if (ernMeineBlockOffen()) ernMeineLaden();
      if (ernMeineModus) {
        ernHinzuSchliessen();
        ernMeineZeigen(`✓ „${l.name}“ gelöscht`);
        return;
      }
      document.getElementById("ern-hinzu-status").textContent = `✓ „${l.name}“ gelöscht`;
      ernAnsicht("suche");
      document.getElementById("ern-suche").value = "";
      ernZuletztZeigen();
    } catch (e) {
      if (e.message !== "unauthorized") alert(e.message);
    }
  });

  // ---- Meine Lebensmittel (Übersicht der eigenen) ----
  function ernMeineBlockOffen() {
    const b = document.getElementById("ern-meine-block");
    return !!(b && b.open);
  }

  // Lädt die eigenen Lebensmittel und rendert die Liste
  async function ernMeineLaden() {
    const el = document.getElementById("ern-meine-liste");
    if (ernMeineLaedt) return;
    ernMeineLaedt = true;
    if (!ernMeineListe.length) el.innerHTML = `<p class="notiz-meta">Lade deine Lebensmittel …</p>`;
    try {
      const res = await api("lebensmittel_eigene");
      ernMeineListe = res.lebensmittel || [];
      ernMeineRendern();
    } catch (e) {
      if (e.message !== "unauthorized") el.innerHTML = `<p class="notiz-meta">${escapeHtml(e.message)}</p>`;
    } finally {
      ernMeineLaedt = false;
    }
  }

  // Rendert die gefilterte Liste eigener Lebensmittel mit Zählern
  function ernMeineRendern() {
    const el = document.getElementById("ern-meine-liste");
    if (!ernMeineListe.length) {
      el.innerHTML = `<p class="notiz-meta">Noch keine eigenen Lebensmittel. „Neu“ legt eins an – oder scann ein Produkt, das Open Food Facts nicht kennt.</p>`;
      return;
    }
    const woerter = document.getElementById("ern-meine-filter").value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const treffer = ernMeineListe.filter((l) => {
      const text = `${l.name} ${l.marke || ""} ${l.quell_code || ""}`.toLowerCase();
      return woerter.every((w) => text.includes(w));
    });
    const mitBarcode = ernMeineListe.filter((l) => l.quell_code).length;
    const kopf = `<p class="ern-liste-titel">${ernMeineListe.length} eigene${woerter.length ? ` · ${treffer.length} passend` : ""} · ${mitBarcode} mit Barcode</p>`;
    el.innerHTML = kopf + (treffer.length
      ? treffer.slice(0, 100).map((l) => `
          <button class="ern-treffer-zeile" onclick="ernMeineBearbeiten('${escapeAttr(l.id)}')">
            <span class="ern-treffer-name">${escapeHtml(l.name)}${l.marke ? ` <span class="notiz-meta">(${escapeHtml(l.marke)})</span>` : ""}</span>
            <span class="notiz-meta">${ernZahl(l.kcal, 0)} kcal · E ${ernZahl(l.eiweiss)} · F ${ernZahl(l.fett)} · KH ${ernZahl(l.kohlenhydrate)} je 100 g · ${l.quell_code ? `Barcode ${escapeHtml(l.quell_code)}` : "ohne Barcode"}</span>
          </button>`).join("") + (treffer.length > 100 ? `<p class="notiz-meta">… und ${treffer.length - 100} weitere – Filter nutzen.</p>` : "")
      : `<p class="notiz-meta">Nichts passt zum Filter.</p>`);
  }

  // Block wieder zeigen (nach Speichern/Löschen/Zurück), optional mit Meldung
  function ernMeineZeigen(meldung) {
    const block = document.getElementById("ern-meine-block");
    document.getElementById("ern-meine-status").textContent = meldung || "";
    if (!block.open) block.open = true; else ernMeineRendern();
    block.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // Öffnet das Formular zum Anlegen/Bearbeiten eines eigenen Lebensmittels
  function ernMeineFormOeffnen(l) {
    window.ernHinzuOeffnen(null);
    ernMeineModus = true;
    document.getElementById("ern-meine-status").textContent = "";
    ernEigenOeffnen(l, "");
    document.getElementById("ern-hinzu-titel").textContent = l ? "Lebensmittel bearbeiten" : "Neues Lebensmittel";
    document.getElementById("ern-hinzu-mahlzeit").classList.add("hidden");
    document.getElementById("ern-hinzu").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // Öffnet ein eigenes Lebensmittel zum Bearbeiten
  window.ernMeineBearbeiten = function(id) {
    const l = ernMeineListe.find((x) => x.id === id);
    if (l) ernMeineFormOeffnen(l);
  };

  document.getElementById("ern-meine-block").addEventListener("toggle", (e) => {
    if (e.target.open) ernMeineLaden();
  });
  document.getElementById("ern-meine-filter").addEventListener("input", ernMeineRendern);
  document.getElementById("btn-ern-meine-neu").addEventListener("click", () => ernMeineFormOeffnen(null));

  // ---- Scanner ----
  document.getElementById("btn-ern-scan").addEventListener("click", () => { ernScanZiel = null; ernScannerOeffnen(); });
  document.getElementById("btn-ern-eigen-barcode-scan").addEventListener("click", () => {
    ernScanZiel = "feld";
    document.getElementById("btn-ern-scanner-suchen").textContent = "Übernehmen";
    ernScannerOeffnen();
  });
  document.getElementById("btn-ern-scanner-zu").addEventListener("click", () => ernScannerSchliessen());
  document.getElementById("btn-ern-scanner-suchen").addEventListener("click", () => {
    const code = document.getElementById("ern-scanner-code").value;
    const ziel = ernScanZiel;
    ernScannerSchliessen();
    ernScanErgebnis(code, ziel);
  });
  document.getElementById("ern-scanner-code").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btn-ern-scanner-suchen").click();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("ern-scanner").classList.contains("hidden")) ernScannerSchliessen();
  });
  // Zurück-Taste des Handys schließt nur den Scanner
  window.addEventListener("popstate", () => {
    if (ernScanHistorie) { ernScanHistorie = false; ernScannerSchliessen(true); }
  });

  // Öffnet den Barcode-Scanner (Kamera + BarcodeDetector, sonst manuelle Eingabe)
  async function ernScannerOeffnen() {
    const overlay = document.getElementById("ern-scanner");
    const status = document.getElementById("ern-scanner-status");
    const video = document.getElementById("ern-scanner-video");
    document.getElementById("ern-scanner-code").value = "";
    overlay.classList.remove("hidden");
    history.pushState({ ernScanner: true }, "");
    ernScanHistorie = true;

    const kannErkennen = "BarcodeDetector" in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    if (!kannErkennen) {
      video.classList.add("hidden");
      status.textContent = "Dieser Browser kann keine Barcodes erkennen (klappt in Chrome auf Android). Tipp die Ziffern unter dem Barcode einfach ab.";
      document.getElementById("ern-scanner-code").focus();
      return;
    }
    let detektor;
    try {
      const formate = await BarcodeDetector.getSupportedFormats();
      const gewuenscht = ["ean_13", "ean_8", "upc_a", "upc_e"].filter((f) => formate.includes(f));
      detektor = new BarcodeDetector({ formats: gewuenscht.length ? gewuenscht : undefined });
    } catch (e) {
      video.classList.add("hidden");
      status.textContent = "Barcode-Erkennung nicht verfügbar – bitte Ziffern abtippen.";
      return;
    }
    // Session 28: höhere Auflösung – die Standard-640×480 sind für die
    // feinen Striche eines EAN-13 oft zu unscharf.
    try {
      ernScanStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
    } catch (e) {
      try {
        ernScanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      } catch (e2) {
        video.classList.add("hidden");
        status.textContent = "Kein Kamerazugriff (erlaubt?). Du kannst die Ziffern auch abtippen.";
        return;
      }
    }
    if (overlay.classList.contains("hidden")) { ernKameraStoppen(); return; } // inzwischen geschlossen
    await ernKameraEinstellen();
    video.classList.remove("hidden");
    video.srcObject = ernScanStream;
    await video.play().catch(() => {});
    status.textContent = "Barcode quer ins Bild halten, etwa 15–20 cm Abstand, gutes Licht.";
    ernScanLaeuft = true;
    const start = Date.now();
    let hinweisGezeigt = false;
    let letzterCode = null;   // Code muss zweimal hintereinander gleich gelesen werden
    const pruefen = async () => {
      if (!ernScanLaeuft) return;
      try {
        if (video.readyState >= 2) {
          const codes = await detektor.detect(video);
          const gueltig = codes.map((c) => c.rawValue).find((v) => ernGtinGueltig(v));
          if (gueltig && gueltig === letzterCode) {
            if (navigator.vibrate) navigator.vibrate(80);
            const ziel = ernScanZiel;
            ernScannerSchliessen();
            ernScanErgebnis(gueltig, ziel);
            return;
          }
          letzterCode = gueltig || null;
        }
      } catch (e) { /* einzelnes Bild nicht auswertbar – weiter */ }
      if (!hinweisGezeigt && Date.now() - start > 8000) {
        hinweisGezeigt = true;
        status.textContent = "Noch nichts erkannt – etwas weiter weg halten (scharf stellen), Licht anmachen oder die Ziffern abtippen.";
      }
      setTimeout(pruefen, 150);
    };
    pruefen();
  }

  // Prüfziffer von EAN-8/-13, UPC-A/-E (GTIN, Modulo 10). Ein falsch
  // gelesener Strich ergibt fast immer eine ungültige Prüfziffer – so
  // landet kein Lesefehler bei Open Food Facts („nicht bekannt“).
  function ernGtinGueltig(code) {
    if (!/^\d{8,14}$/.test(code || "")) return false;
    const z = code.split("").map(Number);
    const pruef = z.pop();
    let summe = 0;
    z.reverse().forEach((d, i) => { summe += d * (i % 2 === 0 ? 3 : 1); });
    return (10 - (summe % 10)) % 10 === pruef;
  }

  // Autofokus, leichter Zoom (Handys fokussieren nah oft nicht scharf –
  // mit Zoom kann man weiter weg halten) und Licht-Knopf, falls vorhanden.
  async function ernKameraEinstellen() {
    const knopf = document.getElementById("btn-ern-scanner-licht");
    ernScanLicht = false;
    if (!knopf) return;   // alte index.html aus dem Cache
    knopf.classList.add("hidden");
    knopf.innerHTML = `${ic("taschenlampe")}Licht an`;
    const spur = ernScanStream && ernScanStream.getVideoTracks()[0];
    if (!spur || typeof spur.getCapabilities !== "function") return;
    const fk = spur.getCapabilities();
    const einst = {};
    if (Array.isArray(fk.focusMode) && fk.focusMode.includes("continuous")) einst.focusMode = "continuous";
    if (fk.zoom && fk.zoom.max >= 1.5) einst.zoom = Math.min(2, fk.zoom.max);
    if (Object.keys(einst).length) {
      try { await spur.applyConstraints({ advanced: [einst] }); } catch (e) { /* Gerät kann es nicht – egal */ }
    }
    if (fk.torch) knopf.classList.remove("hidden");
  }

  document.getElementById("btn-ern-scanner-licht")?.addEventListener("click", async () => {
    const spur = ernScanStream && ernScanStream.getVideoTracks()[0];
    if (!spur) return;
    try {
      await spur.applyConstraints({ advanced: [{ torch: !ernScanLicht }] });
      ernScanLicht = !ernScanLicht;
      document.getElementById("btn-ern-scanner-licht").innerHTML = ic("taschenlampe") + (ernScanLicht ? "Licht aus" : "Licht an");
    } catch (e) { /* ignorieren */ }
  });

  // Stoppt die Kamera des Barcode-Scanners
  function ernKameraStoppen() {
    ernScanLaeuft = false;
    if (ernScanStream) { ernScanStream.getTracks().forEach((t) => t.stop()); ernScanStream = null; }
    const video = document.getElementById("ern-scanner-video");
    video.srcObject = null;
  }

  // Schließt den Barcode-Scanner und räumt den History-Eintrag auf
  function ernScannerSchliessen(ausPopstate) {
    ernKameraStoppen();
    ernScanZiel = null;
    document.getElementById("btn-ern-scanner-suchen").textContent = "Suchen";
    document.getElementById("ern-scanner").classList.add("hidden");
    if (!ausPopstate && ernScanHistorie) { ernScanHistorie = false; history.back(); }
  }
