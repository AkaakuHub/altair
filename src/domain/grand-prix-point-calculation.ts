export type GrandPrixPointBonusTargetType = 1 | 3 | 4 | 5;

export type GrandPrixPointBonusInput = Readonly<{
	targetType: GrandPrixPointBonusTargetType;
	bonusValue: number;
}>;

export type GrandPrixPointCalculation = Readonly<{
	basePoint: number;
	dailyPoint: number;
	limitBreakBonusCount: number;
	limitBreakFactorFixed4: number;
	multiplicativeBonuses: readonly GrandPrixPointBonusInput[];
}>;

export const grandPrixPointCalculationContract = {
	fixedScale: 10_000,
	scoreDivisor: 1_000,
	limitBreakTargetType: 1,
	multiplicativeTargetTypes: [3, 4, 5],
	baseRounding: 'floor-before-bonuses',
	resultRounding: 'ceil-after-all-bonuses',
} as const;

export function calculateGrandPrixPoint(
	score: number,
	bonuses: readonly GrandPrixPointBonusInput[],
): GrandPrixPointCalculation {
	requireNonnegativeSafeInteger(score, 'score');
	const basePoint =
		BigInt(score) / BigInt(grandPrixPointCalculationContract.scoreDivisor);
	let limitBreakFactorFixed4 = grandPrixPointCalculationContract.fixedScale;
	const multiplicativeBonuses: GrandPrixPointBonusInput[] = [];
	for (const bonus of bonuses) {
		requirePositiveSafeInteger(bonus.bonusValue, 'bonusValue');
		if (bonus.targetType === 1) {
			limitBreakFactorFixed4 +=
				bonus.bonusValue - grandPrixPointCalculationContract.fixedScale;
		} else if (isMultiplicativeTargetType(bonus.targetType)) {
			multiplicativeBonuses.push(bonus);
		} else {
			throw new Error(
				`Unsupported Grand Prix point bonus type: ${String(bonus.targetType)}`,
			);
		}
	}
	if (!Number.isSafeInteger(limitBreakFactorFixed4)) {
		throw new Error('Limit-break aggregate factor must be a safe integer');
	}
	if (limitBreakFactorFixed4 <= 0) {
		throw new Error('Limit-break aggregate factor must be positive');
	}
	let numerator = basePoint * BigInt(limitBreakFactorFixed4);
	let denominator = BigInt(grandPrixPointCalculationContract.fixedScale);
	for (const bonus of multiplicativeBonuses) {
		numerator *= BigInt(bonus.bonusValue);
		denominator *= BigInt(grandPrixPointCalculationContract.fixedScale);
	}
	const dailyPoint = dividePositiveCeiling(numerator, denominator);
	if (dailyPoint > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error('Grand Prix point exceeds the safe integer range');
	}
	return {
		basePoint: Number(basePoint),
		dailyPoint: Number(dailyPoint),
		limitBreakBonusCount: bonuses.length - multiplicativeBonuses.length,
		limitBreakFactorFixed4,
		multiplicativeBonuses,
	};
}

function isMultiplicativeTargetType(value: number): value is 3 | 4 | 5 {
	return value === 3 || value === 4 || value === 5;
}

function dividePositiveCeiling(numerator: bigint, denominator: bigint): bigint {
	return (numerator + denominator - 1n) / denominator;
}

function requireNonnegativeSafeInteger(value: number, field: string): void {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error(`${field} must be a nonnegative safe integer`);
	}
}

function requirePositiveSafeInteger(value: number, field: string): void {
	if (!Number.isSafeInteger(value) || value <= 0) {
		throw new Error(`${field} must be a positive safe integer`);
	}
}
