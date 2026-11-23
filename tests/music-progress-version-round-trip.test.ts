import { describe, expect, test } from 'bun:test';
import {
	ensureUserLearningMusicMastery,
	saveUserLearningMusicMastery,
	type UserLearningMusicStateOwner,
} from '../src/state/user-learning-music-state.ts';
import type { UserRhythmGameStateOwner } from '../src/state/user-rhythm-game-types.ts';
import {
	findUserRhythmMusicScore,
	saveUserRhythmMusicScore,
} from '../src/state/user-rhythm-music-score-progress.ts';

const versionA = {
	sourceMasterReleaseId: 'release-a',
	identityFingerprint: { domain: 'music', value: '[1,10]' },
};
const versionB = {
	sourceMasterReleaseId: 'release-b',
	identityFingerprint: { domain: 'music', value: '[1,20]' },
};

describe('music progress version round trip', () => {
	test('legacy scoreを初回更新時の基準にし、fingerprint付きscoreを別entryで保存する', () => {
		const live: UserRhythmGameStateOwner = {
			rhythmMusicScores: [
				{
					musicId: 1,
					highScore: 50,
					highScoreAchievementStatus: 1,
					clearCount: 1,
					totalScoreAccumulated: 50,
					musicMasteryLevel: 1,
					musicMasteryExperience: 2,
					difficultyScores: [],
				},
			],
			rhythmGameClassMissionReceivedOrders: [],
			rhythmGameDecks: [],
		};
		const legacy = findUserRhythmMusicScore(
			live,
			1,
			versionA.identityFingerprint,
		);

		saveUserRhythmMusicScore(live, { ...legacy, highScore: 100 }, versionA);

		expect(live.rhythmMusicScores).toHaveLength(2);
		expect(
			findUserRhythmMusicScore(live, 1, versionA.identityFingerprint).highScore,
		).toBe(100);
		expect(
			findUserRhythmMusicScore(live, 1, versionB.identityFingerprint).highScore,
		).toBe(50);
	});

	test('異なるidentityのscoreを保持したままversion間を往復する', () => {
		const live: UserRhythmGameStateOwner = {
			rhythmMusicScores: [],
			rhythmGameClassMissionReceivedOrders: [],
			rhythmGameDecks: [],
		};
		const emptyA = findUserRhythmMusicScore(
			live,
			1,
			versionA.identityFingerprint,
		);
		saveUserRhythmMusicScore(live, { ...emptyA, highScore: 100 }, versionA);
		const emptyB = findUserRhythmMusicScore(
			live,
			1,
			versionB.identityFingerprint,
		);
		saveUserRhythmMusicScore(live, { ...emptyB, highScore: 200 }, versionB);

		expect(
			findUserRhythmMusicScore(live, 1, versionA.identityFingerprint).highScore,
		).toBe(100);
		expect(
			findUserRhythmMusicScore(live, 1, versionB.identityFingerprint).highScore,
		).toBe(200);
		expect(
			live.rhythmMusicScores.map((score) => score.sourceMasterReleaseId),
		).toEqual(['release-a', 'release-b']);
	});

	test('learning masteryもlegacyを基準にfingerprintごとの進捗を保持する', () => {
		const live: UserLearningMusicStateOwner = {
			learningMusicMasteries: [
				{
					musicId: 1,
					musicExpLevel: 2,
					earnedMusicExp: 20,
					isMastery: true,
				},
			],
		};
		const masteryA = ensureUserLearningMusicMastery(
			live,
			{ musicId: 1, musicExpLevel: 1, earnedMusicExp: 0, isMastery: true },
			versionA,
		);
		saveUserLearningMusicMastery(
			live,
			{ ...masteryA, earnedMusicExp: 30 },
			versionA,
		);
		const masteryB = ensureUserLearningMusicMastery(
			live,
			{ musicId: 1, musicExpLevel: 1, earnedMusicExp: 0, isMastery: true },
			versionB,
		);

		expect(masteryB.earnedMusicExp).toBe(20);
		saveUserLearningMusicMastery(
			live,
			{ ...masteryB, earnedMusicExp: 40 },
			versionB,
		);
		expect(live.learningMusicMasteries).toHaveLength(3);
		expect(
			ensureUserLearningMusicMastery(live, masteryA, versionA).earnedMusicExp,
		).toBe(30);
		expect(
			ensureUserLearningMusicMastery(live, masteryB, versionB).earnedMusicExp,
		).toBe(40);
	});
});
