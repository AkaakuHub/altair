import { getNumberField } from './request-fields.ts';

export function readItemExchangeCategoryListId(
	body: unknown,
): number | undefined {
	return getNumberField(body, 'category_list_id');
}

export function readItemExchangePurchaseRequest(
	body: unknown,
): { itemExchangesId: number; num: number } | undefined {
	const itemExchangesId = getNumberField(body, 'item_exchanges_id');
	const num = getNumberField(body, 'num');
	return itemExchangesId === undefined || num === undefined || num <= 0
		? undefined
		: { itemExchangesId, num };
}
