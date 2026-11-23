import type { Database } from 'bun:sqlite';
import { currentUtcIsoDateTime } from './master-time.ts';

export type GpPrizeExchangePurchaseMaster = {
	gpPrizeExchangesId: number;
	productItemType: number;
	productItemId: number;
	productItemNum: number;
	materialItemId: number;
	materialItemNum: number;
};

type ItemExchangePurchaseMaster = {
	itemExchangesId: number;
	categoryListId: number;
	productItemId: number;
	productItemNum: number;
	materialItemId: number;
	materialItemNum: number;
};

type StickerExchangePurchaseMaster = {
	stickerExchangesId: number;
	productStickerId: number;
	productStickerNum: number;
	materialItemId: number;
	materialItemNum: number;
};

export type LimitBreakMaterialConvertMaster = {
	rarity: number;
	itemId: number;
};

type LimitBreakMaterialConvertRateMaster = {
	rarity: number;
	materialNum: number;
	productItemType: number;
	productItemId: number;
	productItemNum: number;
};

type GpPrizeExchangePurchaseRow = {
	id: number;
	product_item_type: number;
	product_item_id: number;
	product_item_num: number;
	material_item_id: number;
	material_item_num: number;
};

type ItemExchangePurchaseRow = {
	id: number;
	category_list_id: number;
	product_item_id: number;
	product_item_num: number;
	material_item_id: number;
	material_item_num: number;
};

type StickerExchangePurchaseRow = {
	id: number;
	product_sticker_id: number;
	product_sticker_num: number;
	material_item_id: number;
	material_item_num: number;
};

type LimitBreakMaterialConvertRow = {
	rarity: number;
	cost_items_id: number;
};

type LimitBreakMaterialConvertRateRow = {
	limit_break_material_rarity: number;
	limit_break_material_num: number;
	product_item_type: number;
	product_item_id: number;
	product_item_num: number;
};

export function getGpPrizeExchangePurchaseMasterFromDatabase(
	database: Database,
	gpPrizeExchangesId: number,
): GpPrizeExchangePurchaseMaster | undefined {
	const now = currentUtcIsoDateTime();
	const row = database
		.query<GpPrizeExchangePurchaseRow, [number, string, string]>(
			[
				'SELECT id, product_item_type, product_item_id, product_item_num, material_item_id, material_item_num',
				'FROM master_gp_prize_exchanges',
				'WHERE id = ?',
				'AND datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
			].join(' '),
		)
		.get(gpPrizeExchangesId, now, now);
	if (!row) {
		return undefined;
	}
	return {
		gpPrizeExchangesId: row.id,
		productItemType: row.product_item_type,
		productItemId: row.product_item_id,
		productItemNum: row.product_item_num,
		materialItemId: row.material_item_id,
		materialItemNum: row.material_item_num,
	};
}

export function getItemExchangePurchaseMasterFromDatabase(
	database: Database,
	itemExchangesId: number,
): ItemExchangePurchaseMaster | undefined {
	const now = currentUtcIsoDateTime();
	const row = database
		.query<ItemExchangePurchaseRow, [number, string, string]>(
			[
				'SELECT id, category_list_id, product_item_id, product_item_num, material_item_id, material_item_num',
				'FROM master_item_exchanges',
				'WHERE id = ?',
				'AND datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
			].join(' '),
		)
		.get(itemExchangesId, now, now);
	if (!row) {
		return undefined;
	}
	return {
		itemExchangesId: row.id,
		categoryListId: row.category_list_id,
		productItemId: row.product_item_id,
		productItemNum: row.product_item_num,
		materialItemId: row.material_item_id,
		materialItemNum: row.material_item_num,
	};
}

export function getStickerExchangePurchaseMasterFromDatabase(
	database: Database,
	stickerExchangesId: number,
): StickerExchangePurchaseMaster | undefined {
	const now = currentUtcIsoDateTime();
	const row = database
		.query<StickerExchangePurchaseRow, [number, string, string]>(
			[
				'SELECT id, product_sticker_id, product_sticker_num, material_item_id, material_item_num',
				'FROM master_sticker_exchanges',
				'WHERE id = ?',
				'AND datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
			].join(' '),
		)
		.get(stickerExchangesId, now, now);
	if (!row) {
		return undefined;
	}
	return {
		stickerExchangesId: row.id,
		productStickerId: row.product_sticker_id,
		productStickerNum: row.product_sticker_num,
		materialItemId: row.material_item_id,
		materialItemNum: row.material_item_num,
	};
}

export function getLimitBreakMaterialConvertMasterFromDatabase(
	database: Database,
): LimitBreakMaterialConvertMaster[] {
	return database
		.query<LimitBreakMaterialConvertRow, []>(
			[
				'SELECT DISTINCT card.rarity, material.cost_items_id',
				'FROM master_card_limit_break_materials material',
				'JOIN master_card_datas card ON card.card_series_id = material.card_series_id',
				'ORDER BY card.rarity, material.cost_items_id',
			].join(' '),
		)
		.all()
		.map((row) => ({
			rarity: row.rarity,
			itemId: row.cost_items_id,
		}));
}

export function getLimitBreakMaterialConvertRatesFromDatabase(
	database: Database,
): LimitBreakMaterialConvertRateMaster[] {
	return database
		.query<LimitBreakMaterialConvertRateRow, []>(
			[
				'SELECT limit_break_material_rarity, limit_break_material_num,',
				'product_item_type, product_item_id, product_item_num',
				'FROM master_limit_break_material_convert_rate',
				'ORDER BY limit_break_material_rarity',
			].join(' '),
		)
		.all()
		.map((row) => ({
			rarity: row.limit_break_material_rarity,
			materialNum: row.limit_break_material_num,
			productItemType: row.product_item_type,
			productItemId: row.product_item_id,
			productItemNum: row.product_item_num,
		}));
}
