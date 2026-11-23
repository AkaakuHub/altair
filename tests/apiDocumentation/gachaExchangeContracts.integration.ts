import { expect, test } from 'bun:test';
import { z } from 'zod';
import { getItemIdentityFingerprint } from '../../src/master-data/entity-identity-fingerprints.ts';
import { getGachaGuaranteeExchangeRateByIdFromDatabase } from '../../src/master-data/gacha-guarantee-master.ts';
import { getSelectTicketSeriesExchangeTicketsFromDatabase } from '../../src/master-data/gacha-select-ticket-master.ts';
import { getGachaSeriesProvenance } from '../../src/master-data/gacha-series-identity.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../src/master-data/item-master.ts';
import { ensureUserGachaState } from '../../src/state/gacha-aggregate-state.ts';
import { ensureGachaSeriesProgress } from '../../src/state/gacha-series-progress-state.ts';
import { findUserItemByItemId } from '../../src/state/user-inventory-aggregate.ts';
import { setUserItemQuantity } from '../../src/state/user-item-mutation.ts';
import { createInMemoryServerStateStore } from '../support/inMemoryServerStateStore.ts';
import { config, createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

async function prepare() {
	const saved = createInMemoryServerStateStore();
	const app = createTestApp({
		requestLogEnabled: false,
		stateStore: saved.store,
	});
	const user = await registerNewUser(app);
	const request = createDocumentedRequest(app);
	await request('post', '/v1/user/card/get_list');
	await request('post', '/v1/user/items/get_list');
	const repository = config.activeMasterRepository;
	if (repository === undefined) throw new Error('Missing master repository');
	return { saved, request, user, selection: repository.selection };
}

test('選択チケットの一覧・所有カード・交換が契約に適合し、チケットを消費する', async () => {
	const { saved, request, selection } = await prepare();
	const series = getSelectTicketSeriesExchangeTicketsFromDatabase(
		selection.database,
	)[0];
	const inventory = saved.getState().userInventories[0];
	if (series === undefined || inventory === undefined)
		throw new Error('Missing select ticket fixture');
	const definition = getItemDefinitionByItemIdFromDatabase(
		selection.database,
		series.exchangeTicketId,
	);
	const fingerprint = getItemIdentityFingerprint(
		selection.database,
		series.exchangeTicketId,
	);
	if (definition === undefined || fingerprint === undefined)
		throw new Error('Missing ticket definition');
	setUserItemQuantity(inventory, definition, 1, {
		sourceMasterReleaseId: selection.releaseId,
		identityFingerprint: fingerprint,
	});
	expect(
		await request('post', '/v1/select_ticket_exchange/get_list'),
	).toMatchObject({
		select_ticket_exchange_list: expect.arrayContaining([
			{
				select_ticket_series_id: series.selectTicketSeriesId,
				user_select_ticket_num: 1,
			},
		]),
	});
	const having = z
		.object({
			exchange_card_list: z.array(
				z.object({ card_datas_id: z.number(), is_having: z.boolean() }),
			),
		})
		.parse(
			await request('post', '/v1/gacha/get_exchange_card_having_list', {
				exchange_type: 2,
				exchange_id: series.selectTicketSeriesId,
			}),
		);
	const card = having.exchange_card_list.find((item) => !item.is_having);
	if (card === undefined) throw new Error('No unowned exchange card fixture');
	const rate = selection.database
		.query<{ id: number }, [number, number]>(
			'SELECT id FROM master_select_ticket_exchange_rate WHERE select_ticket_series_id = ? AND exchange_item_type = 2 AND exchange_item_id = ? ORDER BY id LIMIT 1',
		)
		.get(series.selectTicketSeriesId, card.card_datas_id);
	if (rate === null) throw new Error('Missing select ticket exchange rate');
	expect(
		await request('post', '/v1/gacha/set_select_ticket_exchange', {
			select_ticket_exchange_rate_id: rate.id,
		}),
	).toEqual({
		receipt_items: [
			{
				get_id: card.card_datas_id,
				get_item_type: 2,
				get_num: 1,
				is_new: true,
			},
		],
	});
	expect(
		findUserItemByItemId(inventory, series.exchangeTicketId)?.itemNum,
	).toBe(0);
	const owned = saved.getState().userCards[0]?.userCardDataList;
	expect(owned?.some((item) => item.card_datas_id === card.card_datas_id)).toBe(
		true,
	);
});

test('ガチャ保証ポイントの一覧と交換が契約に適合し、ポイントとカードを更新する', async () => {
	const { saved, request, selection, user } = await prepare();
	const cardCollection = saved.getState().userCards[0];
	if (cardCollection === undefined) throw new Error('Missing card collection');
	const owned = new Set(
		cardCollection.userCardDataList.map((card) => card.card_datas_id),
	);
	const rateId = selection.database
		.query<{ id: number; exchange_item_id: number }, []>(
			'SELECT id, exchange_item_id FROM master_exchange_point_rate WHERE exchange_item_type = 2 ORDER BY id',
		)
		.all()
		.find((rate) => !owned.has(rate.exchange_item_id))?.id;
	const rate =
		rateId === undefined
			? undefined
			: getGachaGuaranteeExchangeRateByIdFromDatabase(
					selection.database,
					rateId,
				);
	if (rate === undefined) throw new Error('Missing guarantee exchange fixture');
	const provenance = getGachaSeriesProvenance(
		selection.database,
		selection.releaseId,
		rate.gachaSeriesId,
	);
	if (provenance === undefined)
		throw new Error('Missing guarantee series provenance');
	const gacha = ensureUserGachaState(saved.getState(), user.player_id).value;
	const progress = ensureGachaSeriesProgress(
		gacha,
		rate.gachaSeriesId,
		provenance,
	);
	progress.userExchangePointNum = rate.exchangePrice;
	expect(
		await request('post', '/v1/gacha/get_guarantee_point_list', {
			gacha_series_id: rate.gachaSeriesId,
		}),
	).toMatchObject({
		exchange_item_list: expect.arrayContaining([
			expect.objectContaining({
				exchange_point_rate_id: rate.exchangePointRateId,
				is_having: false,
			}),
		]),
	});
	expect(
		await request('post', '/v1/gacha/set_guarantee_point_exchange', {
			exchange_point_rate_id: rate.exchangePointRateId,
		}),
	).toEqual({
		receipt_items: [
			{
				get_id: rate.exchangeItemId,
				get_item_type: rate.exchangeItemType,
				get_num: rate.exchangeItemQuantity,
				is_new: true,
			},
		],
	});
	expect(progress.userExchangePointNum).toBe(0);
	expect(
		cardCollection.userCardDataList.some(
			(card) => card.card_datas_id === rate.exchangeItemId,
		),
	).toBe(true);
});
