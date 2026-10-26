// Tests for docs/odds/odds.js. From the repo root: node tests/web/odds.test.js
const assert = require("assert");
require("../../docs/odds/odds.js");
const O = globalThis.Odds;

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    console.log(`FAIL  ${name}\n      ${e.message}`);
    process.exitCode = 1;
  }
};

test("minDecimals: four places below the first non-zero digit", () => {
  assert.strictEqual(O.minDecimals(12.3456), 3);
  assert.strictEqual(O.minDecimals(5), 4);
  assert.strictEqual(O.minDecimals(0.0123), 6);
  assert.strictEqual(O.minDecimals(100), 2);
  assert.strictEqual(O.minDecimals(0.5, 1), 6);
});

test("roundTo: half up, trailing zeros dropped, no float drift", () => {
  assert.strictEqual(O.roundTo(12.3456, 3).text, "12.346");
  assert.strictEqual(O.roundTo(25, 4).text, "25");
  assert.strictEqual(O.roundTo(0.01234567, 6).text, "0.012346");
  assert.strictEqual(O.roundTo(33.333333333, 3).text, "33.333");
});

test("exact odds need no disclaimer and sum to exactly 100", () => {
  const r = O.disclose([{ name: "A", weight: 1 }, { name: "B", weight: 1 }, { name: "C", weight: 2 }]);
  assert.deepStrictEqual(r.rows.map((x) => x.shown), ["25", "25", "50"]);
  assert.strictEqual(r.sumIsExactly100, true);
  assert.strictEqual(r.needsDisclaimer, false);
  assert.strictEqual(r.disclaimer, null);
});

test("thirds are rounded, flagged, and get Roblox's disclaimer", () => {
  const r = O.disclose([{ name: "A", weight: 1 }, { name: "B", weight: 1 }, { name: "C", weight: 1 }]);
  assert.deepStrictEqual(r.rows.map((x) => x.shown), ["33.333", "33.333", "33.333"]);
  assert.strictEqual(r.displayedSum, "99.999");
  assert.strictEqual(r.sumIsExactly100, false);
  assert.strictEqual(r.disclaimer, O.DISCLAIMER);
  assert.strictEqual(r.identical, "Odds for each item listed below: 33.333%");
});

test("a rare outcome keeps enough precision", () => {
  const r = O.disclose([{ name: "Common", weight: 9999 }, { name: "Mythic", weight: 1 }]);
  assert.strictEqual(r.rows[1].shown, "0.01");
  assert.strictEqual(r.rows[0].shown, "99.99");
  assert.strictEqual(r.sumIsExactly100, true);
  assert.strictEqual(r.needsDisclaimer, false);
  const tiny = O.disclose([{ name: "Common", weight: 7777777 }, { name: "Secret", weight: 3 }]);
  assert.strictEqual(tiny.rows[1].shown, "0.000038571", "5 significant digits for 0.0000385714...%");
  assert.strictEqual(tiny.needsDisclaimer, true);
});

test("zero, negative and non-numeric weights are ignored", () => {
  const r = O.disclose([{ name: "A", weight: 3 }, { name: "B", weight: 0 }, { name: "C", weight: -2 }, { name: "D", weight: NaN }, { name: "E", weight: 1 }]);
  assert.deepStrictEqual(r.rows.map((x) => x.name), ["A", "E"]);
  assert.deepStrictEqual(r.rows.map((x) => x.shown), ["75", "25"]);
});

test("luck boost multiplies only the named weights", () => {
  const base = [{ name: "Common", weight: 90 }, { name: "Legendary", weight: 10 }];
  const r = O.disclose(O.boosted(base, ["Legendary"], 2));
  assert.strictEqual(r.rows[1].shown, "18.182");
  assert.strictEqual(r.rows[0].shown, "81.818");
});

test("pity: chance within N rolls and expected rolls", () => {
  assert.strictEqual(O.chanceWithin(0.01, 60, 60), 1);
  assert.ok(Math.abs(O.chanceWithin(0.01, 59, 60) - (1 - 0.99 ** 59)) < 1e-12);
  assert.ok(Math.abs(O.expectedRolls(0.01, 60) - (1 - 0.99 ** 60) / 0.01) < 1e-9);
  assert.strictEqual(O.expectedRolls(0.01), 100);
  assert.strictEqual(O.expectedRolls(0, 50), 50);
});

test("disclosure text and Luau table", () => {
  const outcomes = [{ name: "Coin", weight: 3 }, { name: "Gem", weight: 1 }];
  const r = O.disclose(outcomes);
  assert.strictEqual(O.disclosureText(r, { name: "Gem", at: 10 }), "Coin: 75%\nGem: 25%\nPity: Gem is guaranteed on or before roll 10 since your last Gem.");
  assert.strictEqual(O.luauTable(outcomes), 'local entries = {\n\t{ id = "Coin", weight = 3 },\n\t{ id = "Gem", weight = 1 },\n}');
});

console.log(`\n${passed} passed${process.exitCode ? ", some failed" : ", 0 failed"}`);
