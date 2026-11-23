import { expect, test } from 'bun:test';
import { z } from 'zod';
import { getItemIdentityFingerprint } from '../../src/master-data/entity-identity-fingerprints.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../src/master-data/item-master.ts';
import {
	calculatePetalExchangeCostFromDatabase,
	getPetalExchangeCardBySeriesIdFromDatabase,
} from '../../src/master-data/petal-exchange-master.ts';
import {
	getGpPrizeExchangePurchaseMasterFromDatabase,
	getItemExchangePurchaseMasterFromDatabase,
	getStickerExchangePurchaseMasterFromDatabase,
} from '../../src/master-data/shop-exchange-purchase-master.ts';
import { findUserItemByItemId } from '../../src/state/user-inventory-aggregate.ts';
import { setUserItemQuantity } from '../../src/state/user-item-mutation.ts';
import { getSiscaStoreMasterFromDatabase } from '../../src/v1/active-master-database/sisca-store-responses.ts';
import { createInMemoryServerStateStore } from '../support/inMemoryServerStateStore.ts';
import { config, createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

async function prepare() {
	const saved = createInMemoryServerStateStore();
	const app = createTestApp({
		requestLogEnabled: false,
		stateStore: saved.store,
	});
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	await request('post', '/v1/user/card/get_list');
	await request('post', '/v1/user/items/get_list');
	const repository = config.activeMasterRepository;
	const inventory = saved.getState().userInventories[0];
	const status = saved.getState().userStatuses[0];
	if (
		repository === undefined ||
		inventory === undefined ||
		status === undefined
	)
		throw new Error('Missing test master or user state');
	const database = repository.selection.database;
	const fund = (itemId: number, amount: number) => {
		const definition = getItemDefinitionByItemIdFromDatabase(database, itemId);
		const identityFingerprint = getItemIdentityFingerprint(database, itemId);
		if (definition === undefined || identityFingerprint === undefined)
			throw new Error('Missing material definition');
		setUserItemQuantity(inventory, definition, amount, {
			sourceMasterReleaseId: repository.selection.releaseId,
			identityFingerprint,
		});
	};
	return { request, database, inventory, status, fund };
}

test('通常アイテム交換の購入が契約に適合し、素材と商品を更新する', async () => {
	const context = await prepare();
	const list = z
		.object({
			item_exchange_list: z.array(
				z.object({
					item_exchanges_id: z.number(),
					is_lock: z.boolean(),
					remaining_exchange_num: z.number(),
				}),
			),
		})
		.parse(await context.request('post', '/v1/item_exchange/get_list_new'));
	const entry = list.item_exchange_list.find((item) => !item.is_lock);
	const master =
		entry === undefined
			? undefined
			: getItemExchangePurchaseMasterFromDatabase(
					context.database,
					entry.item_exchanges_id,
				);
	if (master === undefined)
		throw new Error('No purchasable item exchange fixture');
	const before =
		findUserItemByItemId(context.inventory, master.productItemId)?.itemNum ?? 0;
	context.fund(master.materialItemId, master.materialItemNum);
	expect(
		await context.request('post', '/v1/item_exchange/set_purchase', {
			item_exchanges_id: master.itemExchangesId,
			num: 1,
		}),
	).toEqual({
		user_material_item_num: 0,
		user_product_item_num: before + master.productItemNum,
	});
});

test('ペタル交換の購入が契約に適合し、素材を受け取る', async () => {
	const context = await prepare();
	const list = z
		.object({
			character_petal_exchange_list: z.array(
				z.object({
					limit_break_exchange_list: z.array(
						z.object({ card_series_id: z.number(), total_num: z.number() }),
					),
				}),
			),
		})
		.parse(await context.request('post', '/v1/petal_exchange/get_list'));
	const entry = list.character_petal_exchange_list.flatMap(
		(character) => character.limit_break_exchange_list,
	)[0];
	const master =
		entry === undefined
			? undefined
			: getPetalExchangeCardBySeriesIdFromDatabase(
					context.database,
					entry.card_series_id,
				);
	if (master === undefined || entry === undefined)
		throw new Error('No petal exchange fixture');
	const cost = calculatePetalExchangeCostFromDatabase(
		context.database,
		master.rarity,
		entry.total_num,
		1,
	);
	if (cost === undefined) throw new Error('Missing petal exchange cost');
	const before =
		findUserItemByItemId(context.inventory, master.materialItemId)?.itemNum ??
		0;
	context.fund(3007001, cost);
	expect(
		await context.request('post', '/v1/petal_exchange/set_purchase', {
			card_series_id: entry.card_series_id,
			num: 1,
		}),
	).toEqual({ result: true });
	expect(
		findUserItemByItemId(context.inventory, master.materialItemId)?.itemNum,
	).toBe(before + 1);
	expect(findUserItemByItemId(context.inventory, 3007001)?.itemNum).toBe(0);
});

test('スタンプ交換の購入が契約に適合し、ポイントを消費する', async () => {
	const context = await prepare();
	const list = z
		.object({
			sticker_exchange_list: z.array(
				z.object({ sticker_exchanges_id: z.number(), is_having: z.boolean() }),
			),
		})
		.parse(await context.request('post', '/v1/sticker_exchange/get_list'));
	const entry = list.sticker_exchange_list.find((item) => !item.is_having);
	const master =
		entry === undefined
			? undefined
			: getStickerExchangePurchaseMasterFromDatabase(
					context.database,
					entry.sticker_exchanges_id,
				);
	if (master === undefined)
		throw new Error('No unowned sticker exchange fixture');
	context.fund(master.materialItemId, master.materialItemNum);
	expect(
		await context.request('post', '/v1/sticker_exchange/set_purchase', {
			sticker_exchanges_id: master.stickerExchangesId,
		}),
	).toEqual({ sticker_point_num: 0 });
	expect(
		await context.request('post', '/v1/sticker_exchange/get_list'),
	).toMatchObject({
		sticker_exchange_list: expect.arrayContaining([
			expect.objectContaining({
				sticker_exchanges_id: master.stickerExchangesId,
				is_having: true,
			}),
		]),
	});
});

test('GP賞品交換の購入が契約に適合し、チケットを消費する', async () => {
	const context = await prepare();
	const list = z
		.object({
			gp_prize_exchange_list: z.array(
				z.object({ gp_prize_exchanges_id: z.number(), is_having: z.boolean() }),
			),
		})
		.parse(await context.request('post', '/v1/gp_prize_exchange/get_list'));
	const entry = list.gp_prize_exchange_list.find((item) => !item.is_having);
	const master =
		entry === undefined
			? undefined
			: getGpPrizeExchangePurchaseMasterFromDatabase(
					context.database,
					entry.gp_prize_exchanges_id,
				);
	if (master === undefined) throw new Error('No GP prize exchange fixture');
	context.fund(master.materialItemId, master.materialItemNum);
	expect(
		await context.request('post', '/v1/gp_prize_exchange/set_purchase', {
			gp_prize_exchanges_id: master.gpPrizeExchangesId,
		}),
	).toEqual({
		gp_prize_ticket_id: master.materialItemId - 3011000,
		user_ticket_num: 0,
	});
});

test('SIsCa購入の省略時の個数が契約に適合し、残高と所持品を更新する', async () => {
	const context = await prepare();
	const list = z
		.object({
			item_list: z.array(
				z.object({
					sisca_store_datas_id: z.number(),
					buyable_num: z.number(),
					is_sale: z.boolean(),
				}),
			),
		})
		.parse(await context.request('post', '/v1/sisca_store/get_list'));
	const entry = list.item_list.find(
		(item) => item.buyable_num !== 0 && item.is_sale,
	);
	const master = getSiscaStoreMasterFromDatabase(
		context.database,
	).itemList.find(
		(item) => item.siscaStoreDatasId === entry?.sisca_store_datas_id,
	);
	if (master === undefined) throw new Error('No SIsCa store fixture');
	context.status.jewelFree = master.price;
	context.status.jewelPaidGoogle = master.price;
	const before =
		findUserItemByItemId(context.inventory, master.itemId)?.itemNum ?? 0;
	expect(
		await context.request('post', '/v1/sisca_store/set_purchase', {
			sisca_store_datas_id: master.siscaStoreDatasId,
		}),
	).toMatchObject({
		sisca_info: {
			free: master.isPaidSiscaOnly ? master.price : 0,
			paid: master.isPaidSiscaOnly ? 0 : master.price,
		},
		user_item_info: {
			item_id: master.itemId,
			item_num: before + master.itemNum,
		},
	});
});
