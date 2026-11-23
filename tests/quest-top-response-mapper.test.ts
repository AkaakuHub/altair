import { describe, expect, test } from 'bun:test';
import { stamina } from '../src/v1/active-master-database/basic-data.ts';
import { mapQuestTopResponse } from '../src/v1/active-master-database/quest-top-response-mapper.ts';

describe('quest top response mapper', () => {
	test('inactive challengeと欠損raidを公式の空値へ写像する', () => {
		const response = mapQuestTopResponse({
			standardLiveStatus: 1,
			dailyLiveStatus: 0,
			musicLiveStatus: 1,
			gradeLiveStatus: 0,
			gradeChallengeStatus: 0,
			gradeChallenge: {
				activeGradeChallengeSeasonId: 12,
				startDate: '2026-01-01T00:00:00Z',
				endDate: '2026-02-01T00:00:00Z',
				status: 1,
			},
			gradeDetail: {
				grade_num: 1,
				is_not_received_grade_reward: false,
				season_grade_id: 0,
				season_grade_point: 0,
				season_grade_point_rank: 0,
				status: 1,
				total_grade_point: 0,
				grade_rewards: [],
			},
			dreamLiveStatus: 0,
			grandPrixFields: {
				grand_prix_open: false,
				grand_prix_status: 0,
				grand_prix_id: 4,
				grand_prix_start_datetime: '',
				grand_prix_end_datetime: '',
			},
			raidEvent: null,
			openCampaignIds: [3],
			standardAreaSelect: {
				name: 'Sample',
				area_list: [],
				user_stamina: stamina(),
			},
		});

		expect(response).toMatchObject({
			grade_challenge_season_id: 0,
			grade_challenge_season_start_datetime: null,
			grade_challenge_season_end_datetime: null,
			raid_event_status: 0,
			raid_event_id: 0,
			raid_event_start_datetime: null,
			raid_event_end_datetime: null,
			open_campaign_id_list: [3],
		});
	});
});
