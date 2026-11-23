import { expect, test } from 'bun:test';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('フォローの検索・追加・一覧・解除がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	const target = await registerNewUser(app);
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	expect(
		await request('post', '/v1/follow/search_id', {
			player_id: target.player_id,
		}),
	).toEqual({ resultCode: 0 });
	expect(
		await request('post', '/v1/follow/search_id', {
			player_id: 'missing-player',
		}),
	).toEqual({ resultCode: 1 });
	expect(await request('post', '/v1/follow/live_chat_group_list')).toEqual({
		group_x: [],
		group_y: [],
	});
	expect(await request('post', '/v1/follow/recommend_list')).toMatchObject({
		recommend_info_list: expect.arrayContaining([
			expect.objectContaining({ player_id: target.player_id }),
		]),
	});
	expect(await request('post', '/v1/follow/get_list')).toMatchObject({
		follow_info_list: [],
	});
	await request('post', '/v1/follow/set_follow', {
		player_id: target.player_id,
		follow_type: 1,
	});
	expect(await request('post', '/v1/follow/get_list')).toMatchObject({
		follow_info_list: [
			expect.objectContaining({ player_id: target.player_id }),
		],
	});
	await request('post', '/v1/follow/get_follower_list');
	await request('post', '/v1/follow/set_friend_card', {});
	await request('post', '/v1/follow/set_follow', {
		player_id: target.player_id,
		follow_type: 2,
	});
	expect(await request('post', '/v1/follow/get_list')).toMatchObject({
		follow_info_list: [],
	});
});
