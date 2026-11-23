import { describe, expect, test } from 'bun:test';
import {
	findCompatibleGradeQuestProgress,
	saveGradeQuestProgress,
} from '../src/state/user-grade-quest-state.ts';

const versionA = {
	sourceMasterReleaseId: 'a',
	identityFingerprint: { domain: 'grade-quest-series', value: 'a' },
};
const versionB = {
	sourceMasterReleaseId: 'b',
	identityFingerprint: { domain: 'grade-quest-series', value: 'b' },
};

describe('grade quest progress version', () => {
	test('legacyを基準値として残し、初回writeでmaster releaseへbindする', () => {
		const legacy = { seriesId: 1, clearStatus: 1, bonusCleared: false };
		const next = saveGradeQuestProgress(
			[legacy],
			{ ...legacy, clearStatus: 2 },
			versionA,
		);
		expect(next).toHaveLength(2);
		expect(
			findCompatibleGradeQuestProgress(next, 1, versionA.identityFingerprint)
				?.clearStatus,
		).toBe(2);
		expect(
			findCompatibleGradeQuestProgress(next, 1, versionB.identityFingerprint)
				?.clearStatus,
		).toBe(1);
	});

	test('同じseries IDの異identityを並存させversion往復で復元する', () => {
		let progresses = saveGradeQuestProgress(
			[],
			{ seriesId: 1, clearStatus: 1, bonusCleared: false },
			versionA,
		);
		progresses = saveGradeQuestProgress(
			progresses,
			{ seriesId: 1, clearStatus: 2, bonusCleared: true },
			versionB,
		);
		expect(
			findCompatibleGradeQuestProgress(
				progresses,
				1,
				versionA.identityFingerprint,
			)?.clearStatus,
		).toBe(1);
		expect(
			findCompatibleGradeQuestProgress(
				progresses,
				1,
				versionB.identityFingerprint,
			)?.bonusCleared,
		).toBe(true);
	});
});
