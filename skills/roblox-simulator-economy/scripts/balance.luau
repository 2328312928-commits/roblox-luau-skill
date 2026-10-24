-- Pacing calculator for a simulator / tycoon economy.
--   lune run scripts/balance.luau                 (built-in example)
--   lune run scripts/balance.luau my_economy.json (your numbers)
-- Prints how long each upgrade level and each rebirth takes for a player who
-- spends everything on one upgrade, so you can see where the curve stalls.

local fs = require("@lune/fs")
local process = require("@lune/process")
local serde = require("@lune/serde")

local EconomyMath = require("./economy_math")

local DEFAULT = {
	-- Income per second before upgrades and rebirths.
	baseIncome = 1,
	upgrade = { baseCost = 10, costGrowth = 1.15, incomePerLevel = 1, levels = 40 },
	rebirth = { baseRequirement = 1e6, requirementGrowth = 3, multiplierPerRebirth = 0.5, count = 8 },
	offline = { maxHours = 8, efficiency = 0.5 },
}

local config = DEFAULT
if process.args[1] then
	config = serde.decode("json", fs.readFile(process.args[1]))
end

local function clock(seconds: number): string
	if seconds == math.huge then
		return "never"
	elseif seconds < 60 then
		return string.format("%ds", seconds)
	elseif seconds < 3600 then
		return string.format("%dm %02ds", seconds // 60, seconds % 60)
	elseif seconds < 86400 then
		return string.format("%dh %02dm", seconds // 3600, (seconds % 3600) // 60)
	end
	return string.format("%dd %dh", seconds // 86400, (seconds % 86400) // 3600)
end

local up = config.upgrade
print("Upgrade pacing (no rebirths, buying one level at a time)")
print(string.format("%5s %14s %14s %12s %12s", "level", "price", "total spent", "income/s", "wait"))
local totalTime = 0
for level = 0, up.levels - 1 do
	local income = config.baseIncome + level * up.incomePerLevel
	local price = EconomyMath.levelCost(up.baseCost, up.costGrowth, level)
	local wait = EconomyMath.secondsToEarn(price, income)
	totalTime += wait
	if level < 10 or level % 5 == 4 then
		print(
			string.format(
				"%5d %14d %14d %12d %12s",
				level + 1,
				price,
				EconomyMath.cumulativeCostExact(up.baseCost, up.costGrowth, 0, level + 1),
				income,
				clock(wait)
			)
		)
	end
end
print(string.format("Time to level %d: %s", up.levels, clock(totalTime)))

local rb = config.rebirth
local income = config.baseIncome + up.levels * up.incomePerLevel
print(string.format("\nRebirth pacing (income %d/s before multipliers)", income))
print(string.format("%7s %16s %11s %12s %8s", "rebirth", "requirement", "multiplier", "wait", "vs prev"))
local previous: number? = nil
for done = 0, rb.count - 1 do
	local requirement = EconomyMath.rebirthRequirement(rb.baseRequirement, rb.requirementGrowth, done)
	local multiplier = EconomyMath.rebirthMultiplier(rb.multiplierPerRebirth, done)
	local wait = EconomyMath.secondsToEarn(requirement, income * multiplier)
	local ratio = if previous then string.format("x%.2f", wait / previous) else "-"
	print(
		string.format(
			"%7d %16d %11s %12s %8s",
			done + 1,
			requirement,
			string.format("x%.1f", multiplier),
			clock(wait),
			ratio
		)
	)
	previous = wait
end

local off = config.offline
print(
	string.format(
		"\nOffline: %d h cap at %d%% efficiency pays up to %d at %d/s",
		off.maxHours,
		off.efficiency * 100,
		EconomyMath.offlineIncome(off.maxHours * 3600, income, off.maxHours, off.efficiency),
		income
	)
)
