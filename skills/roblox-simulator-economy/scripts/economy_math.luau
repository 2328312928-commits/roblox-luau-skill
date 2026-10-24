--!strict
-- Closed-form maths for simulator / tycoon pacing. Pure Luau: runs in Lune
-- and in Roblox. Used by balance.luau and covered by tests/run.luau.

local EconomyMath = {}

-- Cost of buying the next level when `level` levels are owned:
-- floor(base * growth ^ level).
function EconomyMath.levelCost(base: number, growth: number, level: number): number
	return math.floor(base * growth ^ level)
end

-- Total cost of going from `from` levels to `to` levels (geometric series,
-- before flooring each step). Use cumulativeCostExact when the floored sum matters.
function EconomyMath.cumulativeCost(base: number, growth: number, from: number, to: number): number
	if to <= from then
		return 0
	end
	if growth == 1 then
		return base * (to - from)
	end
	return base * growth ^ from * (growth ^ (to - from) - 1) / (growth - 1)
end

-- Same as cumulativeCost but sums the floored per-level prices, which is what
-- players actually pay.
function EconomyMath.cumulativeCostExact(base: number, growth: number, from: number, to: number): number
	local total = 0
	for level = from, to - 1 do
		total += EconomyMath.levelCost(base, growth, level)
	end
	return total
end

-- How many levels `money` buys starting from `owned` levels ("buy max").
function EconomyMath.maxAffordable(base: number, growth: number, owned: number, money: number): number
	local count = 0
	local spent = 0
	while true do
		local price = EconomyMath.levelCost(base, growth, owned + count)
		if spent + price > money then
			return count
		end
		spent += price
		count += 1
	end
end

-- Requirement for the next rebirth after `done` rebirths: base * growth ^ done.
function EconomyMath.rebirthRequirement(base: number, growth: number, done: number): number
	return math.floor(base * growth ^ done)
end

-- Income multiplier after `done` rebirths: 1 + done * perRebirth.
function EconomyMath.rebirthMultiplier(perRebirth: number, done: number): number
	return 1 + done * perRebirth
end

-- Seconds to earn `amount` at `perSecond`; math.huge if there is no income.
function EconomyMath.secondsToEarn(amount: number, perSecond: number): number
	if perSecond <= 0 then
		return math.huge
	end
	return amount / perSecond
end

-- Offline income: whole seconds away, capped at maxHours, scaled by efficiency.
-- A clock that went backwards earns nothing.
function EconomyMath.offlineIncome(secondsAway: number, perSecond: number, maxHours: number, efficiency: number): number
	if secondsAway <= 0 then
		return 0
	end
	local counted = math.min(secondsAway, maxHours * 3600)
	return math.floor(counted * perSecond * efficiency)
end

return EconomyMath
