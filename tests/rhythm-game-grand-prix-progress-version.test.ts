import { describe, expect, test } from 'bun:test';
import { createRhythmGameGrandPrixSeriesIdentityFingerprint } from '../src/master-data/rhythm-game-grand-prix-series-identity.ts';
import {
	findRhythmGameGrandPrixSeriesProgress,
	recordRhythmGameGrandPrixSeriesResult,
	saveRhythmGameGrandPrixSeriesProgress,
} from '../src/state/rhythm-game-grand-prix-series-progress.ts';
import type { UserRhythmGameGrandPrixState } from '../src/state/rhythm-game-grand-prix-types.ts';

const oldFingerprint = createRhythmGameGrandPrixSeriesIdentityFingerprint({
	id: 20,
	grand_prixes_id: 10,
	order_id: 1,
	quest_musics_type: 1,
	quest_musics_detail: 100,
});
const newFingerprint = createRhythmGameGrandPrixSeriesIdentityFingerprint({
	id: 20,
	grand_prixes_id: 10,
	order_id: 1,
	quest_musics_type: 1,
	quest_musics_detail: 200,
});

describe('rhythm game grand prix progress version', () => {
	test('uses gameplay structure but not display order as series identity', () => {
		const reorderedFingerprint =
			createRhythmGameGrandPrixSeriesIdentityFingerprint({
				id: 20,
				grand_prixes_id: 10,
				order_id: 9,
				quest_musics_type: 1,
				quest_musics_detail: 100,
			});

		expect(reorderedFingerprint).toEqual(oldFingerprint);
		expect(newFingerprint).not.toEqual(oldFingerprint);
	});

	test('preserves independent progress when the same series id changes identity', () => {
		const grandPrix: UserRhythmGameGrandPrixState = {
			grandPrixId: 10,
			seriesProgressList: [],
		};
		recordRhythmGameGrandPrixSeriesResult(
			grandPrix,
			20,
			1000,
			100,
			oldFingerprint,
			'old-release',
		);
		recordRhythmGameGrandPrixSeriesResult(
			grandPrix,
			20,
			2000,
			200,
			newFingerprint,
			'new-release',
		);

		expect(
			findRhythmGameGrandPrixSeriesProgress(grandPrix, 20, oldFingerprint),
		).toMatchObject({
			highScore: 1000,
			currentDailyPoint: 100,
			sourceMasterReleaseId: 'old-release',
		});
		expect(
			findRhythmGameGrandPrixSeriesProgress(grandPrix, 20, newFingerprint),
		).toMatchObject({
			highScore: 2000,
			currentDailyPoint: 200,
			sourceMasterReleaseId: 'new-release',
		});
		expect(grandPrix.seriesProgressList).toHaveLength(2);
	});

	test('keeps legacy progress readable without adding runtime provenance', () => {
		const legacy = {
			grandPrixRhythmGameSeriesId: 20,
			highScore: 3000,
			currentDailyPoint: 300,
			playCount: 3,
			deckCardList: [],
		};
		const grandPrix = { grandPrixId: 10, seriesProgressList: [legacy] };

		expect(
			findRhythmGameGrandPrixSeriesProgress(grandPrix, 20, newFingerprint),
		).toBe(legacy);
		expect(legacy).not.toHaveProperty('identityFingerprint');
		expect(legacy).not.toHaveProperty('sourceMasterReleaseId');
	});

	test('prefers exact identity over a retained legacy record', () => {
		const legacy = {
			grandPrixRhythmGameSeriesId: 20,
			highScore: 3000,
			currentDailyPoint: 300,
			playCount: 3,
			deckCardList: [],
		};
		const grandPrix = { grandPrixId: 10, seriesProgressList: [legacy] };
		saveRhythmGameGrandPrixSeriesProgress(grandPrix, {
			...legacy,
			sourceMasterReleaseId: 'new-release',
			identityFingerprint: newFingerprint,
			highScore: 4000,
		});

		expect(
			findRhythmGameGrandPrixSeriesProgress(grandPrix, 20, newFingerprint)
				.highScore,
		).toBe(4000);
		expect(grandPrix.seriesProgressList).toContain(legacy);
	});
});
