import { expect, test } from 'bun:test';
import { ensureUserGachaState } from '../src/state/gacha-aggregate-state.ts';
import { executeGachaPurchase } from '../src/state/gacha-purchase-execution.ts';
import type { UserCardTemplateState } from '../src/state/user-card-types.ts';
import { createGachaHistoryResponse } from '../src/v1/responses/gacha-response.ts';

test('purchase stateからfixtureなしで公式gacha履歴responseを生成する', () => {
	const userGacha = ensureUserGachaState({ userGachas: [] }, 'player-a').value;
	const result = executeGachaPurchase(
		userGacha,
		{ playerId: 'player-a', userCardDataList: [] },
		() => cardTemplate,
		() => ({
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: { domain: 'card', value: 'card-100' },
		}),
		10,
		{
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: { domain: 'gacha-series', value: 'series-10' },
		},
		1,
		{ cardDatasIds: [100], bonusResults: [] },
		20,
		() => ({
			coinNum: 10,
			materialLimitBreakItemId: 30,
			materialLimitBreakNum: 1,
		}),
		{ price: 2_000, type: 2 },
	);

	expect(result).toBeDefined();
	const response = createGachaHistoryResponse(userGacha);
	expect(response.gacha_result_history_list).toHaveLength(1);
	expect(response.gacha_result_history_list[0]).toMatchObject({
		gacha_price_num: 2_000,
		gacha_price_type: 2,
		gacha_series_id: 10,
		gacha_result_history_info_list: [
			{
				card_datas_id: 100,
				gacha_bonus_result_history_list: [],
				order_id: 1,
			},
		],
	});
	expect(response.gacha_result_history_list[0]?.gacha_date_time).toMatch(
		/^\d{4}-\d{2}-\d{2}T/u,
	);
});

const cardTemplate: UserCardTemplateState = {
	d_card_datas_id: '100',
	card_datas_id: 100,
	card_name: 'Card',
	card_series_id: 10,
	style_level: 1,
	max_style_level: 1,
	limit_break_times: 0,
	max_limit_break_times: 4,
	card_parameters: { smile: 1, pure: 1, cool: 1, mental: 1, beat_point: 1 },
	skill_list: [],
	character_id: 1,
	generations_id: 1,
	series_type: 1,
	card_sort_order: 1,
	character_bonus: {
		character_id: 1,
		music_mastery_bonus: 0,
		love_correction_value: 0,
		music_mastery_bonus_list: [],
		season_fan_level: 1,
	},
	is_evolve_possible: false,
	is_evolve_max: false,
	member_fan_level: 1,
	is_limit_break: false,
	is_style_level_up: false,
	rhythm_game_skill_list: [],
};
