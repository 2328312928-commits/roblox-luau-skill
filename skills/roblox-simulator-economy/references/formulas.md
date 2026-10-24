# Formulas and a worked example

## Geometric upgrade costs

Owning `n` levels, the next one costs `c(n) = floor(b * g^n)`.

Ignoring the floor, going from `a` to `b` levels costs

    S(a, b) = sum_{n=a}^{b-1} b0 * g^n = b0 * g^a * (g^(b-a) - 1) / (g - 1)    (g > 1)

and `b0 * (b - a)` when `g = 1`. The floored total players actually pay is a little less: at most
one coin less per level.

**Buy max** without the floor: the largest `k` with `S(a, a+k) <= M` is

    k = floor( log(1 + M * (g - 1) / (b0 * g^a)) / log(g) )

With floored prices this can be off by one, so `economy_math.maxAffordable` loops instead.

**How fast prices grow:** price doubles every `log(2) / log(g)` levels, i.e. every 5 levels at
g = 1.15, every 10 at g = 1.07, every 2 at g = 1.5.

## Rebirth pacing

With requirement `R_k = R0 * r^k`, an additive multiplier `m_k = 1 + k*p` and a fixed base income
`I` (everything else resets), the wait for rebirth `k+1` is `T_k = R_k / (I * m_k)`. The ratio
between consecutive waits is

    T_{k+1} / T_k = r * (1 + k*p) / (1 + (k+1)*p)

It starts at `r / (1 + p)` and climbs towards `r`. To keep each rebirth about x1.3 longer than the
last with `p = 0.5`, `r` needs to be about 1.3 * 1.5 = 1.95 early on, and the ratio drifts towards
1.95 later. A multiplicative multiplier `m_k = q^k` gives a constant ratio `r / q`.

## Worked example (the calculator's defaults)

`baseIncome 1, baseCost 10, costGrowth 1.15, +1 income/level, 40 levels;`
`baseRequirement 1e6, requirementGrowth 3, +0.5 per rebirth`

- Reaching level 40 takes about 10 minutes, and the last levels take about a minute each: good early pacing.
- Rebirth 1 at 41 income/s takes 6h 46m; rebirth 8 takes 137 days. The `vs prev` column
  goes x2.00, x2.25, ... x2.67, which is the formula above with r = 3, p = 0.5.
- Fix: `requirementGrowth` 1.8 with `p = 0.5` gives about x1.2 rising to x1.6 per rebirth, or keep
  r = 3 and use a multiplicative multiplier of 2.4 for a constant x1.25.

## Offline earnings

    paid = floor( min(away, maxHours * 3600) * rate * efficiency ),   away <= 0  ->  0

`away` is server time now minus server time saved on leave. Clamp before multiplying so a huge gap
or a corrupted timestamp can't overflow.
