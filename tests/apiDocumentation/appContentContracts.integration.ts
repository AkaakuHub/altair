import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';
import { createContractValidator } from '../../tools/apiDocumentation/contractValidation.ts';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('活動記録の取得と視聴結果がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const top = z
		.object({
			activity_record_monthly_info_list: z.array(
				z.object({
					adv_info_list: z.array(
						z.object({ adv_data_id: z.number(), watchable_status: z.number() }),
					),
				}),
			),
		})
		.parse(await request('post', '/v1/activity_record/get_top'));
	const adv = top.activity_record_monthly_info_list
		.flatMap((series) => series.adv_info_list)
		.find((entry) => entry.watchable_status === 1);
	if (adv === undefined)
		throw new Error('Activity record fixture has no playable ADV');
	await request('post', '/v1/activity_record/play_adv_data', {
		adv_data_id: adv.adv_data_id,
	});
});

test('デイリー選択・ステップアップミッション・WebViewのGETとPOSTが契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	await request('post', '/v1/out_quest_live/daily/get_stage_select');
	await request('post', '/v1/step_up_beginner_mission/get_list');
	const path = '/v1/webview/school_idol_connect_post/get_theme_list';
	expect(await request('post', path)).toEqual([]);
	const document = createGameOpenApiDocument(app.routes);
	const schema =
		document.paths[path]?.get?.responses['200']?.content?.['application/json']
			.schema;
	if (schema === undefined)
		throw new Error('WebView GET response contract is missing');
	const response = await app.request(path);
	expect(response.status).toBe(200);
	const body: unknown = await response.json();
	createContractValidator(document.components.schemas)(schema, body);
	expect(body).toEqual([]);
});
