import { describe, expect, test } from 'bun:test';
import { projectProfileUserProgressStats } from '../src/application/profile-progress-projection.ts';
import { ensureUserLiveState } from '../src/state/user-live-state.ts';

describe('profile progress projection', () => {
	test('counts only progress supported by the selected master release', () => {
		const live = ensureUserLiveState({ userLives: [] }, 'player-1').value;
		live.learningMusicMasteries = [
			{ musicId: 10, musicExpLevel: 1, earnedMusicExp: 0, isMastery: false },
			{ musicId: 20, musicExpLevel: 1, earnedMusicExp: 0, isMastery: false },
		];
		live.questStageProgressList = [
			{ questLiveType: 1, stageId: 100, highScore: 0, playCount: 1 },
			{
				questLiveType: 1,
				stageId: 200,
				highScore: 0,
				playCount: 1,
				identityFingerprint: {
					domain: 'standard-quest-stage',
					value: 'old-definition',
				},
			},
		];
		live.gradeQuestProgressList = [
			{ seriesId: 1000, clearStatus: 1, bonusCleared: false },
			{ seriesId: 2000, clearStatus: 1, bonusCleared: false },
		];
		const canonical = structuredClone(live);

		expect(
			projectProfileUserProgressStats(live, {
				musicIds: new Set([10]),
				standardStageFingerprints: new Map([
					[100, { domain: 'standard-quest-stage', value: 'legacy-target' }],
					[200, { domain: 'standard-quest-stage', value: 'new-definition' }],
				]),
				gradeSeriesFingerprints: new Map([
					[1000, { domain: 'grade-quest-series', value: '1000' }],
				]),
			}),
		).toEqual({
			musicNum: 1,
			standardLiveClearNum: 1,
			gradeLiveClearNum: 1,
		});
		expect(live).toEqual(canonical);
	});
});
