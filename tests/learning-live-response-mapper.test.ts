import { describe, expect, test } from 'bun:test';
import { mapMusicLearningResult } from '../src/v1/active-master-database/learning-live-response-mapper.ts';

describe('learning live response mapper', () => {
	test('公式のmastary field名と経験値を維持する', () => {
		const current = {
			stageId: 3,
			musicId: 10,
			score: 500,
			playReport: '{}',
			questLiveType: 3,
		} as Parameters<typeof mapMusicLearningResult>[0];
		const before = {
			musicId: 10,
			musicExpLevel: 1,
			earnedMusicExp: 20,
			isMastery: true,
		};
		const after = { ...before, musicExpLevel: 2, earnedMusicExp: 50 };
		expect(
			mapMusicLearningResult(current, before, after, 1, 30).body,
		).toMatchObject({
			mastary_level_before: 1,
			mastary_level_after: 2,
			mastary_level_experience: 30,
			before_earned_music_exp: 20,
			earned_music_exp: 50,
		});
	});
});
