// ==========================================================
// WICHTIG: Diese URL nach dem Deployment der Edge Function
// aus dem Supabase-Dashboard eintragen (siehe SETUP.md).
// ==========================================================
const API_URL = "https://juxoxltaeugsmtvirfcm.supabase.co/functions/v1/bright-endpoint";

// Sicherheits-Update: Es wird nur noch ein Session-Token gespeichert,
// nie mehr das Passwort selbst.
let token = localStorage.getItem("aufgaben-token") || "";
let projekte = [];
let aufgaben = [];
let termine = [];
let notizen = [];
let links = [];
let calMonat = new Date();
let calAusgewaehlterTag = null;

async function api(action, extra = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token, ...extra }),
  });
  if (res.status === 401) {
    localStorage.removeItem("aufgaben-token");
    token = "";
    zeigeLogin("Sitzung abgelaufen. Bitte erneut anmelden.");
    throw new Error("unauthorized");
  }
  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    zeigeLogin(data.error || "Zu viele Versuche. Bitte kurz warten.");
    throw new Error("rate-limited");
  }
  if (!res.ok) throw new Error("Serverfehler");
  return res.json();
}

function zeigeLogin(fehler) {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("login-error").textContent = fehler || "";
}

function zeigeApp() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

document.getElementById("login-btn").addEventListener("click", anmelden);
document.getElementById("login-pass").addEventListener("keydown", (e) => {
  if (e.key === "Enter") anmelden();
});

document.getElementById("btn-abmelden").addEventListener("click", async () => {
  try { await api("logout"); } catch (e) { /* egal, wir loggen lokal trotzdem aus */ }
  localStorage.removeItem("aufgaben-token");
  token = "";
  document.getElementById("login-pass").value = "";
  zeigeLogin();
});

async function anmelden() {
  const pass = document.getElementById("login-pass").value;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", pass }),
    });
    const data = await res.json();
    if (!res.ok) {
      document.getElementById("login-error").textContent = data.error || "Anmeldung fehlgeschlagen.";
      return;
    }
    token = data.token;
    localStorage.setItem("aufgaben-token", token);
    await ladeDaten();
    zeigeApp();
  } catch (e) {
    document.getElementById("login-error").textContent = "Verbindung fehlgeschlagen.";
  }
}

function heuteISO() {
  return new Date().toISOString().slice(0, 10);
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
  render();
  renderKalender();
  renderHeute();
  renderNotizen();
  renderLinks();
}

