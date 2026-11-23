import { describe, expect, test } from 'bun:test';
import {
	getEvolutionValue,
	mapCardEvolutionRequirement,
	mapCardLimitBreakRequirement,
	mapCardSkillLevelUpRequirement,
} from '../src/master-data/card-growth-row-mappers.ts';

describe('card growth row mappers', () => {
	test('limit break material rowを契約fieldへ変換する', () => {
		expect(
			mapCardLimitBreakRequirement({
				limit_break_times: 2,
				cost_items_id: 301,
				cost_num: 4,
			}),
		).toEqual({ limitBreakTimes: 2, costItemsId: 301, costNum: 4 });
	});

	test('skill material rowの3組のitemと個数を維持する', () => {
		expect(
			mapCardSkillLevelUpRequirement({
				skill_level: 3,
				cost_items_id1: 101,
				cost_num1: 1,
				cost_items_id2: 102,
				cost_num2: 2,
				cost_items_id3: 103,
				cost_num3: 3,
			}),
		).toEqual({
			skillLevel: 3,
			costItemId1: 101,
			costNum1: 1,
			costItemId2: 102,
			costNum2: 2,
			costItemId3: 103,
			costNum3: 3,
		});
	});

	test('evolutionの次cardとmax style levelをmaterialへ結合する', () => {
		expect(
			mapCardEvolutionRequirement(2002, 80, {
				cost_items_id1: 201,
				cost_num1: 4,
				cost_items_id2: 202,
				cost_num2: 5,
				cost_items_id3: 203,
				cost_num3: 6,
			}),
		).toEqual({
			nextCardDatasId: 2002,
			nextMaxStyleLevel: 80,
			costItemId1: 201,
			costNum1: 4,
			costItemId2: 202,
			costNum2: 5,
			costItemId3: 203,
			costNum3: 6,
		});
	});

	test('evolution index外はundefinedを返す', () => {
		expect(getEvolutionValue([10, 20, 30], 1)).toBe(20);
		expect(getEvolutionValue([10, 20, 30], 3)).toBeUndefined();
	});
});
