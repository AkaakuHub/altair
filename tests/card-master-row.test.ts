import { describe, expect, test } from 'bun:test';
import { localUserCardDataId } from '../src/master-data/card-master-row.ts';

describe('card master row conversion', () => {
	test('card data IDを固定長local UUIDへ変換する', () => {
		expect(localUserCardDataId(123)).toBe(
			'00000000-0000-0000-0000-000000000123',
		);
	});

	test('12桁を超えるcard data IDを拒否する', () => {
		expect(() => localUserCardDataId(1_000_000_000_000)).toThrow(
			'card_datas_id is too large',
		);
	});
});
