// Odds maths for Roblox paid random items (eggs, crates, spins).
// Runs in the browser (odds/index.html) and under Node (tests/web/odds.test.js).
(function (root) {
  const DISCLAIMER = "Probabilities are rounded; total of displayed individual probabilities may not equal 100%.";

  // Decimal places Roblox's rounding rule allows at the minimum: four places
  // below the place of the first non-zero digit (12.3456% -> 3 places,
  // 0.0123% -> 6 places). `extra` adds more places.
  function minDecimals(percent, extra = 0) {
    if (!(percent > 0)) return 0;
    const firstDigitPlace = Math.floor(Math.log10(percent));
    return Math.max(0, 4 - firstDigitPlace) + extra;
  }

  // Exact decimal string of `value` rounded half-up to `decimals` places,
  // without trailing zeros. Uses BigInt so long decimals don't drift.
  function roundTo(value, decimals) {
    const scaledValue = value * 10 ** decimals;
    let units = BigInt(Math.round(scaledValue));
    // Past 2^53 Math.round loses precision, so round from the decimal string instead.
    if (!Number.isSafeInteger(Math.round(scaledValue))) {
      const [int, frac = ""] = value.toFixed(Math.min(decimals + 2, 100)).split(".");
      const digits = BigInt(int + frac.slice(0, decimals).padEnd(decimals, "0"));
      const next = Number(frac[decimals] || "0");
      units = digits + (next >= 5 ? 1n : 0n);
    }
    return { units, decimals, text: unitsToText(units, decimals) };
  }

  function unitsToText(units, decimals) {
    const negative = units < 0n;
    let s = (negative ? -units : units).toString().padStart(decimals + 1, "0");
    let text = decimals > 0 ? s.slice(0, -decimals) + "." + s.slice(-decimals) : s;
    if (decimals > 0) text = text.replace(/0+$/, "").replace(/\.$/, "");
    return (negative ? "-" : "") + text;
  }

  // outcomes: [{ name, weight }] with weight > 0. Returns each outcome's exact
  // percent and its displayed (rounded) percent, plus whether a disclaimer is needed.
  function disclose(outcomes, extra = 0) {
    const valid = outcomes.filter((o) => o.weight > 0 && Number.isFinite(o.weight));
    const total = valid.reduce((sum, o) => sum + o.weight, 0);
    const rows = valid.map((o) => {
      const percent = (o.weight / total) * 100;
      const decimals = minDecimals(percent, extra);
      const shown = roundTo(percent, decimals);
      const exact = Math.abs(Number(shown.text) - percent) <= Math.max(1e-12, percent * 1e-12);
      return { name: o.name, weight: o.weight, percent, shown: shown.text, decimals, rounded: !exact };
    });
    // Sum the displayed strings exactly at the largest precision used.
    const places = rows.reduce((m, r) => Math.max(m, r.decimals), 0);
    const scale = 10n ** BigInt(places);
    const sumUnits = rows.reduce((sum, r) => {
      const [int, frac = ""] = r.shown.split(".");
      return sum + BigInt(int) * scale + BigInt((frac + "0".repeat(places)).slice(0, places) || "0");
    }, 0n);
    const displayedSum = unitsToText(sumUnits, places);
    const anyRounded = rows.some((r) => r.rounded);
    const allSame = rows.length > 1 && rows.every((r) => r.weight === rows[0].weight);
    return {
      rows,
      total,
      displayedSum,
      sumIsExactly100: sumUnits === 100n * scale,
      needsDisclaimer: anyRounded,
      disclaimer: anyRounded ? DISCLAIMER : null,
      identical: allSame ? `Odds for each item listed below: ${rows[0].shown}%` : null,
    };
  }

  // Applies a luck boost: multiplies the weights of the named outcomes.
  function boosted(outcomes, names, multiplier) {
    return outcomes.map((o) => (names.includes(o.name) ? { ...o, weight: o.weight * multiplier } : o));
  }

  // Hard pity: guaranteed on or before roll `pityAt` since the last hit, with
  // base chance `p` (0..1) per roll otherwise.
  // Chance of at least one hit within `rolls` rolls.
  function chanceWithin(p, rolls, pityAt) {
    if (pityAt && rolls >= pityAt) return 1;
    return 1 - (1 - p) ** rolls;
  }

  // Expected rolls per hit: sum of P(no hit in the first i rolls) for i < pityAt.
  function expectedRolls(p, pityAt) {
    if (!pityAt) return p > 0 ? 1 / p : Infinity;
    if (p <= 0) return pityAt;
    return (1 - (1 - p) ** pityAt) / p;
  }

  // Disclosure text for a game UI: one line per outcome, then the disclaimer.
  function disclosureText(result, pity) {
    const lines = result.identical
      ? [result.identical, ...result.rows.map((r) => r.name)]
      : result.rows.map((r) => `${r.name}: ${r.shown}%`);
    if (pity) {
      lines.push(`Pity: ${pity.name} is guaranteed on or before roll ${pity.at} since your last ${pity.name}.`);
    }
    if (result.disclaimer) lines.push(result.disclaimer);
    return lines.join("\n");
  }

  // Luau weight table (works with weighted-random loot tables).
  function luauTable(outcomes) {
    const body = outcomes
      .filter((o) => o.weight > 0)
      .map((o) => `\t{ id = ${JSON.stringify(o.name)}, weight = ${o.weight} },`)
      .join("\n");
    return `local entries = {\n${body}\n}`;
  }

  root.Odds = { DISCLAIMER, minDecimals, roundTo, disclose, boosted, chanceWithin, expectedRolls, disclosureText, luauTable };
})(typeof window !== "undefined" ? window : globalThis);
