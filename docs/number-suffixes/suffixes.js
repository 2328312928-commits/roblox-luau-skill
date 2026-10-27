// Roblox simulator number suffixes. abbreviate() is a port of NumberFormat.abbreviate
// from github.com/2328312928-commits/roblox-number-format and is checked against the
// Luau original by tests/web/suffixes_parity.js.
(function (root) {
  const SUFFIXES = [
    ["K", "thousand"], ["M", "million"], ["B", "billion"], ["T", "trillion"],
    ["Qa", "quadrillion"], ["Qi", "quintillion"], ["Sx", "sextillion"], ["Sp", "septillion"],
    ["Oc", "octillion"], ["No", "nonillion"], ["Dc", "decillion"], ["Ud", "undecillion"],
    ["Dd", "duodecillion"], ["Td", "tredecillion"], ["Qad", "quattuordecillion"], ["Qid", "quindecillion"],
    ["Sxd", "sexdecillion"], ["Spd", "septendecillion"], ["Ocd", "octodecillion"], ["Nod", "novemdecillion"],
    ["Vg", "vigintillion"],
  ];
  const MAX_DECIMALS = 6;
  const POW10 = [];
  for (let i = 0; i <= 3 * SUFFIXES.length + MAX_DECIMALS + 2; i++) POW10[i] = Number("1e" + i);

  // Luau's // and % on numbers: floor division and floored modulo.
  const fdiv = (a, b) => Math.floor(a / b);
  const fmod = (a, b) => a - Math.floor(a / b) * b;

  function roundShifted(abs, shift) {
    const scaled = shift >= 0 ? abs / POW10[shift] : abs * POW10[-shift];
    return Math.floor(scaled + 0.5);
  }

  function fixed(units, decimals) {
    const whole = fdiv(units, POW10[decimals]).toFixed(0);
    if (decimals === 0) return whole;
    let frac = fmod(units, POW10[decimals]).toFixed(0).padStart(decimals, "0").replace(/0+$/, "");
    return frac === "" ? whole : whole + "." + frac;
  }

  function scientific(abs, decimals) {
    let [mantissa, exponent] = abs.toExponential(decimals).split("e");
    if (mantissa.includes(".")) mantissa = mantissa.replace(/0+$/, "").replace(/\.$/, "");
    return `${mantissa}e${Number(exponent)}`;
  }

  function abbreviate(n, decimals = 2) {
    if (Number.isNaN(n)) return "NaN";
    if (n === Infinity) return "inf";
    if (n === -Infinity) return "-inf";
    const abs = Math.abs(n);
    let tier = 0;
    while (tier < SUFFIXES.length && abs >= POW10[3 * (tier + 1)]) tier++;
    let units = roundShifted(abs, 3 * tier - decimals);
    if (units >= POW10[3 + decimals] && tier < SUFFIXES.length) {
      tier++;
      units = roundShifted(abs, 3 * tier - decimals);
    }
    let text = units >= POW10[3 + decimals] ? scientific(abs, decimals) : fixed(units, decimals) + (tier === 0 ? "" : SUFFIXES[tier - 1][0]);
    if (n < 0 && text !== "0") text = "-" + text;
    return text;
  }

  // "1.5Qa" -> 1.5e15. Suffixes are matched case-insensitively (they don't clash).
  function parse(text) {
    const m = String(text).trim().replace(/,/g, "").match(/^(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*([a-z]*)$/i);
    if (!m) return null;
    const value = Number(m[1]);
    if (!m[2]) return value;
    const i = SUFFIXES.findIndex(([s]) => s.toLowerCase() === m[2].toLowerCase());
    return i < 0 ? null : value * POW10[3 * (i + 1)];
  }

  root.Suffixes = { SUFFIXES, abbreviate, parse };
})(typeof window !== "undefined" ? window : globalThis);
