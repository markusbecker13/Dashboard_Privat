  // ==========================================================
  // WICHTIG: Diese URL nach dem Deployment der Edge Function
  // aus dem Supabase-Dashboard eintragen (siehe SETUP.md).
  // Beispiel: https://xxxxxxxx.supabase.co/functions/v1/aufgaben-api
  // ==========================================================
  const API_URL = "https://juxoxltaeugsmtvirfcm.supabase.co/functions/v1/bright-endpoint";

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
    ["training", "Training"],
  ];
  const BEREICH_TABS = { privat: ALLE_REITER, ogs: ALLE_REITER, awo: ALLE_REITER, business: ALLE_REITER };
  const BEREICH_TITEL_VERWALTUNG = { privat: "🏠 Privat", ogs: "🏫 OGS Rapunzel", awo: "🤝 AWO OV Liblar", business: "☕ Business" };

  // Vorbelegung, solange in tab_einstellungen noch kein expliziter Eintrag
  // existiert – entspricht dem bisherigen Standardverhalten, damit sich
  // ohne aktives Umschalten nichts an der gewohnten Ansicht ändert.
  const STANDARD_SICHTBAR = {
    privat: ["heute", "frei", "aufgaben", "kalender", "planung", "finanzen", "notizen", "links",
      "reflexion", "spiele", "einkauf", "export", "verlauf", "anleitung", "training"],
    ogs: ["heute", "aufgaben", "kalender", "notizen", "verlauf", "anleitung",
      "ogsideen", "ogsinventar", "ogsprojekte", "verleih"],
    awo: ["heute", "aufgaben", "kalender", "notizen", "verlauf", "anleitung", "ogsideen"],
    business: ["heute", "aufgaben", "kalender", "notizen", "links", "verlauf", "anleitung", "ogsideen"],
  };

  function reiterIstSichtbar(bereich, schluessel) {
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
      { schluessel: "sammeln", label: "Sammeln", icon: "🗂️", tabs: ["notizen", "links", "reflexion", "spiele", "einkauf", "training"] },
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
  const BEREICH_THEME_FARBE = { neutral: "#1b1b1b", privat: "#10233f", ogs: "#1e3a5c", awo: "#3b1215", business: "#2a1d15" };
  const BEREICH_LOGO = {
    privat: { src: "icons/privat.png", alt: "Privat" },
    ogs: { src: "icons/rapunzel.png", alt: "Rapunzel Kinderhaus e.V." },
    awo: { src: "icons/awo-liblar.png", alt: "AWO Ortsverein Liblar-Köttingen e.V." },
    business: { src: "icons/zwischenkaffeeundchaos.png", alt: "zwischenkaffeeundchaos" },
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
      zeigeBereichAuswahl();
    } catch (e) {
      zeigeLogin("Verbindung fehlgeschlagen.");
    }
  }

  function heuteISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function addTage(datumISO, tage) {
    const d = new Date(datumISO + "T00:00:00");
    d.setDate(d.getDate() + tage);
    return d.toISOString().slice(0, 10);
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

        if (googleCode || gewuenschterTab) {
          zeigeApp();
          bereichAnwenden();
          render();
          renderNotizen();
          renderKalender();
          renderHeute();
          renderOgsIdeen();
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
        ? `Moin Markus.<br><span class="heute-gruss-akzent">${offeneDinge} ${offeneDinge === 1 ? "Ding" : "Dinge"}</span> heute.`
        : `Moin Markus.<br>Freie Bahn heute.`;
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
    document.getElementById("blockzeit-datum-row").class