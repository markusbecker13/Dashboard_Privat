// Tests für den CSV-Import (Review 17.10.2026, Fund 1–3).
// Aufruf im Repo-Ordner:  node tests/csv-test.mjs
// Holt parseCsvText und parseCsvBetrag direkt aus app.js – getestet wird
// also immer der echte Code, nichts doppelt gepflegt.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ordner = dirname(fileURLToPath(import.meta.url));
const app = readFileSync(join(ordner, "..", "app.js"), "utf8");

function funktion(name) {
  const start = app.indexOf(`  function ${name}(`);
  if (start < 0) throw new Error(`${name} nicht in app.js gefunden`);
  const ende = app.indexOf("\n  }\n", start);
  return app.slice(start, ende + 4);
}
const { parseCsvText, parseCsvBetrag } = new Function(
  `${funktion("parseCsvText")}\n${funktion("parseCsvBetrag")}\nreturn { parseCsvText, parseCsvBetrag };`
)();

let ok = 0, fehler = 0;
function gleich(beschreibung, ist, soll) {
  const a = JSON.stringify(ist), b = JSON.stringify(soll);
  if (a === b) { ok++; return; }
  fehler++;
  console.log(`✗ ${beschreibung}\n    erwartet: ${b}\n    bekommen: ${a}`);
}

// ---- parseCsvText ----
let r = parseCsvText('Verwendungszweck;Betrag;Datum\n"Miete; Okt";-850,00;01.10.2026\n');
gleich("Semikolon in Anführungszeichen (Fund 1)", r.rows, [["Miete; Okt", "-850,00", "01.10.2026"]]);
gleich("Kopfzeile", r.header, ["Verwendungszweck", "Betrag", "Datum"]);
gleich("Trennzeichen ;", r.trenner, ";");

r = parseCsvText('a,b,c\n"x, y",1.5,"2026-10-01"\r\n"z",2,3\r\n');
gleich("Komma-CSV mit Komma im Feld", r.rows, [["x, y", "1.5", "2026-10-01"], ["z", "2", "3"]]);
gleich("Trennzeichen ,", r.trenner, ",");

r = parseCsvText('Text;Betrag\n"Er sagte ""Hallo""";5\n');
gleich("Doppelte Anführungszeichen", r.rows, [['Er sagte "Hallo"', "5"]]);

r = parseCsvText('Text;Betrag\n"Zeile 1\nZeile 2";7\n\n\n');
gleich("Zeilenumbruch im Feld, Leerzeilen ignoriert", r.rows, [["Zeile 1\nZeile 2", "7"]]);

r = parseCsvText('﻿"Buchungstag";"Betrag"\n"01.10.2026";"-12,50"');
gleich("BOM und Datei ohne Zeilenumbruch am Ende", [r.header, r.rows], [["Buchungstag", "Betrag"], [["01.10.2026", "-12,50"]]]);

r = parseCsvText('a;b;c\n1;;3\n');
gleich("Leeres Feld bleibt erhalten", r.rows, [["1", "", "3"]]);

r = parseCsvText('Name;Notiz\n"Kaffee; Milch"; frei , mit Komma\n');
gleich("Semikolon-Datei mit vielen Kommas im Text", [r.trenner, r.rows], [";", [["Kaffee; Milch", "frei , mit Komma"]]]);

// ---- parseCsvBetrag ----
const betraege = [
  ["-850,00", -850], ["1.234,56", 1234.56], ["1,234.56", 1234.56], // Fund 2
  ["-1.234.567,89", -1234567.89], ["1,234,567.89", 1234567.89],
  ["12.5", 12.5], ["12,5", 12.5], ["1,234,567", 1234567], ["1.234.567", 1234567],
  ["850,00-", -850], ["(12,00)", -12], ["−3,20", -3.2], ["+5", 5],
  ["1 234,56 €", 1234.56], ["EUR -9,99", -9.99], ["0", 0],
  ["", null], ["   ", null], [null, null], [undefined, null], ["abc", null], ["1.2.3,4.5", null], ["-", null],
];
for (const [ein, soll] of betraege) gleich(`Betrag ${JSON.stringify(ein)}`, parseCsvBetrag(ein), soll);

console.log(`${ok} ok, ${fehler} fehlgeschlagen`);
process.exit(fehler ? 1 : 0);
