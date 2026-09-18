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
  let aktiverBereich = localStorage.getItem("aktiver-bereich") || "privat";
  let aktiveKategorie = null; // Schlüssel der gerade offenen Themen-Kachel-Gruppe, oder null
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
  const BEREICH_TABS = { privat: ALLE_REITER, ogs: ALLE_REITER, awo: ALLE_REITER };
  const BEREICH_TITEL_VERWALTUNG = { privat: "🏠 Privat", ogs: "🏫 OGS Rapunzel", awo: "🤝 AWO OV Liblar" };

  // Vorbelegung, solange in tab_einstellungen noch kein expliziter Eintrag
  // existiert – entspricht dem bisherigen Standardverhalten, damit sich
  // ohne aktives Umschalten nichts an der gewohnten Ansicht ändert.
  const STANDARD_SICHTBAR = {
    privat: ["heute", "frei", "aufgaben", "kalender", "planung", "finanzen", "notizen", "links",
      "reflexion", "spiele", "einkauf", "export", "verlauf", "anleitung", "training"],
    ogs: ["heute", "aufgaben", "kalender", "notizen", "verlauf", "anleitung",
      "ogsideen", "ogsinventar", "ogsprojekte", "verleih"],
    awo: ["heute", "aufgaben", "kalender", "notizen", "verlauf", "anleitung", "ogsideen"],
  };

  function reiterIstSichtbar(bereich, schluessel) {
    const eintrag = tabEinstellungen.find((e) => e.bereich === bereich && e.tab_id === schluessel);
    if (eintrag) return eintrag.sichtbar !== false;
    return (STANDARD_SICHTBAR[bereich] || []).includes(schluessel);
  }

  // Themen-Kacheln (Hauptkategorien) je Bereich. Fasst dieselben Reiter
  // zusammen, die vorher als Sidebar-Gruppen (Heute/Planen/Sammeln/...)
  // dargestellt wurden – jetzt als zweite Kachel-Ebene nach der
  // Bereichsauswahl. "arbeit" trägt bewusst Label/Icon des aktiven
  // Bereichs (analog zur früheren "tab-group-arbeit-label").
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
  let wetterLetzterAbruf = 0; // Timestamp (ms), für einfaches Caching
  const WETTER_CACHE_MS = 30 * 60 * 1000; // 30 Minuten

  async function api(action, extra = {}) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, token, ...extra }),
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

  function zeigeLogin(fehler) {
    document.getElementById("app").classList.add("hidden");
    document.getElementById("bereich-screen").classList.add("hidden");
    document.getElementById("kategorie-screen").classList.add("hidden");
    document.getElementById("unterkategorie-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("login-error").textContent = fehler || "";
  }

  function zeigeBereichAuswahl() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("kategorie-screen").classList.add("hidden");
    document.getElementById("unterkategorie-screen").classList.add("hidden");
    document.getElementById("bereich-screen").classList.remove("hidden");
  }

  function zeigeApp() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("bereich-screen").classList.add("hidden");
    document.getElementById("kategorie-screen").classList.add("hidden");
    document.getElementById("unterkategorie-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    dashboardNameAnzeigen();
    untertitelAnzeigen();
  }

  // ==========================================================
  // Kachel-Navigation: Bereich -> Hauptkategorie (Thema) -> Reiter
  // ==========================================================
  function zeigeKategorien() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("bereich-screen").classList.add("hidden");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("unterkategorie-screen").classList.add("hidden");
    document.getElementById("kategorie-screen").classList.remove("hidden");
    aktiveKategorie = null;
    renderKategorieTiles();
  }

  function renderKategorieTiles() {
    const titel = document.getElementById("kategorie-screen-bereichsname");
    if (titel) titel.textContent = BEREICH_TITEL_VERWALTUNG[aktiverBereich] || "";
    const container = document.getElementById("kategorie-tiles");
    if (!container) return;
    container.innerHTML = hauptkategorien()
      .filter((g) => sichtbareTabsInGruppe(g).length > 0)
      .map((g) => `
        <button class="bereich-tile" onclick="kategorieAuswaehlen('${g.schluessel}')">
          <span class="bereich-tile-icon">${g.icon}</span>
          <span class="bereich-tile-label">${escapeHtml(g.label)}</span>
        </button>
      `).join("");
  }

  window.kategorieAuswaehlen = function(schluessel) {
    const gruppe = hauptkategorien().find((g) => g.schluessel === schluessel);
    const sichtbar = gruppe ? sichtbareTabsInGruppe(gruppe) : [];
    // Nur ein sichtbarer Reiter im Thema? Dann direkt hinein, statt eine
    // Zwischenseite mit nur einer Kachel zu zeigen.
    if (sichtbar.length <= 1) {
      tabWechseln(sichtbar[0] || "heute");
      return;
    }
    zeigeUnterkategorien(schluessel);
  };

  function zeigeUnterkategorien(schluessel) {
    document.getElementById("kategorie-screen").classList.add("hidden");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("unterkategorie-screen").classList.remove("hidden");
    aktiveKategorie = schluessel;
    renderUnterkategorieTiles();
  }

  function renderUnterkategorieTiles() {
    const gruppe = hauptkategorien().find((g) => g.schluessel === aktiveKategorie);
    if (!gruppe) return;
    const titel = document.getElementById("unterkategorie-screen-titel");
    if (titel) titel.textContent = gruppe.label;
    const container = document.getElementById("unterkategorie-tiles");
    if (!container) return;
    container.innerHTML = sichtbareTabsInGruppe(gruppe).map((schluessel) => {
      const eintrag = ALLE_REITER.find(([s]) => s === schluessel);
      const label = eintrag ? eintrag[1] : schluessel;
      return `
        <button class="bereich-tile" onclick="tabWechseln('${schluessel}')">
          <span class="bereich-tile-label">${escapeHtml(label)}</span>
        </button>
      `;
    }).join("");
  }

  window.bereichAuswaehlen = function(bereich) {
    aktiverBereich = bereich;
    localStorage.setItem("aktiver-bereich", bereich);
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
      zeigeKategorien();
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
    return `<span class="badge ${cls}">${text}</span>`;
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
            await api("google_auth_callback", { code: googleCode });
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

  const BEREICH_NAME = { ogs: "OGS Rapunzel", awo: "AWO OV Liblar" };

  function bereichAnwenden() {
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
    document.getElementById("kategorie-screen").classList.add("hidden");
    document.getElementById("unterkategorie-screen").classList.add("hidden");
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
    if (aktiv === "reiterverwaltung") renderReiterVerwaltung();
    kontoMenuSchliessen();
  }
  window.tabWechseln = tabWechseln;

  // Zurück-Button: eine Ebene zurück zu den Reiter-Kacheln des aktuellen
  // Themas (oder direkt zu den Themen-Kacheln, wenn das Thema nur einen
  // sichtbaren Reiter hatte und deshalb übersprungen wurde). Im Bereich
  // "Verwaltung" gibt es keine Kachel-Ebenen – dort geht's zurück zur
  // Bereichsauswahl.
  document.getElementById("content-back-btn").addEventListener("click", () => {
    if (aktiverBereich === "verwaltung") { zeigeBereichAuswahl(); return; }
    const gruppe = gruppeVonTab(aktiverTab);
    if (gruppe && sichtbareTabsInGruppe(gruppe).length > 1) {
      zeigeUnterkategorien(gruppe.schluessel);
    } else {
      zeigeKategorien();
    }
  });
  // Home-Button: direkt zu den Themen-Kacheln des aktuellen Bereichs.
  document.getElementById("content-home-btn").addEventListener("click", () => {
    if (aktiverBereich === "verwaltung") { zeigeBereichAuswahl(); return; }
    zeigeKategorien();
  });
  document.getElementById("kategorie-zurueck-btn").addEventListener("click", zeigeBereichAuswahl);
  document.getElementById("unterkategorie-zurueck-btn").addEventListener("click", zeigeKategorien);

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
    container.innerHTML = `<div class="wetter-karte wetter-laedt">Wetter wird geladen …</div>`;
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
        `<div class="wetter-karte wetter-fehler">Wetter konnte nicht geladen werden (${escapeHtml(fehler.message || "Fehler")}).
         <button class="link-btn" onclick="ladeWetter(true)">Erneut versuchen</button></div>`;
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

    document.getElementById("wetter-bereich").innerHTML = `
      <div class="wetter-karte">
        <div class="wetter-kopf">
          <div class="wetter-jetzt">
            <span class="wetter-jetzt-icon">${aktIcon}</span>
            <span class="wetter-jetzt-temp">${Math.round(wetterDaten.aktuelle_temperatur)}°</span>
            <span class="wetter-jetzt-text">${aktText}</span>
          </div>
          <div class="wetter-ort-zeile">
            <span>${escapeHtml(wetterDaten.ort_gefunden || wetterOrt)}</span>
            <button class="project-edit-btn" onclick="wetterOrtBearbeiten()" title="Ort ändern">✎</button>
          </div>
        </div>
        <div class="wetter-kachel-grid">${tage}</div>
      </div>`;
  }

  window.wetterOrtBearbeiten = function () {
    const neu = prompt("Ort für die Wettervorhersage:", wetterOrt);
    if (neu === null) return;
    const bereinigt = neu.trim();
    if (!bereinigt || bereinigt === wetterOrt) return;
    wetterOrt = bereinigt;
    localStorage.setItem("wetter-ort", wetterOrt);
    ladeWetter(true);
  };

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

    if (termineGanztags.length > 0) {
      html += `<div class="jetzt-naechster" style="margin-top:0;">Ganztägig: <strong>${termineGanztags.map((t) => escapeHtml(t.titel)).join(", ")}</strong></div>`;
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
            <span class="jetzt-leiste-titel">Heute</span>
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

    if (termineGanztags.length === 0 && !(rahmen.aktiv && heuteEintraege) && aufgabenZahl === 0 && einkaufOffen.length === 0 && aktuelleZiele.length === 0) {
      html = '<p class="empty-text">Nichts Dringendes für heute — guter Tag.</p>';
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
      const datum = new Date(p.erstellt_am).