import { describe, expect, test } from 'bun:test';
import { projectArchivePlaybackCursor } from '../src/application/archive-playback-cursor-projection.ts';
import {
	setCurrentWithliveArchive,
	setCurrentWithstationArchive,
} from '../src/state/archive-playback-cursor.ts';

describe('archive playback cursor projection', () => {
	test('hides unsupported cursor without changing canonical data', () => {
		const canonical = { liveId: 'new-live', playTimeSecond: 12 };
		const before = structuredClone(canonical);

		expect(
			projectArchivePlaybackCursor(
				canonical,
				(liveId) => liveId === 'old-live',
			),
		).toBeUndefined();
		expect(canonical).toEqual(before);
		expect(projectArchivePlaybackCursor(canonical, () => true)).toBe(canonical);
	});
});

describe('withstation archive playback cursor', () => {
	test('archive開始時のmaster snapshotをcursorへ固定する', () => {
		const collection = {
			playerId: 'player-1',
			watchedWithliveArchiveIds: [],
			watchedFesArchiveIds: [],
			userStickerStates: [],
		};

		expect(
			setCurrentWithstationArchive(
				collection,
				'live-1',
				'snapshot-1',
				12,
				new Date('2026-07-11T00:00:00.000Z'),
			),
		).toBe(true);
		expect(collection).toMatchObject({
			currentWithstationArchiveId: 'live-1',
			currentWithstationArchiveMasterReleaseId: 'snapshot-1',
			currentWithstationArchiveStartMillisecond: 12_000,
		});
	});
});

describe('withlive archive playback cursor', () => {
	test('archive開始時のmaster snapshotをcursorへ固定する', () => {
		const collection = {
			playerId: 'player-1',
			watchedWithliveArchiveIds: [],
			watchedFesArchiveIds: [],
			userStickerStates: [],
		};

		expect(
			setCurrentWithliveArchive(
				collection,
				'live-1',
				'snapshot-1',
				12,
				3,
				1,
				new Date('2026-07-11T00:00:00.000Z'),
			),
		).toBe(true);
		expect(collection).toMatchObject({
			currentWithliveArchiveId: 'live-1',
			currentWithliveArchiveMasterReleaseId: 'snapshot-1',
		});
	});
});
