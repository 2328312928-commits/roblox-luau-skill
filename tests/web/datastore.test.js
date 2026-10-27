// Tests for docs/datastore-limits/datastore.js. From the repo root: node tests/web/datastore.test.js
const assert = require("assert");
require("../../docs/datastore-limits/datastore.js");
const D = globalThis.DataStoreLimits;

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

test("request budgets follow base + players × perPlayer", () => {
  const read = D.REQUEST_LIMITS.find((l) => l.type === "Standard read");
  const orderedWrite = D.REQUEST_LIMITS.find((l) => l.type === "Ordered write");
  assert.strictEqual(D.budget(read, 0), 60);
  assert.strictEqual(D.budget(read, 20), 860);
  assert.strictEqual(D.budget(orderedWrite, 20), 130);
  assert.strictEqual(D.REQUEST_LIMITS.length, 8);
});

test("throughput is billed in whole kilobytes, at least 1 KB", () => {
  assert.strictEqual(D.billedBytes(0), 1024);
  assert.strictEqual(D.billedBytes(1), 1024);
  assert.strictEqual(D.billedBytes(1024), 1024);
  assert.strictEqual(D.billedBytes(1025), 2048);
});

test("storage limit is 500 MB + 1 MB per lifetime user", () => {
  assert.strictEqual(D.storageLimitBytes(0), 500 * 1024 * 1024);
  assert.strictEqual(D.storageLimitBytes(10000), 10500 * 1024 * 1024);
});

test("utf8Bytes counts bytes, not characters", () => {
  assert.strictEqual(D.utf8Bytes('{"a":1}'), 7);
  assert.strictEqual(D.utf8Bytes("金币"), 6);
});

test("plan: a typical server is far under every limit", () => {
  const p = D.plan({ players: 20, autosaveSeconds: 60, keysPerSave: 1, saveBytes: 5000, lifetimeUsers: 10000 });
  assert.strictEqual(p.writeBudget, 860);
  assert.strictEqual(p.writesPerMinute, 20);
  assert.ok(p.writeShare < 0.03);
  assert.strictEqual(p.perKeyBytesPerMinute, 5 * 1024);
  assert.ok(p.storageShare < 0.01);
});

test("plan: saving too often or too big shows up as a share above 1", () => {
  const p = D.plan({ players: 50, autosaveSeconds: 1, keysPerSave: 2, saveBytes: 100000, lifetimeUsers: 100 });
  assert.ok(p.writeShare > 1, "6000 writes/min vs 2060 budget");
  assert.ok(p.perKeyShare > 1, "60 writes × 98 KB per key per minute is over 4 MB");
  const huge = D.plan({ players: 1, autosaveSeconds: 60, keysPerSave: 1, saveBytes: 5e6, lifetimeUsers: 1 });
  assert.ok(huge.valueShare > 1, "5 MB value is over the 4,194,304 limit");
});

test("plan: autosave off means no autosave writes", () => {
  const p = D.plan({ players: 10, autosaveSeconds: 0, keysPerSave: 1, saveBytes: 1000, lifetimeUsers: 1 });
  assert.strictEqual(p.writesPerMinute, 0);
  assert.strictEqual(p.perKeyBytesPerMinute, 0);
});

console.log(`\n${passed} passed${process.exitCode ? ", some failed" : ", 0 failed"}`);
