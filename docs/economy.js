// Same formulas as skills/roblox-simulator-economy/scripts/economy_math.luau,
// for the in-browser calculator. Also loads under Node for checking.
(function (root) {
  const levelCost = (base, growth, level) => Math.floor(base * growth ** level);

  const cumulativeCostExact = (base, growth, from, to) => {
    let total = 0;
    for (let level = from; level < to; level++) total += levelCost(base, growth, level);
    return total;
  };

  const rebirthRequirement = (base, growth, done) => Math.floor(base * growth ** done);
  const rebirthMultiplier = (perRebirth, done) => 1 + done * perRebirth;
  const secondsToEarn = (amount, perSecond) => (perSecond <= 0 ? Infinity : amount / perSecond);

  const offlineIncome = (secondsAway, perSecond, maxHours, efficiency) =>
    secondsAway <= 0 ? 0 : Math.floor(Math.min(secondsAway, maxHours * 3600) * perSecond * efficiency);

  // Same layout as balance.luau's output, as data.
  function pacing(config) {
    const up = config.upgrade;
    const upgrades = [];
    let totalTime = 0;
    for (let level = 0; level < up.levels; level++) {
      const income = config.baseIncome + level * up.incomePerLevel;
      const price = levelCost(up.baseCost, up.costGrowth, level);
      const wait = secondsToEarn(price, income);
      totalTime += wait;
      upgrades.push({ level: level + 1, price, spent: cumulativeCostExact(up.baseCost, up.costGrowth, 0, level + 1), income, wait });
    }
    const rb = config.rebirth;
    const income = config.baseIncome + up.levels * up.incomePerLevel;
    const rebirths = [];
    let previous = null;
    for (let done = 0; done < rb.count; done++) {
      const requirement = rebirthRequirement(rb.baseRequirement, rb.requirementGrowth, done);
      const multiplier = rebirthMultiplier(rb.multiplierPerRebirth, done);
      const wait = secondsToEarn(requirement, income * multiplier);
      rebirths.push({ rebirth: done + 1, requirement, multiplier, wait, ratio: previous ? wait / previous : null });
      previous = wait;
    }
    const off = config.offline;
    return {
      upgrades,
      totalTime,
      rebirthIncome: income,
      rebirths,
      offlineMax: offlineIncome(off.maxHours * 3600, income, off.maxHours, off.efficiency),
    };
  }

  // Same format as balance.luau's clock(): truncates like Luau's %d.
  function clock(seconds) {
    if (seconds === Infinity) return "never";
    const s = Math.trunc(seconds);
    const pad = (n) => String(n).padStart(2, "0");
    if (seconds < 60) return `${s}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${pad(Math.trunc(seconds % 60))}s`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${pad(Math.floor((seconds % 3600) / 60))}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  }

  // Fixed decimals like C/Luau string.format("%.Nf"): exact halves round to even
  // (2.625 -> "2.62"), where JS toFixed would give "2.63".
  function fixed(value, decimals) {
    const scaled = value * 10 ** decimals;
    const floor = Math.floor(scaled);
    const frac = scaled - floor;
    const rounded = frac > 0.5 || (frac === 0.5 && floor % 2 !== 0) ? floor + 1 : floor;
    return (rounded / 10 ** decimals).toFixed(decimals);
  }

  root.Economy = { levelCost, cumulativeCostExact, rebirthRequirement, rebirthMultiplier, secondsToEarn, offlineIncome, pacing, clock, fixed };
})(typeof window !== "undefined" ? window : globalThis);