function badgeHtml(cls, text) {
  return `<span class="badge ${cls}">${text}</span>`;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function taskHtml(a, done) {
  const projekt = projekte.find((p) => p.id === a.projekt_id);
  let meta = "";
  if (done && projekt) meta += badgeHtml("", projekt.name);
  if (!done && a.faellig_am) {
    if (a.status === "ueberfaellig") meta += badgeHtml("overdue", "überfällig · " + a.faellig_am);
    else if (a.status === "heute") meta += badgeHtml("today", "heute fällig");
    else meta += badgeHtml("", "fällig " + a.faellig_am);
  }
  if (!done && a.erinnere_alle_tage) meta += badgeHtml("reminder", "alle " + a.erinnere_alle_tage + " Tage");

  const snoozeBtn = !done && a.erinnerungFaellig
    ? `<button class="task-snooze" data-action="snooze" data-id="${escapeAttr(a.id)}" title="Später erneut erinnern">↻</button>`
    : "";

  return `
    <div class="task ${!done ? a.status : ""}">
      <button class="task-check ${done ? "done" : ""}" data-action="umschalten" data-id="${escapeAttr(a.id)}">${done ? "✓" : ""}</button>
      <div class="task-info">
        <span class="task-titel ${done ? "done" : ""}">${escapeHtml(a.titel)}</span>
        <div class="task-meta">${meta}</div>
      </div>
      ${snoozeBtn}
      <button class="task-delete" data-action="aufgabe-loeschen" data-id="${escapeAttr(a.id)}">×</button>
    </div>`;
}

function render() {
  const select = document.getElementById("aufgabe-projekt");
  select.innerHTML = '<option value="">Ohne Projekt</option>' +
    projekte.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

  const offen = aufgaben.filter((a) => !a.erledigt).map(enrich);
  const erledigt = aufgaben.filter((a) => a.erledigt);

  const sortiere = (liste) => [...liste].sort((a, b) => {
    const ad = a.faellig_am || "9999-99-99";
    const bd = b.faellig_am || "9999-99-99";
    if (ad !== bd) return ad < bd ? -1 : 1;
    return b.erstellt_am < a.erstellt_am ? -1 : 1;
  });

  const ohneProjekt = sortiere(offen.filter((a) => !a.projekt_id));
  const gruppen = projekte
    .map((p) => ({ projekt: p, liste: sortiere(offen.filter((a) => a.projekt_id === p.id)) }))
    .filter((g) => g.liste.length > 0);

  let html = "";
  if (ohneProjekt.length > 0) {
    html += `<div class="project-heading">Ohne Projekt</div><div class="task-list">${ohneProjekt.map((a) => taskHtml(a, false)).join("")}</div>`;
  }
  for (const g of gruppen) {
    html += `<div class="project-heading">${escapeHtml(g.projekt.name)} <button class="project-edit-btn" data-action="projekt-umbenennen" data-id="${escapeAttr(g.projekt.id)}" title="Projekt umbenennen">✎</button></div><div class="task-list">${g.liste.map((a) => taskHtml(a, false)).join("")}</div>`;
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
  const erinnere_alle_tage = document.getElementById("aufgabe-intervall").value || null;

  await api("aufgabe_hinzufuegen", { titel, projekt_id, faellig_am, erinnere_alle_tage });
  document.getElementById("neue-aufgabe").value = "";
  document.getElementById("aufgabe-faellig").value = "";
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
  await api("projekt_hinzufuegen", { name });
  document.getElementById("neues-projekt").value = "";
  await ladeDaten();
}

async function projektUmbenennen(id) {
  const projekt = projekte.find((p) => p.id === id);
  if (!projekt) return;
  const neuerName = prompt("Neuer Projektname:", projekt.name);
  if (!neuerName || !neuerName.trim() || neuerName.trim() === projekt.name) return;
  try {
    await api("projekt_umbenennen", { id, name: neuerName.trim() });
    await ladeDaten();
  } catch (e) {
    alert("Umbenennen fehlgeschlagen – existiert der Name schon?");
  }
}

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

// Beim Start: automatisch anmelden, falls Token schon gespeichert
(async function init() {
  if (token) {
    try {
      await ladeDaten();
      zeigeApp();
      return;
    } catch (e) {
      // Token ungültig geworden -> Login zeigen
    }
  }
  zeigeLogin();
})();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// ==========================================================
// Zentrale Klick-Delegation statt einzelner onclick-Attribute
// (nötig für ein striktes Content-Security-Policy ohne
// 'unsafe-inline' im script-src).
// ==========================================================
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const id = el.dataset.id;
  switch (el.dataset.action) {
    case "umschalten": umschalten(id); break;
    case "aufgabe-loeschen": loeschen(id); break;
    case "snooze": erinnerungVerschieben(id); break;
    case "projekt-umbenennen": projektUmbenennen(id); break;
    case "termin-loeschen": terminLoeschen(id); break;
    case "notiz-loeschen": notizLoeschen(id); break;
    case "link-loeschen": linkLoeschen(id); break;
    case "cal-tag": calTagAuswaehlen(el.dataset.iso); break;
  }
});

