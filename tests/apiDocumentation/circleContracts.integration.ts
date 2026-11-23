import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';
import { authHeaders, createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

const circleInfo = z.object({
	circle_info: z.object({
		search_guild_key: z.string(),
		guild_name: z.string(),
		leader_player_id: z.string(),
	}),
});
const invitationList = z.object({
	join_info_list: z.array(
		z.object({ player_id: z.string(), d_guild_invitations_id: z.string() }),
	),
});

test('サークルの作成・検索・設定・チャットがSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	await request('post', '/v1/circle/get_circle_top_info');
	await request('post', '/v1/circle/get_list');
	await request('post', '/v1/circle/get_invite_list');
	const document = createGameOpenApiDocument(app.routes);
	const example =
		document.paths['/v1/circle/set_create']?.post?.requestBody?.content[
			'application/json'
		].example;
	const body = z.object({ guild_setting: z.string() }).parse(example);
	const created = circleInfo.parse(
		await request('post', '/v1/circle/set_create', body),
	);
	const key = { search_guild_key: created.circle_info.search_guild_key };
	expect(created.circle_info.guild_name).toBe('Sample Circle');
	await request('post', '/v1/circle/get_circle_top_info');
	await request('post', '/v1/circle/get_detail', key);
	await request('post', '/v1/circle/get_info', key);
	expect(
		await request('post', '/v1/circle/get_list', {
			search_conditions: JSON.stringify({
				guild_name: 'Sample Circle',
				page_num: 1,
			}),
		}),
	).toMatchObject({
		circle_info_list: [
			expect.objectContaining({ guild_name: 'Sample Circle' }),
		],
	});
	await request('post', '/v1/circle/set_setting', { ...body, ...key });
	expect(
		await request('post', '/v1/circle/set_chat_message', {
			guild_chat_info: JSON.stringify({ chat_comment: 'Sample message' }),
		}),
	).toEqual({ chat_comment: 'Sample message' });
	expect(
		await request('get', '/v1/circle/get_chat_log_list', { diff_order_id: 0 }),
	).toMatchObject({
		circle_chat_log_list: expect.arrayContaining([
			expect.objectContaining({ comment: 'Sample message' }),
		]),
	});
	await request('post', '/v1/circle/get_chat_log_list');
	expect(await request('post', '/v1/circle/set_dissolution')).toEqual({
		result: true,
	});
	expect(await request('post', '/v1/circle/get_list')).toMatchObject({
		circle_info_list: [],
	});
});

test('サークルの加入申請・役職変更・退会が利用者別に契約へ適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	const leader = await registerNewUser(app);
	const member = await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const leaderHeaders = authHeaders(leader.session_token);
	const memberHeaders = authHeaders(member.session_token);
	const created = circleInfo.parse(
		await request(
			'post',
			'/v1/circle/set_create',
			{
				guild_setting: JSON.stringify({
					guild_name: 'Sample Circle',
					guild_comment: 'Sample description',
					guild_policy_action: 1,
					guild_policy_recruiting: 2,
					guild_icon_parts_info: '{}',
				}),
			},
			leaderHeaders,
		),
	);
	const key = { search_guild_key: created.circle_info.search_guild_key };
	async function invite() {
		await request('post', '/v1/circle/set_join', key, memberHeaders);
		const list = invitationList.parse(
			await request(
				'post',
				'/v1/circle/get_invite_and_join_info',
				{},
				leaderHeaders,
			),
		);
		const invitation = list.join_info_list.find(
			(entry) => entry.player_id === member.player_id,
		);
		if (invitation === undefined)
			throw new Error('Join request was not recorded');
		return { d_guild_invitations_id: invitation.d_guild_invitations_id };
	}
	await request(
		'post',
		'/v1/circle/set_cancel_join',
		await invite(),
		memberHeaders,
	);
	await request(
		'post',
		'/v1/circle/set_reject_join',
		await invite(),
		leaderHeaders,
	);
	await request(
		'post',
		'/v1/circle/set_approve_join',
		await invite(),
		leaderHeaders,
	);
	const target = { player_id: member.player_id };
	await request(
		'post',
		'/v1/circle/set_position',
		{ ...target, position_type: 2 },
		leaderHeaders,
	);
	await request('post', '/v1/circle/set_dismissal', target, leaderHeaders);
	await request('post', '/v1/circle/set_expulsion', target, leaderHeaders);
	await request(
		'post',
		'/v1/circle/set_approve_join',
		await invite(),
		leaderHeaders,
	);
	await request(
		'post',
		'/v1/circle/set_transfer_leader',
		target,
		leaderHeaders,
	);
	expect(
		circleInfo.parse(
			await request('post', '/v1/circle/get_info', key, memberHeaders),
		).circle_info.leader_player_id,
	).toBe(member.player_id);
	await request('post', '/v1/circle/set_out', {}, leaderHeaders);
	await request('post', '/v1/circle/set_dissolution', {}, memberHeaders);
});
