// Farbschema (Hell/Dunkel) – läuft im <head>, bevor die Seite gezeichnet
// wird, damit sie nicht erst hell aufblitzt. Auswahl im ⋮-Menü von
// app.js („Darstellung“), gespeichert in localStorage "farbschema":
// "auto" (Standard, folgt der Handy-/PC-Einstellung), "hell" oder "dunkel".
// Seit Etappe 5 außerdem: „?“-Hilfesymbole ausgeblendet (localStorage
// "hilfe-symbole" = "aus") – Klasse ohne-hilfe am <html>.
(function () {
  var wahl = "auto";
  try { wahl = localStorage.getItem("farbschema") || "auto"; } catch (e) { /* privater Modus */ }
  var dunkel = wahl === "dunkel" ||
    (wahl !== "hell" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-schema", dunkel ? "dunkel" : "hell");
  try {
    if (localStorage.getItem("hilfe-symbole") === "aus") document.documentElement.classList.add("ohne-hilfe");
  } catch (e) { /* privater Modus */ }
})();
