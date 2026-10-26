---
name: roblox-simulator-economy
description: Use when designing, balancing or implementing the economy of a Roblox simulator, tycoon, clicker or idle game in Luau — upgrade cost curves, "buy max", income per second, rebirth/prestige requirements and multipliers, offline earnings, big-number display (1.5K, 3.4M, 2Qa), server-authoritative purchases, save data that survives exploiters, and odds disclosure for paid random items (eggs, crates, spins). Also when players say progress "stalls", "rebirth takes forever", "numbers show 1000K", "offline gives too much", or "players get free coins".
---

# Roblox Simulator Economy

Design the numbers first, then implement them so the server owns every amount. Most simulator
economies fail in one of two ways: the curve stalls (each rebirth takes 2-3x longer than the last,
players quit), or the server trusts the client (exploiters set their own coins). This skill covers both.

## When to use

- Picking `baseCost`, `costGrowth`, rebirth requirement and multiplier values, or checking existing ones.
- Writing upgrade, currency, rebirth or offline-earnings code in Luau.
- Showing large numbers to players.
- Adding eggs, crates or spins that can be bought with Robux (or with currency bought with Robux).

## Workflow

1. **Write the numbers down as a config table**, not scattered constants: base income, each
   upgrade's `baseCost` / `costGrowth` / effect, rebirth `baseRequirement` / `requirementGrowth` /
   `multiplierPerRebirth`, offline `maxHours` / `efficiency`.
2. **Run the pacing calculator** before writing gameplay code:
   `lune run scripts/balance.luau my_economy.json` (copy the defaults printed by
   `lune run scripts/balance.luau` as a starting point). Read the `wait` and `vs prev` columns.
3. **Tune until the pacing is what you want** (targets below), then implement with the patterns in
   this file. Keep the config as the single source of truth for both.
4. **Test the maths outside Studio** with Lune (`lune run tests/run.luau` shows the pattern); engine
   behaviour still needs a playtest.

## The formulas

| Quantity | Formula | Notes |
|---|---|---|
| Price of next level | `floor(baseCost * costGrowth ^ owned)` | `costGrowth` 1.07-1.15 for upgrades bought many times; 1.5-3 for rare big ones |
| Cost from level a to b | `baseCost * g^a * (g^(b-a) - 1) / (g - 1)` | Players pay the floored per-level sum, which is slightly less |
| Buy max | loop prices until the next one exceeds the money | The loop is safer than the log formula with floored prices |
| Rebirth requirement k | `baseRequirement * requirementGrowth ^ k` | |
| Rebirth multiplier | `1 + k * multiplierPerRebirth` | Additive multipliers grow slowly; multiplicative ones (`m ^ k`) explode |
| Offline income | `min(away, maxHours * 3600) * rate * efficiency` | Away time ≤ 0 (clock went back) pays 0 |

Exact derivations and a worked example: [references/formulas.md](references/formulas.md).

## Pacing targets (rules of thumb, not laws)

- **Early upgrades** should take seconds; the first 10 levels set the "this feels good" moment.
- **Time per rebirth should grow slowly**, e.g. x1.2-x1.5 per rebirth. The calculator's `vs prev`
  column shows this ratio. With an additive multiplier, the ratio is about
  `requirementGrowth * (1 + k*p) / (1 + (k+1)*p)`, so `requirementGrowth = 3` with `p = 0.5` gives
  x2.0-x2.7 per rebirth: rebirth 8 takes months. Lower `requirementGrowth` or raise `p`.
- **Offline earnings below online earnings**: efficiency 0.25-0.5 and an 8-12 hour cap keep
  playing worth more than idling, without punishing people who log off.

## Implementation patterns

- **The server owns every amount.** A RemoteEvent says *what the player wants* ("buy upgrade
  Speed"), never *how much* ("add 500 coins"). The server looks up the price, checks the balance,
  spends and grants in one step. Rate-limit remotes per player (token bucket).
- **Spend atomically.** Check all currencies first, then subtract; never leave a half-paid state.
  For multi-currency costs, check `canAfford(costs)` for every currency before changing any.
- **Rebirth on the server with the current amount**: `if amount >= requirement then` reset wallet
  and upgrades, increment the count. Never accept "I rebirthed" from the client.
- **Doubles are exact only up to 2^53 (about 9e15).** Above that, integer coin counts lose
  precision; if your economy goes past ~1e15, store a mantissa/exponent pair or log10 values
  instead of plain numbers.
- **Save data must survive tampering and old versions.** On load: check types, reject NaN/inf and
  negative or fractional amounts, clamp levels to the current max, skip unknown ids, and treat
  timestamps in the future as "now". Loading must never error; return what you repaired. NaN and
  inf are not valid JSON, so validate before saving to a DataStore.
- **Offline time comes from the server clock** (`os.time()` on the server), saved on leave. Never
  trust a client-sent timestamp.

## Big-number display

- Suffixes: K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, then Ud, Dd, Td, Qad, Qid, Sxd, Spd, Ocd, Nod, Vg (1e63).
- **The rollover bug:** formatting 999,950 with one decimal as `999950 / 1000 = 999.95 → "1000.0K"`.
  Round first, and if the rounded value reaches 1000, move to the next suffix ("1.0M").
- Format on the client for display only; never parse a formatted string back into a number.

## Paid random items (eggs, crates, spins)

If an item with a random outcome can be bought with Robux, or with in-game currency that can be
bought with Robux, Roblox's policy requires showing **every possible outcome and its odds as
percentages that sum to exactly 100%**, before purchase, including the effect of luck boosts and
pity systems, updated live when they change. A bare "(i)" icon is not enough; label it "Info" or
"Odds". Source: [Roblox paid random items guidelines](https://create.roblox.com/docs/production/monetization/paid-random-items).

- Compute displayed odds from the same weight table the server rolls with, so they can't drift.
- Rounding: long decimals may be rounded to four or more decimal places below the first non-zero
  digit, but then the disclaimer "Probabilities are rounded; total of displayed individual
  probabilities may not equal 100%." must be shown. A browser checker that does this from your
  weights: https://2328312928-commits.github.io/roblox-luau-skill/odds/
- Pity ("guaranteed within N") changes the odds; disclose it.

## Common mistakes

- Tuning by feel in Studio instead of looking at the pacing table, then discovering rebirth 6 takes weeks.
- `costGrowth` of 1.5+ on an upgrade meant to be bought 50 times (level 50 costs 637 million times level 0).
- Multiplicative rebirth multipliers (`1.5 ^ k`) without a matching requirement curve: the late game breaks.
- Client-side purchase checks only, or a remote that accepts an amount.
- Offline earnings computed from a client timestamp, or with no cap.
- `math.floor(x * 10) / 10` formatting that prints "1000K".
- Saving NaN after a division by zero, then the save fails or loads as garbage.

## Files

- `scripts/balance.luau`: pacing calculator (Lune). Prints price, total spent, income and wait
  per upgrade level, and requirement, multiplier, wait and growth ratio per rebirth.
- `scripts/economy_math.luau`: the formulas as pure Luau functions (usable in Roblox too).
- `tests/run.luau`: tests for the formulas (`lune run tests/run.luau`).
- `references/formulas.md`: derivations and a worked example.
