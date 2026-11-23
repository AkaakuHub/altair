import { describe, expect, test } from 'bun:test';
import {
	compareQuestClearStatus,
	parseStandardQuestStageIdList,
	standardQuestStageDetail,
} from '../src/v1/active-master-database/standard-quest-response-mappers.ts';

describe('standard quest response mappers', () => {
	test('maps progress without changing hidden progress data', () => {
		const progress = {
			questLiveType: 1,
			stageId: 101,
			highScore: 12345,
			bestLoveMusicId: 2001,
			playCount: 2,
		};

		expect(standardQuestStageDetail(101, progress)).toEqual({
			stage_id: 101,
			is_challenge: false,
			is_skip: true,
			clear_status: 3,
			best_love_music_id: 2001,
			stage_reward_list: [],
			stage_challenge_reward_list: null,
			best_love: 12345,
		});
		expect(progress).toEqual({
			questLiveType: 1,
			stageId: 101,
			highScore: 12345,
			bestLoveMusicId: 2001,
			playCount: 2,
		});
	});

	test('keeps only positive integer stage IDs from master data', () => {
		expect(parseStandardQuestStageIdList('12,invalid,0,-1,13.5,14')).toEqual([
			12, 14,
		]);
	});

	test('orders unlocked stages first and then descending by stage ID', () => {
		const statuses = [
			{ stages_id: 1, quest_live_type: 1, is_lock: true, star_num: 0 },
			{ stages_id: 2, quest_live_type: 1, is_lock: false, star_num: 3 },
			{ stages_id: 3, quest_live_type: 1, is_lock: false, star_num: 0 },
		];

		expect(
			[...statuses]
				.sort(compareQuestClearStatus)
				.map((status) => status.stages_id),
		).toEqual([3, 2, 1]);
	});
});
