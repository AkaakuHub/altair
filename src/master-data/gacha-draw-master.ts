import type { Database } from 'bun:sqlite';
import type { GachaDrawRate } from '../state/gacha-definition.ts';

type GachaPurchaseCost = {
	price: number;
	resultCount: number;
	isPaidOnly: boolean;
};

type WebviewGachaRateRow = {
	rate_index: number;
	min_draw_count: number;
	max_draw_count: number;
};

type WebviewGachaDetailRow = { giftless: number };

type WebviewGachaDrawCardRow = {
	rate_index: number;
	card_datas_id: number;
	odds: number;
};

type WebviewGachaDrawBonusItemRow = {
	rate_index: number;
	rank: number;
	item_id: number;
	quantity: number;
	odds: number;
};

type SiscaGachaPurchaseCostRow = {
	single_gacha_price: number;
	consective_gacha_price: number;
	consective_gacha_times: number;
	paid_sis_ca_only_gacha_flag: number;
	paid_sis_ca_only_gacha_price: number;
	paid_sis_ca_only_gacha_times: number;
};

export function getGachaDrawRatesBySeriesIdFromDatabase(
	database: Database,
	gachaSeriesId: number,
): GachaDrawRate[] {
	const rates = database
		.query<WebviewGachaRateRow, [number]>(
			'SELECT rate_index, min_draw_count, max_draw_count FROM top_webview_gacha_rate WHERE gacha_series_id = ? ORDER BY rate_index',
		)
		.all(gachaSeriesId);
	if (rates.length === 0) return [];
	const detail = database
		.query<WebviewGachaDetailRow, [number]>(
			'SELECT giftless FROM top_webview_gacha_detail WHERE gacha_series_id = ?',
		)
		.get(gachaSeriesId);
	const cards = database
		.query<WebviewGachaDrawCardRow, [number]>(
			'SELECT rate_index, resolved_card_datas_id AS card_datas_id, odds FROM top_webview_gacha_rate_card WHERE gacha_series_id = ? ORDER BY rate_index, card_index',
		)
		.all(gachaSeriesId);
	const bonusItems = database
		.query<WebviewGachaDrawBonusItemRow, [number]>(
			'SELECT rate.rate_index, rate.rank, item.id AS item_id, rate.quantity, rate.odds FROM top_webview_gacha_rate_item rate JOIN master_items item ON item.name = rate.item_name WHERE rate.gacha_series_id = ? ORDER BY rate.rate_index, rate.item_index',
		)
		.all(gachaSeriesId);
	return rates.map((rate) => ({
		rateIndex: rate.rate_index,
		minDrawCount: rate.min_draw_count,
		maxDrawCount: rate.max_draw_count,
		isGiftless: detail?.giftless === 1,
		cardList: cards
			.filter((card) => card.rate_index === rate.rate_index)
			.map((card) => ({ cardDatasId: card.card_datas_id, odds: card.odds })),
		bonusItemList: bonusItems
			.filter((item) => item.rate_index === rate.rate_index)
			.map((item) => ({
				rank: item.rank,
				itemId: item.item_id,
				quantity: item.quantity,
				odds: item.odds,
			})),
	}));
}

export function getGachaPurchaseCostBySeriesIdFromDatabase(
	database: Database,
	gachaSeriesId: number,
	gachaSetPurchaseType: number,
): GachaPurchaseCost | undefined {
	const row = database
		.query<SiscaGachaPurchaseCostRow, [number, number]>(
			[
				'SELECT single_gacha_price, consective_gacha_price, consective_gacha_times, paid_sis_ca_only_gacha_flag, paid_sis_ca_only_gacha_price, paid_sis_ca_only_gacha_times',
				'FROM master_gift_bonus_gachas WHERE id = ?',
				'UNION ALL',
				'SELECT single_gacha_price, consective_gacha_price, consective_gacha_times, paid_sis_ca_only_gacha_flag, paid_sis_ca_only_gacha_price, paid_sis_ca_only_gacha_times',
				'FROM master_giftless_gachas WHERE id = ?',
				'LIMIT 1',
			].join(' '),
		)
		.get(gachaSeriesId, gachaSeriesId);
	if (!row) return undefined;
	if (gachaSetPurchaseType === 1) {
		return { price: row.single_gacha_price, resultCount: 1, isPaidOnly: false };
	}
	if (gachaSetPurchaseType === 2) {
		return {
			price: row.consective_gacha_price,
			resultCount: row.consective_gacha_times,
			isPaidOnly: false,
		};
	}
	if (gachaSetPurchaseType === 3 && row.paid_sis_ca_only_gacha_flag !== 0) {
		return {
			price: row.paid_sis_ca_only_gacha_price,
			resultCount: row.paid_sis_ca_only_gacha_times,
			isPaidOnly: true,
		};
	}
	return undefined;
}
