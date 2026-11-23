import { expect, test } from 'bun:test';
import { z } from 'zod';
import { cardDatasIdToSeriesId } from '../../src/state/user-card-aggregate-state.ts';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('プロフィールの更新・ミュート・通報がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	const target = await registerNewUser(app);
	const user = await registerNewUser(app);
	const request = createDocumentedRequest(app);
	await request('post', '/v1/profile/set_comment', {
		comment: 'Sample comment',
	});
	await request('post', '/v1/profile/set_name', { name: 'Sample User' });
	expect(
		await request('post', '/v1/profile/get_info', {
			player_id: user.player_id,
		}),
	).toMatchObject({
		profile_info: { player_name: 'Sample User', comment: 'Sample comment' },
	});
	await request('post', '/v1/profile/set_mute', {
		player_id: target.player_id,
	});
	expect(await request('post', '/v1/profile/get_mute_list')).toEqual({
		mute_list: [{ player_id: target.player_id }],
	});
	await request('post', '/v1/profile/set_report', {
		player_id: target.player_id,
		report_type: 1,
	});
	expect(
		await request('post', '/v1/profile/get_info', {
			player_id: target.player_id,
		}),
	).toMatchObject({ is_mute: true, is_report: true });
	await request('post', '/v1/profile/set_mute_cancel', {
		player_id: target.player_id,
	});
	expect(await request('post', '/v1/profile/get_mute_list')).toEqual({
		mute_list: [],
	});
});

test('プロフィールのデザイン保存と選択がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const designs = z.object({
		my_design_list: z.array(
			z.object({
				d_profile_my_designs_id: z.string(),
				my_design_parts_info: z.string(),
				is_setting: z.boolean(),
				my_design_name: z.string(),
			}),
		),
	});
	for (const type of ['card', 'icon'] as const) {
		const path = `/v1/profile/get_my_design_${type}_list`;
		const list = designs.parse(await request('post', path));
		const selected = list.my_design_list.find(
			(entry) => entry.my_design_parts_info.length > 0,
		);
		if (selected === undefined)
			throw new Error('Profile fixture has no design parts');
		await request('post', `/v1/profile/set_my_design_${type}`, {
			d_profile_my_designs_id: selected.d_profile_my_designs_id,
			[`profile_${type}_parts_info`]: selected.my_design_parts_info,
			my_design_name: 'Sample design',
		});
		await request('post', `/v1/profile/set_profile_${type}`, {
			d_profile_my_designs_id: selected.d_profile_my_designs_id,
		});
		const saved = designs
			.parse(await request('post', path))
			.my_design_list.find(
				(entry) =>
					entry.d_profile_my_designs_id === selected.d_profile_my_designs_id,
			);
		expect(saved).toMatchObject({
			my_design_name: 'Sample design',
			is_setting: true,
			my_design_parts_info: selected.my_design_parts_info,
		});
	}
});

test('ファンレベル・ホーム設定・表示カード・簡易チュートリアルが契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const fan = z
		.object({
			fan_level_info_list: z.array(z.object({ character_id: z.number() })),
		})
		.parse(await request('post', '/v1/profile/get_fan_level_info'));
	const character = fan.fan_level_info_list[0];
	if (character === undefined)
		throw new Error('Profile fixture has no fan levels');
	await request('post', '/v1/profile/get_fan_level_ranking', {
		character_id: character.character_id,
	});
	const home = z
		.object({ user_card_data_list: z.array(z.number()) })
		.parse(await request('post', '/v1/home/get_custom_setting'));
	const cardId = home.user_card_data_list[0];
	if (cardId === undefined)
		throw new Error('Profile fixture has no available display card');
	expect(
		await request('post', '/v1/card/set_display_data', {
			base_card_series_id: cardDatasIdToSeriesId(cardId),
			display_card_id: cardId,
		}),
	).toMatchObject({ after_display_card_id: cardId });
	await request('post', '/v1/user/set_simple_tutorial_finish', {
		contents_id: 1,
	});
	expect(await request('post', '/v1/home/get_home')).toMatchObject({
		finished_simple_tutorial_list: expect.arrayContaining([1]),
	});
});
