# roblox-luau-skill

Claude Skills for Roblox / Luau development. Free, MIT licensed.

| Skill | Use it for |
|---|---|
| [`roblox-simulator-economy`](skills/roblox-simulator-economy/SKILL.md) | Designing and balancing simulator / tycoon / idle economies: upgrade cost curves, buy-max, rebirth requirements and multipliers, offline earnings, big-number display, server-authoritative purchases, tamper-safe saves, and odds disclosure for paid random items. Includes a Lune **pacing calculator** that shows where your curve stalls. |

Other Roblox skill collections already cover general Luau scripting, networking, DataStores and
tooling well (for example [scenario-labs/skills](https://github.com/scenario-labs/skills) and
[awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)).
This repo focuses on the economy maths those don't.

## Install

Claude Code: copy the skill folder into your project's `.claude/skills/` (or `~/.claude/skills/`
for all projects):

```bash
git clone https://github.com/2328312928-commits/roblox-luau-skill
cp -r roblox-luau-skill/skills/roblox-simulator-economy ~/.claude/skills/
```

Claude.ai: zip the `roblox-simulator-economy` folder and upload it under Settings → Capabilities → Skills.

## Try the calculator

**In your browser:** https://2328312928-commits.github.io/roblox-luau-skill/ (same maths, shareable links).

**Egg / crate odds:** https://2328312928-commits.github.io/roblox-luau-skill/odds/ turns weights into the percentages Roblox's paid-random-items policy requires (rounding, disclaimer, pity, luck boosts).

**Number suffixes:** https://2328312928-commits.github.io/roblox-luau-skill/number-suffixes/ lists K … Vg with a converter both ways.

**DataStore limits:** https://2328312928-commits.github.io/roblox-luau-skill/datastore-limits/ shows the current request budgets for your server size (60 + players × 40 per minute for reads and writes) and checks an autosave plan and save size against them.

**From the command line**, with [Lune](https://github.com/lune-org/lune):

```bash
cd skills/roblox-simulator-economy
lune run scripts/balance.luau            # built-in example: shows a rebirth curve that stalls
lune run scripts/balance.luau my.json    # your numbers
lune run tests/run.luau                  # tests for the formulas
```

Example output (default config): rebirth 1 takes 6h 46m, rebirth 8 takes 137 days, because each
rebirth is x2.0-x2.7 slower than the last. `requirementGrowth` 1.8 brings that to x1.2-x1.6.

## Related

- Free modules: [roblox-rate-limiter](https://github.com/2328312928-commits/roblox-rate-limiter)
- Paid, tested Luau kits by the same author (optional, not needed by the skill):
  [Game Systems Kit](https://kettlewick.gumroad.com/l/roblox-game-systems-kit),
  [Progression Kit](https://kettlewick.gumroad.com/l/roblox-progression-kit)

## Disclosure

Written with the help of an AI coding assistant. The formulas are covered by tests, the numbers in
this README come from running the calculator, and the paid-random-items rules link to Roblox's
own documentation. Issues and corrections are welcome.
