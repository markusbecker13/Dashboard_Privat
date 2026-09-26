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
  let calBearbeiteterTermin = null; // id des gerade bearbeiteten Termins oder null
  let blockzeiten = [];
  let tagesrahmen = [];
  let fixkosten = [];
  let sonderausgaben = [];
  let buchungen = [];
  let finanzEinstellungen = [];
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
  let zielEventBearbeitenId = null;
  let auswertungJahr = new Date().getFullYear();
  let aktiverBereich = localStorage.getItem("aktiver-bereich") || "privat";
  let aktiverTab = null; // Schlüssel des gerade angezeigten Reiters (view-*), für den Zurück-Button

  const VIEW_ELEMENTE = {
    heute: "view-heute", frei: "view-frei", aufgaben: "view-aufgaben", kalender: "view-kalender",
    planung: "view-planung", finanzen: "view-finanzen", notizen: "view-notizen", links: "view-links",
    reflexion: "view-reflexion", spiele: "view-spiele", einkauf: "view-einkauf", export: "view-export",
    verlauf: "view-verlauf", anleitung: "view-anleitung", ogsideen: "view-ogs-ideen",
    ogsinventar: "view-ogs-inventar", ogsprojekte: "view-ogs-projekte", verleih: "view-verleih",
    reiterverwaltung: "view-reiter-verwaltung", training: "view-training",
    rezepte: "view-rezepte", ernaehrung: "view-ernaehrung",
  };

  // Welche Reiter es grundsätzlich gibt – jetzt in allen drei Bereichen
  // gleich, die tatsächliche Sichtbarkeit steuert allein tab_einstellungen
  // (mit STANDARD_SICHTBAR als Vorbelegung, siehe unten).
  const ALLE_REITER = [
    ["heute", "Start"], ["frei", "Frei"], ["aufgaben", "Aufgaben"], ["kalender", "Kalender"],
    ["planung", "Planung"], ["finanzen", "Finanzen"], ["notizen", "Notizen"], ["links", "Links"],
    ["reflexion", "Reflexion"], ["spiele", "Spiele"], ["einkauf", "Einkauf"], ["export", "Export"],
    ["verlauf", "Verlauf"], ["anleitung", "Anleitung"], ["ogsideen", "Ideen"],
    ["ogsinventar", "Inventar"], ["ogsprojekte", "Projekte"], ["verleih", "Verleih"],
    ["training", "Training"], ["rezepte", "Rezepte"], ["ernaehrung", "Ernährung"],
  ];
  // Reiter mit persönlichen Gesundheitsdaten gibt es nur in Privat – sie
  // tauchen in der Reiter-Verwaltung der anderen Bereiche gar nicht auf.
  const NUR_PRIVAT_REITER = ["ernaehrung"];
  const REITER_OHNE_PRIVATE = ALLE_REITER.filter(([k]) => !NUR_PRIVAT_REITER.includes(k));
  const BEREICH_TABS = { privat: ALLE_REITER, ogs: REITER_OHNE_PRIVATE, awo: REITER_OHNE_PRIVATE, business: REITER_OHNE_PRIVATE };
  const BEREICH_TITEL_VERWALTUNG = { privat: "🏠 Privat", ogs: "🏫 OGS Rapunzel", awo: "🤝 AWO OV Liblar", business: "☕ Business" };

  // Vorbelegung, solange in tab_einstellungen noch kein expliziter Eintrag
  // existiert – entspricht dem bisherigen Standardverhalten, damit sich
  // ohne aktives Umschalten nichts an der gewohnten Ansicht ändert.
  const STANDARD_SICHTBAR = {
    privat: ["heute", "frei", "aufgaben", "kalender", "planung", "finanzen", "notizen", "links",
      "reflexion", "spiele", "einkauf", "export", "verlauf", "anleitung", "training", "rezepte", "ernaehrung"],
    ogs: ["heute", "aufgaben", "kalender", "notizen", "verlauf", "anleitung",
      "ogsideen", "ogsinventar", "ogsprojekte", "verleih"],
    awo: ["heute", "aufgaben", "kalender", "notizen", "verlauf", "anleitung", "ogsideen"],
    business: ["heute", "aufgaben", "kalender", "notizen", "links", "verlauf", "anleitung", "ogsideen"],
  };

  function reiterIstSichtbar(bereich, schluessel) {
    if (NUR_PRIVAT_REITER.includes(schluessel) && bereich !== "privat") return false;
    const eintrag = tabEinstellungen.find((e) => e.bereich === bereich && e.tab_id === schluessel);
    if (eintrag) return eintrag.sichtbar !== false;
    return (STANDARD_SICHTBAR[bereich] || []).includes(schluessel);
  }

  // Themen (Hauptkategorien) je Bereich – bilden die Leiste unten, ihre
  // Reiter die Reiter-Leiste oben. "arbeit" trägt bewusst das Label des
  // aktiven Bereichs.
  const BEREICH_ARBEIT_ICON = { ogs: "🏫", awo: "🤝" };

  function hauptkategorien() {
    return [
      { schluessel: "heute", label: "Heute", icon: "☀️", tabs: ["heute"] },
      { schluessel: "planen", label: "Planen", icon: "🗓️", tabs: ["aufgaben", "kalender", "frei", "planung", "finanzen"] },
      { schluessel: "sammeln", label: "Sammeln", icon: "🗂️", tabs: ["notizen", "links", "reflexion", "spiele", "einkauf", "rezepte", "training", "ernaehrung"] },
      { schluessel: "arbeit", label: BEREICH_NAME[aktiverBereich] || "Weitere", icon: BEREICH_ARBEIT_ICON[aktiverBereich] || "📌", tabs: ["ogsideen", "ogsinventar", "ogsprojekte", "verleih"] },
      { schluessel: "verwalten", label: "Verwalten", icon: "🛠️", tabs: ["export", "verlauf", "anleitung"] },
    ];
  }

  function sichtbareTabsInGruppe(gruppe) {
    return gruppe.tabs.filter((schluessel) => reiterIstSichtbar(aktiverBereich, schluessel));
  }

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

  function farbweltAnwenden(bereich) {
    const welt = BEREICH_FARBWELT.includes(bereich) ? bereich : "neutral";
    document.documentElement.dataset.bereich = welt;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", BEREICH_THEME_FARBE[welt]);
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

  function willkommenDatumAnzeigen() {
    const el = document.getElementById("willkommen-datum");
    if (el) el.textContent = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  }

  function zeigeLogin(fehler) {
    farbweltAnwenden("neutral");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("bereich-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("login-error").textContent = fehler || "";
  }

  function zeigeBereichAuswahl() {
    farbweltAnwenden("neutral");
    willkommenDatumAnzeigen();
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("bereich-screen").classList.remove("hidden");
  }

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
  const SVG_ATTR = 'width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const NAV_ICON = {
    heute: `<svg ${SVG_ATTR}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    planen: `<svg ${SVG_ATTR}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
    sammeln: `<svg ${SVG_ATTR}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`,
    arbeit: `<svg ${SVG_ATTR}><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/></svg>`,
    verwalten: `<svg ${SVG_ATTR}><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>`,
  };
  const BEREICH_KNOPF_TEXT = { privat: "Privat", ogs: "OGS", awo: "AWO", business: "Business", verwaltung: "Verwaltung" };

  function sichtbareGruppen() {
    return hauptkategorien().filter((g) => sichtbareTabsInGruppe(g).length > 0);
  }

  // Zuletzt geöffneter Reiter je Bereich + Thema, damit ein Tipp auf ein
  // Thema dort weitermacht, wo du zuletzt warst.
  function letzterReiterSchluessel(gruppe) {
    return `letzter-reiter-${aktiverBereich}-${gruppe}`;
  }

  function ersterSichtbarerReiter() {
    if (reiterIstSichtbar(aktiverBereich, "heute")) return "heute";
    const gruppe = sichtbareGruppen()[0];
    return gruppe ? sichtbareTabsInGruppe(gruppe)[0] : "heute";
  }

  window.gruppeOeffnen = function(schluessel) {
    const gruppe = hauptkategorien().find((g) => g.schluessel === schluessel);
    if (!gruppe) return;
    const sichtbar = sichtbareTabsInGruppe(gruppe);
    if (sichtbar.length === 0) return;
    const gemerkt = localStorage.getItem(letzterReiterSchluessel(schluessel));
    tabWechseln(sichtbar.includes(gemerkt) ? gemerkt : sichtbar[0]);
  };

  function renderNavigation() {
    const bereichKnopf = document.getElementById("content-bereich-text");
    if (bereichKnopf) bereichKnopf.textContent = BEREICH_KNOPF_TEXT[aktiverBereich] || "Bereich";

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
    nav.innerHTML = sichtbareGruppen().map((g) => {
      const aktiv = aktiveGruppe && aktiveGruppe.schluessel === g.schluessel;
      return `<button class="bottom-nav-btn${aktiv ? " aktiv" : ""}" onclick="gruppeOeffnen('${g.schluessel}')"
        aria-label="${escapeHtml(g.label)}" title="${escapeHtml(g.label)}"${aktiv ? ' aria-current="page"' : ""}>
        ${NAV_ICON[g.schluessel] || NAV_ICON.verwalten}${aktiv ? `<span class="bottom-nav-label">${escapeHtml(g.label)}</span>` : ""}
      </button>`;
    }).join("");

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

  function dashboardNameAnzeigen() {
    const gespeichert = localStorage.getItem("dashboard-name");
    document.getElementById("brand-name").textContent = gespeichert || "Dashboard";
  }

  window.dashboardNameBearbeiten = function() {
    const aktuell = localStorage.getItem("dashboard-name") || "Dashboard";
    const neu = prompt("Wie soll dein Dashboard heißen?", aktuell);
    if (neu === null || !neu.trim()) return;
    localStorage.setItem("dashboard-name", neu.trim());
    dashboardNameAnzeigen();
  };

  function untertitelAnzeigen() {
    const gespeichert = localStorage.getItem("dashboard-untertitel");
    document.getElementById("brand-sub").textContent = gespeichert || "Aufgaben";
  }

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
        zeigeBereichAuswahl();
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

  function heuteISO() {
    return datumLokalISO();
  }

  function addTage(datumISO, tage) {
    const d = new Date(datumISO + "T00:00:00");
    d.setDate(d.getDate() + tage);
    return datumLokalISO(d);
  }

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
    renderProjekte();
    renderSpiele();
    renderRezepte();
  }

  function badgeHtml(cls, text) {
    return `<span class="badge ${cls}">${escapeHtml(text)}</span>`;
  }

  let aufgabeBearbeitenId = null;

  window.aufgabeBearbeitenStart = function(id) {
    aufgabeBearbeitenId = id;
    render();
  };

  window.aufgabeBearbeitenAbbrechen = function() {
    aufgabeBearbeitenId = null;
    render();
  };

  window.aufgabeBearbeitenSpeichern = async function(id) {
    const titel = document.getElementById("edit-aufgabe-titel").value.trim();
    if (!titel) return;
    const projekt_id = document.getElementById("edit-aufgabe-projekt").value || null;
    const faellig_am = document.getElementById("edit-aufgabe-faellig").value || null;
    const uhrzeit = document.getElementById("edit-aufgabe-uhrzeit").value || null;
    const ende_uhrzeit = document.getElementById("edit-aufgabe-ende").value || null;
    const erinnere_alle_tage = document.getElementById("edit-aufgabe-intervall").value || null;
    await api("aufgabe_aktualisieren", { id, titel, projekt_id, faellig_am, uhrzeit, ende_uhrzeit, erinnere_alle_tage });
    aufgabeBearbeitenId = null;
    await ladeDaten();
    render();
  };

  function taskEditHtml(a) {
    const projektOptions = '<option value="">Ohne Projekt</option>' +
      projekteAktuell().map((p) => `<option value="${p.id}" ${p.id === a.projekt_id ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("");
    return `
      <div class="task task-edit">
        <div class="task-info" style="width:100%;">
          <div class="task-edit-felder">
            <input type="text" id="edit-aufgabe-titel" value="${escapeAttr(a.titel)}" placeholder="Titel">
            <select id="edit-aufgabe-projekt">${projektOptions}</select>
            <input type="date" id="edit-aufgabe-faellig" value="${a.faellig_am || ""}" title="Fälligkeitsdatum (optional)">
            <input type="time" id="edit-aufgabe-uhrzeit" style="width:8rem;" value="${a.uhrzeit ? a.uhrzeit.slice(0,5) : ""}" title="Beginn (optional)">
            <input type="time" id="edit-aufgabe-ende" style="width:8rem;" value="${a.ende_uhrzeit ? a.ende_uhrzeit.slice(0,5) : ""}" title="Ende (optional)">
            <input type="number" id="edit-aufgabe-intervall" min="1" placeholder="alle X Tage" value="${a.erinnere_alle_tage || ""}" title="Wiederkehrende Erinnerung">
          </div>
          <div class="row" style="margin:0;">
            <button class="btn-primary" onclick="aufgabeBearbeitenSpeichern('${a.id}')">Speichern</button>
            <button class="btn-secondary" onclick="aufgabeBearbeitenAbbrechen()">Abbrechen</button>
          </div>
        </div>
      </div>`;
  }

  function taskHtml(a, done) {
    if (a.id === aufgabeBearbeitenId) return taskEditHtml(a);
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
      ? `<button class="task-snooze" onclick="erinnerungVerschieben('${a.id}')" title="Später erneut erinnern">↻</button>`
      : "";

    return `
      <div class="task ${!done ? a.status : ""}">
        <button class="task-check ${done ? "done" : ""}" onclick="umschalten('${a.id}')">${done ? "✓" : ""}</button>
        <div class="task-info">
          <span class="task-titel ${done ? "done" : ""}">${escapeHtml(a.titel)}</span>
          <div class="task-meta">${meta}</div>
        </div>
        ${snoozeBtn}
        <button class="task-edit-btn" onclick="aufgabeBearbeitenStart('${a.id}')" title="Bearbeiten">✎</button>
        <button class="task-delete" onclick="loeschen('${a.id}')">×</button>
      </div>`;
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

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
    if (ohneProjekt.length > 0) {
      html += `<div class="project-heading">Ohne Projekt</div><div class="task-list">${ohneProjekt.map((a) => taskHtml(a, false)).join("")}</div>`;
    }
    for (const g of gruppen) {
      html += `<div class="project-heading">${escapeHtml(g.projekt.name)} <button class="project-edit-btn" onclick="projektUmbenennen('${g.projekt.id}')" title="Projekt umbenennen">✎</button></div><div class="task-list">${g.liste.map((a) => taskHtml(a, false)).join("")}</div>`;
    }
    if (ohneProjekt.length === 0 && gruppen.length === 0) {
      html = '<p class="empty-text">Keine offenen Aufgaben — gut gemacht.</p>';
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

  async function aufgabeHinzufuegen() {
    const titel = document.getElementById("neue-aufgabe").value.trim();
    if (!titel) return;
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

  async function projektAnlegen() {
    const name = document.getElementById("neues-projekt").value.trim();
    if (!name) return;
    await api("projekt_hinzufuegen", { name, bereich: aktiverBereich });
    document.getElementById("neues-projekt").value = "";
    await ladeDaten();
  }

  window.projektUmbenennen = async function(id) {
    const projekt = projekteAktuell().find((p) => p.id === id);
    if (!projekt) return;
    const neuerName = prompt("Neuer Projektname:", projekt.name);
    if (!neuerName || !neuerName.trim() || neuerName.trim() === projekt.name) return;
    try {
      await api("projekt_umbenennen", { id, name: neuerName.trim() });
      await ladeDaten();
    } catch (e) {
      alert("Umbenennen fehlgeschlagen – existiert der Name schon?");
    }
  };

  async function umschalten(id) {
    await api("aufgabe_umschalten", { id });
    await ladeDaten();
  }

  async function loeschen(id) {
    await api("aufgabe_loeschen", { id });
    await ladeDaten();
  }

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
          zeigeBereichAuswahl();
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

  function formatDatumUhrzeit(iso) {
    const dt = new Date(iso);
    return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

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

  async function googleVerbindenKlick() {
    try {
      const { url } = await api("google_auth_start");
      location.href = url;
    } catch (e) {
      alert("Konnte Google-Login nicht starten: " + e.message);
    }
  }

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

  function projekteAktuell() {
    return projekte.filter((p) => bereichVon(p) === aktiverBereich);
  }

  function fixkostenAktuell() {
    return fixkosten.filter((f) => bereichVon(f) === aktiverBereich);
  }

  function sonderausgabenAktuell() {
    return sonderausgaben.filter((s) => bereichVon(s) === aktiverBereich);
  }

  function buchungenAktuell() {
    return buchungen.filter((b) => bereichVon(b) === aktiverBereich);
  }

  function ogsInventarAktuell() {
    return ogsInventar.filter((i) => bereichVon(i) === aktiverBereich);
  }

  function ogsProjekteAktuell() {
    return ogsProjekte.filter((p) => bereichVon(p) === aktiverBereich);
  }

  function verleihAktuell() {
    return verleih.filter((v) => bereichVon(v) === aktiverBereich);
  }

  function trainingAktuell() {
    return training.filter((t) => bereichVon(t) === aktiverBereich);
  }

  const BEREICH_NAME = { ogs: "OGS Rapunzel", awo: "AWO OV Liblar", business: "Business" };

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
    if (aktiv === "verleih") renderVerleih();
    if (aktiv === "training") renderTraining();
    if (aktiv === "rezepte") renderRezepte();
    if (aktiv === "ernaehrung") { renderErnaehrung(); if (ernProfilGeladen) ernMetRendern(); }
    if (aktiv === "verlauf") renderVerlauf();
    if (aktiv === "reiterverwaltung") renderReiterVerwaltung();
    kontoMenuSchliessen();
  }
  window.tabWechseln = tabWechseln;

  // Bereichs-Knopf oben links: zurück zur Willkommensseite (Bereichswahl)
  document.getElementById("content-bereich-btn").addEventListener("click", zeigeBereichAuswahl);

  // Konto-/Einstellungs-Menü (⋮ oben rechts): Name/Untertitel ändern,
  // Bereich wechseln, Abmelden – ersetzt die frühere Sidebar-Ecke.
  const menuToggleBtn = document.getElementById("menu-toggle");
  const accountMenuEl = document.getElementById("account-menu");

  function kontoMenuOeffnen() {
    accountMenuEl.classList.remove("hidden");
    menuToggleBtn.setAttribute("aria-expanded", "true");
  }
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
  // WMO-Wettercodes (von Open-Meteo) grob zusammengefasst.
  const WETTER_CODES = {
    0: ["☀️", "Klar"], 1: ["🌤️", "Meist klar"], 2: ["⛅", "Teilweise bewölkt"], 3: ["☁️", "Bedeckt"],
    45: ["🌫️", "Nebel"], 48: ["🌫️", "Reifnebel"],
    51: ["🌦️", "Leichter Nieselregen"], 53: ["🌦️", "Nieselregen"], 55: ["🌦️", "Starker Nieselregen"],
    61: ["🌧️", "Leichter Regen"], 63: ["🌧️", "Regen"], 65: ["🌧️", "Starker Regen"],
    71: ["🌨️", "Leichter Schneefall"], 73: ["🌨️", "Schneefall"], 75: ["❄️", "Starker Schneefall"],
    80: ["🌦️", "Regenschauer"], 81: ["🌧️", "Kräftiger Regenschauer"], 82: ["⛈️", "Heftiger Regenschauer"],
    95: ["⛈️", "Gewitter"], 96: ["⛈️", "Gewitter mit Hagel"], 99: ["⛈️", "Starkes Gewitter mit Hagel"],
  };
  function wetterCodeInfo(code) {
    return WETTER_CODES[code] || ["🌡️", "Unbekannt"];
  }
  const WETTER_WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  async function ladeWetter(erzwingen = false) {
    const container = document.getElementById("wetter-bereich");
    if (!container) {
      console.error("[Wetter] Container #wetter-bereich nicht im DOM gefunden – index.html nicht aktuell?");
      return;
    }
    const jetzigerOrt = wetterOrt;
    if (!erzwingen && wetterDaten && Date.now() - wetterLetzterAbruf < WETTER_CACHE_MS) {
      renderWetter();
      return;
    }
    container.innerHTML = `<div class="heute-kachel heute-kachel--wetter"><span class="heute-kachel-titel">Wetter</span><span class="heute-kachel-text">wird geladen …</span></div>`;
    try {
      const daten = await api("wetter_abrufen", { ort: jetzigerOrt });
      // Falls der Ort zwischenzeitlich geändert wurde, veraltete Antwort verwerfen.
      if (jetzigerOrt !== wetterOrt) return;
      wetterDaten = daten;
      wetterLetzterAbruf = Date.now();
      renderWetter();
    } catch (fehler) {
      console.error("[Wetter] Laden fehlgeschlagen:", fehler);
      container.innerHTML =
        `<button class="heute-kachel heute-kachel--wetter" onclick="ladeWetter(true)" title="${escapeHtml(fehler.message || "Fehler")}">
          <span class="heute-kachel-titel">Wetter</span>
          <span class="heute-kachel-text">nicht geladen – tippen für neuen Versuch</span>
        </button>`;
    }
  }

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
          <span class="wetter-kachel-icon">${icon}</span>
          <span class="wetter-kachel-max">${Math.round(t.max)}°</span>
          <span class="wetter-kachel-min">${Math.round(t.min)}°</span>
        </div>`;
    }).join("");

    // Kompakte Kachel oben (aktuelles Wetter), Tipp klappt den Ausblick auf
    document.getElementById("wetter-bereich").innerHTML = `
      <button class="heute-kachel heute-kachel--wetter" onclick="wetterAusblickUmschalten()" aria-expanded="${wetterAusblickOffen}" aria-controls="wetter-ausblick">
        <span class="heute-kachel-titel">Wetter · ${escapeHtml(wetterDaten.ort_gefunden || wetterOrt)}</span>
        <span class="heute-kachel-zahl">${Math.round(wetterDaten.aktuelle_temperatur)}° <span class="heute-kachel-text">${aktIcon} ${escapeHtml(aktText)}</span></span>
      </button>`;
    const ausblick = document.getElementById("wetter-ausblick");
    if (ausblick) {
      ausblick.classList.toggle("hidden", !wetterAusblickOffen);
      ausblick.innerHTML = `
        <div class="wetter-karte">
          <div class="wetter-ort-zeile">
            <span>5-Tage-Ausblick · ${escapeHtml(wetterDaten.ort_gefunden || wetterOrt)}</span>
            <button class="project-edit-btn" onclick="wetterOrtBearbeiten()" title="Ort ändern">✎</button>
          </div>
          <div class="wetter-kachel-grid">${tage}</div>
        </div>`;
    }
  }

  window.wetterAusblickUmschalten = function () {
    wetterAusblickOffen = !wetterAusblickOffen;
    renderWetter();
  };

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

  function zitatDesTages(bereich, datum = new Date()) {
    const liste = ZITATE[bereich];
    if (!liste || liste.length === 0) return null;
    // Tageszähler nach lokalem Kalendertag (UTC-Konstruktor vermeidet
    // Sprünge durch Sommer-/Winterzeit)
    const tag = Math.floor(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()) / 86400000);
    return liste[((tag % liste.length) + liste.length) % liste.length];
  }

  function renderTagesZitat() {
    const el = document.getElementById("tages-zitat");
    if (!el) return;
    const z = zitatDesTages(aktiverBereich);
    if (!z) { el.classList.add("hidden"); el.innerHTML = ""; return; }
    el.classList.remove("hidden");
    el.innerHTML = `<blockquote class="tages-zitat-text">${escapeHtml(z.text)}</blockquote>` +
      `<figcaption class="tages-zitat-quelle">${escapeHtml(z.autor)} · <cite>${escapeHtml(z.quelle)}</cite></figcaption>`;
  }

  function renderHeute() {
    bereichAnwenden();
    const heuteIso = heuteISO();
    const aufgabenBereich = aufgaben.filter((a) => bereichVon(a) === aktiverBereich);
    const offenEnriched = aufgabenBereich.filter((a) => !a.erledigt).map(enrich);
    const faelligHeute = offenEnriched.filter((a) => a.status === "ueberfaellig" || a.status === "heute");
    const erinnerungenHeute = offenEnriched.filter((a) => a.erinnerungFaellig);
    const termineGanztags = termine
      .filter((t) => t.datum === heuteIso && !t.uhrzeit && bereichVon(t) === aktiverBereich)
      .sort((a, b) => a.titel.localeCompare(b.titel));
    const einkaufOffen = aktiverBereich === "privat" ? einkaufsliste.filter((e) => !e.erledigt) : [];

    const jetztDate = new Date();
    const jetztMinuten = jetztDate.getHours() * 60 + jetztDate.getMinutes();
    const jetztLabel = String(jetztDate.getHours()).padStart(2,"0") + ":" + String(jetztDate.getMinutes()).padStart(2,"0");
    const heuteWtIndex = wochentagIndex(jetztDate);
    const rahmen = freiRahmenFuerWochentag(heuteWtIndex);
    const heuteEintraege = freiTagEintraege(heuteIso, heuteWtIndex);

    let html = "";

    // ---- Kopf: Datum + Gruß mit Anzahl + Überfällig-Kachel ----
    const datumEl = document.getElementById("heute-datum");
    if (datumEl) datumEl.textContent = jetztDate.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

    // ---- Zeitleiste: Überfälliges, heutige Termine und Aufgaben ----
    const ueberfaellig = offenEnriched
      .filter((a) => a.status === "ueberfaellig")
      .sort((a, b) => (a.faellig_am || "").localeCompare(b.faellig_am || ""));
    const ueberfaelligZahl = document.getElementById("heute-ueberfaellig-zahl");
    if (ueberfaelligZahl) ueberfaelligZahl.textContent = ueberfaellig.length;

    const zlEintraege = [];
    // Überfälliges wird nach Fälligkeitstag gruppiert (Gestern, Vorgestern, …,
    // ab 8 Tagen „Älter“); alles Heutige steht in der Gruppe „Heute“.
    const zlUeberfaellig = ueberfaellig.map((a) => {
      const tage = tageSeitIso(a.faellig_am, heuteIso);
      const aelter = tage > 7;
      const start = a.uhrzeit ? a.uhrzeit.slice(0, 5) : null;
      return {
        id: a.id, typ: "aufgabe", gruppe: aelter ? "aelter" : a.faellig_am,
        zeit: aelter ? formatDatumKurz(a.faellig_am) : (start || "–"),
        titel: a.titel, chip: "Überfällig", art: "ueberfaellig", tab: "aufgaben",
        sort: start ? zeitZuMinuten(start) : 24 * 60,
      };
    });
    termineGanztags.forEach((t) => zlEintraege.push({
      id: t.id, typ: "termin",
      zeit: "ganzt.", titel: t.titel, chip: "Termin · ganztägig", art: "termin", tab: "kalender", sort: -1, erledigt: !!t.erledigt,
    }));
    termine
      .filter((t) => t.datum === heuteIso && t.uhrzeit && bereichVon(t) === aktiverBereich)
      .forEach((t) => {
        const start = t.uhrzeit.slice(0, 5);
        const ende = t.ende_uhrzeit ? t.ende_uhrzeit.slice(0, 5) : null;
        zlEintraege.push({
          id: t.id, typ: "termin",
          zeit: start, start, ende: ende || minutenZuZeit(zeitZuMinuten(start) + 30), titel: t.titel,
          chip: "Termin · " + start + (ende ? "–" + ende : ""), art: "termin", tab: "kalender",
          sort: zeitZuMinuten(start), erledigt: !!t.erledigt,
        });
      });
    const schonDrin = new Set(ueberfaellig.map((a) => a.id));
    offenEnriched
      .filter((a) => !schonDrin.has(a.id) && (a.status === "heute" || a.erinnerungFaellig))
      .forEach((a) => {
        const start = a.status === "heute" && a.uhrzeit ? a.uhrzeit.slice(0, 5) : null;
        const ende = start ? (a.ende_uhrzeit ? a.ende_uhrzeit.slice(0, 5) : minutenZuZeit(zeitZuMinuten(start) + 30)) : null;
        zlEintraege.push({
          id: a.id, typ: "aufgabe",
          zeit: start || "Heute", start, ende, titel: a.titel,
          chip: a.status === "heute" ? "Aufgabe" + (start ? " · " + start + (a.ende_uhrzeit ? "–" + a.ende_uhrzeit.slice(0, 5) : "") : "") : "Erinnerung",
          art: "aufgabe", tab: "aufgaben", sort: start ? zeitZuMinuten(start) : 24 * 60,
        });
      });
    zlEintraege.sort((a, b) => a.sort - b.sort);

    const offeneDinge = zlEintraege.filter((e) => !e.erledigt).length + zlUeberfaellig.length;
    const grussEl = document.getElementById("heute-gruss");
    if (grussEl) {
      grussEl.innerHTML = offeneDinge > 0
        ? `${escapeHtml(GRUSS)}<br><span class="heute-gruss-akzent">${offeneDinge} ${offeneDinge === 1 ? "Ding" : "Dinge"}</span> heute.`
        : `${escapeHtml(GRUSS)}<br>Freie Bahn heute.`;
    }
    renderTagesZitat();

    html += `<h2 class="heute-abschnitt">Zeitleiste</h2>`;
    if (zlEintraege.length === 0 && zlUeberfaellig.length === 0) {
      html += `<p class="empty-text">Nichts Dringendes für heute – guter Tag.</p>`;
    } else {
      const zlKarte = (e) => {
        const laeuftJetzt = !e.erledigt && e.start && e.ende &&
          zeitZuMinuten(e.start) <= jetztMinuten && jetztMinuten < zeitZuMinuten(e.ende);
        const klassen = ["zl-eintrag"];
        if (laeuftJetzt) klassen.push("jetzt");
        if (e.erledigt) klassen.push("erledigt");
        return `
          <div class="${klassen.join(" ")}">
            <span class="zl-zeit">${laeuftJetzt ? "Jetzt" : escapeHtml(e.zeit)}</span>
            <div class="zl-karte">
              <button class="task-check zl-check ${e.erledigt ? "done" : ""}" onclick="zeitleisteUmschalten('${e.typ}','${e.id}', this)"
                title="${e.erledigt ? "Wieder offen" : "Erledigt"}" aria-label="${escapeHtml(e.titel)} ${e.erledigt ? "wieder öffnen" : "als erledigt markieren"}"></button>
              <button class="zl-inhalt" onclick="tabWechseln('${e.tab}')" title="${e.tab === "kalender" ? "Im Kalender öffnen" : "In Aufgaben öffnen"}">
                <span class="zl-chip zl-chip--${e.art}">${escapeHtml(e.chip)}</span>
                <span class="zl-titel">${escapeHtml(e.titel)}</span>
              </button>
            </div>
          </div>`;
      };
      // Gruppen: Heute zuerst, dann überfällige Tage (neueste zuerst), dann „Älter“
      const gruppen = [{
        key: "heute", label: "Heute", eintraege: zlEintraege, ueberfaellig: false,
      }];
      const tagKeys = [...new Set(zlUeberfaellig.filter((e) => e.gruppe !== "aelter").map((e) => e.gruppe))]
        .sort((a, b) => b.localeCompare(a));
      tagKeys.forEach((iso) => gruppen.push({
        key: iso, label: zlTagLabel(iso, heuteIso), ueberfaellig: true,
        eintraege: zlUeberfaellig.filter((e) => e.gruppe === iso).sort((a, b) => a.sort - b.sort),
      }));
      const aelter = zlUeberfaellig.filter((e) => e.gruppe === "aelter");
      if (aelter.length) gruppen.push({ key: "aelter", label: "Älter", ueberfaellig: true, eintraege: aelter });

      html += `<div class="zl-gruppen">` + gruppen.map((g) => {
        const offen = g.eintraege.filter((e) => !e.erledigt).length;
        const inhalt = g.eintraege.length
          ? `<div class="zeitleiste">${g.eintraege.map(zlKarte).join("")}</div>`
          : `<p class="empty-text">Nichts Weiteres für heute.</p>`;
        return `
          <details class="zl-gruppe${g.ueberfaellig ? " zl-gruppe--ueberfaellig" : ""}" ${zlGruppenOffen.has(g.key) ? "open" : ""}
            ontoggle="zlGruppeUmschalten('${g.key}', this.open)">
            <summary class="zl-gruppe-kopf">
              <span class="zl-gruppe-titel">${escapeHtml(g.label)}</span>
              <span class="zl-gruppe-zahl" aria-label="${offen} offen">${offen}</span>
            </summary>
            ${inhalt}
          </details>`;
      }).join("") + `</div>`;
    }

    // ---- Jetzt-Zeitleiste ----
    if (rahmen.aktiv && heuteEintraege) {
      const rStart = zeitZuMinuten(rahmen.start_zeit);
      const rEnde = zeitZuMinuten(rahmen.end_zeit);
      const spanne = Math.max(1, rEnde - rStart);
      const segmente = heuteEintraege.map((e) => {
        const s = Math.max(rStart, zeitZuMinuten(e.start));
        const en = Math.min(rEnde, zeitZuMinuten(e.ende));
        if (en <= s) return "";
        const breite = ((en - s) / spanne) * 100;
        const art = e.art === "frei" ? "frei" : (e.art === "erledigt" ? "erledigt" : "belegt");
        return `<div class="jetzt-segment ${art}" style="width:${breite}%;" title="${e.start}–${e.ende}${e.titel ? " · " + escapeHtml(e.titel) : ""}"></div>`;
      }).join("");
      const markerPos = Math.min(100, Math.max(0, ((jetztMinuten - rStart) / spanne) * 100));
      const markerSichtbar = jetztMinuten >= rStart && jetztMinuten <= rEnde;

      const naechsterTermin = heuteEintraege.find((e) => e.typ === "Termin" && e.art !== "erledigt" && zeitZuMinuten(e.ende) > jetztMinuten);

      html += `
        <div class="jetzt-leiste-wrap">
          <div class="jetzt-leiste-kopf">
            <span class="jetzt-leiste-titel">Freie Zeit</span>
            <span class="jetzt-leiste-zeit">${jetztLabel} Uhr</span>
          </div>
          <div class="jetzt-leiste" onclick="heuteFreiOeffnen()" style="cursor:pointer;">
            ${segmente}
            ${markerSichtbar ? `<div class="jetzt-marker" style="left:${markerPos}%;"></div>` : ""}
          </div>
          <div class="jetzt-leiste-labels"><span>${rahmen.start_zeit}</span><span>${rahmen.end_zeit}</span></div>
          <div class="jetzt-naechster">${naechsterTermin ? `Nächster Termin: <strong>${naechsterTermin.start} · ${escapeHtml(naechsterTermin.titel)}</strong>` : "Kein weiterer Termin heute."}</div>
        </div>`;
    }

    // ---- Kacheln ----
    const TYP_LABEL = { woche: "Woche", monat: "Monat", jahr: "Jahr" };
    const aktuelleZiele = aktiverBereich === "privat" ? ["woche", "monat", "jahr"].flatMap((typ) => {
      const startIso = dateToISO(periodStart(typ, new Date()));
      return ziele.filter((z) => z.zeitraum_typ === typ && z.zeitraum_start === startIso);
    }) : [];

    const aufgabenZahl = faelligHeute.length + erinnerungenHeute.length;

    if (aktiverBereich === "privat") {
      html += `<div class="start-kachel-grid">
        <button class="start-kachel mod-aufgaben" onclick="tabWechseln('aufgaben')">
          <span class="start-kachel-zahl">${aufgabenZahl}</span>
          <span class="start-kachel-label">${aufgabenZahl === 1 ? "Aufgabe fällig" : "Aufgaben fällig"}</span>
        </button>
        <button class="start-kachel mod-planung" onclick="tabWechseln('planung')">
          <span class="start-kachel-zahl">${aktuelleZiele.length}</span>
          <span class="start-kachel-label">aktive Ziele</span>
        </button>
        <button class="start-kachel mod-einkauf" onclick="tabWechseln('einkauf')">
          <span class="start-kachel-zahl">${einkaufOffen.length}</span>
          <span class="start-kachel-label">${einkaufOffen.length === 1 ? "Artikel offen" : "Artikel offen"}</span>
        </button>
        ${ernStartKachelHtml()}
      </div>`;
    } else {
      const ideenOffen = ogsIdeen.filter((i) => bereichVon(i) === aktiverBereich && (i.status === "offen" || i.status === "in_arbeit")).length;
      html += `<div class="start-kachel-grid">
        <button class="start-kachel mod-aufgaben" onclick="tabWechseln('aufgaben')">
          <span class="start-kachel-zahl">${aufgabenZahl}</span>
          <span class="start-kachel-label">${aufgabenZahl === 1 ? "Aufgabe fällig" : "Aufgaben fällig"}</span>
        </button>
        <button class="start-kachel mod-planung" onclick="tabWechseln('ogsideen')">
          <span class="start-kachel-zahl">${ideenOffen}</span>
          <span class="start-kachel-label">${ideenOffen === 1 ? "offene Idee" : "offene Ideen"}</span>
        </button>
      </div>`;
    }

    if (aktuelleZiele.length > 0) {
      html += `<div class="project-heading">Ziele</div><div class="ziel-kachel-grid">` +
        aktuelleZiele.map((z) => {
          const schritte = zielSchritte.filter((s) => s.ziel_id === z.id);
          const erledigtCount = schritte.filter((s) => s.erledigt).length;
          return `
            <button class="ziel-kachel" onclick="zielKachelKlick('${z.id}')">
              <span class="ziel-kachel-typ">${TYP_LABEL[z.zeitraum_typ]}</span>
              <span class="ziel-kachel-titel">${escapeHtml(z.titel)}</span>
              <span class="ziel-kachel-fortschritt">${schritte.length > 0 ? erledigtCount + " / " + schritte.length + " Schritte" : "keine Schritte"}</span>
            </button>`;
        }).join("") +
        `</div>`;
    }

    document.getElementById("heute-bereich").innerHTML = html;
  }

  // ==========================================================
  // Kalender
  // ==========================================================
  const MONATSNAMEN = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const TAGLABEL = ["Mo","Di","Mi","Do","Fr","Sa","So"];

  function dateToISO(d) {
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  }

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

  function zlTagLabel(iso, heuteIso) {
    const tage = tageSeitIso(iso, heuteIso);
    if (tage === 1) return "Gestern";
    if (tage === 2) return "Vorgestern";
    const [j, m, t] = iso.split("-").map(Number);
    const wt = new Date(j, m - 1, t).toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
    return wt + ", " + formatDatumKurz(iso);
  }

  window.zlGruppeUmschalten = function(key, offen) {
    if (offen) zlGruppenOffen.add(key); else zlGruppenOffen.delete(key);
  };

  function formatDatumKurz(iso) {
    const [j,m,t] = iso.split("-");
    return t + "." + m + ".";
  }

  window.calTagAuswaehlen = function(iso) {
    calAusgewaehlterTag = (calAusgewaehlterTag === iso) ? null : iso;
    renderKalender();
  };

  function renderCalDayPanel() {
    const panel = document.getElementById("cal-day-panel");
    if (!calAusgewaehlterTag) { panel.innerHTML = ""; return; }

    const liste = termineAmTag(calAusgewaehlterTag);
    const [j,m,t] = calAusgewaehlterTag.split("-");
    const titel = `${t}. ${MONATSNAMEN[parseInt(m,10)-1]} ${j}`;

    // Falls der gerade bearbeitete Termin nicht mehr auf diesem Tag ist
    // (z.B. Tag gewechselt), Bearbeitungsmodus verlassen.
    const bearbeiteterTermin = calBearbeiteterTermin
      ? liste.find((t) => t.id === calBearbeiteterTermin)
      : null;
    if (calBearbeiteterTermin && !bearbeiteterTermin) calBearbeiteterTermin = null;

    const itemsHtml = liste.length === 0
      ? `<p class="empty-text" style="margin:0 0 0.6rem;">Noch keine Termine an diesem Tag.</p>`
      : liste.map((t) => `
          <div class="termin-item">
            <span class="termin-zeit">${t.uhrzeit ? t.uhrzeit.slice(0,5) + (t.ende_uhrzeit ? "–" + t.ende_uhrzeit.slice(0,5) : "") : ""}</span>
            <span class="termin-titel">${escapeHtml(t.titel)}${t.notiz ? `<span class="termin-notiz">${escapeHtml(t.notiz)}</span>` : ""}</span>
            <button class="task-snooze" onclick="terminBearbeitenStart('${t.id}')" title="Bearbeiten">✎</button>
            <button class="task-delete" onclick="terminLoeschen('${t.id}')">×</button>
          </div>`).join("");

    const formTitel = bearbeiteterTermin ? "Termin bearbeiten" : "";
    const buttonLabel = bearbeiteterTermin ? "Speichern" : "Eintragen";
    const abbrechenHtml = bearbeiteterTermin
      ? `<button class="btn-secondary" id="btn-termin-abbrechen">Abbrechen</button>`
      : "";

    panel.innerHTML = `
      <div class="cal-day-panel">
        <h3>${titel}</h3>
        ${itemsHtml}
        ${formTitel ? `<div class="project-heading" style="margin:1rem 0 0.4rem;">${formTitel}</div>` : ""}
        <div class="termin-form">
          <input type="text" id="termin-titel" placeholder="Titel" value="${bearbeiteterTermin ? escapeAttr(bearbeiteterTermin.titel) : ""}">
          <input type="time" id="termin-uhrzeit" style="width:8rem;" title="Beginn (optional)" value="${bearbeiteterTermin && bearbeiteterTermin.uhrzeit ? bearbeiteterTermin.uhrzeit.slice(0,5) : ""}">
          <input type="time" id="termin-ende" style="width:8rem;" title="Ende (optional)" value="${bearbeiteterTermin && bearbeiteterTermin.ende_uhrzeit ? bearbeiteterTermin.ende_uhrzeit.slice(0,5) : ""}">
          <input type="text" id="termin-notiz" placeholder="Notiz (optional)" value="${bearbeiteterTermin && bearbeiteterTermin.notiz ? escapeAttr(bearbeiteterTermin.notiz) : ""}">
          <button class="btn-primary" id="btn-termin-hinzufuegen">${buttonLabel}</button>
          ${abbrechenHtml}
        </div>
      </div>`;

    document.getElementById("btn-termin-hinzufuegen").addEventListener("click", bearbeiteterTermin ? terminAktualisieren : terminHinzufuegen);
    document.getElementById("termin-titel").addEventListener("keydown", (e) => {
      if (e.key === "Enter") (bearbeiteterTermin ? terminAktualisieren : terminHinzufuegen)();
    });
    if (bearbeiteterTermin) {
      document.getElementById("btn-termin-abbrechen").addEventListener("click", () => {
        calBearbeiteterTermin = null;
        renderCalDayPanel();
      });
    }
  }

  window.terminBearbeitenStart = function(id) {
    calBearbeiteterTermin = id;
    renderCalDayPanel();
  };

  async function terminHinzufuegen() {
    const titel = document.getElementById("termin-titel").value.trim();
    if (!titel || !calAusgewaehlterTag) return;
    const uhrzeit = document.getElementById("termin-uhrzeit").value || null;
    const ende_uhrzeit = document.getElementById("termin-ende").value || null;
    const notiz = document.getElementById("termin-notiz").value.trim() || null;

    await api("termin_hinzufuegen", { titel, datum: calAusgewaehlterTag, uhrzeit, ende_uhrzeit, notiz, bereich: aktiverBereich });
    await ladeDaten();
    renderKalender();
  }

  async function terminAktualisieren() {
    const id = calBearbeiteterTermin;
    const titel = document.getElementById("termin-titel").value.trim();
    if (!titel || !id) return;
    const uhrzeit = document.getElementById("termin-uhrzeit").value || null;
    const ende_uhrzeit = document.getElementById("termin-ende").value || null;
    const notiz = document.getElementById("termin-notiz").value.trim() || null;

    await api("termin_aktualisieren", { id, titel, uhrzeit, ende_uhrzeit, notiz });
    calBearbeiteterTermin = null;
    await ladeDaten();
    renderKalender();
  }

  window.terminLoeschen = async function(id) {
    if (calBearbeiteterTermin === id) calBearbeiteterTermin = null;
    await api("termin_loeschen", { id });
    await ladeDaten();
    renderKalender();
  };

  // ==========================================================
  // Blockzeiten ("nicht stören" – wiederkehrend oder einmalig)
  // ==========================================================
  let blockzeitBearbeiteterId = null;

  document.getElementById("toggle-blockzeit-form").addEventListener("click", (e) => {
    const form = document.getElementById("blockzeit-form");
    form.classList.toggle("hidden");
    e.target.textContent = (form.classList.contains("hidden") ? "▸" : "▾") + " Neue Blockzeit anlegen";
  });

  document.querySelectorAll('input[name="blockzeit-art"]').forEach((radio) => {
    radio.addEventListener("change", blockzeitArtUmschalten);
  });

  function blockzeitArtUmschalten() {
    const wiederkehrend = document.getElementById("blockzeit-art-wiederkehrend").checked;
    document.getElementById("blockzeit-wochentage-row").classList.toggle("hidden", !wiederkehrend);
    document.getElementById("blockzeit-datum-row").classList.toggle("hidden", wiederkehrend);
  }

  function renderBlockzeitWochentage() {
    const row = document.getElementById("blockzeit-wochentage-row");
    row.innerHTML = TAGLABEL.map((label, i) => `
      <label style="display:flex; align-items:center; gap:0.25rem; font-size:0.82rem;">
        <input type="checkbox" class="blockzeit-wochentag-cb" value="${i}"> ${label}
      </label>`).join("");
  }
  renderBlockzeitWochentage();

  document.getElementById("btn-blockzeit-anlegen").addEventListener("click", blockzeitSpeichern);
  document.getElementById("btn-blockzeit-abbrechen").addEventListener("click", blockzeitFormZuruecksetzen);

  function blockzeitFormZuruecksetzen() {
    blockzeitBearbeiteterId = null;
    document.getElementById("blockzeit-titel").value = "";
    document.getElementById("blockzeit-start").value = "";
    document.getElementById("blockzeit-ende").value = "";
    document.getElementById("blockzeit-notiz").value = "";
    document.getElementById("blockzeit-datum").value = "";
    document.getElementById("blockzeit-art-wiederkehrend").checked = true;
    document.querySelectorAll(".blockzeit-wochentag-cb").forEach((cb) => { cb.checked = false; });
    blockzeitArtUmschalten();
    document.getElementById("btn-blockzeit-anlegen").textContent = "Anlegen";
    document.getElementById("btn-blockzeit-abbrechen").classList.add("hidden");
  }

  window.blockzeitBearbeitenStart = function(id) {
    const b = blockzeiten.find((bb) => bb.id === id);
    if (!b) return;
    blockzeitBearbeiteterId = id;
    document.getElementById("blockzeit-form").classList.remove("hidden");
    document.getElementById("toggle-blockzeit-form").textContent = "▾ Neue Blockzeit anlegen";
    document.getElementById("blockzeit-titel").value = b.titel;
    document.getElementById("blockzeit-start").value = b.start_zeit ? b.start_zeit.slice(0,5) : "";
    document.getElementById("blockzeit-ende").value = b.end_zeit ? b.end_zeit.slice(0,5) : "";
    document.getElementById("blockzeit-notiz").value = b.notiz || "";
    document.querySelectorAll(".blockzeit-wochentag-cb").forEach((cb) => { cb.checked = false; });
    if (b.datum) {
      document.getElementById("blockzeit-art-einmalig").checked = true;
      document.getElementById("blockzeit-datum").value = b.datum;
    } else {
      document.getElementById("blockzeit-art-wiederkehrend").checked = true;
      document.querySelectorAll(".blockzeit-wochentag-cb").forEach((cb) => {
        cb.checked = (b.wochentage || []).includes(parseInt(cb.value, 10));
      });
    }
    blockzeitArtUmschalten();
    document.getElementById("btn-blockzeit-anlegen").textContent = "Speichern";
    document.getElementById("btn-blockzeit-abbrechen").classList.remove("hidden");
    document.getElementById("blockzeit-titel").scrollIntoView({ behavior: "smooth", block: "center" });
  };

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

    if (blockzeitBearbeiteterId) {
      await api("blockzeit_aktualisieren", { id: blockzeitBearbeiteterId, titel, start_zeit, end_zeit, wochentage, datum, notiz });
    } else {
      await api("blockzeit_hinzufuegen", { titel, start_zeit, end_zeit, wochentage, datum, notiz });
    }
    blockzeitFormZuruecksetzen();
    await ladeDaten();
  }

  window.blockzeitLoeschen = async function(id) {
    if (blockzeitBearbeiteterId === id) blockzeitFormZuruecksetzen();
    await api("blockzeit_loeschen", { id });
    await ladeDaten();
  };

  function blockzeitWiederholungText(b) {
    if (b.datum) return "einmalig · " + formatDatumKurz(b.datum);
    if (b.wochentage && b.wochentage.length > 0) {
      const sortiert = [...b.wochentage].sort((x, y) => x - y);
      return sortiert.map((i) => TAGLABEL[i]).join(", ");
    }
    return "";
  }

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
        <button class="task-snooze" onclick="blockzeitBearbeitenStart('${b.id}')" title="Bearbeiten">✎</button>
        <button class="task-delete" onclick="blockzeitLoeschen('${b.id}')">×</button>
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
  let freiBearbeiteterTermin = null;
  let freiBearbeiteteAufgabe = null;

  function wochentagIndex(d) {
    return (d.getDay() + 6) % 7; // 0=Mo … 6=So
  }
  function zeitZuMinuten(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
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

  function freiRahmenFuerWochentag(wtIndex) {
    const eintrag = tagesrahmen.find((r) => r.wochentag === wtIndex);
    if (eintrag) {
      return { start_zeit: eintrag.start_zeit.slice(0,5), end_zeit: eintrag.end_zeit.slice(0,5), aktiv: eintrag.aktiv };
    }
    return { start_zeit: "08:00", end_zeit: "20:00", aktiv: true }; // Vorschlag, noch nicht gespeichert
  }

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
      timelineEl.innerHTML = '<p class="empty-text">Für diesen Wochentag ist kein Zeitrahmen aktiv.</p>';
      freiFormularSchliessen();
      return;
    }

    if (eintraege.length === 0) {
      timelineEl.innerHTML = '<p class="empty-text">Kein Zeitrahmen für diesen Tag eingestellt.</p>';
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
          ${e.typ === "Termin" ? `<button class="task-snooze" onclick="freiTerminBearbeitenStart('${e.id}')" title="Bearbeiten">✎</button>` : ""}
          ${e.typ === "Termin" ? `<button class="task-delete" onclick="freiTerminEntfernen('${e.id}')" title="Entfernen">×</button>` : ""}
          ${e.typ === "Aufgabe" ? `<button class="task-snooze" onclick="freiAufgabeBearbeitenStart('${e.id}')" title="Bearbeiten">✎</button>` : ""}
          ${e.typ === "Aufgabe" ? `<button class="task-delete" onclick="freiAufgabeEntfernen('${e.id}')" title="Entfernen">×</button>` : ""}
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

  window.freiTerminUmschalten = async function(id) {
    await api("termin_umschalten", { id });
    await ladeDaten();
    renderFrei();
  };

  window.freiAufgabeUmschalten = async function(id) {
    await api("aufgabe_umschalten", { id });
    await ladeDaten();
    renderFrei();
  };

  window.freiTerminEntfernen = async function(id) {
    if (freiBearbeiteterTermin === id) freiFormularSchliessen();
    await api("termin_loeschen", { id });
    await ladeDaten();
    renderFrei();
  };

  window.freiAufgabeEntfernen = async function(id) {
    await api("aufgabe_loeschen", { id });
    await ladeDaten();
    renderFrei();
  };

  window.freiLueckeAuswaehlen = function(start, ende) {
    freiBearbeiteterTermin = null;
    freiBearbeiteteAufgabe = null;
    freiAusgewaehlteLuecke = { start, ende };
    freiFormularTyp = "termin";
    renderFreiFormular();
    document.getElementById("frei-formular-bereich").scrollIntoView({ behavior: "smooth", block: "center" });
  };

  function freiFormularSchliessen() {
    freiAusgewaehlteLuecke = null;
    freiBearbeiteterTermin = null;
    freiBearbeiteteAufgabe = null;
    document.getElementById("frei-formular-bereich").innerHTML = "";
  }

  window.freiTerminBearbeitenStart = function(id) {
    freiAusgewaehlteLuecke = null;
    freiBearbeiteteAufgabe = null;
    freiBearbeiteterTermin = id;
    renderFreiTerminFormular();
    document.getElementById("frei-formular-bereich").scrollIntoView({ behavior: "smooth", block: "center" });
  };

  function renderFreiTerminFormular() {
    const bereich = document.getElementById("frei-formular-bereich");
    const t = termine.find((tt) => tt.id === freiBearbeiteterTermin);
    if (!t) { bereich.innerHTML = ""; return; }

    bereich.innerHTML = `
      <div class="cal-day-panel">
        <div class="project-heading" style="margin:0 0 0.6rem;">Termin verschieben / bearbeiten</div>
        <div class="row">
          <input type="text" id="frei-termin-titel" placeholder="Titel" value="${escapeAttr(t.titel)}">
        </div>
        <div class="row">
          <input type="date" id="frei-termin-datum" value="${t.datum}">
          <input type="time" id="frei-termin-start" style="width:8rem;" value="${t.uhrzeit ? t.uhrzeit.slice(0,5) : ""}">
          <input type="time" id="frei-termin-ende" style="width:8rem;" value="${t.ende_uhrzeit ? t.ende_uhrzeit.slice(0,5) : ""}">
        </div>
        <div class="row">
          <input type="text" id="frei-termin-notiz" placeholder="Notiz (optional)" value="${t.notiz ? escapeAttr(t.notiz) : ""}">
        </div>
        <div class="row">
          <button class="btn-primary" id="btn-frei-termin-speichern">Speichern</button>
          <button class="btn-secondary" id="btn-frei-termin-abbrechen">Abbrechen</button>
        </div>
      </div>`;

    document.getElementById("btn-frei-termin-speichern").addEventListener("click", freiTerminSpeichern);
    document.getElementById("btn-frei-termin-abbrechen").addEventListener("click", freiFormularSchliessen);
  }

  async function freiTerminSpeichern() {
    const id = freiBearbeiteterTermin;
    const titel = document.getElementById("frei-termin-titel").value.trim();
    if (!titel || !id) return;
    const datum = document.getElementById("frei-termin-datum").value || null;
    const uhrzeit = document.getElementById("frei-termin-start").value || null;
    const ende_uhrzeit = document.getElementById("frei-termin-ende").value || null;
    const notiz = document.getElementById("frei-termin-notiz").value.trim() || null;

    await api("termin_aktualisieren", { id, titel, datum, uhrzeit, ende_uhrzeit, notiz });
    freiFormularSchliessen();
    await ladeDaten();
    if (datum && datum !== dateToISO(freiTag)) freiTag = new Date(datum + "T00:00:00");
    renderFrei();
  }

  window.freiAufgabeBearbeitenStart = function(id) {
    freiAusgewaehlteLuecke = null;
    freiBearbeiteterTermin = null;
    freiBearbeiteteAufgabe = id;
    renderFreiAufgabeFormular();
    document.getElementById("frei-formular-bereich").scrollIntoView({ behavior: "smooth", block: "center" });
  };

  function renderFreiAufgabeFormular() {
    const bereich = document.getElementById("frei-formular-bereich");
    const a = aufgaben.find((aa) => aa.id === freiBearbeiteteAufgabe);
    if (!a) { bereich.innerHTML = ""; return; }

    const projektOptions = '<option value="">Ohne Projekt</option>' +
      projekteAktuell().map((p) => `<option value="${p.id}" ${p.id === a.projekt_id ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("");

    bereich.innerHTML = `
      <div class="cal-day-panel">
        <div class="project-heading" style="margin:0 0 0.6rem;">Aufgabe verschieben / bearbeiten</div>
        <div class="row">
          <input type="text" id="frei-aufgabe-titel" placeholder="Titel" value="${escapeAttr(a.titel)}">
          <select id="frei-aufgabe-projekt">${projektOptions}</select>
        </div>
        <div class="row">
          <input type="date" id="frei-aufgabe-datum" value="${a.faellig_am || ""}">
          <input type="time" id="frei-aufgabe-start" style="width:8rem;" value="${a.uhrzeit ? a.uhrzeit.slice(0,5) : ""}">
          <input type="time" id="frei-aufgabe-ende" style="width:8rem;" value="${a.ende_uhrzeit ? a.ende_uhrzeit.slice(0,5) : ""}">
        </div>
        <div class="row">
          <button class="btn-primary" id="btn-frei-aufgabe-speichern">Speichern</button>
          <button class="btn-secondary" id="btn-frei-aufgabe-abbrechen">Abbrechen</button>
        </div>
      </div>`;

    document.getElementById("btn-frei-aufgabe-speichern").addEventListener("click", freiAufgabeSpeichern);
    document.getElementById("btn-frei-aufgabe-abbrechen").addEventListener("click", freiFormularSchliessen);
  }

  async function freiAufgabeSpeichern() {
    const id = freiBearbeiteteAufgabe;
    const titel = document.getElementById("frei-aufgabe-titel").value.trim();
    if (!titel || !id) return;
    const projekt_id = document.getElementById("frei-aufgabe-projekt").value || null;
    const faellig_am = document.getElementById("frei-aufgabe-datum").value || null;
    const uhrzeit = document.getElementById("frei-aufgabe-start").value || null;
    const ende_uhrzeit = document.getElementById("frei-aufgabe-ende").value || null;

    await api("aufgabe_aktualisieren", { id, titel, projekt_id, faellig_am, uhrzeit, ende_uhrzeit });
    freiFormularSchliessen();
    await ladeDaten();
    if (faellig_am && faellig_am !== dateToISO(freiTag)) freiTag = new Date(faellig_am + "T00:00:00");
    renderFrei();
  }

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
          <button class="task-delete" onclick="notizLoeschen('${n.id}')">×</button>
        </div>`;
    }).join("");
    bereich.innerHTML = `<div class="notiz-list">${html}</div>`;
  }

  document.getElementById("btn-notiz-hinzufuegen").addEventListener("click", notizHinzufuegen);
  document.getElementById("neue-notiz").addEventListener("keydown", (e) => {
    if (e.key === "Enter") notizHinzufuegen();
  });

  async function notizHinzufuegen() {
    const text = document.getElementById("neue-notiz").value.trim();
    if (!text) return;
    const projekt_id = document.getElementById("notiz-projekt").value || null;
    await api("notiz_hinzufuegen", { text, projekt_id, bereich: aktiverBereich });
    document.getElementById("neue-notiz").value = "";
    await ladeDaten();
  }

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
          <button class="task-delete" onclick="ogsIdeeLoeschen('${i.id}')">×</button>
        </div>`;
    }).join("");
    bereich.innerHTML = `<div class="notiz-list">${html}</div>`;
  }

  document.getElementById("btn-ogs-idee-hinzufuegen").addEventListener("click", ogsIdeeHinzufuegen);
  document.getElementById("neue-ogs-idee").addEventListener("keydown", (e) => {
    if (e.key === "Enter") ogsIdeeHinzufuegen();
  });

  async function ogsIdeeHinzufuegen() {
    const titel = document.getElementById("neue-ogs-idee").value.trim();
    if (!titel) return;
    const beschreibung = document.getElementById("neue-ogs-idee-beschreibung").value.trim() || null;
    await api("ogs_idee_hinzufuegen", { titel, beschreibung, bereich: aktiverBereich });
    document.getElementById("neue-ogs-idee").value = "";
    document.getElementById("neue-ogs-idee-beschreibung").value = "";
    await ladeDaten();
  }

  window.ogsIdeeStatusAendern = async function(id, status) {
    const idee = ogsIdeen.find((i) => i.id === id);
    if (!idee) return;
    await api("ogs_idee_aktualisieren", { id, titel: idee.titel, beschreibung: idee.beschreibung, status });
    await ladeDaten();
  };

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

  function rezepteAktuell() {
    return rezepte.filter((r) => bereichVon(r) === aktiverBereich);
  }

  function rezeptMeta(r) {
    const teile = [];
    if (r.bild_pfad) teile.push("📷");
    if (r.kategorie) teile.push(escapeHtml(r.kategorie));
    if (r.portionen) teile.push(`${r.portionen} ${r.portionen === 1 ? "Portion" : "Portionen"}`);
    if (r.zeit_minuten) teile.push(`${r.zeit_minuten} Min.`);
    return teile.join(" · ");
  }

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

  function rezeptEinkaufButtonText(anzahl) {
    return anzahl === 0 ? "Zutaten auswählen" : `${anzahl} auf die Einkaufsliste`;
  }

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

  function kochWachAnzeigen() {
    const el = document.getElementById("koch-wach");
    if (!el || !kochmodus) return;
    const texte = {
      an: "🔆 Bildschirm bleibt an",
      aus: "Bildschirm-Sperre wieder aktiv – kurz antippen, um sie erneut zu verhindern",
      nicht: "Dieser Browser kann den Bildschirm nicht wach halten",
      fehler: "Bildschirm konnte nicht wach gehalten werden",
    };
    el.textContent = texte[kochmodus.wach] || "";
  }

  document.addEventListener("visibilitychange", () => {
    // Das Betriebssystem gibt die Sperre beim Wechsel in eine andere App frei
    if (kochmodus && document.visibilityState === "visible" && !kochmodus.wakeLock) kochWachHalten();
  });

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

  function kochmodusAufraeumen() {
    if (!kochmodus) return;
    if (kochmodus.wakeLock) { try { kochmodus.wakeLock.release(); } catch (e) { /* egal */ } }
    kochmodus = null;
    const overlay = document.getElementById("koch-overlay");
    if (overlay) overlay.remove();
    document.body.classList.remove("koch-offen");
  }

  window.kochmodusSchliessen = function() {
    if (!kochmodus) return;
    if (history.state && history.state.kochmodus) history.back(); // räumt über popstate auf
    else kochmodusAufraeumen();
  };

  window.addEventListener("popstate", () => { if (kochmodus) kochmodusAufraeumen(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && kochmodus) window.kochmodusSchliessen(); });

  window.kochZutatUmschalten = function(index) {
    if (!kochmodus) return;
    const set = kochmodus.zutatenErledigt;
    if (set.has(index)) set.delete(index); else set.add(index);
    renderKochmodus();
  };

  window.kochSchrittUmschalten = function(index) {
    if (!kochmodus) return;
    const set = kochmodus.schritteErledigt;
    if (set.has(index)) set.delete(index); else set.add(index);
    renderKochmodus();
  };

  window.kochPortionenAendern = function(delta) {
    if (!kochmodus) return;
    window.rezeptPortionenAendern(kochmodus.id, delta);
    renderKochmodus();
  };

  window.kochFertig = async function() {
    if (!kochmodus) return;
    const id = kochmodus.id;
    const r = rezepte.find((x) => x.id === id);
    window.kochmodusSchliessen();
    if (r && r.zuletzt_gekocht !== heuteISO()) await window.rezeptHeuteGekocht(id);
  };

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
        <span class="session-fokus-titel" id="koch-titel">👨‍🍳 ${escapeHtml(r.titel)}</span>
        <button class="session-fokus-schliessen" onclick="kochmodusSchliessen()" aria-label="Kochmodus schließen">✕</button>
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
            ${(hatZutaten || r.zubereitung) && !einkaufModus ? `<button class="btn-primary rezept-koch-start" onclick="kochmodusStarten('${r.id}')">👨‍🍳 Kochmodus</button>` : ""}
            ${zutaten ? `<h3 class="rezept-abschnitt">Zutaten</h3>${portionenLeiste}${zutaten}` : ""}
            ${hatZutaten && !einkaufModus ? `<button class="btn-secondary rezept-einkauf-start" onclick="rezeptEinkaufStarten('${r.id}')">🛒 Zutaten auf die Einkaufsliste …</button>` : ""}
            ${r.zubereitung ? `<h3 class="rezept-abschnitt">Zubereitung</h3><p class="rezept-text">${escapeHtml(r.zubereitung)}</p>` : ""}
            ${r.notiz ? `<h3 class="rezept-abschnitt">Notiz</h3><p class="rezept-text">${escapeHtml(r.notiz)}</p>` : ""}
            ${r.quelle ? `<p class="notiz-meta">Quelle: ${rezeptQuelleHtml(r.quelle)}</p>` : ""}
            ${!zutaten && !r.zubereitung && !r.notiz ? '<p class="empty-text">Noch keine Zutaten oder Zubereitung eingetragen.</p>' : ""}
            <div class="rezept-aktionen">
              ${heuteGekocht
                ? `<button class="btn-secondary rezept-gekocht-btn erledigt" onclick="rezeptGekochtZuruecknehmen('${r.id}')">✓ Heute gekocht · zurücknehmen</button>`
                : `<button class="btn-secondary rezept-gekocht-btn" onclick="rezeptHeuteGekocht('${r.id}')">✓ Heute gekocht</button>`}
              <button class="btn-secondary" onclick="rezeptBearbeiten('${r.id}')">✎ Bearbeiten</button>
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
          <label class="btn-secondary rezept-foto-label" for="rezept-f-foto">📷 Foto wählen</label>
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

  window.rezeptPortionenAendern = function(id, delta) {
    const r = rezepte.find((x) => x.id === id);
    if (!r || !r.portionen) return;
    const aktuell = rezeptPortionenAnzeige[id] || r.portionen;
    rezeptPortionenAnzeige[id] = Math.min(100, Math.max(1, aktuell + delta));
    renderRezepte();
  };

  window.rezeptPortionenZuruecksetzen = function(id) {
    delete rezeptPortionenAnzeige[id];
    renderRezepte();
  };

  window.rezeptEinkaufStarten = function(id) {
    rezeptEinkaufId = id;
    rezeptEinkaufAuswahl = new Set();
    renderRezepte();
  };

  window.rezeptEinkaufAbbrechen = function() {
    rezeptEinkaufId = null;
    rezeptEinkaufAuswahl = new Set();
    renderRezepte();
  };

  window.rezeptEinkaufWaehlen = function(index, an) {
    if (an) rezeptEinkaufAuswahl.add(index); else rezeptEinkaufAuswahl.delete(index);
    // nur den Knopf aktualisieren, nicht neu zeichnen (Scrollposition bleibt)
    const knopf = document.getElementById("rezept-einkauf-uebernehmen");
    if (knopf) {
      knopf.textContent = rezeptEinkaufButtonText(rezeptEinkaufAuswahl.size);
      knopf.disabled = rezeptEinkaufAuswahl.size === 0;
    }
  };

  function rezeptEinkaufKandidaten(r) {
    const faktor = r.portionen ? (rezeptPortionenAnzeige[r.id] || r.portionen) / r.portionen : 1;
    const offeneArtikel = new Set(einkaufsliste
      .filter((e) => bereichVon(e) === aktiverBereich && !e.erledigt)
      .map((e) => e.text.trim().toLowerCase()));
    return rezeptZutatenZeilen(r.zutaten, faktor)
      .filter((z) => z.typ === "zutat" && !offeneArtikel.has(z.text.toLowerCase()));
  }

  window.rezeptEinkaufAlle = function(id) {
    const r = rezepte.find((x) => x.id === id);
    if (!r) return;
    rezeptEinkaufAuswahl = new Set(rezeptEinkaufKandidaten(r).map((z) => z.index));
    renderRezepte();
  };

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

  window.rezeptBearbeiten = function(id) {
    rezeptFormId = id;
    rezeptFormRendern();
  };

  window.rezeptFormSchliessen = function() {
    rezeptFormId = null;
    rezeptFormRendern();
  };

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
  const INV_ZUSTAND_LABEL = { gut: "✅ Gut", eingeschraenkt: "⚠️ Eingeschränkt nutzbar", defekt: "❌ Defekt" };
  let invAktiveKategorie = "alle";
  let invBearbeitenId = null;

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
      </select>`;

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
        if (invBearbeitenId === i.id) {
          return `
            <div class="notiz-item">
              <div style="flex:1; display:flex; flex-wrap:wrap; gap:0.4rem;">
                <input type="text" id="inv-edit-name-${i.id}" value="${escapeAttr(i.name)}" placeholder="Gegenstand">
                <input type="text" id="inv-edit-kategorie-${i.id}" value="${escapeAttr(i.kategorie)}" placeholder="Kategorie" list="inv-kategorie-liste">
                <input type="number" id="inv-edit-menge-${i.id}" value="${i.menge}" min="1" style="width:5rem;">
                <input type="text" id="inv-edit-standort-${i.id}" value="${escapeAttr(i.standort || "")}" placeholder="Standort">
                <input type="text" id="inv-edit-beschreibung-${i.id}" value="${escapeAttr(i.beschreibung || "")}" placeholder="Beschreibung" style="min-width:14rem; flex:1;">
                <select id="inv-edit-zustand-${i.id}">
                  <option value="gut" ${i.zustand === "gut" ? "selected" : ""}>Gut</option>
                  <option value="eingeschraenkt" ${i.zustand === "eingeschraenkt" ? "selected" : ""}>Eingeschränkt nutzbar</option>
                  <option value="defekt" ${i.zustand === "defekt" ? "selected" : ""}>Defekt</option>
                </select>
                <button class="btn-primary" onclick="invBearbeitenSpeichern('${i.id}')">Speichern</button>
                <button class="link-btn" onclick="invBearbeitenAbbrechen()">Abbrechen</button>
              </div>
            </div>`;
        }
        const offeneAusleihen = verleihAktuell().filter((v) => v.inventar_id === i.id && !v.rueckgabe_am);
        const ausleiheHinweis = offeneAusleihen.length > 0
          ? `<span class="notiz-meta" style="display:block; color:var(--accent);">→ ${offeneAusleihen.reduce((s, v) => s + v.menge, 0)}× verliehen an ${offeneAusleihen.map((v) => escapeHtml(v.ausgeliehen_an)).join(", ")}</span>`
          : "";
        return `
          <div class="notiz-item">
            <div style="flex:1; cursor:pointer;" onclick="invBearbeitenStart('${i.id}')">
              <span class="notiz-text">${escapeHtml(i.name)}</span>
              <span class="notiz-meta">${i.menge}× ${i.standort ? "· " + escapeHtml(i.standort) + " " : ""}· ${INV_ZUSTAND_LABEL[i.zustand] || i.zustand}</span>
              ${i.beschreibung ? `<span class="notiz-meta" style="display:block;">${escapeHtml(i.beschreibung)}</span>` : ""}
              ${ausleiheHinweis}
            </div>
            <button class="task-delete" onclick="invLoeschen('${i.id}')">×</button>
          </div>`;
      }).join("");
      return `<h3 style="margin-top:1.2rem; margin-bottom:0.4rem; font-size:0.95rem; color:var(--ink-dim);">${escapeHtml(kat)}</h3><div class="notiz-list">${zeilen}</div>`;
    }).join("");
  }

  window.invFilterAendern = function(wert) {
    invAktiveKategorie = wert;
    renderInventar();
  };

  document.getElementById("btn-inv-hinzufuegen").addEventListener("click", invHinzufuegen);

  async function invHinzufuegen() {
    const name = document.getElementById("neu-inv-name").value.trim();
    const kategorie = document.getElementById("neu-inv-kategorie").value.trim();
    if (!name || !kategorie) return;
    const menge = document.getElementById("neu-inv-menge").value || 1;
    const standort = document.getElementById("neu-inv-standort").value.trim() || null;
    const beschreibung = document.getElementById("neu-inv-beschreibung").value.trim() || null;
    const zustand = document.getElementById("neu-inv-zustand").value;
    await api("ogs_inventar_hinzufuegen", { name, kategorie, menge, standort, beschreibung, zustand, bereich: aktiverBereich });
    document.getElementById("neu-inv-name").value = "";
    document.getElementById("neu-inv-kategorie").value = "";
    document.getElementById("neu-inv-menge").value = "1";
    document.getElementById("neu-inv-standort").value = "";
    document.getElementById("neu-inv-beschreibung").value = "";
    document.getElementById("neu-inv-zustand").value = "gut";
    await ladeDaten();
  }

  window.invBearbeitenStart = function(id) {
    invBearbeitenId = id;
    renderInventar();
  };

  window.invBearbeitenAbbrechen = function() {
    invBearbeitenId = null;
    renderInventar();
  };

  window.invBearbeitenSpeichern = async function(id) {
    const name = document.getElementById(`inv-edit-name-${id}`).value.trim();
    const kategorie = document.getElementById(`inv-edit-kategorie-${id}`).value.trim();
    if (!name || !kategorie) return;
    const menge = document.getElementById(`inv-edit-menge-${id}`).value || 1;
    const standort = document.getElementById(`inv-edit-standort-${id}`).value.trim() || null;
    const beschreibung = document.getElementById(`inv-edit-beschreibung-${id}`).value.trim() || null;
    const zustand = document.getElementById(`inv-edit-zustand-${id}`).value;
    await api("ogs_inventar_aktualisieren", { id, name, kategorie, menge, standort, beschreibung, zustand });
    invBearbeitenId = null;
    await ladeDaten();
  };

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
  let projBearbeitenId = null;
  let verleihBearbeitenId = null;

  function dateiZuBase64(datei) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(datei);
    });
  }

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

    function projektHtml(p, istUnterprojekt) {
      const datum = new Date(p.erstellt_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      const dateien = ogsProjektDateien.filter((d) => d.projekt_id === p.id);
      const itemKlasse = istUnterprojekt ? "proj-unter-item" : "notiz-item";

      if (projBearbeitenId === p.id) {
        // Auswahl fürs Umhängen: alle Hauptprojekte außer sich selbst.
        const hauptOptionen = hauptprojekte.filter((h) => h.id !== p.id)
          .map((h) => `<option value="${h.id}" ${p.hauptprojekt_id === h.id ? "selected" : ""}>${escapeAttr(h.titel)}</option>`).join("");
        return `
          <div class="${itemKlasse}">
            <div style="flex:1; display:flex; flex-direction:column; gap:0.4rem;">
              <input type="text" id="proj-edit-titel-${p.id}" value="${escapeAttr(p.titel)}" placeholder="Titel">
              <input type="text" id="proj-edit-kategorie-${p.id}" value="${escapeAttr(p.kategorie || "")}" placeholder="Kategorie" list="proj-kategorie-liste">
              <textarea id="proj-edit-beschreibung-${p.id}" rows="2" placeholder="Kurzbeschreibung">${escapeHtml(p.beschreibung || "")}</textarea>
              <select id="proj-edit-hauptprojekt-${p.id}">
                <option value="">– Eigenständiges Hauptprojekt –</option>
                ${hauptOptionen}
              </select>
              <div>
                <button class="btn-primary" onclick="projBearbeitenSpeichern('${p.id}')">Speichern</button>
                <button class="link-btn" onclick="projBearbeitenAbbrechen()">Abbrechen</button>
              </div>
            </div>
          </div>`;
      }

      const dateiZeilen = dateien.map((d) => {
        const hochgeladen = new Date(d.hochgeladen_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
        return `
              <div>📎 <span onclick="event.stopPropagation(); projDateiOeffnen('${d.id}')" style="text-decoration:underline; cursor:pointer;">${escapeHtml(d.datei_name)}</span>
                <span style="opacity:0.65;">(${hochgeladen})</span>
                <span onclick="event.stopPropagation(); projDateiLoeschen('${d.id}')" style="cursor:pointer; margin-left:0.3rem;" title="Datei entfernen">×</span></div>`;
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
                <label style="text-decoration:underline; cursor:pointer;" onclick="event.stopPropagation();">📎 Datei hinzufügen<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none;" onchange="projDateiHinzufuegen('${p.id}', this)"></label>
              </div>
            </div>
            ${unterprojekteHtml}
          </div>
          <button class="task-delete" onclick="projLoeschen('${p.id}')">×</button>
        </div>`;
    }

    const html = hauptprojekte.map((p) => projektHtml(p, false)).join("");
    bereich.innerHTML = `<div class="notiz-list">${html}</div>`;
  }

  document.getElementById("btn-proj-hinzufuegen").addEventListener("click", projHinzufuegen);

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

  window.projBearbeitenStart = function(id) {
    projBearbeitenId = id;
    renderProjekte();
  };

  window.projBearbeitenAbbrechen = function() {
    projBearbeitenId = null;
    renderProjekte();
  };

  window.projBearbeitenSpeichern = async function(id) {
    const titel = document.getElementById(`proj-edit-titel-${id}`).value.trim();
    if (!titel) return;
    const kategorie = document.getElementById(`proj-edit-kategorie-${id}`).value.trim() || null;
    const beschreibung = document.getElementById(`proj-edit-beschreibung-${id}`).value.trim() || null;
    const hauptprojektSelect = document.getElementById(`proj-edit-hauptprojekt-${id}`);
    const hauptprojekt_id = hauptprojektSelect ? (hauptprojektSelect.value || null) : undefined;
    try {
      await api("ogs_projekt_aktualisieren", { id, titel, kategorie, beschreibung, hauptprojekt_id });
      projBearbeitenId = null;
      await ladeDaten();
    } catch (e) {
      alert("Konnte nicht gespeichert werden: " + e.message);
    }
  };

  window.projLoeschen = async function(id) {
    if (!confirm("Dieses Projekt inklusive hinterlegter Dateien wirklich löschen?")) return;
    try {
      await api("ogs_projekt_loeschen", { id });
      await ladeDaten();
    } catch (e) {
      alert("Konnte nicht gelöscht werden: " + e.message);
    }
  };

  window.projDateiOeffnen = async function(dateiId) {
    try {
      const res = await api("ogs_projekt_datei_url", { datei_id: dateiId });
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      alert("Datei konnte nicht geöffnet werden: " + e.message);
    }
  };

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

    function gegenstandName(v) {
      return inventarById[v.inventar_id]?.name || "(gelöschter Gegenstand)";
    }

    function eintragHtml(v) {
      if (verleihBearbeitenId === v.id) {
        return `
          <div class="notiz-item">
            <div style="flex:1; display:flex; flex-wrap:wrap; gap:0.4rem;">
              <input type="text" id="verleih-edit-an-${v.id}" value="${escapeAttr(v.ausgeliehen_an)}" placeholder="An wen">
              <input type="number" id="verleih-edit-menge-${v.id}" value="${v.menge}" min="1" style="width:5rem;">
              <label class="empty-text" style="display:flex; align-items:center; gap:0.3rem;">Ausgeliehen: <input type="date" id="verleih-edit-am-${v.id}" value="${v.ausgeliehen_am}"></label>
              <label class="empty-text" style="display:flex; align-items:center; gap:0.3rem;">Zurück: <input type="date" id="verleih-edit-rueck-${v.id}" value="${v.rueckgabe_am || ""}"></label>
              <input type="text" id="verleih-edit-notiz-${v.id}" value="${escapeAttr(v.notiz || "")}" placeholder="Notiz (optional)" style="flex:1; min-width:150px;">
              <button class="btn-primary" onclick="verleihBearbeitenSpeichern('${v.id}')">Speichern</button>
              <button class="link-btn" onclick="verleihBearbeitenAbbrechen()">Abbrechen</button>
            </div>
          </div>`;
      }
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
          <button class="task-delete" onclick="event.stopPropagation(); verleihLoeschen('${v.id}')">×</button>
        </div>`;
    }

    const offeneEintraege = eintraegeAktuell.filter((v) => !v.rueckgabe_am);
    const zurueckEintraege = eintraegeAktuell.filter((v) => v.rueckgabe_am);

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

  window.verleihRueckgabe = async function(id) {
    await api("verleih_rueckgabe", { id });
    await ladeDaten();
  };

  window.verleihLoeschen = async function(id) {
    if (!confirm("Diesen Verleih-Eintrag endgültig löschen?")) return;
    await api("verleih_loeschen", { id });
    await ladeDaten();
  };

  window.verleihBearbeitenStart = function(id) {
    verleihBearbeitenId = id;
    renderVerleih();
  };

  window.verleihBearbeitenAbbrechen = function() {
    verleihBearbeitenId = null;
    renderVerleih();
  };

  window.verleihBearbeitenSpeichern = async function(id) {
    const ausgeliehen_an = document.getElementById(`verleih-edit-an-${id}`).value.trim();
    if (!ausgeliehen_an) return;
    const menge = document.getElementById(`verleih-edit-menge-${id}`).value || 1;
    const ausgeliehen_am = document.getElementById(`verleih-edit-am-${id}`).value;
    const rueckgabe_am = document.getElementById(`verleih-edit-rueck-${id}`).value || null;
    const notiz = document.getElementById(`verleih-edit-notiz-${id}`).value.trim() || null;
    await api("verleih_aktualisieren", { id, ausgeliehen_an, menge, ausgeliehen_am, rueckgabe_am, notiz });
    verleihBearbeitenId = null;
    await ladeDaten();
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

  function trainingWochenziel(sportart) {
    const key = (sportart || "").trim();
    const eintrag = trainingEinstellungen.find((e) => e.bereich === aktiverBereich && (e.sportart || "") === key);
    if (eintrag) return eintrag.wochenziel;
    return key ? null : 2;
  }

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

  function trainingUebungZeileHtml(u, i, praefix) {
    return `
      <div class="row" style="gap:0.4rem; margin-bottom:0.3rem; flex-wrap:wrap;">
        <input type="text" id="${praefix}-ueb-name-${i}" value="${escapeAttr(u.name || "")}" placeholder="Übung (z.B. Rudern)" list="training-uebung-namen-liste" style="flex:1; min-width:120px;">
        <input type="number" id="${praefix}-ueb-saetze-${i}" value="${u.saetze ?? ""}" placeholder="Sätze" min="0" style="width:4.3rem;">
        <input type="number" id="${praefix}-ueb-wdh-${i}" value="${u.wiederholungen ?? ""}" placeholder="Wdh" min="0" style="width:4.3rem;">
        <input type="number" id="${praefix}-ueb-sekunden-${i}" value="${u.sekunden ?? ""}" placeholder="Sek." min="0" title="Sekunden (statt Wdh., z.B. für Plank)" style="width:4.3rem;">
        <input type="number" id="${praefix}-ueb-gewicht-${i}" value="${u.gewicht_kg ?? ""}" placeholder="kg" min="0" step="0.5" style="width:4.3rem;">
        <input type="text" id="${praefix}-ueb-progression-${i}" value="${escapeAttr(u.progression || "")}" placeholder="Variante (z.B. unterstützt)" style="flex:1; min-width:110px;">
        <button class="task-delete" type="button" onclick="trainingUebungZeileEntfernen('${praefix}', ${i})">×</button>
      </div>`;
  }

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

  function trainingUebungenArray(praefix) {
    if (praefix === "neu") return trainingFormUebungen;
    if (praefix === "plan-neu") return planFormUebungen;
    if (praefix.startsWith("plan-edit-")) return planBearbeitenUebungen;
    return trainingBearbeitenUebungen;
  }

  window.trainingUebungZeileHinzufuegen = function(praefix) {
    const arr = trainingUebungenArray(praefix);
    const aktuell = trainingUebungenAusDom(praefix, arr.length);
    aktuell.push({ name: "", saetze: "", wiederholungen: "", gewicht_kg: "" });
    arr.length = 0;
    arr.push(...aktuell);
    renderTraining();
  };

  window.trainingUebungZeileEntfernen = function(praefix, index) {
    const arr = trainingUebungenArray(praefix);
    const aktuell = trainingUebungenAusDom(praefix, arr.length);
    aktuell.splice(index, 1);
    arr.length = 0;
    arr.push(...aktuell);
    renderTraining();
  };

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
        ${laengsteStreak >= 1 ? `<div class="empty-text" style="margin-top:0.2rem;">🔥 Längste Serie: ${laengsteStreak} Woche${laengsteStreak === 1 ? "" : "n"} in Folge Ziel erreicht</div>` : ""}`;
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

    function trendSymbol(aktuell, vorher) {
      if (vorher === null || vorher === undefined) return "";
      const diff = Number(aktuell) - Number(vorher);
      if (diff > 0) return ` <span style="color:var(--mod-termine);">↑</span>`;
      if (diff < 0) return ` <span style="color:var(--overdue-text);">↓</span>`;
      return ` <span style="color:var(--ink-dim);">→</span>`;
    }

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
        return `<span class="chip" style="cursor:default; padding-right:0.7rem;" ${bestleistung ? 'title="Neue Bestleistung"' : ""}>${chipBildHtml("uebung", u.name)}${bestleistung ? "🏆 " : ""}${escapeHtml(u.name)}${werte ? ` <span style="color:var(--ink-dim);">${werte}</span>` : ""}</span>`;
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
            <span class="notiz-text">${istEntryBestleistung(t) ? '<span title="Neue Bestleistung">🏆</span> ' : ""}${escapeHtml(t.sportart)}${t.ort ? " · " + escapeHtml(t.ort) : ""}</span>
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
          <button class="task-delete" onclick="event.stopPropagation(); trainingLoeschen('${t.id}')">×</button>
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

  window.trainingLoeschen = async function(id) {
    if (!confirm("Dieses Training endgültig löschen?")) return;
    await api("training_loeschen", { id });
    await ladeDaten();
    renderTraining();
  };

  window.trainingBearbeitenStart = function(id) {
    trainingBearbeitenId = id;
    trainingBearbeitenUebungen = trainingUebungen
      .filter((u) => u.training_id === id)
      .sort((a, b) => a.reihenfolge - b.reihenfolge)
      .map((u) => ({ name: u.name, saetze: u.saetze ?? "", wiederholungen: u.wiederholungen ?? "", sekunden: u.sekunden ?? "", gewicht_kg: u.gewicht_kg ?? "", progression: u.progression ?? "" }));
    renderTraining();
  };

  window.trainingBearbeitenAbbrechen = function() {
    trainingBearbeitenId = null;
    trainingBearbeitenUebungen = [];
    renderTraining();
  };

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

  function planUebungenFuer(planId) {
    return trainingsplanUebungen.filter((u) => u.plan_id === planId).sort((a, b) => a.reihenfolge - b.reihenfolge);
  }

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
            <button class="link-btn" onclick="planStarten('${p.id}')" ${uebungen.length ? "" : "disabled"}>▶ Starten</button>
            <button class="link-btn" onclick="planExportieren('${p.id}')">⇩ Export</button>
            <button class="task-edit-btn" onclick="planBearbeitenStart('${p.id}')" title="Bearbeiten">✎</button>
            <button class="task-delete" onclick="planLoeschen('${p.id}')">×</button>
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

  window.planBearbeitenStart = function(id) {
    planBearbeitenId = id;
    planBearbeitenUebungen = planUebungenFuer(id)
      .map((u) => ({ name: u.name, saetze: u.saetze ?? "", wiederholungen: u.wiederholungen ?? "", sekunden: u.sekunden ?? "", gewicht_kg: u.gewicht_kg ?? "", progression: u.progression ?? "" }));
    renderTraining();
  };

  window.planBearbeitenAbbrechen = function() {
    planBearbeitenId = null;
    planBearbeitenUebungen = [];
    renderTraining();
  };

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

  function planDateinameSlug(text) {
    const ersatz = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
    const slug = (text || "plan")
      .toLowerCase()
      .replace(/[äöüß]/g, (c) => ersatz[c] || c)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "plan";
  }

  window.planExportieren = function(planId) {
    const p = trainingsplaene.find((pl) => pl.id === planId);
    if (!p) return;
    const exportObj = { typ: "trainingsplan_export", version: 1, plaene: [planZuExportObjekt(p)] };
    downloadDatei(`trainingsplan-${planDateinameSlug(p.name)}.json`, JSON.stringify(exportObj, null, 2), "application/json");
  };

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

  function csvGanzzahlOderNull(raw) {
    const s = (raw || "").trim();
    if (!s) return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }

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
        btnPlaeneImport.textContent = "⇪ Pläne importieren (CSV/JSON)";
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

  function renderTrainingsstammdaten() {
    const sportarten = trainingStammdatenAktuell("sportart");
    const uebungen = trainingStammdatenAktuell("uebung");

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
          <button class="task-edit-btn" onclick="stammdatenBearbeitenStart('${s.id}')" title="Bearbeiten">✎</button>
          <button class="task-delete" onclick="stammdatenLoeschen('${s.id}')">×</button>
        </div>`;
    }

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
          <button class="task-edit-btn" onclick="stammdatenBearbeitenStart('${s.id}')" title="Bearbeiten">✎</button>
          <button class="task-delete" onclick="stammdatenLoeschen('${s.id}')">×</button>
        </div>`;
    }

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
        ${unerkannt.length ? `<p class="empty-text">Nicht erkannt (bitte über „✎" von Hand zuordnen): ${unerkannt.map((v) => escapeHtml(v.name)).join(", ")}</p>` : ""}
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

  window.uebungKategorieVorschlagHaken = function(id, haken) {
    const v = uebungKategorieVorschlaege && uebungKategorieVorschlaege.find((x) => x.id === id);
    if (v) v.uebernehmen = haken;
    renderUebungKategorieVorschlag();
  };

  window.uebungKategorieVorschlagAendern = function(id, kategorie) {
    const v = uebungKategorieVorschlaege && uebungKategorieVorschlaege.find((x) => x.id === id);
    if (v) v.kategorie = kategorie;
  };

  window.uebungKategorieVorschlaegeSchliessen = function() {
    uebungKategorieVorschlaege = null;
    renderUebungKategorieVorschlag();
  };

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

  window.stammdatenLoeschen = async function(id) {
    await api("stammdaten_loeschen", { id });
    await ladeDaten();
    renderTraining();
  };

  window.stammdatenBearbeitenStart = function(id) {
    stammdatenBearbeitenId = id;
    renderTraining();
  };

  window.stammdatenBearbeitenAbbrechen = function() {
    stammdatenBearbeitenId = null;
    renderTraining();
  };

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
              <button class="task-delete" data-sportart="${escapeAttr(z.sportart)}" onclick="trainingSportartZielLoeschen(this.dataset.sportart)">×</button>
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

  window.trainingSessionWeiter = function() {
    trainingSessionAusDomUebernehmen();
    trainingSession.index = Math.min(trainingSession.index + 1, trainingSession.uebungen.length - 1);
    trainingSession.countdown = null; // neue Übung = frischer Countdown
    renderTrainingSession();
  };

  window.trainingSessionZurueck = function() {
    trainingSessionAusDomUebernehmen();
    trainingSession.index = Math.max(trainingSession.index - 1, 0);
    trainingSession.countdown = null;
    renderTrainingSession();
  };

  window.trainingSessionAbbrechen = function() {
    if (!confirm("Trainings-Session abbrechen? Bisher eingegebene Werte gehen verloren.")) return;
    sessionFokusSchliessen();
    trainingSession = null;
    renderTraining();
  };

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

  window.sessionCountdownNeu = function() {
    if (!trainingSession) return;
    trainingSessionAusDomUebernehmen();
    trainingSession.countdown = null;
    renderTrainingSession();
  };

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
      knoepfe = `<button class="session-fokus-btn-sek" onclick="sessionCountdownPause()">⏸ Pause</button>`;
    } else if (c.status === "pausiert") {
      status = `Satz ${c.satz} von ${c.saetze} pausiert`;
      knoepfe = `<button class="session-fokus-btn-primaer" onclick="sessionCountdownStart()">▶ Weiter</button>`;
    } else {
      status = `Satz ${c.satz} von ${c.saetze}`;
      knoepfe = `<button class="session-fokus-btn-primaer" onclick="sessionCountdownStart()">▶ ${c.saetze > 1 ? `Satz ${c.satz} starten` : "Start"}</button>`;
    }
    return `
      <div class="session-countdown session-countdown-${c.status}">
        <div class="session-countdown-status">${status}</div>
        ${c.status !== "fertig" ? `<div class="timer-countdown" id="session-countdown-zeit">${zeitFormat(rest)}</div>` : ""}
        <div class="session-countdown-knoepfe">${knoepfe}</div>
      </div>`;
  }

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
        <span class="session-gesamtzeit" title="Gesamtzeit">⏱ <span id="session-gesamtzeit">${zeitFormat((Date.now() - trainingSession.startMs) / 1000, true)}</span></span>
        <button class="session-fokus-schliessen" onclick="trainingSessionAbbrechen()" aria-label="Schließen">×</button>
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
          <button class="link-btn" onclick="timerStarten('${t.id}')">▶ Starten</button>
          <button class="task-edit-btn" onclick="timerBearbeitenStart('${t.id}')" title="Bearbeiten">✎</button>
          <button class="task-delete" onclick="timerLoeschen('${t.id}')">×</button>
        </div>`;
    }

    listEl.innerHTML = liste.length
      ? `<div class="notiz-list">${liste.map(timerHtml).join("")}</div>`
      : '<p class="empty-text">Noch keine Timer angelegt.</p>';
  }

  const btnTimerHinzufuegen = document.getElementById("btn-timer-hinzufuegen");
  if (btnTimerHinzufuegen) btnTimerHinzufuegen.addEventListener("click", timerHinzufuegen);

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

  window.timerBearbeitenStart = function(id) {
    timerBearbeitenId = id;
    renderTraining();
  };

  window.timerBearbeitenAbbrechen = function() {
    timerBearbeitenId = null;
    renderTraining();
  };

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

  window.timerLoeschen = async function(id) {
    if (!confirm("Diesen Timer endgültig löschen?")) return;
    await api("timer_loeschen", { id });
    await ladeDaten();
    renderTraining();
  };

  let timerIntervalHandle = null;

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

  function timerFokusSchliessen() {
    clearInterval(timerIntervalHandle);
    timerIntervalHandle = null;
    const overlay = document.getElementById("timer-fokus-overlay");
    if (overlay) overlay.remove();
    if (document.fullscreenElement) {
      try { document.exitFullscreen?.().catch(() => {}); } catch {}
    }
  }

  function timerTick() {
    if (!timerSession || !timerSession.laeuft) return;
    timerSession.sekundenVerbleibend--;
    if (timerSession.sekundenVerbleibend <= 0) {
      timerPhaseWeiter();
    } else {
      renderTimerSession();
    }
  }

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

  window.timerPausieren = function() {
    if (!timerSession) return;
    timerSession.laeuft = !timerSession.laeuft;
    renderTimerSession();
  };

  window.timerAbbrechen = function() {
    if (!timerSession) return;
    if (timerSession.phase !== "fertig" && !confirm("Timer beenden?")) return;
    if (timerSession.wakeLock) { try { timerSession.wakeLock.release(); } catch {} }
    timerSession = null;
    timerFokusSchliessen();
  };

  function renderTimerSession() {
    const overlay = document.getElementById("timer-fokus-overlay");
    if (!overlay || !timerSession) return;
    const t = timerSession;
    const phaseLabel = { vorbereitung: "Vorbereitung", arbeit: "Arbeit", pause: "Pause", fertig: "Fertig! 🎉" }[t.phase];
    const mm = String(Math.floor(t.sekundenVerbleibend / 60)).padStart(2, "0");
    const ss = String(t.sekundenVerbleibend % 60).padStart(2, "0");

    overlay.innerHTML = `
      <div class="session-fokus-kopf">
        <span class="session-fokus-titel">${escapeHtml(t.name)} · Runde ${Math.min(t.rundeAktuell, t.runden)} von ${t.runden}</span>
        <button class="session-fokus-schliessen" onclick="timerAbbrechen()" aria-label="Schließen">×</button>
      </div>
      <div class="session-fokus-inhalt timer-fokus-mitte timer-phase-${t.phase}">
        <div class="timer-phase-label">${phaseLabel}</div>
        ${t.phase !== "fertig" ? `<div class="timer-countdown">${mm}:${ss}</div>` : ""}
      </div>
      <div class="session-fokus-fuss">
        ${t.phase !== "fertig" ? `<button class="session-fokus-btn-sek" onclick="timerPausieren()">${t.laeuft ? "⏸ Pause" : "▶ Weiter"}</button>` : ""}
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

    function countdownText(datum) {
      const tage = Math.round((new Date(datum + "T00:00:00") - new Date(heute + "T00:00:00")) / 86400000);
      if (tage < 0) return `war vor ${Math.abs(tage)} Tag${Math.abs(tage) === 1 ? "" : "en"}`;
      if (tage === 0) return "heute!";
      const wochenText = tage >= 14 ? ` (≈ ${Math.round(tage / 7)} Wochen)` : "";
      return `noch ${tage} Tag${tage === 1 ? "" : "e"}${wochenText}`;
    }

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
          ${z.plan_id ? `<button class="link-btn" onclick="planStarten('${z.plan_id}')">▶ Starten</button>` : ""}
          <button class="task-edit-btn" onclick="zieleventBearbeitenStart('${z.id}')" title="Bearbeiten">✎</button>
          <button class="task-delete" onclick="zieleventLoeschen('${z.id}')">×</button>
        </div>`;
    }

    listEl.innerHTML = liste.length
      ? `<div class="notiz-list">${liste.map(eventHtml).join("")}</div>`
      : '<p class="empty-text">Noch keine Ziele angelegt.</p>';
  }

  const btnZieleventHinzufuegen = document.getElementById("btn-zielevent-hinzufuegen");
  if (btnZieleventHinzufuegen) btnZieleventHinzufuegen.addEventListener("click", zieleventHinzufuegen);

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

  window.zieleventBearbeitenStart = function(id) {
    zielEventBearbeitenId = id;
    renderTraining();
  };

  window.zieleventBearbeitenAbbrechen = function() {
    zielEventBearbeitenId = null;
    renderTraining();
  };

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

  function formatMinuten(min) {
    if (!min) return "0 Min.";
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (!h) return `${m} Min.`;
    return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
  }

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

  window.auswertungJahrGewaehlt = function(jahr) {
    auswertungJahr = Number(jahr);
    renderTraining();
  };

  // ------------------------------------------------------------
  // Übungsverlauf (Langzeit-Diagramm: Gewicht je Übung über die Zeit)
  // ------------------------------------------------------------

  let verlaufAusgewaehlteUebung = null;

  function trainingUebungsnamenAktuell() {
    const idsAktuell = new Set(training.filter((t) => bereichVon(t) === aktiverBereich).map((t) => t.id));
    const namen = new Set();
    trainingUebungen.forEach((u) => {
      if (idsAktuell.has(u.training_id) && (u.name || "").trim()) namen.add(u.name.trim());
    });
    return [...namen].sort((a, b) => a.localeCompare(b));
  }

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
  let spielBearbeitenId = null;
  const SPIEL_OHNE_KATEGORIE = "__ohne__";

  function spielMetaZeile(s) {
    const teile = [];
    if (s.teilnehmerzahl) teile.push(`👥 ${escapeHtml(s.teilnehmerzahl)}`);
    if (s.altersgruppe) teile.push(`🎂 ${escapeHtml(s.altersgruppe)}`);
    if (s.dauer) teile.push(`⏱ ${escapeHtml(s.dauer)}`);
    if (s.material) teile.push(`🧰 ${escapeHtml(s.material)}`);
    return teile.join(" · ");
  }

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

    filterBereich.innerHTML = `
      <select id="spiel-kategorie-filter" onchange="spielFilterAendern(this.value)">
        <option value="alle" ${spielAktiveKategorie === "alle" ? "selected" : ""}>Alle Kategorien (${spiele.length})</option>
        ${kategorien.map((k) => {
          const anzahl = spiele.filter((s) => s.kategorie === k).length;
          return `<option value="${escapeAttr(k)}" ${spielAktiveKategorie === k ? "selected" : ""}>${escapeHtml(k)} (${anzahl})</option>`;
        }).join("")}
        ${ohneKategorieAnzahl > 0 ? `<option value="${SPIEL_OHNE_KATEGORIE}" ${spielAktiveKategorie === SPIEL_OHNE_KATEGORIE ? "selected" : ""}>Ohne Kategorie (${ohneKategorieAnzahl})</option>` : ""}
      </select>`;

    let gefiltert = spiele;
    if (spielAktiveKategorie === SPIEL_OHNE_KATEGORIE) gefiltert = spiele.filter((s) => !s.kategorie);
    else if (spielAktiveKategorie !== "alle") gefiltert = spiele.filter((s) => s.kategorie === spielAktiveKategorie);

    if (gefiltert.length === 0) {
      listeBereich.innerHTML = '<p class="empty-text">Noch keine Spiele hinterlegt.</p>';
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

    listeBereich.innerHTML = kategorienSortiert.map((kat) => {
      const items = gruppen[kat].sort((a, b) => a.titel.localeCompare(b.titel));
      const ueberschrift = kat === SPIEL_OHNE_KATEGORIE ? "Ohne Kategorie" : kat;
      const zeilen = items.map((s) => {
        const dateien = spieleDateien.filter((d) => d.spiel_id === s.id);

        if (spielBearbeitenId === s.id) {
          return `
            <div class="notiz-item">
              <div style="flex:1; display:flex; flex-direction:column; gap:0.4rem;">
                <input type="text" id="spiel-edit-titel-${s.id}" value="${escapeAttr(s.titel)}" placeholder="Titel">
                <input type="text" id="spiel-edit-kategorie-${s.id}" value="${escapeAttr(s.kategorie || "")}" placeholder="Kategorie" list="spiel-kategorie-liste">
                <div class="row" style="flex-wrap:wrap;">
                  <input type="text" id="spiel-edit-teilnehmerzahl-${s.id}" value="${escapeAttr(s.teilnehmerzahl || "")}" placeholder="Teilnehmerzahl" style="max-width:12rem;">
                  <input type="text" id="spiel-edit-altersgruppe-${s.id}" value="${escapeAttr(s.altersgruppe || "")}" placeholder="Altersgruppe" style="max-width:12rem;">
                  <input type="text" id="spiel-edit-dauer-${s.id}" value="${escapeAttr(s.dauer || "")}" placeholder="Dauer" style="max-width:10rem;">
                  <input type="text" id="spiel-edit-material-${s.id}" value="${escapeAttr(s.material || "")}" placeholder="Material">
                </div>
                <textarea id="spiel-edit-beschreibung-${s.id}" rows="3" placeholder="Spielbeschreibung">${escapeHtml(s.beschreibung || "")}</textarea>
                <div>
                  <button class="btn-primary" onclick="spielBearbeitenSpeichern('${s.id}')">Speichern</button>
                  <button class="link-btn" onclick="spielBearbeitenAbbrechen()">Abbrechen</button>
                </div>
              </div>
            </div>`;
        }

        const dateiZeilen = dateien.map((d) => {
          const hochgeladen = new Date(d.hochgeladen_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
          return `
                <div>📎 <span onclick="event.stopPropagation(); spielDateiOeffnen('${d.id}')" style="text-decoration:underline; cursor:pointer;">${escapeHtml(d.datei_name)}</span>
                  <span style="opacity:0.65;">(${hochgeladen})</span>
                  <span onclick="event.stopPropagation(); spielDateiLoeschen('${d.id}')" style="cursor:pointer; margin-left:0.3rem;" title="Datei entfernen">×</span></div>`;
        }).join("");

        const meta = spielMetaZeile(s);

        return `
          <div class="notiz-item">
            <div style="flex:1; cursor:pointer;" onclick="spielBearbeitenStart('${s.id}')">
              <span class="notiz-text">${escapeHtml(s.titel)}</span>
              ${meta ? `<div class="notiz-meta" style="margin-top:0.2rem;">${meta}</div>` : ""}
              ${s.beschreibung ? `<div class="notiz-meta" style="margin-top:0.3rem; white-space:pre-wrap;">${escapeHtml(s.beschreibung)}</div>` : ""}
              <div class="notiz-meta" style="margin-top:0.3rem;">
                ${dateiZeilen}
                <label style="text-decoration:underline; cursor:pointer;" onclick="event.stopPropagation();">📎 Datei hinzufügen<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none;" onchange="spielDateiHinzufuegen('${s.id}', this)"></label>
              </div>
            </div>
            <button class="task-delete" onclick="spielLoeschen('${s.id}')">×</button>
          </div>`;
      }).join("");
      return `<h3 style="margin-top:1.2rem; margin-bottom:0.4rem; font-size:0.95rem; color:var(--ink-dim);">${escapeHtml(ueberschrift)}</h3><div class="notiz-list">${zeilen}</div>`;
    }).join("");
  }

  window.spielFilterAendern = function(wert) {
    spielAktiveKategorie = wert;
    renderSpiele();
  };

  document.getElementById("btn-spiel-hinzufuegen").addEventListener("click", spielHinzufuegen);

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

  window.spielBearbeitenStart = function(id) {
    spielBearbeitenId = id;
    renderSpiele();
  };

  window.spielBearbeitenAbbrechen = function() {
    spielBearbeitenId = null;
    renderSpiele();
  };

  window.spielBearbeitenSpeichern = async function(id) {
    const titel = document.getElementById(`spiel-edit-titel-${id}`).value.trim();
    if (!titel) return;
    const kategorie = document.getElementById(`spiel-edit-kategorie-${id}`).value.trim() || null;
    const beschreibung = document.getElementById(`spiel-edit-beschreibung-${id}`).value.trim() || null;
    const teilnehmerzahl = document.getElementById(`spiel-edit-teilnehmerzahl-${id}`).value.trim() || null;
    const altersgruppe = document.getElementById(`spiel-edit-altersgruppe-${id}`).value.trim() || null;
    const dauer = document.getElementById(`spiel-edit-dauer-${id}`).value.trim() || null;
    const material = document.getElementById(`spiel-edit-material-${id}`).value.trim() || null;
    await api("spiel_aktualisieren", { id, titel, kategorie, beschreibung, teilnehmerzahl, altersgruppe, dauer, material });
    spielBearbeitenId = null;
    await ladeDaten();
  };

  window.spielLoeschen = async function(id) {
    if (!confirm("Dieses Spiel inklusive hinterlegter Dateien wirklich löschen?")) return;
    await api("spiel_loeschen", { id });
    await ladeDaten();
  };

  window.spielDateiOeffnen = async function(dateiId) {
    try {
      const res = await api("spiel_datei_url", { datei_id: dateiId });
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      alert("Datei konnte nicht geöffnet werden: " + e.message);
    }
  };

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
        <button class="task-delete" onclick="linkLoeschen('${l.id}')">×</button>
      </div>`;
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

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

  window.linkLoeschen = async function(id) {
    await api("link_loeschen", { id });
    await ladeDaten();
  };

  // ==========================================================
  // Reflexion
  // ==========================================================
  document.getElementById("reflex-datum").value = heuteISO();
  let reflexBearbeiteterId = null;

  function formatDatumLang(iso) {
    const [j, m, t] = iso.split("-");
    const monate = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
    return `${parseInt(t,10)}. ${monate[parseInt(m,10)-1]} ${j}`;
  }

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
            <button class="task-snooze" style="padding:0.2rem 0.5rem;" onclick="reflexionBearbeitenStart('${r.id}')" title="Bearbeiten">✎</button>
            <button class="task-delete" style="font-size:1rem;" onclick="reflexionLoeschen('${r.id}')">×</button>
          </span>
        </div>
        <div class="reflex-text">${escapeHtml(r.text)}</div>
      </div>`).join("");
  }

  function reflexFormZuruecksetzen() {
    reflexBearbeiteterId = null;
    document.getElementById("reflex-text").value = "";
    document.getElementById("reflex-datum").value = heuteISO();
    document.getElementById("btn-reflex-hinzufuegen").textContent = "Eintragen";
    document.getElementById("btn-reflex-abbrechen").classList.add("hidden");
  }

  window.reflexionBearbeitenStart = function(id) {
    const r = reflexionen.find((rr) => rr.id === id);
    if (!r) return;
    reflexBearbeiteterId = id;
    document.getElementById("reflex-datum").value = r.datum;
    document.getElementById("reflex-text").value = r.text;
    document.getElementById("btn-reflex-hinzufuegen").textContent = "Speichern";
    document.getElementById("btn-reflex-abbrechen").classList.remove("hidden");
    document.getElementById("reflex-text").scrollIntoView({ behavior: "smooth", block: "center" });
  };

  document.getElementById("btn-reflex-hinzufuegen").addEventListener("click", reflexSpeichern);
  document.getElementById("btn-reflex-abbrechen").addEventListener("click", reflexFormZuruecksetzen);

  async function reflexSpeichern() {
    const text = document.getElementById("reflex-text").value.trim();
    if (!text) return;
    const datum = document.getElementById("reflex-datum").value || heuteISO();

    if (reflexBearbeiteterId) {
      await api("reflexion_aktualisieren", { id: reflexBearbeiteterId, text, datum });
    } else {
      await api("reflexion_hinzufuegen", { text, datum, bereich: aktiverBereich });
    }
    reflexFormZuruecksetzen();
    await ladeDaten();
  }

  window.reflexionLoeschen = async function(id) {
    if (reflexBearbeiteterId === id) reflexFormZuruecksetzen();
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
  function fT() {
    return termine.map((t) => ({
      Titel: t.titel,
      Datum: t.datum,
      Beginn: t.uhrzeit ? t.uhrzeit.slice(0, 5) : "",
      Ende: t.ende_uhrzeit ? t.ende_uhrzeit.slice(0, 5) : "",
      Notiz: t.notiz || "",
    }));
  }
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
  function fR() {
    return reflexionen.map((r) => ({
      Datum: r.datum,
      Text: r.text,
    }));
  }
  function fE() {
    return einkaufsliste.map((e) => ({
      Artikel: e.text,
      Erledigt: e.erledigt ? "Ja" : "Nein",
      "Erstellt am": e.erstellt_am ? e.erstellt_am.slice(0, 10) : "",
    }));
  }
  function fV() {
    return verlauf.map((v) => ({
      Bereich: BEREICH_KNOPF_TEXT[bereichVon(v)] || bereichVon(v),
      Zeitpunkt: v.erstellt_am ? new Date(v.erstellt_am).toLocaleString("de-DE") : "",
      Kategorie: v.kategorie,
      Aktion: v.aktion,
      Beschreibung: v.beschreibung || "",
    }));
  }
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

  const EXPORT_KATEGORIEN = [
    { id: "aufgaben", name: "Aufgaben", daten: fA },
    { id: "termine", name: "Termine", daten: fT },
    { id: "notizen", name: "Notizen", daten: fN },
    { id: "links", name: "Links", daten: fL },
    { id: "reflexion", name: "Reflexion", daten: fR },
    { id: "einkauf", name: "Einkaufsliste", daten: fE },
    { id: "rezepte", name: "Rezepte", daten: fRz },
    { id: "verlauf", name: "Verlauf", daten: fV },
    { id: "ziele", name: "Ziele", daten: fZ },
  ];

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

  function tabelleAlsHtml(titel, daten) {
    if (daten.length === 0) return `<h2>${escapeHtml(titel)}</h2><p>Keine Einträge.</p>`;
    const spalten = Object.keys(daten[0]);
    let html = `<h2>${escapeHtml(titel)}</h2><table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px;">`;
    html += `<tr>${spalten.map((s) => `<th style="background:#eee;text-align:left;">${escapeHtml(s)}</th>`).join("")}</tr>`;
    for (const row of daten) {
      html += `<tr>${spalten.map((s) => `<td>${escapeHtml(String(row[s] ?? ""))}</td>`).join("")}</tr>`;
    }
    html += `</table>`;
    return html;
  }

  function wordDokument(titel, innerHtml) {
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${escapeHtml(titel)}</title></head>
      <body>${innerHtml}</body></html>`;
  }

  window.exportExcel = function(kategorieId) {
    if (typeof XLSX === "undefined") { alert("Export-Bibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen."); return; }
    const k = EXPORT_KATEGORIEN.find((k) => k.id === kategorieId);
    const daten = k.daten();
    const ws = XLSX.utils.json_to_sheet(daten.length ? daten : [{ Hinweis: "Keine Einträge" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, k.name.slice(0, 31));
    XLSX.writeFile(wb, `${k.name}.xlsx`);
  };

  window.exportWord = function(kategorieId) {
    const k = EXPORT_KATEGORIEN.find((k) => k.id === kategorieId);
    const html = wordDokument(k.name, tabelleAlsHtml(k.name, k.daten()));
    downloadDatei(`${k.name}.doc`, html, "application/msword");
  };

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

  window.exportAllesWord = function() {
    const teile = EXPORT_KATEGORIEN.map((k) => tabelleAlsHtml(k.name, k.daten())).join("<br>");
    const html = wordDokument("Dashboard Export", `<h1>Dashboard Export</h1>${teile}`);
    downloadDatei("dashboard-export.doc", html, "application/msword");
  };

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
        <div class="task">
          <button class="task-check" onclick="einkaufUmschalten('${e.id}')"></button>
          <div class="task-info"><span class="task-titel">${escapeHtml(e.text)}</span></div>
          <button class="task-delete" onclick="einkaufLoeschen('${e.id}')">×</button>
        </div>`).join("") + '</div>';

      if (erledigt.length > 0) {
        html += `<div class="project-heading" style="margin-top:1.4rem;">Erledigt (${erledigt.length})</div><div class="task-list">` +
          erledigt.map((e) => `
            <div class="task">
              <button class="task-check done" onclick="einkaufUmschalten('${e.id}')">✓</button>
              <div class="task-info"><span class="task-titel done">${escapeHtml(e.text)}</span></div>
              <button class="task-delete" onclick="einkaufLoeschen('${e.id}')">×</button>
            </div>`).join("") + '</div>';
      }
    }
    document.getElementById("einkauf-bereich").innerHTML = html;
  }

  document.getElementById("btn-einkauf-hinzufuegen").addEventListener("click", einkaufHinzufuegen);
  document.getElementById("neuer-einkauf").addEventListener("keydown", (e) => {
    if (e.key === "Enter") einkaufHinzufuegen();
  });

  async function einkaufHinzufuegen() {
    const text = document.getElementById("neuer-einkauf").value.trim();
    if (!text) return;
    await api("einkauf_hinzufuegen", { text, bereich: aktiverBereich });
    document.getElementById("neuer-einkauf").value = "";
    await ladeDaten();
  }

  window.einkaufUmschalten = async function(id) {
    await api("einkauf_umschalten", { id });
    await ladeDaten();
  };

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
  function monatStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function jahrStart(d) { return new Date(d.getFullYear(), 0, 1); }

  function periodStart(typ, anker) {
    if (typ === "woche") return wochenStart(anker);
    if (typ === "monat") return monatStart(anker);
    return jahrStart(anker);
  }
  function periodEnd(typ, start) {
    if (typ === "woche") {
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return end;
    }
    if (typ === "monat") return new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return new Date(start.getFullYear(), 11, 31);
  }
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
  function planLabel(typ, start, end) {
    if (typ === "jahr") return String(start.getFullYear());
    if (typ === "monat") return MONATSNAMEN[start.getMonth()] + " " + start.getFullYear();
    const fmt = (d) => d.getDate() + "." + (d.getMonth() + 1) + ".";
    return "Woche vom " + fmt(start) + "–" + fmt(end) + " " + end.getFullYear();
  }
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

  window.zielLoeschen = async function(id) {
    await api("ziel_loeschen", { id });
    await ladeDaten();
  };

  window.zielSchrittHinzufuegen = async function(zielId, inputEl) {
    const text = inputEl.value.trim();
    if (!text) return;
    await api("ziel_schritt_hinzufuegen", { ziel_id: zielId, text });
    await ladeDaten();
  };

  window.heuteFreiOeffnen = function() {
    freiTag = new Date();
    tabWechseln("frei");
  };

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

  window.zielKarteUmschalten = function(id) {
    if (zielExpandiert.has(id)) zielExpandiert.delete(id);
    else zielExpandiert.add(id);
    renderPlanung();
  };

  window.zielSchrittUmschalten = async function(id) {
    await api("ziel_schritt_umschalten", { id });
    await ladeDaten();
  };

  window.zielSchrittLoeschen = async function(id) {
    await api("ziel_schritt_loeschen", { id });
    await ladeDaten();
  };

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
          <button class="task-delete" onclick="zielLoeschen('${z.id}')">×</button>
        </div>
        ${parent ? `<div class="ziel-uebergeordnet">→ ${escapeHtml(parent.titel)}</div>` : ""}
        <div class="ziel-details ${offen ? "" : "hidden"}">
          <div class="ziel-schritte">
            ${schritte.map((s) => `
              <div class="ziel-schritt">
                <button class="task-check ${s.erledigt ? "done" : ""}" onclick="zielSchrittUmschalten('${s.id}')">${s.erledigt ? "✓" : ""}</button>
                <span class="ziel-schritt-text ${s.erledigt ? "done" : ""}">${escapeHtml(s.text)}</span>
                <button class="task-delete" style="margin-left:auto;" onclick="zielSchrittLoeschen('${s.id}')">×</button>
              </div>`).join("")}
          </div>
          <div class="ziel-schritt-add">
            <input type="text" placeholder="Schritt hinzufügen …" onkeydown="if(event.key==='Enter') zielSchrittHinzufuegen('${z.id}', this)">
            <button onclick="zielSchrittHinzufuegen('${z.id}', this.previousElementSibling)">+</button>
          </div>
        </div>
      </div>`;
  }

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
  // Finanzen-Modul: Fixkosten + Sonderausgaben
  // ==========================================================
  function finEuro(n) {
    return Number(n || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  }
  function finZahl(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  ["fixkosten", "sonderausgaben", "buchungen", "uebersicht"].forEach((t) => {
    document.getElementById("fintyp-" + t).addEventListener("click", () => {
      finTyp = t;
      document.getElementById("fintyp-fixkosten").classList.toggle("active", t === "fixkosten");
      document.getElementById("fintyp-sonderausgaben").classList.toggle("active", t === "sonderausgaben");
      document.getElementById("fintyp-buchungen").classList.toggle("active", t === "buchungen");
      document.getElementById("fintyp-uebersicht").classList.toggle("active", t === "uebersicht");
      document.getElementById("fin-fixkosten-bereich").classList.toggle("hidden", t !== "fixkosten");
      document.getElementById("fin-sonderausgaben-bereich").classList.toggle("hidden", t !== "sonderausgaben");
      document.getElementById("fin-buchungen-bereich").classList.toggle("hidden", t !== "buchungen");
      document.getElementById("fin-uebersicht-bereich").classList.toggle("hidden", t !== "uebersicht");
      renderFinanzen();
    });
  });

  function renderFinanzen() {
    if (finTyp === "fixkosten") renderFinFixkosten();
    else if (finTyp === "sonderausgaben") renderFinSonderausgaben();
    else if (finTyp === "buchungen") renderFinBuchungen();
    else renderFinUebersicht();
  }

  function fixkostenZeileHtml(f, istBearbeitet) {
    const summe = FIN_MONATE.reduce((s, m) => s + finZahl(f[m]), 0);
    if (istBearbeitet) {
      return `
        <tr data-fk-id="${f.id}">
          <td class="fin-bez"><input type="text" id="fk-bez-${f.id}" value="${escapeAttr(f.bezeichnung)}"></td>
          ${FIN_MONATE.map((m) => `<td><input type="number" step="0.01" id="fk-${m}-${f.id}" value="${finZahl(f[m])}"></td>`).join("")}
          <td>${finEuro(summe)}</td>
          <td>
            <button class="fin-loesch-btn" onclick="fixkostenSpeichern('${f.id}')" title="Speichern">✓</button>
            <button class="fin-loesch-btn" onclick="fixkostenBearbeitenAbbrechen()" title="Abbrechen">×</button>
          </td>
        </tr>`;
    }
    return `
      <tr data-fk-id="${f.id}">
        <td class="fin-bez" style="cursor:pointer;" onclick="fixkostenBearbeitenStart('${f.id}')">${escapeHtml(f.bezeichnung)}</td>
        ${FIN_MONATE.map((m) => `<td>${finZahl(f[m]) ? finEuro(f[m]) : "–"}</td>`).join("")}
        <td><strong>${finEuro(summe)}</strong></td>
        <td><button class="fin-loesch-btn" onclick="fixkostenLoeschen('${f.id}')" title="Löschen">×</button></td>
      </tr>`;
  }

  function fixkostenTabelleHtml(typ, titel) {
    const zeilen = fixkostenAktuell().filter((f) => f.typ === typ);
    const summenProMonat = FIN_MONATE.map((m) => zeilen.reduce((s, f) => s + finZahl(f[m]), 0));
    const summeGesamt = summenProMonat.reduce((s, x) => s + x, 0);
    return `
      <div class="fin-tabelle-wrap">
        <table class="fin-tabelle">
          <thead>
            <tr>
              <th class="fin-bez-th">${titel}</th>
              ${FIN_MONATSNAMEN_KURZ.map((m) => `<th>${m}</th>`).join("")}
              <th>Summe</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${zeilen.length
              ? zeilen.map((f) => fixkostenZeileHtml(f, f.id === finBearbeitetesFixkosten)).join("")
              : `<tr><td class="fin-bez" colspan="14"><span class="empty-text">Noch keine Einträge.</span></td></tr>`}
            <tr class="fin-tabelle-summe">
              <td class="fin-bez">Summe ${titel}</td>
              ${summenProMonat.map((s) => `<td>${finEuro(s)}</td>`).join("")}
              <td>${finEuro(summeGesamt)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  function renderFinFixkosten() {
    const el = document.getElementById("fin-fixkosten-bereich");
    el.innerHTML = `
      ${fixkostenTabelleHtml("ausgabe", "Fixkosten")}
      ${fixkostenTabelleHtml("einnahme", "Feste Einnahmen")}

      <button class="link-btn" id="toggle-fixkosten-form">▸ Neue Position anlegen</button>
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
  }

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

  window.fixkostenBearbeitenStart = function (id) {
    finBearbeitetesFixkosten = id;
    renderFinFixkosten();
  };
  window.fixkostenBearbeitenAbbrechen = function () {
    finBearbeitetesFixkosten = null;
    renderFinFixkosten();
  };
  window.fixkostenSpeichern = async function (id) {
    const bezeichnung = document.getElementById("fk-bez-" + id).value.trim();
    if (!bezeichnung) return;
    const zahlung = { id, bezeichnung };
    FIN_MONATE.forEach((m) => { zahlung[m] = document.getElementById("fk-" + m + "-" + id).value; });
    await api("fixkosten_aktualisieren", zahlung);
    finBearbeitetesFixkosten = null;
    await ladeDaten();
    renderFinanzen();
  };
  window.fixkostenLoeschen = async function (id) {
    await api("fixkosten_loeschen", { id });
    await ladeDaten();
    renderFinanzen();
  };

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
          <button class="fin-loesch-btn" onclick="sonderausgabeBearbeitenAbbrechen()" title="Abbrechen">×</button>
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
        <button class="fin-loesch-btn" onclick="sonderausgabeLoeschen('${s.id}')" title="Löschen">×</button>
      </div>`;
  }

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

  window.sonderausgabeBearbeitenStart = function (id) {
    finBearbeiteteSonderausgabe = id;
    renderFinSonderausgaben();
  };
  window.sonderausgabeBearbeitenAbbrechen = function () {
    finBearbeiteteSonderausgabe = null;
    renderFinSonderausgaben();
  };
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

  window.buchungTypWaehlen = function (typ) {
    buchungTypAusgewaehlt = typ;
    buchungKategorieAusgewaehlt = (typ === "einnahme" ? FIN_KAT_EINNAHME : FIN_KAT_AUSGABE)[0];
    renderFinBuchungen();
  };
  window.buchungKategorieWaehlen = function (kat) {
    buchungKategorieAusgewaehlt = kat;
    renderFinBuchungen();
  };
  window.finBuchungMonatVerschieben = function (delta) {
    finBuchMonat += delta;
    if (finBuchMonat < 1) { finBuchMonat = 12; finBuchJahr--; }
    if (finBuchMonat > 12) { finBuchMonat = 1; finBuchJahr++; }
    renderFinBuchungen();
  };

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
                <button class="fin-loesch-btn" onclick="buchungBearbeitenAbbrechen()" title="Abbrechen">×</button>
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
              <button class="fin-loesch-btn" onclick="buchungLoeschen('${b.id}')" title="Löschen">×</button>
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

      <button class="fin-csv-btn" id="btn-csv-import">⇪ CSV importieren</button>
      <input type="file" id="csv-import-input" accept=".csv" class="hidden">

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
        <div class="cal-nav"><button onclick="finBuchungMonatVerschieben(-1)">‹</button></div>
        <h2>${MONATSNAMEN_FIN[finBuchMonat - 1]} ${finBuchJahr}${istAktuellerMonat ? " · aktuell" : ""}</h2>
        <div class="cal-nav"><button onclick="finBuchungMonatVerschieben(1)">›</button></div>
      </div>

      ${listeHtml}
    `;

    document.getElementById("btn-buchung-speichern").addEventListener("click",
      finBearbeiteteBuchung ? () => buchungAktualisieren(finBearbeiteteBuchung) : buchungHinzufuegen);

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
        btn.textContent = "⇪ CSV importieren";
        btn.disabled = false;
      }
    });
  }

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

  window.buchungBearbeitenStart = function (id) {
    finBearbeiteteBuchung = id;
    renderFinBuchungen();
  };
  window.buchungBearbeitenAbbrechen = function () {
    finBearbeiteteBuchung = null;
    renderFinBuchungen();
  };
  window.buchungAktualisieren = async function (id) {
    const datum = document.getElementById("edit-buchung-datum-" + id).value;
    const betrag = document.getElementById("edit-buchung-betrag-" + id).value;
    const typ = document.getElementById("edit-buchung-typ-" + id).value;
    const kategorie = document.getElementById("edit-buchung-kategorie-" + id).value.trim();
    const notiz = document.getElementById("edit-buchung-notiz-" + id).value.trim();
    await api("buchung_aktualisieren", { id, datum, betrag, typ, kategorie, notiz });
    finBearbeiteteBuchung = null;
    await ladeDaten();
    renderFinanzen();
  };
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

  function parseCsvBetrag(raw) {
    let s = (raw || "").trim();
    if (!s) return null;
    if (s.includes(".") && s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (s.includes(",")) s = s.replace(",", ".");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

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

    let meldung = "Import abgeschlossen\n\n" +
      `Neue Ausgaben: ${ergebnis.importiert_ausgaben}\n` +
      `Neue Einnahmen: ${ergebnis.importiert_einnahmen}\n` +
      `Bereits vorhanden (Duplikate): ${ergebnis.uebersprungen_duplikate}\n` +
      `Als Fixkosten erkannt & übersprungen: ${ergebnis.uebersprungen_fixkosten}\n` +
      (nichtLesbar ? `Nicht lesbare Zeilen: ${nichtLesbar}\n` : "");

    const treffer = Object.entries(ergebnis.fixkosten_treffer || {});
    if (treffer.length) {
      treffer.sort((a, b) => b[1] - a[1]);
      meldung += "\nErkannte Fixkosten (Beispiele):\n" + treffer.slice(0, 8).map(([k, v]) => `  ${k}: ${v}x`).join("\n");
    }
    alert(meldung);

    await ladeDaten();

    const kandidaten = erkennKandidatenFin(buchungenAktuell());
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

  function finNormalizeKey(notiz) {
    let text = (notiz || "").toUpperCase();
    FIN_NOISE_WORDS.forEach((w) => { text = text.split(w).join(" "); });
    text = text.replace(/[0-9]+/g, " ");
    text = text.replace(/[^A-ZÄÖÜẞ\s]/g, " ");
    text = text.replace(/\s+/g, " ").trim();
    return text.split(" ").filter(Boolean).slice(0, 4).join(" ");
  }

  function finMedian(zahlen) {
    const sortiert = [...zahlen].sort((a, b) => a - b);
    const mitte = Math.floor(sortiert.length / 2);
    return sortiert.length % 2 !== 0 ? sortiert[mitte] : (sortiert[mitte - 1] + sortiert[mitte]) / 2;
  }

  function erkennKandidatenFin(alleBuchungen, minMonate = 2, varianzSchwelle = 0.2) {
    const gruppen = new Map();
    for (const b of alleBuchungen) {
      const schluesselText = finNormalizeKey(b.notiz);
      if (!schluesselText) continue;
      const key = (b.typ || "ausgabe") + "|" + schluesselText;
      if (!gruppen.has(key)) gruppen.set(key, []);
      gruppen.get(key).push(b);
    }

    const kandidaten = [];
    for (const [key, eintraege] of gruppen.entries()) {
      const typ = key.split("|")[0];
      const monate = new Set(eintraege.map((e) => (e.datum || "").slice(0, 7)).filter(Boolean));
      if (monate.size < minMonate) continue;

      const betraege = eintraege.map((e) => finZahl(e.betrag)).filter((b) => b);
      if (!betraege.length) continue;
      const median = finMedian(betraege);
      const spanne = median ? (Math.max(...betraege) - Math.min(...betraege)) / median : 0;

      const notizCounts = new Map();
      eintraege.forEach((e) => {
        const n = (e.notiz || "").trim();
        notizCounts.set(n, (notizCounts.get(n) || 0) + 1);
      });
      let bezeichnungVorschlag = "";
      let bestCount = 0;
      for (const [n, c] of notizCounts.entries()) {
        if (c > bestCount) { bestCount = c; bezeichnungVorschlag = n; }
      }
      bezeichnungVorschlag = (bezeichnungVorschlag || key).slice(0, 60);

      kandidaten.push({
        typ,
        bezeichnungVorschlag,
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
  let finBuchungenLoeschenNachUebernahme = false; // sicherer Default: nicht automatisch löschen

  function zeigeErkennungsModal(kandidaten) {
    finErkennungKandidaten = kandidaten;
    const overlay = document.createElement("div");
    overlay.className = "fin-modal-overlay";
    overlay.id = "fin-erkennung-overlay";
    document.body.appendChild(overlay);
    renderErkennungsModal();
  }

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
                  <input type="number" step="0.01" id="fin-kand-betrag-${i}" value="${k.betragMedian}" style="width:7rem;">
                </div>
                <div class="fin-kandidat-meta">
                  ${k.anzahlBuchungen}× über ${k.anzahlMonate} Monate${k.variabel ? " · Betrag schwankt" : ""}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="fin-modal-fuss">
          <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; color:var(--ink-dim);">
            <input type="checkbox" id="fin-erkennung-loeschen" ${finBuchungenLoeschenNachUebernahme ? "checked" : ""}>
            Einzelbuchungen danach löschen
          </label>
          <div style="display:flex; gap:0.5rem;">
            <button class="link-btn" id="fin-erkennung-verwerfen">Verwerfen</button>
            <button class="btn-primary" id="fin-erkennung-uebernehmen">Übernehmen</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("fin-erkennung-loeschen").addEventListener("change", (e) => {
      finBuchungenLoeschenNachUebernahme = e.target.checked;
    });
    document.getElementById("fin-erkennung-verwerfen").addEventListener("click", schliesseErkennungsModal);
    document.getElementById("fin-erkennung-uebernehmen").addEventListener("click", erkennungUebernehmen);
  }

  window.finKandidatUmschalten = function (i) {
    finErkennungKandidaten[i].ausgewaehlt = !finErkennungKandidaten[i].ausgewaehlt;
  };

  function schliesseErkennungsModal() {
    const overlay = document.getElementById("fin-erkennung-overlay");
    if (overlay) overlay.remove();
    finErkennungKandidaten = [];
    renderFinanzen();
  }

  async function erkennungUebernehmen() {
    // Haken-Zustand direkt aus dem Formular lesen statt aus der separaten
    // Variable – die wurde nur über das change-Event aktualisiert, was
    // unzuverlässig war und dazu führte, dass Buchungen trotz deaktiviertem
    // Haken gelöscht wurden.
    const loeschenCheckbox = document.getElementById("fin-erkennung-loeschen");
    const buchungenLoeschen = loeschenCheckbox ? loeschenCheckbox.checked : finBuchungenLoeschenNachUebernahme;

    const ausgewaehlte = finErkennungKandidaten.filter((k) => k.ausgewaehlt);
    let angelegt = 0;
    let geloescht = 0;

    for (let i = 0; i < finErkennungKandidaten.length; i++) {
      const k = finErkennungKandidaten[i];
      if (!k.ausgewaehlt) continue;
      const bezeichnung = document.getElementById("fin-kand-bez-" + i).value.trim();
      const typ = document.getElementById("fin-kand-typ-" + i).value;
      const betrag = document.getElementById("fin-kand-betrag-" + i).value;
      if (!bezeichnung) continue;

      const zahlung = { bezeichnung, typ };
      FIN_MONATE.forEach((m) => { zahlung[m] = betrag; });
      await api("fixkosten_hinzufuegen", { ...zahlung, bereich: aktiverBereich });
      angelegt++;

      if (buchungenLoeschen) {
        for (const id of k.buchungIds) {
          await api("buchung_loeschen", { id });
          geloescht++;
        }
      }
    }

    schliesseErkennungsModal();
    await ladeDaten();
    renderFinanzen();
    alert(`${angelegt} Fixkosten-Position(en) angelegt` + (geloescht ? `, ${geloescht} Einzelbuchung(en) gelöscht.` : "."));
  }

  // ==========================================================
  // Finanzen-Modul: Jahresübersicht (Kontostand-Kette + Charts)
  // ==========================================================
  window.finUebJahrVerschieben = function (delta) {
    finUebJahr += delta;
    renderFinUebersicht();
  };

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
        <div class="cal-nav"><button onclick="finUebJahrVerschieben(-1)">‹</button></div>
        <h2>${finUebJahr}</h2>
        <div class="cal-nav"><button onclick="finUebJahrVerschieben(1)">›</button></div>
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
          <span><span class="fin-legende-punkt" style="background:#2f9e6f;"></span>Einnahmen</span>
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
  // Finanzen-Modul: Massenlöschung (Buchungen / Fixkosten / Sonderausgaben)
  // ==========================================================
  let finMlVorschauAktuell = null; // merkt sich die zuletzt geprüften Filter, damit "Löschen" nur nach frischer Vorschau geht

  function finMlAlleKategorien() {
    return Array.from(new Set([...FIN_KAT_AUSGABE, ...FIN_KAT_EINNAHME])).sort((a, b) => a.localeCompare(b, "de"));
  }

  function finMassenloeschungHtml() {
    const kategorien = finMlAlleKategorien();
    return `
      <details class="fin-massenloeschung" id="fin-ml-details">
        <summary>⚠ Daten löschen (Buchungen / Fixkosten / Sonderausgaben)</summary>
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

  function finMlAusgewaehlteBereiche() {
    const bereiche = [];
    if (document.getElementById("fin-ml-bereich-buchungen").checked) bereiche.push("buchungen");
    if (document.getElementById("fin-ml-bereich-fixkosten").checked) bereiche.push("fixkosten");
    if (document.getElementById("fin-ml-bereich-sonderausgaben").checked) bereiche.push("sonderausgaben");
    return bereiche;
  }

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
    ["fruehstueck", "Frühstück", "🌅"],
    ["mittag", "Mittag", "🍽️"],
    ["abend", "Abend", "🌙"],
    ["snack", "Snacks", "🍎"],
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

  function ernAktDatum() { return ernDatum || heuteISO(); }
  function ernGramm(v) { return v === null || v === undefined ? "–" : ernZahl(v) + " g"; }

  function ernZahl(v, stellen = 1) {
    if (v === null || v === undefined || v === "") return "–";
    return Number(v).toLocaleString("de-DE", { maximumFractionDigits: stellen });
  }

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

  function ernSumme(liste) {
    const s = { kcal: 0, eiweiss: 0, fett: 0, kohlenhydrate: 0, ballaststoffe: 0, luecken: false };
    for (const e of liste) {
      s.kcal += Number(e.kcal) || 0;
      for (const f of ["eiweiss", "fett", "kohlenhydrate", "ballaststoffe"]) {
        if (e[f] === null || e[f] === undefined) s.luecken = true;
        else s[f] += Number(e[f]);
      }
    }
    return s;
  }

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
  window.ernMahlzeitKlappen = function(schluessel) {
    if (ernZugeklappt.has(schluessel)) ernZugeklappt.delete(schluessel); else ernZugeklappt.add(schluessel);
    ernZugeklapptSpeichern();
    renderErnaehrung();
  };

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
             <span class="ern-mahlzeit-titel">${icon} ${name}</span>
             <span class="ern-mahlzeit-kcal">${kcalText}</span>
           </button>`
        : `<h3>${icon} ${name}</h3>`;
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
        <button class="task-edit-btn" onclick="ernBearbeiten('${e.id}')" aria-label="Bearbeiten">✎</button>
        <button class="task-delete" onclick="ernLoeschen('${e.id}')" aria-label="Löschen">×</button>
      </div>`;
  }

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
         <label class="ern-feld">KH g<input type="number" id="ern-edit-kh" min="0" step="any" inputmode="decimal" value="${e.kohlenhydrate ?? ""}"></label>`;
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
        ⧉ Wie ${tag} <span class="notiz-meta">· ${v.anzahl} ${v.anzahl === 1 ? "Eintrag" : "Einträge"} · ${ernZahl(v.kcal, 0)} kcal</span>
      </button>`;
  }

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
      html += `<p class="ern-kop-hinweis">⚠️ ${gefuellt.map((k) => ERN_MAHLZEIT_NAME[k]).join(", ")} ${gefuellt.length === 1 ? "hat" : "haben"} schon Einträge – die kopierten kommen dazu.</p>`;
    }
    vorschauEl.innerHTML = html;
    btn.disabled = !zielGeladen || ernKopLaeuft;
    btn.textContent = `${anzahl} ${anzahl === 1 ? "Eintrag" : "Einträge"} kopieren`;
  }

  window.ernKopNeu = function() { ernKopCache = {}; ernKopFehler = ""; ernKopRendern(); };

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
    return `
      <button class="start-kachel mod-ernaehrung" onclick="ernStartKachelKlick()">
        <span class="start-kachel-zahl">${zahl}</span>
        <span class="start-kachel-label">${label}</span>
      </button>`;
  }

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

  window.ernWocheTag = function(iso) {
    ernDatumSetzen(iso);
    document.getElementById("ern-summe").scrollIntoView({ block: "start", behavior: "smooth" });
  };
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

  function ernWert(v) {
    // leer statt 0, wenn kein Wert vorliegt; sonst echte Zahl (für Excel)
    return v === null || v === undefined || v === "" ? "" : Math.round(Number(v) * 10) / 10;
  }

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
        "Eiweiß (g)": ernWert(s.eiweiss),
        "Ziel Eiweiß (g)": z ? Math.round(z.eiweiss) : "",
        "Fett (g)": ernWert(s.fett),
        "Kohlenhydrate (g)": ernWert(s.kohlenhydrate),
        "Ballaststoffe (g)": ernWert(s.ballaststoffe),
        "Werte unvollständig": s.luecken ? "ja" : "",
        "Ziel-Einstellung": z && z.profil ? ernZielKurz(z.profil) : "",
      };
    });

    const zeilenGewicht = gewichte.map((g) => ({ Datum: g.datum, "Gewicht (kg)": ernWert(g.gewicht_kg) }));

    const info = [
      { Punkt: "Zeitraum", Wert: `${datumDe(von)} bis ${datumDe(bis)}` },
      { Punkt: "Erstellt", Wert: new Date().toLocaleString("de-DE") },
      { Punkt: "Werte", Wert: "Je Eintrag für die gegessene Menge, so wie beim Eintragen gespeichert. Leere Zelle = kein Wert vorhanden (nicht 0)." },
      { Punkt: "Ziele", Wert: !ernProfil ? "Kein Profil hinterlegt – daher keine Ziele."
        : ernZielVersionen && ernZielVersionen.length
          ? "Je Tag mit den Ziel-Einstellungen, die an diesem Tag galten (Spalte „Ziel-Einstellung“ im Blatt Tage), Mifflin-St Jeor × Aktivität ± Ziel, Gewicht bis zum jeweiligen Tag, Trainings eingerechnet. Geschlecht, Geburtsdatum und Größe: aktueller Stand."
          : "Berechnet mit dem aktuellen Profil (Mifflin-St Jeor × Aktivität ± Ziel, Gewicht bis zum jeweiligen Tag, Trainings eingerechnet). Profil-Historie noch nicht eingerichtet." },
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
    blatt(zeilenEintraege, "Einträge", [11, 11, 40, 10, 8, 10, 8, 16, 16, 18]);
    blatt(zeilenTage, "Tage", [11, 9, 9, 8, 9, 13, 14, 10, 14, 8, 16, 16, 18, 70]);
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

  window.ernNeuLaden = function() { ernGeladenFuer = null; ernFehler = ""; ernProfilFehlgeschlagen = false; ernTagLaden(); };

  window.ernBearbeiten = function(id) { ernBearbeitenId = id; renderErnaehrung(); };
  window.ernBearbeitenAbbrechen = function() { ernBearbeitenId = null; renderErnaehrung(); };

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

  function ernAnsicht(welche) {
    // "suche" | "menge" | "frei"
    document.getElementById("ern-such-bereich").classList.toggle("hidden", welche !== "suche");
    document.getElementById("ern-menge-bereich").classList.toggle("hidden", welche !== "menge");
    document.getElementById("ern-frei-bereich").classList.toggle("hidden", welche !== "frei");
    document.getElementById("ern-eigen-bereich").classList.toggle("hidden", welche !== "eigen");
    document.getElementById("ern-zuordnen-bereich").classList.toggle("hidden", welche !== "zuordnen");
  }

  window.ernHinzuOeffnen = function(mahlzeit) {
    ernHinzuMahlzeit = mahlzeit || ernStandardMahlzeit();
    if (mahlzeit && ernZugeklappt.delete(mahlzeit)) { ernZugeklapptSpeichern(); renderErnaehrung(); }
    const panel = document.getElementById("ern-hinzu");
    panel.classList.remove("hidden");
    ernHinzuTitelAktualisieren();
    ernAuswahl = null;
    ernAnsicht("suche");
    document.getElementById("ern-hinzu-status").textContent = "";
    const suche = document.getElementById("ern-suche");
    suche.value = "";
    ernZuletztZeigen();
    panel.scrollIntoView({ block: "start", behavior: "smooth" });
    suche.focus({ preventScroll: true });
  };

  function ernHinzuSchliessen() {
    document.getElementById("ern-hinzu").classList.add("hidden");
    ernHinzuMahlzeit = null;
    ernAuswahl = null;
  }

  document.getElementById("btn-ern-eintragen-oben").addEventListener("click", () => window.ernHinzuOeffnen(null));
  document.getElementById("ern-hinzu-schliessen").addEventListener("click", ernHinzuSchliessen);
  document.getElementById("ern-hinzu-mahlzeit").addEventListener("change", (e) => {
    ernHinzuMahlzeit = e.target.value;
    ernHinzuTitelAktualisieren();
    if (!document.getElementById("ern-suche").value.trim()) ernZuletztZeigen();
  });

  function ernTrefferZeile(l, i) {
    const zusatz = [l.marke, ernQuelleLabel(l)].filter(Boolean).join(" · ");
    const marke = zusatz ? ` <span class="notiz-meta">(${escapeHtml(zusatz)})</span>` : "";
    return `
      <button class="ern-treffer-zeile" onclick="ernAuswaehlen(${i})">
        <span class="ern-treffer-name">${escapeHtml(l.name)}${marke}</span>
        <span class="notiz-meta">${ernZahl(l.kcal, 0)} kcal · E ${ernZahl(l.eiweiss)} · F ${ernZahl(l.fett)} · KH ${ernZahl(l.kohlenhydrate)} je 100 g${l.letzte_menge ? ` · zuletzt ${ernZahl(l.letzte_menge)} g` : ""}</span>
      </button>`;
  }

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

  window.ernAuswaehlen = function(i) {
    const l = ernListe[i];
    if (!l) return;
    ernAuswahl = l;
    document.getElementById("ern-auswahl-name").textContent = l.marke ? `${l.name} (${l.marke})` : l.name;
    const quelle = ernQuelleLabel(l);
    document.getElementById("ern-auswahl-info").textContent =
      `je 100 g: ${ernZahl(l.kcal, 0)} kcal · Eiweiß ${ernGramm(l.eiweiss)} · Fett ${ernGramm(l.fett)} · KH ${ernGramm(l.kohlenhydrate)}${quelle ? ` · Quelle: ${quelle}` : ""}${l.quelle === "eigen" && l.quell_code ? ` · Barcode ${l.quell_code}` : ""}`;
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

  window.ernMengeSetzen = function(g) {
    document.getElementById("ern-menge").value = g;
    ernVorschau();
  };

  function ernVorschau() {
    const el = document.getElementById("ern-vorschau");
    const g = Number(String(document.getElementById("ern-menge").value).replace(",", "."));
    if (!ernAuswahl || !(g > 0)) { el.textContent = ""; return; }
    const f = g / 100;
    const w = (v) => (v === null || v === undefined ? "–" : ernZahl(Number(v) * f) + " g");
    el.innerHTML = `<strong>${ernZahl(Number(ernAuswahl.kcal) * f, 0)} kcal</strong> · Eiweiß ${w(ernAuswahl.eiweiss)} · Fett ${w(ernAuswahl.fett)} · KH ${w(ernAuswahl.kohlenhydrate)}`;
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
    ["ern-frei-name", "ern-frei-kcal", "ern-frei-eiweiss", "ern-frei-fett", "ern-frei-kh"].forEach((id) => { document.getElementById(id).value = ""; });
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

  async function ernProfilLaden() {
    ernProfilLaedt = true;
    try {
      const res = await api("ernaehrung_profil");
      ernProfil = res.profil;
      ernGewichte = res.gewichte || [];
      ernMet = res.met || [];
      ernZielVersionen = Array.isArray(res.versionen) ? res.versionen : null;
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

  function ernAlterAm(geburt, datum) {
    const [gj, gm, gt] = geburt.split("-").map(Number);
    const [j, m, t] = datum.split("-").map(Number);
    return j - gj - (m < gm || (m === gm && t < gt) ? 1 : 0);
  }

  // Reine Rechnung, damit Formular-Vorschau und Tagesansicht dieselbe nutzen
  function ernBedarfRechnen(p, gewicht, datum, trainingKcal = 0) {
    if (!p || !gewicht || !p.geburtsdatum || !p.geschlecht || !p.groesse_cm) return null;
    const kg = Number(gewicht);
    const alter = ernAlterAm(p.geburtsdatum, datum);
    const grundumsatz = 10 * kg + 6.25 * Number(p.groesse_cm) - 5 * alter + (p.geschlecht === "m" ? 5 : -161);
    const bedarf = grundumsatz * Number(p.pal);
    // Trainingskalorien anteilig aufschlagen (Profil: 0/50/75/100 %)
    const anrechnung = p.training_anrechnung === undefined || p.training_anrechnung === null ? 100 : Number(p.training_anrechnung);
    const trainingZuschlag = trainingKcal * anrechnung / 100;
    const ziel = bedarf + Number(p.ziel_kcal_diff) + trainingZuschlag;
    const eiweiss = kg * Number(p.eiweiss_g_pro_kg);
    const fett = (ziel * Number(p.fett_prozent) / 100) / 9;
    const kh = Math.max(0, (ziel - eiweiss * 4 - fett * 9) / 4);
    return { kg, alter, grundumsatz, bedarf, ziel, eiweiss, fett, kh, trainingZuschlag, anrechnung,
      unterGrundumsatz: ziel - trainingZuschlag < grundumsatz };
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
      gueltig_ab: v.gueltig_ab,
    };
  }

  function ernZiele(datum) {
    const g = ernGewichtFuer(datum);
    const trainings = ernTrainingsAm(datum);
    const summe = trainings.reduce((a, t) => a + (t.kcal || 0), 0);
    const p = ernProfilFuer(datum);
    const r = ernBedarfRechnen(p, g && g.gewicht_kg, datum, summe);
    return r ? { ...r, gewichtDatum: g.datum, trainings, trainingSumme: summe, profil: p } : null;
  }

  // Kurzbeschreibung eines Ziel-Stands, z. B. „Abnehmen −500 · Aktivität 1,6 · …“
  function ernZielKurz(v) {
    const diff = Number(v.ziel_kcal_diff);
    const ziel = diff === 0 ? "Halten" : diff < 0 ? `Abnehmen −${ernZahl(-diff, 0)}` : `Aufbauen +${ernZahl(diff, 0)}`;
    const anr = v.training_anrechnung === null || v.training_anrechnung === undefined ? 100 : Number(v.training_anrechnung);
    return `${ziel} · Aktivität ${ernZahl(v.pal)} · Eiweiß ${ernZahl(v.eiweiss_g_pro_kg)} g/kg · Fett ${v.fett_prozent} % · Training ${anr} %`;
  }

  // ---- Trainingskalorien ----
  // Netto-Schätzung: (MET − 1) × kg × Stunden. Das "− 1" zieht den
  // Ruheumsatz ab, der im Grundumsatz schon steckt.
  function ernMetFuer(sportart) {
    const key = String(sportart || "").trim().toLowerCase();
    const e = ernMet.find((m) => m.sportart_key === key);
    return e ? Number(e.met) : null;
  }

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

  function ernSummeHtml(s, z) {
    if (!z) {
      const hinweis = !ernProfilGeladen ? ""
        : !ernProfil ? "Für ein Tagesziel unten „⚙️ Profil &amp; Ziel“ ausfüllen."
        : "Für ein Tagesziel unten unter „⚖️ Gewicht“ dein Gewicht eintragen.";
      return `
        <div class="ern-summe-karte">
          <div class="ern-kcal-gross"><span>${ernZahl(s.kcal, 0)}</span> kcal</div>
          <div class="ern-makros">
            ${ernMakroHtml("Eiweiß", s.eiweiss, null, "ern-balken-eiweiss")}
            ${ernMakroHtml("Fett", s.fett, null, "ern-balken-fett")}
            ${ernMakroHtml("Kohlenhydrate", s.kohlenhydrate, null, "ern-balken-kh")}
            ${ernMakroHtml("Ballaststoffe", s.ballaststoffe, null, "")}
          </div>
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
        <div class="ern-makros">
          ${ernMakroHtml("Eiweiß", s.eiweiss, z.eiweiss, "ern-balken-eiweiss")}
          ${ernMakroHtml("Fett", s.fett, z.fett, "ern-balken-fett")}
          ${ernMakroHtml("Kohlenhydrate", s.kohlenhydrate, z.kh, "ern-balken-kh")}
          ${ernMakroHtml("Ballaststoffe", s.ballaststoffe, null, "")}
        </div>
        ${s.luecken ? `<p class="notiz-meta" style="margin:0.5rem 0 0;">Bei einzelnen Einträgen fehlen Werte (–) – die Summe ist dort etwas zu niedrig.</p>` : ""}
        <p class="notiz-meta" style="margin:0.5rem 0 0;">Gewicht ${ernZahl(z.kg)} kg vom ${datumDe(z.gewichtDatum)}</p>
      </div>`;
  }

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
    };
  }

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
    ernProfilRechnungZeigen();
  }

  // Live-Rechnung unter dem Formular (mit den gerade eingestellten Werten)
  function ernProfilRechnungZeigen() {
    const el = document.getElementById("ern-profil-rechnung");
    const heute = heuteISO();
    const g = ernGewichtFuer(heute);
    const p = ernProfilAusFormular();
    if (!g) { el.innerHTML = `<p class="notiz-meta">Trag unter „⚖️ Gewicht“ dein aktuelles Gewicht ein, dann steht hier die Rechnung.</p>`; return; }
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
      <p class="notiz-meta">An Trainingstagen kommen ${p.training_anrechnung === 0 ? "keine Trainingskalorien dazu (nur Anzeige)" : `${p.training_anrechnung === 100 ? "die" : p.training_anrechnung + " % der"} Trainingskalorien dazu – die Makroziele wachsen mit (Fett anteilig, der Rest als Kohlenhydrate)`}.</p>
      ${r.unterGrundumsatz ? `<p class="ern-warnung">Das Ziel liegt unter deinem Grundumsatz. Auf Dauer ist das nicht zu empfehlen – wähle lieber ein langsameres Tempo oder sprich es mit ärztlicher oder ernährungsfachlicher Begleitung ab.</p>` : ""}
      <p class="notiz-meta">Das ist eine Schätzung: Formeln liegen bei Einzelnen oft um rund 10 % daneben. Genauer wird es, wenn du ein paar Wochen isst, trackst und wiegst – dein Gewichtstrend zeigt dann, wo dein echter Bedarf liegt.</p>`;
  }
  ["ern-p-geschlecht", "ern-p-geburt", "ern-p-groesse", "ern-p-pal", "ern-p-ziel", "ern-p-eiweiss", "ern-p-fett", "ern-p-anrechnung"].forEach((id) => {
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
        ? `<button class="task-delete" onclick="ernZielVersionLoeschen('${v.gueltig_ab}')" aria-label="Stand ab ${datumDe(v.gueltig_ab)} löschen">×</button>`
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
        <button class="task-delete" onclick="ernGewichtLoeschen('${g.datum}')" aria-label="Gewicht vom ${datumDe(g.datum)} löschen">×</button>
      </div>`).join("");
    el.innerHTML = `
      <p class="ern-gewicht-aktuell">Zuletzt <strong>${ernZahl(letzter.gewicht_kg)} kg</strong> am ${datumDe(letzter.datum)}${vText}</p>
      ${svg}
      <div class="ern-gewicht-liste">${liste}</div>
      <p class="notiz-meta">Tipp: morgens nach dem Aufstehen wiegen, gleiche Bedingungen. Einzelwerte schwanken um 1–2 kg (Wasser, Salz, Verdauung) – aussagekräftig ist der Trend über Wochen.</p>`;
  }

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
    return `<p class="ern-training-zeile">🏃 ${teile.join(" · ")}${z.trainingSumme > 0 ? ` → ${zuschlag}` : ""}</p>`;
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

  window.ernMetVorschlag = function(i, index) {
    if (index === "") return;
    document.getElementById(`ern-met-wert-${i}`).value = ERN_MET_VORSCHLAEGE[Number(index)][0];
  };

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
  let ernScanStream = null;
  let ernScanLaeuft = false;
  let ernScanHistorie = false;
  let ernScanZiel = null;         // "feld" = Scan füllt das Barcode-Feld im Eigen-Formular

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

  window.ernOffTrefferWaehlen = function(code) { ernBarcodeSuchen(code); };

  // ---- Eigenes Lebensmittel anlegen / korrigieren ----
  const ERN_EIGEN_FELDER = ["name", "marke", "kcal", "eiweiss", "fett", "kh", "bal", "portion-name", "portion-g"];
  // Barcode aus einem erfolglosen Scan: wird beim Anlegen mitgespeichert
  let ernEigenBarcode = null;
  function ernEigenOeffnen(l, vorschlagName, barcode) {
    ernLmBearbeiten = l;
    ernEigenBarcode = !l && barcode ? barcode : null;
    const werte = l ? {
      name: l.name, marke: l.marke || "", kcal: l.kcal, eiweiss: l.eiweiss, fett: l.fett, kh: l.kohlenhydrate,
      bal: l.ballaststoffe, "portion-name": l.portion_name || "", "portion-g": l.portion_g,
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
      document.getElementById("ern-hinzu-status").textContent = `✓ „${l.name}“ gelöscht`;
      ernAnsicht("suche");
      document.getElementById("ern-suche").value = "";
      ernZuletztZeigen();
    } catch (e) {
      if (e.message !== "unauthorized") alert(e.message);
    }
  });

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
    try {
      ernScanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    } catch (e) {
      video.classList.add("hidden");
      status.textContent = "Kein Kamerazugriff (erlaubt?). Du kannst die Ziffern auch abtippen.";
      return;
    }
    if (overlay.classList.contains("hidden")) { ernKameraStoppen(); return; } // inzwischen geschlossen
    video.classList.remove("hidden");
    video.srcObject = ernScanStream;
    await video.play().catch(() => {});
    status.textContent = "Barcode ins Bild halten – ruhig und nicht zu nah.";
    ernScanLaeuft = true;
    const pruefen = async () => {
      if (!ernScanLaeuft) return;
      try {
        if (video.readyState >= 2) {
          const codes = await detektor.detect(video);
          const treffer = codes.find((c) => /^\d{8,14}$/.test(c.rawValue));
          if (treffer) {
            if (navigator.vibrate) navigator.vibrate(80);
            const ziel = ernScanZiel;
            ernScannerSchliessen();
            ernScanErgebnis(treffer.rawValue, ziel);
            return;
          }
        }
      } catch (e) { /* einzelnes Bild nicht auswertbar – weiter */ }
      setTimeout(pruefen, 250);
    };
    pruefen();
  }

  function ernKameraStoppen() {
    ernScanLaeuft = false;
    if (ernScanStream) { ernScanStream.getTracks().forEach((t) => t.stop()); ernScanStream = null; }
    const video = document.getElementById("ern-scanner-video");
    video.srcObject = null;
  }

  function ernScannerSchliessen(ausPopstate) {
    ernKameraStoppen();
    ernScanZiel = null;
    document.getElementById("btn-ern-scanner-suchen").textContent = "Suchen";
    document.getElementById("ern-scanner").classList.add("hidden");
    if (!ausPopstate && ernScanHistorie) { ernScanHistorie = false; history.back(); }
  }
