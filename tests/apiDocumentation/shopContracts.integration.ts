import { expect, test } from 'bun:test';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('ショップ・交換所の一覧と素材変換がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	for (const path of [
		'/v1/shop/get_list',
		'/v1/item_store/get_list',
		'/v1/jewel_shop/get_membership_list',
		'/v1/petal_exchange/get_list',
		'/v1/gp_prize_exchange/get_list',
		'/v1/item_exchange/get_list_new',
		'/v1/item_exchange/get_limit_break_material_convert_list',
		'/v1/sticker_exchange/get_list',
		'/v1/sisca_store/get_list',
	])
		await request('post', path);
	expect(
		await request('post', '/v1/item_exchange/get_list_new', {
			category_list_id: -1,
		}),
	).toMatchObject({ item_exchange_list: [] });
	await request('post', '/v1/item_exchange/set_limit_break_material_convert');
});
