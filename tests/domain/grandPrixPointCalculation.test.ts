import { expect, test } from 'bun:test';
import { calculateGrandPrixPoint } from '../../src/domain/grand-prix-point-calculation.ts';
import { calculateGrandPrixScorePoint } from '../../src/v1/active-master-database/grand-prix-point-bonus.ts';

test('公式run 73・74のscoreと型別bonusからdaily pointを再現する', () => {
	const cases = [
		{
			score: 5_074_693_189_631_943,
			limitBreak: [
				14000, 11500, 14000, 11500, 13000, 11500, 14000, 11500, 11500,
			],
			multipliers: [
				[3, 13000],
				[4, 9100],
				[5, 10000],
			],
			dailyPoint: 19_510_926_640_834,
		},
		{
			score: 957_595_916_649,
			limitBreak: [
				14000, 11500, 14000, 11500, 13000, 11500, 13500, 14000, 13500, 11500,
				11500,
			],
			multipliers: [
				[3, 13000],
				[4, 7700],
				[5, 10000],
			],
			dailyPoint: 3_786_286_373,
		},
		{
			score: 288_725_721_353_494,
			limitBreak: [
				14000, 11500, 14000, 11500, 13000, 11500, 13500, 14000, 13500, 11500,
				11500,
			],
			multipliers: [
				[3, 10000],
				[4, 7700],
				[5, 10000],
			],
			dailyPoint: 878_159_281_496,
		},
		{
			score: 4_750_779_508_555_035,
			limitBreak: [
				14000, 11500, 14000, 11500, 13000, 11500, 13500, 14000, 13500, 11500,
				11500,
			],
			multipliers: [
				[3, 13000],
				[4, 7700],
				[5, 10000],
			],
			dailyPoint: 18_784_344_637_852,
		},
		{
			score: 111_985_347_304_889,
			limitBreak: [10000, 12500, 12000, 10000, 12000, 13500],
			multipliers: [
				[3, 13000],
				[4, 12300],
				[5, 10000],
			],
			dailyPoint: 358_129_140_679,
		},
		{
			score: 15_145_570_132_444,
			limitBreak: [10000, 10000, 10000, 10000, 10000, 10000],
			multipliers: [
				[3, 13000],
				[4, 12300],
				[5, 10000],
			],
			dailyPoint: 24_217_766_642,
		},
		{
			score: 5_047_076_688_110_692,
			limitBreak: [14000, 14000, 11500, 11500, 11500, 11500],
			multipliers: [
				[3, 13000],
				[4, 12300],
				[5, 10000],
			],
			dailyPoint: 19_368_661_498_291,
		},
	] as const;
	for (const entry of cases) {
		const result = calculateGrandPrixPoint(entry.score, [
			...entry.limitBreak.map((bonusValue) => ({
				targetType: 1 as const,
				bonusValue,
			})),
			...entry.multipliers.map(([targetType, bonusValue]) => ({
				targetType,
				bonusValue,
			})),
		]);
		expect(result.basePoint).toBe(Math.floor(entry.score / 1000));
		expect(result.dailyPoint).toBe(entry.dailyPoint);
	}
});

test('Grand Prix pointは未対応typeと整数契約違反を拒否する', () => {
	expect(() =>
		calculateGrandPrixScorePoint(1000, [
			{ target_type: 2, bonus_value: 10000 },
		]),
	).toThrow('Unsupported Grand Prix point bonus type: 2');
	expect(() =>
		calculateGrandPrixPoint(1000, [
			{ targetType: 1, bonusValue: 1 },
			{ targetType: 1, bonusValue: 1 },
		]),
	).toThrow('Limit-break aggregate factor must be positive');
	expect(() =>
		calculateGrandPrixPoint(1000, [
			{ targetType: 1, bonusValue: Number.MAX_SAFE_INTEGER + 1 },
		]),
	).toThrow('bonusValue must be a positive safe integer');
	expect(() =>
		calculateGrandPrixPoint(1000, [
			{ targetType: 1, bonusValue: Number.MAX_SAFE_INTEGER },
			{ targetType: 1, bonusValue: Number.MAX_SAFE_INTEGER },
		]),
	).toThrow('Limit-break aggregate factor must be a safe integer');
	expect(() =>
		calculateGrandPrixPoint(Number.MAX_SAFE_INTEGER, [
			{ targetType: 3, bonusValue: Number.MAX_SAFE_INTEGER },
		]),
	).toThrow('Grand Prix point exceeds the safe integer range');
});
