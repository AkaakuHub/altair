import { describe, expect, test } from 'bun:test';
import {
	calculateGrandPrixDailyScore,
	playReportCardBonusTargets,
} from '../src/v1/active-master-database/grand-prix-result-calculation.ts';

describe('grand prix result calculation', () => {
	test('extracts non-zero card bonus targets in report order', () => {
		expect(
			playReportCardBonusTargets(
				JSON.stringify({
					character_info: [
						{
							main_card_id: 10,
							main_count: 2,
							side1_card_id: 0,
							side1_count: 9,
							side2_card_id: 20,
							side2_count: 3,
						},
					],
				}),
			),
		).toEqual([
			{ cardId: 10, limitBreakCount: 2 },
			{ cardId: 20, limitBreakCount: 3 },
		]);
		expect(playReportCardBonusTargets('invalid')).toEqual([]);
	});

	test('calculates daily score with the existing point bonus contract', () => {
		expect(calculateGrandPrixDailyScore(1000, [])).toBe(1);
	});
});
