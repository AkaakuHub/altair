import { describe, expect, test } from 'bun:test';
import { createFanLevelList } from '../src/v1/route-support/fan-level-response-mapper.ts';

describe('fan level response mapper', () => {
	test('canonical fieldを公式snake_caseへ写像する', () => {
		expect(
			createFanLevelList([
				{
					characterId: 1,
					dSeasonFanLevel: 2,
					dSeasonFanExperience: 3,
					memberFanLevel: 4,
					memberFanExperience: 5,
				},
			]),
		).toEqual([
			{
				character_id: 1,
				d_season_fan_level: 2,
				d_season_fan_experience: 3,
				member_fan_level: 4,
				member_fan_experience: 5,
			},
		]);
	});
});
