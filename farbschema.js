// Farbschema (Hell/Dunkel) – läuft im <head>, bevor die Seite gezeichnet
// wird, damit sie nicht erst hell aufblitzt. Auswahl im ⋮-Menü von
// app.js („Darstellung“), gespeichert in localStorage "farbschema":
// "auto" (Standard, folgt der Handy-/PC-Einstellung), "hell" oder "dunkel".
(function () {
  var wahl = "auto";
  try { wahl = localStorage.getItem("farbschema") || "auto"; } catch (e) { /* privater Modus */ }
  var dunkel = wahl === "dunkel" ||
    (wahl !== "hell" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-schema", dunkel ? "dunkel" : "hell");
})();
