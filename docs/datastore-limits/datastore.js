// Roblox DataStore limits, from
// https://create.roblox.com/docs/cloud-services/data-stores/error-codes-and-limits
// (checked 2026-10-27; that page was updated the same day). Used by
// datastore-limits/index.html and tests/web/datastore.test.js.
(function (root) {
  const CHECKED = "2026-10-27";

  // Per game server, per minute: base + players × perPlayer.
  const REQUEST_LIMITS = [
    { type: "Standard read", base: 60, perPlayer: 40, covers: "GetAsync, GetVersionAsync, GetVersionAtTimeAsync, read part of UpdateAsync" },
    { type: "Standard write", base: 60, perPlayer: 40, covers: "SetAsync, IncrementAsync, write part of UpdateAsync" },
    { type: "Standard list", base: 5, perPlayer: 2, covers: "ListDataStoresAsync, ListKeysAsync, ListVersionsAsync" },
    { type: "Standard remove", base: 60, perPlayer: 40, covers: "RemoveAsync" },
    { type: "Ordered read", base: 60, perPlayer: 40, covers: "OrderedDataStore:GetAsync, BatchGetAsync, read part of UpdateAsync" },
    { type: "Ordered write", base: 30, perPlayer: 5, covers: "OrderedDataStore:SetAsync, IncrementAsync, write part of UpdateAsync" },
    { type: "Ordered list", base: 5, perPlayer: 2, covers: "OrderedDataStore:GetSortedAsync" },
    { type: "Ordered remove", base: 30, perPlayer: 5, covers: "OrderedDataStore:RemoveAsync" },
  ];

  const VALUE_LIMIT_CHARS = 4194304; // per key, after JSON serialization
  const KEY_WRITE_BYTES_PER_MIN = 4 * 1024 * 1024; // per key, all servers, rolling minute
  const KEY_READ_BYTES_PER_MIN = 25 * 1024 * 1024;
  const NAME_LIMIT = 50; // data store name, key name, scope

  const budget = (limit, players) => limit.base + players * limit.perPlayer;

  // Throughput is rounded up to the next kilobyte per request.
  const billedBytes = (bytes) => Math.max(1, Math.ceil(bytes / 1024)) * 1024;

  // Total latest-version storage: 500 MB + 1 MB × lifetime users.
  const storageLimitBytes = (lifetimeUsers) => (500 + lifetimeUsers) * 1024 * 1024;

  const utf8Bytes = (text) => new TextEncoder().encode(text).length;

  // Plan check for one server: autosave every `autosaveSeconds` for each of
  // `players`, each save writing `keysPerSave` keys of `saveBytes` bytes.
  function plan({ players, autosaveSeconds, keysPerSave, saveBytes, lifetimeUsers }) {
    const write = REQUEST_LIMITS[1];
    const writeBudget = budget(write, players);
    const writesPerMinute = autosaveSeconds > 0 ? players * keysPerSave * (60 / autosaveSeconds) : 0;
    const perKeyWritesPerMinute = autosaveSeconds > 0 ? 60 / autosaveSeconds : 0;
    const perKeyBytesPerMinute = perKeyWritesPerMinute * billedBytes(saveBytes);
    const storageNeed = lifetimeUsers * keysPerSave * saveBytes; // uncompressed upper bound
    return {
      writeBudget,
      writesPerMinute,
      writeShare: writeBudget > 0 ? writesPerMinute / writeBudget : Infinity,
      valueShare: saveBytes / VALUE_LIMIT_CHARS,
      perKeyBytesPerMinute,
      perKeyShare: perKeyBytesPerMinute / KEY_WRITE_BYTES_PER_MIN,
      storageLimit: storageLimitBytes(lifetimeUsers),
      storageNeed,
      storageShare: storageNeed / storageLimitBytes(lifetimeUsers),
    };
  }

  root.DataStoreLimits = {
    CHECKED, REQUEST_LIMITS, VALUE_LIMIT_CHARS, KEY_WRITE_BYTES_PER_MIN, KEY_READ_BYTES_PER_MIN, NAME_LIMIT,
    budget, billedBytes, storageLimitBytes, utf8Bytes, plan,
  };
})(typeof window !== "undefined" ? window : globalThis);
