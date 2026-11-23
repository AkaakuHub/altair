import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';
import { getGachaSeriesAdminSummaryFromDatabase } from '../../src/master-data/gacha-series-master.ts';
import { ensureUserGachaState } from '../../src/state/gacha-aggregate-state.ts';
import { createGachaHistoryResponse } from '../../src/v1/responses/gacha-response.ts';
import { createContractValidator } from '../../tools/apiDocumentation/contractValidation.ts';
import { createInMemoryServerStateStore } from '../support/inMemoryServerStateStore.ts';
import { config, createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('ガチャ一覧と初期履歴がSwagger契約に適合する', async () => {
	const saved = createInMemoryServerStateStore();
	const app = createTestApp({
		requestLogEnabled: false,
		stateStore: saved.store,
	});
	await registerNewUser(app);
	const repository = config.activeMasterRepository;
	if (repository === undefined) throw new Error('Missing master repository');
	const available = getGachaSeriesAdminSummaryFromDatabase(
		repository.selection.database,
	)[0];
	if (available === undefined) throw new Error('Gacha fixture has no series');
	saved.getState().gachaSeriesActivations = [
		{ gachaSeriesId: available.gachaSeriesId, isEnabled: true },
	];
	const request = createDocumentedRequest(app);
	const series = z
		.object({
			gacha_series_list: z.array(
				z.object({
					gacha_series_id: z.number(),
					card_list: z.array(z.number()),
				}),
			),
		})
		.parse(await request('post', '/v1/gacha/get_series_list'));
	expect(series.gacha_series_list.length).toBeGreaterThan(0);
	expect(
		series.gacha_series_list.some((entry) => entry.card_list.length > 0),
	).toBe(true);
	expect(await request('post', '/v1/gacha/get_history')).toEqual({
		gacha_result_history_list: [],
	});
});

test('購入履歴の要素を固有の型で検証する', () => {
	const document = createGameOpenApiDocument([
		{ method: 'POST', path: '/v1/gacha/get_history' },
	]);
	const schema =
		document.paths['/v1/gacha/get_history']?.post?.responses['200']?.content?.[
			'application/json'
		].schema;
	if (schema === undefined) throw new Error('Missing gacha history schema');
	const validate = createContractValidator(document.components.schemas);
	const state = ensureUserGachaState({ userGachas: [] }, 'sample').value;
	state.resultHistoryList.push({
		gacha_date_time: '2026-01-01T00:00:00Z',
		gacha_price_num: 100,
		gacha_price_type: 2,
		gacha_series_id: 1,
		gacha_result_history_info_list: [
			{ card_datas_id: 1, order_id: 1, gacha_bonus_result_history_list: [] },
		],
	});
	const response = createGachaHistoryResponse(state);
	expect(() => validate(schema, response)).not.toThrow();
	expect(() =>
		validate(schema, {
			gacha_result_history_list: [{ gacha_series_id: 'invalid' }],
		}),
	).toThrow();
	expect(response.gacha_result_history_list[0]).not.toBe(
		state.resultHistoryList[0],
	);
});
