import { describe, expect, test } from 'bun:test';
import { readGiftShopCharacterIds } from '../src/master-data/gift-shop-character-source.ts';
import { calculateGiftPoint } from '../src/master-data/gift-shop-item-conversion.ts';
import { toUtcZ } from '../src/master-data/message-card-master.ts';

describe('gift shop conversion', () => {
	test('favorite rankでgift pointを変換する', () => {
		expect(calculateGiftPoint(100, 0)).toBe(100);
		expect(calculateGiftPoint(100, 1)).toBe(130);
		expect(calculateGiftPoint(100, 2)).toBe(200);
	});
	test('character JSONから有効なIDだけを読む', () =>
		expect(
			readGiftShopCharacterIds('[{"character_id":1021},{"name":"x"}]'),
		).toEqual([1021]));
	test('UTC offset表現をZへ変換する', () =>
		expect(toUtcZ('2026-01-01T00:00:00+00:00')).toBe('2026-01-01T00:00:00Z'));
});
