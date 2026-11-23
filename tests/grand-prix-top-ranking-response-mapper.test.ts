import { describe, expect, test } from 'bun:test';
import { mapGrandPrixRankingListResponse } from '../src/v1/active-master-database/grand-prix-top-ranking-response-mapper.ts';

describe('grand prix top ranking response mapper', () => {
	test('keeps the official empty ranking shape', () => {
		expect(mapGrandPrixRankingListResponse(1, 0, [])).toEqual({
			body: {
				status: 1,
				my_rank: 0,
				lowest_rank: 0,
				point_rankings: [],
				circle_high_score_rankings: [],
			},
			statusCode: 200,
		});
	});

	test('uses the last projected rank as the lowest rank', () => {
		const rankings = [
			{
				id: 'player-1',
				name: 'Player',
				user_type: 2,
				icon_parts_info: '{}',
				rank: 7,
				point: 100,
				is_mute_player: false,
			},
		];
		expect(mapGrandPrixRankingListResponse(2, 7, rankings).body).toMatchObject({
			status: 2,
			my_rank: 7,
			lowest_rank: 7,
			point_rankings: rankings,
		});
	});
});
