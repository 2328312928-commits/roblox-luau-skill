// Checks docs/number-suffixes/suffixes.js against the Luau original.
//   node tests/web/suffixes_parity.js path/to/NumberFormat.luau
// Needs Lune (https://github.com/lune-org/lune). Runs the same values through
// NumberFormat.abbreviate in Lune and Suffixes.abbreviate in Node, decimals 0-6,
// and exits 1 on any difference.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
require("../../docs/number-suffixes/suffixes.js");

const luauModule = process.argv[2];
if (!luauModule || !fs.existsSync(luauModule)) {
  console.error("usage: node tests/web/suffixes_parity.js path/to/NumberFormat.luau");
  process.exit(1);
}

// Deterministic values: every power of ten up to 1e70, values just below each
// rollover, a pseudo-random spread, and their negatives.
let seed = 42;
const rand = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
const values = [0, 1, 999, 1000, 999.5, 999.95, 999950, 999999, 2 ** 53, 1e63, 9.99995e65, 1e66, 1.5e300, 0.004, 12.345];
for (let e = 0; e < 70; e++) {
  for (let i = 0; i < 40; i++) values.push((1 + rand() * 998.999) * 10 ** e);
  for (const k of [0.9995, 0.99995, 0.999995, 1]) values.push(k * 10 ** (e + 3));
}
values.push(...values.slice(0, 300).map((v) => -v));

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "suffix-parity-"));
fs.copyFileSync(luauModule, path.join(dir, "NumberFormat.luau"));
fs.writeFileSync(path.join(dir, "vals.txt"), values.map((v) => v.toPrecision(17)).join("\n"));
fs.writeFileSync(
  path.join(dir, "run.luau"),
  `local fs = require("@lune/fs")
local NF = require("./NumberFormat")
local out = {}
for line in string.gmatch(fs.readFile("vals.txt"), "[^\\n]+") do
	for d = 0, 6 do table.insert(out, NF.abbreviate(tonumber(line) :: number, d)) end
end
fs.writeFile("lua_out.txt", table.concat(out, "\\n"))
`
);
execFileSync("lune", ["run", "run.luau"], { cwd: dir, stdio: "inherit" });
const lua = fs.readFileSync(path.join(dir, "lua_out.txt"), "utf8").split("\n");
const parsed = fs.readFileSync(path.join(dir, "vals.txt"), "utf8").split("\n").map(Number);
const js = [];
for (const n of parsed) for (let d = 0; d <= 6; d++) js.push(Suffixes.abbreviate(n, d));

let diffs = 0;
js.forEach((s, i) => {
  if (s !== lua[i] && diffs++ < 10) console.log(`DIFF value=${parsed[Math.floor(i / 7)]} decimals=${i % 7}: lua=${lua[i]} js=${s}`);
});
console.log(`${diffs} differences out of ${js.length}`);
process.exit(diffs ? 1 : 0);
