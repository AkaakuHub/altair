export function hasLimitBreakRoom(
	limitBreakTimes: number,
	maxLimitBreakTimes: number,
): boolean {
	return limitBreakTimes < maxLimitBreakTimes;
}

export function canPaySiscaBalance(
	free: number,
	paid: number,
	amount: number,
	isPaidOnly: boolean,
): boolean {
	if (amount <= 0) return false;
	return isPaidOnly ? paid >= amount : free + paid >= amount;
}
