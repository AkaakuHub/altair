import { getNumberField } from './request-fields.ts';

export const readGachaGuaranteeListRequest = (body: unknown) => ({
	gachaSeriesId: getNumberField(body, 'gacha_series_id'),
});
export const readGachaGuaranteeExchangeRequest = (body: unknown) => ({
	exchangePointRateId: getNumberField(body, 'exchange_point_rate_id'),
});
