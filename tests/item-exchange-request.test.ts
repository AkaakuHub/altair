import { describe, expect, test } from 'bun:test';
import {
	readItemExchangeCategoryListId,
	readItemExchangePurchaseRequest,
} from '../src/v1/route-support/item-exchange-request.ts';

describe('item exchange request', () => {
	test('purchase IDと正の個数を読む', () => {
		expect(
			readItemExchangePurchaseRequest({ item_exchanges_id: 10, num: 2 }),
		).toEqual({ itemExchangesId: 10, num: 2 });
	});

	test('不足・0以下・数値以外を拒否する', () => {
		expect(
			readItemExchangePurchaseRequest({ item_exchanges_id: 10 }),
		).toBeUndefined();
		expect(
			readItemExchangePurchaseRequest({ item_exchanges_id: 10, num: 0 }),
		).toBeUndefined();
		expect(
			readItemExchangePurchaseRequest({ item_exchanges_id: '10', num: 1 }),
		).toBeUndefined();
	});

	test('list categoryは省略を維持する', () => {
		expect(readItemExchangeCategoryListId({})).toBeUndefined();
		expect(readItemExchangeCategoryListId({ category_list_id: 3 })).toBe(3);
	});
});