// ==========================================================
// Tabs
// ==========================================================
function tabWechseln(aktiv) {
  const tabs = { heute: "tab-heute", aufgaben: "tab-aufgaben", kalender: "tab-kalender", notizen: "tab-notizen", links: "tab-links" };
  const views = { heute: "view-heute", aufgaben: "view-aufgaben", kalender: "view-kalender", notizen: "view-notizen", links: "view-links" };
  for (const key in tabs) {
    document.getElementById(tabs[key]).classList.toggle("active", key === aktiv);
    document.getElementById(views[key]).classList.toggle("hidden", key !== aktiv);
  }
  if (aktiv === "kalender") renderKalender();
  if (aktiv === "heute") renderHeute();
}
document.getElementById("tab-heute").addEventListener("click", () => tabWechseln("heute"));
document.getElementById("tab-aufgaben").addEventListener("click", () => tabWechseln("aufgaben"));
document.getElementById("tab-kalender").addEventListener("click", () => tabWechseln("kalender"));
document.getElementById("tab-notizen").addEventListener("click", () => tabWechseln("notizen"));
document.getElementById("tab-links").addEventListener("click", () => tabWechseln("links"));

function renderHeute() {
  const heuteIso = heuteISO();
  const offenEnriched = aufgaben.filter((a) => !a.erledigt).map(enrich);
  const faelligHeute = offenEnriched.filter((a) => a.status === "ueberfaellig" || a.status === "heute");
  const erinnerungenHeute = offenEnriched.filter((a) => a.erinnerungFaellig);
  const termineHeute = termine
    .filter((t) => t.datum === heuteIso)
    .sort((a, b) => (a.uhrzeit || "99:99").localeCompare(b.uhrzeit || "99:99"));

  let html = "";

  if (termineHeute.length > 0) {
    html += `<div class="project-heading">Termine heute</div><div class="upcoming-list" style="margin-bottom:1.6rem;">` +
      termineHeute.map((t) => `
        <div class="upcoming-item">
          <span class="upcoming-datum">${t.uhrzeit ? t.uhrzeit.slice(0,5) : "ganztägig"}</span>
          <span>${escapeHtml(t.titel)}</span>
        </div>`).join("") +
      `</div>`;
  }

  if (faelligHeute.length > 0) {
    html += `<div class="project-heading">Fällige Aufgaben</div><div class="task-list">${faelligHeute.map((a) => taskHtml(a, false)).join("")}</div>`;
  }

  if (erinnerungenHeute.length > 0) {
    html += `<div class="project-heading" style="margin-top:1.6rem;">Erinnerungen</div><div class="task-list">${erinnerungenHeute.map((a) => taskHtml(a, false)).join("")}</div>`;
  }

  if (termineHeute.length === 0 && faelligHeute.length === 0 && erinnerungenHeute.length === 0) {
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
  return termine.filter((t) => t.datum === isoDatum).sort((a,b) => (a.uhrzeit||"99:99").localeCompare(b.uhrzeit||"99:99"));
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
    html += `<div class="${classes.join(" ")}" data-action="cal-tag" data-iso="${iso}">
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
    .filter((t) => t.datum >= heuteIso)
    .sort((a,b) => (a.datum + (a.uhrzeit||"99:99")).localeCompare(b.datum + (b.uhrzeit||"99:99")))
    .slice(0, 5);

  if (kommende.length === 0) {
    document.getElementById("upcoming-bereich").innerHTML = "";
    return;
  }
  const html = kommende.map((t) => `
    <div class="upcoming-item">
      <span class="upcoming-datum">${formatDatumKurz(t.datum)}${t.uhrzeit ? " · " + t.uhrzeit.slice(0,5) : ""}</span>
      <span>${escapeHtml(t.titel)}</span>
    </div>`).join("");
  document.getElementById("upcoming-bereich").innerHTML =
    `<div class="project-heading">Nächste Termine</div><div class="upcoming-list">${html}</div>`;
}

function formatDatumKurz(iso) {
  const [j,m,t] = iso.split("-");
  return t + "." + m + ".";
}

function calTagAuswaehlen(iso) {
  calAusgewaehlterTag = (calAusgewaehlterTag === iso) ? null : iso;
  renderKalender();
}

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
          <span class="termin-zeit">${t.uhrzeit ? t.uhrzeit.slice(0,5) : ""}</span>
          <span class="termin-titel">${escapeHtml(t.titel)}${t.notiz ? `<span class="termin-notiz">${escapeHtml(t.notiz)}</span>` : ""}</span>
          <button class="task-delete" data-action="termin-loeschen" data-id="${escapeAttr(t.id)}">×</button>
        </div>`).join("");

  panel.innerHTML = `
    <div class="cal-day-panel">
      <h3>${titel}</h3>
      ${itemsHtml}
      <div class="termin-form">
        <input type="text" id="termin-titel" placeholder="Titel">
        <input type="time" id="termin-uhrzeit" style="width:8rem;">
        <input type="text" id="termin-notiz" placeholder="Notiz (optional)">
        <button class="btn-primary" id="btn-termin-hinzufuegen">Eintragen</button>
      </div>
    </div>`;

  document.getElementById("btn-termin-hinzufuegen").addEventListener("click", terminHinzufuegen);
  document.getElementById("termin-titel").addEventListener("keydown", (e) => {
    if (e.key === "Enter") terminHinzufuegen();
  });
}

