-- Tests for economy_math. From the skill folder: lune run tests/run.luau

local EconomyMath = require("../scripts/economy_math")

local passed, failed = 0, 0

local function test(name: string, fn: () -> ())
	local ok, err = pcall(fn)
	if ok then
		passed += 1
	else
		failed += 1
		print(`FAIL  {name}\n      {err}`)
	end
end

local function eq(actual: any, expected: any, label: string?)
	if actual ~= expected then
		error(`{label or "value"}: expected {tostring(expected)}, got {tostring(actual)}`, 2)
	end
end

local function near(actual: number, expected: number, tolerance: number, label: string)
	if math.abs(actual - expected) > tolerance then
		error(`{label}: expected ~{expected}, got {actual}`, 2)
	end
end

test("levelCost floors base * growth ^ level", function()
	eq(EconomyMath.levelCost(10, 1.15, 0), 10, "level 0")
	eq(EconomyMath.levelCost(10, 1.15, 1), 11, "level 1 (11.5 floored)")
	eq(EconomyMath.levelCost(100, 2, 10), 102400, "doubling")
end)

test("cumulativeCost matches the summed series", function()
	local loop = 0
	for level = 3, 19 do
		loop += 50 * 1.2 ^ level
	end
	near(EconomyMath.cumulativeCost(50, 1.2, 3, 20), loop, 1e-6, "geometric sum")
	eq(EconomyMath.cumulativeCost(50, 1, 3, 20), 50 * 17, "flat growth")
	eq(EconomyMath.cumulativeCost(50, 1.2, 5, 5), 0, "empty range")
end)

test("cumulativeCostExact sums floored prices and never exceeds the smooth sum", function()
	local exact = EconomyMath.cumulativeCostExact(10, 1.15, 0, 30)
	local smooth = EconomyMath.cumulativeCost(10, 1.15, 0, 30)
	assert(exact <= smooth, "floored sum is at most the smooth sum")
	assert(smooth - exact < 30, "and loses less than 1 per level")
end)

test("maxAffordable buys exactly as many levels as the money covers", function()
	local owned, money = 4, 1000
	local count = EconomyMath.maxAffordable(10, 1.15, owned, money)
	local spent = EconomyMath.cumulativeCostExact(10, 1.15, owned, owned + count)
	assert(spent <= money, "affordable")
	assert(spent + EconomyMath.levelCost(10, 1.15, owned + count) > money, "one more is not")
	eq(EconomyMath.maxAffordable(10, 1.15, 0, 9), 0, "can't afford the first level")
end)

test("rebirth requirement and multiplier", function()
	eq(EconomyMath.rebirthRequirement(1e6, 3, 0), 1e6, "first")
	eq(EconomyMath.rebirthRequirement(1e6, 3, 2), 9e6, "third")
	eq(EconomyMath.rebirthMultiplier(0.5, 0), 1, "no rebirths")
	eq(EconomyMath.rebirthMultiplier(0.5, 3), 2.5, "three rebirths")
end)

test("secondsToEarn handles zero income", function()
	eq(EconomyMath.secondsToEarn(100, 4), 25, "simple")
	eq(EconomyMath.secondsToEarn(100, 0), math.huge, "no income")
end)

test("offlineIncome caps, scales and ignores backwards clocks", function()
	eq(EconomyMath.offlineIncome(3600, 10, 8, 0.5), 18000, "one hour at half rate")
	eq(EconomyMath.offlineIncome(48 * 3600, 10, 8, 1), 8 * 3600 * 10, "capped at 8 hours")
	eq(EconomyMath.offlineIncome(-500, 10, 8, 1), 0, "clock went backwards")
end)

print(`\n{passed} passed, {failed} failed`)
if failed > 0 then
	error("tests failed")
end
