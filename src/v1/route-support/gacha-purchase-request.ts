import { getNumberField } from './request-fields.ts';

export function parseGachaPurchaseRequest(body: unknown): {
	gachaSeriesId: number | undefined;
	gachaSetPurchaseType: number | undefined;
} {
	return {
		gachaSeriesId: getNumberField(body, 'gacha_series_id'),
		gachaSetPurchaseType: getNumberField(body, 'gacha_set_purchase_type'),
	};
}
