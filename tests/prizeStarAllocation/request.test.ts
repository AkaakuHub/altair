import { expect, test } from 'bun:test';
import { readPrizeStarAllocations } from '../../src/application/prize-star-allocations.ts';

test('APKのJSON形式を読み、有効な空配列と不正な入力を区別する', () => {
	expect(
		readPrizeStarAllocations(
			JSON.stringify({
				set_star_info_list: [
					{ character_id: 1021, set_star_num: 3 },
					{ character_id: 1031, set_star_num: 2 },
				],
			}),
		),
	).toEqual([
		{ characterId: 1021, starNum: 3 },
		{ characterId: 1031, starNum: 2 },
	]);
	expect(readPrizeStarAllocations('{"set_star_info_list":[]}')).toEqual([]);
	for (const input of [
		'{',
		'null',
		'{}',
		'{"1021":3}',
		'{"set_star_info_list":{}}',
	])
		expect(readPrizeStarAllocations(input)).toBeUndefined();
});

test('一部の不正な配分を捨てず要求全体を拒否する', () => {
	const valid = { character_id: 1021, set_star_num: 3 };
	for (const invalid of [
		{},
		null,
		{ character_id: 1031, set_star_num: '2' },
		{ character_id: 1031, set_star_num: 0 },
		{ character_id: 1031, set_star_num: -1 },
		{ character_id: 0, set_star_num: 1 },
		{ character_id: 1031.5, set_star_num: 1 },
		{ character_id: 1031, set_star_num: 1.5 },
		valid,
		{ character_id: 1031, set_star_num: Number.MAX_SAFE_INTEGER },
	]) {
		expect(
			readPrizeStarAllocations(
				JSON.stringify({ set_star_info_list: [valid, invalid] }),
			),
		).toBeUndefined();
	}
});
