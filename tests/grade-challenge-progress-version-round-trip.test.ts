import { describe, expect, test } from 'bun:test';
import type { EntityProvenance } from '../src/state/entity-provenance.ts';
import {
	addUserGradeChallengeSeasonGradePoint,
	findUserGradeChallengeSeasonProgress,
	findUserGradeChallengeStageProgress,
	recordUserGradeChallengeStageResult,
} from '../src/state/user-grade-challenge-state.ts';

const stageA: EntityProvenance = {
	sourceMasterReleaseId: 'release-a',
	identityFingerprint: { domain: 'grade-challenge-stage', value: 'stage-a' },
};
const stageB: EntityProvenance = {
	sourceMasterReleaseId: 'release-b',
	identityFingerprint: { domain: 'grade-challenge-stage', value: 'stage-b' },
};
const seasonA: EntityProvenance = {
	sourceMasterReleaseId: 'release-a',
	identityFingerprint: { domain: 'grade-challenge-season', value: 'season-a' },
};
const seasonB: EntityProvenance = {
	sourceMasterReleaseId: 'release-b',
	identityFingerprint: { domain: 'grade-challenge-season', value: 'season-b' },
};

describe('grade challenge progress version round trip', () => {
	test('legacy progressを初回更新の基準にし、fingerprint付きentryを別に保存する', () => {
		const legacyStage = {
			gradeChalSeasonId: 1,
			stageId: 10,
			musicId: 100,
			highScore: 50,
			playCount: 2,
			playReport: 'legacy',
		};
		const legacySeason = { gradeChalSeasonId: 1, seasonGradePoint: 3 };
		const live = {
			gradeChallengeProgressList: [legacyStage],
			gradeChallengeSeasonProgressList: [legacySeason],
		};

		recordUserGradeChallengeStageResult(live, 1, 10, 100, 80, 'a', stageA);
		addUserGradeChallengeSeasonGradePoint(live, 1, 2, seasonA);

		expect(live.gradeChallengeProgressList).toContain(legacyStage);
		expect(live.gradeChallengeSeasonProgressList).toContain(legacySeason);
		expect(
			findUserGradeChallengeStageProgress(
				live,
				1,
				10,
				stageA.identityFingerprint,
			).highScore,
		).toBe(80);
		expect(
			findUserGradeChallengeSeasonProgress(live, 1, seasonA.identityFingerprint)
				.seasonGradePoint,
		).toBe(5);
	});

	test('異なるidentityの進捗を保持したままversion間を往復する', () => {
		const live = {
			gradeChallengeProgressList: [],
			gradeChallengeSeasonProgressList: [],
		};
		recordUserGradeChallengeStageResult(live, 1, 10, 100, 80, 'a', stageA);
		addUserGradeChallengeSeasonGradePoint(live, 1, 2, seasonA);
		recordUserGradeChallengeStageResult(live, 1, 10, 200, 120, 'b', stageB);
		addUserGradeChallengeSeasonGradePoint(live, 1, 7, seasonB);

		expect(
			findUserGradeChallengeStageProgress(
				live,
				1,
				10,
				stageA.identityFingerprint,
			).highScore,
		).toBe(80);
		expect(
			findUserGradeChallengeStageProgress(
				live,
				1,
				10,
				stageB.identityFingerprint,
			).highScore,
		).toBe(120);
		expect(
			findUserGradeChallengeSeasonProgress(live, 1, seasonA.identityFingerprint)
				.seasonGradePoint,
		).toBe(2);
		expect(
			findUserGradeChallengeSeasonProgress(live, 1, seasonB.identityFingerprint)
				.seasonGradePoint,
		).toBe(7);
	});
});
