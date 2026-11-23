import { describe, expect, test } from 'bun:test';
import { getGiftShopMasterIdField } from '../src/v1/route-support/gift-shop-list-handler.ts';

describe('gift shop list handler', () => {
	test('gift shop種別ごとの公式request fieldを返す', () => {
		expect(getGiftShopMasterIdField('withlive')).toBe('m_withlives_id');
		expect(getGiftShopMasterIdField('withstation')).toBe('m_withstations_id');
	});
});
