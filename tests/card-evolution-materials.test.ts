import { describe, expect, test } from 'bun:test';
import { evolutionRequirementItems } from '../src/application/card-growth/card-evolution-materials.ts';

describe('card evolution materials', () => {
	test('正のitem IDと必要数だけを定義順で計画する', () => {
		expect(
			evolutionRequirementItems({
				costItemId1: 10,
				costNum1: 2,
				costItemId2: 0,
				costNum2: 3,
				costItemId3: 30,
				costNum3: 0,
			}),
		).toEqual([{ itemId: 10, costNum: 2 }]);
	});
});
