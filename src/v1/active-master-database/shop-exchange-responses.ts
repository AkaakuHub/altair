import type { Database } from 'bun:sqlite';
import { currentUtcIsoDateTime } from '../../master-data/master-time.ts';
import type {
	GpPrizeUserTicketMaster,
	ShopExchangeMaster,
	ShopMaster,
} from '../../state/shop-exchange-definition.ts';

type ShopRow = {
	shop_type: number;
	name: string;
	order_id: number;
};

type GpPrizeExchangeRow = {
	id: number;
	product_item_type: number;
	product_item_id: number;
	product_item_num: number;
	material_item_id: number;
	material_item_num: number;
};

type ItemExchangeRow = {
	id: number;
	category_list_id: number;
	product_item_id: number;
	product_item_num: number;
	material_item_id: number;
	material_item_num: number;
};

type StickerExchangeRow = {
	id: number;
	product_sticker_id: number;
	product_sticker_num: number;
	material_item_id: number;
	material_item_num: number;
};

export function getShopExchangeMasterFromDatabase(
	database: Database,
): ShopExchangeMaster {
	const now = currentUtcIsoDateTime();
	const gpPrizeExchangeList = readActiveGpPrizeExchanges(database, now);
	const itemExchangeList = readActiveItemExchanges(database, now);
	const stickerExchangeList = readActiveStickerExchanges(database, now);
	return {
		isConvertibleLimitBreakMaterial: itemExchangeList.length > 0,
		shopList: readShops(database, {
			hasGpPrizeExchanges: gpPrizeExchangeList.length > 0,
			hasItemExchanges: itemExchangeList.length > 0,
			hasStickerExchanges: stickerExchangeList.length > 0,
		}),
		gpPrizeExchangeList,
		gpPrizeUserTicketList: readGpPrizeUserTickets(database),
		itemExchangeList,
		stickerExchangeList,
	};
}

function readShops(
	database: Database,
	productStatus: {
		hasGpPrizeExchanges: boolean;
		hasItemExchanges: boolean;
		hasStickerExchanges: boolean;
	},
): ShopMaster[] {
	return database
		.query<ShopRow, []>(
			[
				'SELECT shop_type, name, order_id',
				'FROM master_shops',
				'ORDER BY order_id, id',
			].join(' '),
		)
		.all()
		.map((row) => ({
			shopType: row.shop_type,
			name: row.name,
			orderId: row.order_id,
			isExistProducts: hasShopProducts(database, row.shop_type, productStatus),
		}));
}

function hasShopProducts(
	database: Database,
	shopType: number,
	productStatus: {
		hasGpPrizeExchanges: boolean;
		hasItemExchanges: boolean;
		hasStickerExchanges: boolean;
	},
): boolean {
	if (shopType === 7) {
		return productStatus.hasGpPrizeExchanges;
	}
	if (shopType === 3) {
		return productStatus.hasItemExchanges;
	}
	if (shopType === 9) {
		return productStatus.hasStickerExchanges;
	}
	if (shopType === 10) {
		return hasActiveRows(database, 'master_sis_ca_store_datas');
	}
	if (shopType === 4) {
		return hasRows(database, 'master_petal_exchange_rates');
	}
	if (shopType === 8) {
		return hasRows(database, 'master_select_ticket_exchange_rate');
	}
	return false;
}

function readActiveGpPrizeExchanges(
	database: Database,
	now: string,
): ShopExchangeMaster['gpPrizeExchangeList'] {
	return database
		.query<GpPrizeExchangeRow, [string, string]>(
			[
				'SELECT id, product_item_type, product_item_id, product_item_num, material_item_id, material_item_num',
				'FROM master_gp_prize_exchanges',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY order_id, id',
			].join(' '),
		)
		.all(now, now)
		.map((row) => ({
			gpPrizeExchangesId: row.id,
			productItemType: row.product_item_type,
			productItemId: row.product_item_id,
			productItemNum: row.product_item_num,
			materialItemId: row.material_item_id,
			materialItemNum: row.material_item_num,
		}));
}

function readActiveStickerExchanges(
	database: Database,
	now: string,
): ShopExchangeMaster['stickerExchangeList'] {
	return database
		.query<StickerExchangeRow, [string, string]>(
			[
				'SELECT id, product_sticker_id, product_sticker_num, material_item_id, material_item_num',
				'FROM master_sticker_exchanges',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY order_id, id',
			].join(' '),
		)
		.all(now, now)
		.map((row) => ({
			stickerExchangesId: row.id,
			productStickerId: row.product_sticker_id,
			productStickerNum: row.product_sticker_num,
			materialItemId: row.material_item_id,
			materialItemNum: row.material_item_num,
		}));
}

function readActiveItemExchanges(
	database: Database,
	now: string,
): ShopExchangeMaster['itemExchangeList'] {
	return database
		.query<ItemExchangeRow, [string, string]>(
			[
				'SELECT id, category_list_id, product_item_id, product_item_num, material_item_id, material_item_num',
				'FROM master_item_exchanges',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY category_list_id, order_id, id',
			].join(' '),
		)
		.all(now, now)
		.map((row) => ({
			itemExchangesId: row.id,
			categoryListId: row.category_list_id,
			productItemId: row.product_item_id,
			productItemNum: row.product_item_num,
			materialItemId: row.material_item_id,
			materialItemNum: row.material_item_num,
		}));
}

function readGpPrizeUserTickets(database: Database): GpPrizeUserTicketMaster[] {
	return database
		.query<{ material_item_id: number }, []>(
			[
				'SELECT DISTINCT material_item_id',
				'FROM master_gp_prize_exchanges',
				'ORDER BY material_item_id',
			].join(' '),
		)
		.all()
		.map((row) => ({
			itemId: row.material_item_id,
		}));
}

function hasActiveRows(database: Database, tableName: string): boolean {
	const now = currentUtcIsoDateTime();
	const row = database
		.query<{ row_count: number }, [string, string]>(
			[
				'SELECT count(*) AS row_count',
				`FROM ${tableName}`,
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
			].join(' '),
		)
		.get(now, now);
	return (row?.row_count ?? 0) > 0;
}

function hasRows(database: Database, tableName: string): boolean {
	const row = database
		.query<{ row_count: number }, []>(
			['SELECT count(*) AS row_count', `FROM ${tableName}`].join(' '),
		)
		.get();
	return (row?.row_count ?? 0) > 0;
}