async function terminHinzufuegen() {
  const titel = document.getElementById("termin-titel").value.trim();
  if (!titel || !calAusgewaehlterTag) return;
  const uhrzeit = document.getElementById("termin-uhrzeit").value || null;
  const notiz = document.getElementById("termin-notiz").value.trim() || null;

  await api("termin_hinzufuegen", { titel, datum: calAusgewaehlterTag, uhrzeit, notiz });
  await ladeDaten();
  renderKalender();
}

async function terminLoeschen(id) {
  await api("termin_loeschen", { id });
  await ladeDaten();
  renderKalender();
}

// ==========================================================
// Notizen
// ==========================================================
function renderNotizen() {
  const select = document.getElementById("notiz-projekt");
  select.innerHTML = '<option value="">Ohne Projekt</option>' +
    projekte.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

  const bereich = document.getElementById("notizen-bereich");
  if (notizen.length === 0) {
    bereich.innerHTML = '<p class="empty-text">Noch keine Notizen.</p>';
    return;
  }
  const html = notizen.map((n) => {
    const projekt = projekte.find((p) => p.id === n.projekt_id);
    const datum = new Date(n.erstellt_am).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `
      <div class="notiz-item">
        <div style="flex:1;">
          <span class="notiz-text">${escapeHtml(n.text)}</span>
          <span class="notiz-meta">${datum}${projekt ? " · " + escapeHtml(projekt.name) : ""}</span>
        </div>
        <button class="task-delete" data-action="notiz-loeschen" data-id="${escapeAttr(n.id)}">×</button>
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
  await api("notiz_hinzufuegen", { text, projekt_id });
  document.getElementById("neue-notiz").value = "";
  await ladeDaten();
}

async function notizLoeschen(id) {
  await api("notiz_loeschen", { id });
  await ladeDaten();
}

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
      <button class="task-delete" data-action="link-loeschen" data-id="${escapeAttr(l.id)}">×</button>
    </div>`;
}

function renderLinks() {
  const select = document.getElementById("link-projekt");
  select.innerHTML = '<option value="">Ohne Projekt</option>' +
    projekte.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

  const ohneProjekt = links.filter((l) => !l.projekt_id);
  const gruppen = projekte
    .map((p) => ({ projekt: p, liste: links.filter((l) => l.projekt_id === p.id) }))
    .filter((g) => g.liste.length > 0);

  let html = "";
  if (ohneProjekt.length > 0) {
    html += `<div class="project-heading">Ohne Projekt</div><div class="task-list">${ohneProjekt.map(linkHtml).join("")}</div>`;
  }
  for (const g of gruppen) {
    html += `<div class="project-heading">${escapeHtml(g.projekt.name)}</div><div class="task-list">${g.liste.map(linkHtml).join("")}</div>`;
  }
  if (links.length === 0) {
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

  await api("link_hinzufuegen", { titel, url, notiz, projekt_id });
  document.getElementById("neuer-link-titel").value = "";
  document.getElementById("neuer-link-url").value = "";
  document.getElementById("neuer-link-notiz").value = "";
  await ladeDaten();
}

async function linkLoeschen(id) {
  await api("link_loeschen", { id });
  await ladeDaten();
}
