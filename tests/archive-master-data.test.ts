import { describe, expect, test } from 'bun:test';
import { parseArchiveGiftStarRewardSegments } from '../src/master-data/archive-master-data.ts';

describe('archive gift star reward segments', () => {
	test('正本nullを空配列と区別する', () => {
		expect(parseArchiveGiftStarRewardSegments(null)).toBeNull();
		expect(parseArchiveGiftStarRewardSegments('[]')).toEqual([]);
	});

	test('空文字、非array、無効な数値を拒否する', () => {
		for (const value of ['', '{}', '[1,"2"]', '[1,1.5]']) {
			expect(() => parseArchiveGiftStarRewardSegments(value)).toThrow();
		}
	});
});
