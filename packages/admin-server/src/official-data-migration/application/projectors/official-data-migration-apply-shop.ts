import type {
	UserGpPrizeExchangeState,
	UserItemExchangeState,
	UserPetalExchangePurchaseState,
	UserShopExchangeState,
	UserShopState,
} from '../../../../../../src/state/shop-exchange-types.ts';
import type {
	SiscaStoreItemState,
	UserSiscaStoreState,
} from '../../../../../../src/state/sisca-store-state.ts';
import {
	type JsonRecord,
	type OfficialDataMigrationDump,
	readNumber,
	readRecordArray,
} from '../official-data-migration-dump.ts';
import { isSuccessfulOfficialDataMigrationResponse } from './official-data-migration-apply-events.ts';

export function createShopExchangeFromDump(
	playerId: string,
	dump: OfficialDataMigrationDump,
): UserShopExchangeState | null {
	const shopListResponse = dump.responsesByPath.get('/v1/shop/get_list');
	const petalExchangeResponse = dump.responsesByPath.get(
		'/v1/petal_exchange/get_list',
	);
	const gpPrizeExchangeResponse = dump.responsesByPath.get(
		'/v1/gp_prize_exchange/get_list',
	);
	const itemExchangeList = dump.events
		.filter(
			isSuccessfulOfficialDataMigrationResponse(
				'/v1/item_exchange/get_list_new',
			),
		)
		.flatMap((event) => readRecordArray(event.response?.item_exchange_list))
		.map(createItemExchange)
		.filter((item): item is UserItemExchangeState => item !== null);
	if (
		shopListResponse === undefined &&
		petalExchangeResponse === undefined &&
		gpPrizeExchangeResponse === undefined &&
		itemExchangeList.length === 0
	) {
		return null;
	}
	return {
		playerId,
		shopList: readRecordArray(shopListResponse?.shop_list)
			.map(createShop)
			.filter((shop): shop is UserShopState => shop !== null),
		petalExchangePurchaseList: readPetalExchangePurchaseList(
			petalExchangeResponse,
		),
		gpPrizeExchangeList: readRecordArray(
			gpPrizeExchangeResponse?.gp_prize_exchange_list,
		)
			.map(createGpPrizeExchange)
			.filter(
				(exchange): exchange is UserGpPrizeExchangeState => exchange !== null,
			),
		itemExchangeList,
	};
}

export function mergeMigratedShopExchange(
	current: UserShopExchangeState | undefined,
	legacy: UserShopExchangeState,
): UserShopExchangeState {
	if (current === undefined) return legacy;
	return {
		...legacy,
		petalExchangePurchaseList: [
			...current.petalExchangePurchaseList.filter(
				(entry) => entry.identityFingerprint !== undefined,
			),
			...legacy.petalExchangePurchaseList,
		],
		gpPrizeExchangeList: [
			...current.gpPrizeExchangeList.filter(
				(entry) => entry.identityFingerprint !== undefined,
			),
			...legacy.gpPrizeExchangeList,
		],
		itemExchangeList: [
			...current.itemExchangeList.filter(
				(entry) => entry.identityFingerprint !== undefined,
			),
			...legacy.itemExchangeList,
		],
	};
}

export function createSiscaStoreFromResponse(
	playerId: string,
	response: JsonRecord | undefined,
): UserSiscaStoreState | null {
	if (response === undefined) {
		return null;
	}
	return {
		playerId,
		itemList: readRecordArray(response.item_list)
			.map(createSiscaStoreItem)
			.filter((item): item is SiscaStoreItemState => item !== null),
	};
}

function createShop(shop: JsonRecord): UserShopState | null {
	const shopType = readNumber(shop.shop_type);
	if (shopType === null) {
		return null;
	}
	return {
		shopType,
		isMaintenance: shop.is_maintenance === true,
	};
}

function readPetalExchangePurchaseList(
	response: JsonRecord | undefined,
): UserPetalExchangePurchaseState[] {
	return readRecordArray(response?.character_petal_exchange_list)
		.flatMap((character) =>
			readRecordArray(character.limit_break_exchange_list),
		)
		.map(createPetalExchangePurchase)
		.filter(
			(purchase): purchase is UserPetalExchangePurchaseState =>
				purchase !== null,
		);
}

function createPetalExchangePurchase(
	purchase: JsonRecord,
): UserPetalExchangePurchaseState | null {
	const cardSeriesId = readNumber(purchase.card_series_id);
	const totalNum = readNumber(purchase.total_num);
	if (cardSeriesId === null || totalNum === null) {
		return null;
	}
	return { cardSeriesId, totalNum };
}

function createGpPrizeExchange(
	exchange: JsonRecord,
): UserGpPrizeExchangeState | null {
	const gpPrizeExchangesId = readNumber(exchange.gp_prize_exchanges_id);
	const remainingExchangeNum = readNumber(exchange.remaining_exchange_num);
	if (gpPrizeExchangesId === null || remainingExchangeNum === null) {
		return null;
	}
	return {
		gpPrizeExchangesId,
		isHaving: exchange.is_having === true,
		remainingExchangeNum,
	};
}

function createItemExchange(
	exchange: JsonRecord,
): UserItemExchangeState | null {
	const itemExchangesId = readNumber(exchange.item_exchanges_id);
	const remainingExchangeNum = readNumber(exchange.remaining_exchange_num);
	if (itemExchangesId === null || remainingExchangeNum === null) {
		return null;
	}
	return {
		itemExchangesId,
		isLock: exchange.is_lock === true,
		remainingExchangeNum,
	};
}

function createSiscaStoreItem(item: JsonRecord): SiscaStoreItemState | null {
	const siscaStoreDatasId = readNumber(item.sisca_store_datas_id);
	const buyableNum = readNumber(item.buyable_num);
	if (siscaStoreDatasId === null || buyableNum === null) {
		return null;
	}
	return {
		siscaStoreDatasId,
		buyableNum,
		isNewItem: item.is_new_item === true,
		isSale: item.is_sale === true,
	};
}
