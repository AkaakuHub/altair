import { describe, expect, test } from 'bun:test';
import type { UserArchiveCollectionState } from '../src/state/archive-collection-definition.ts';
import {
	markFesArchiveWatched,
	markWithliveArchiveWatched,
	projectArchiveWatchedHistory,
} from '../src/state/archive-watched-history.ts';

const withliveA = { domain: 'withlive-archive', value: 'content-a' };
const withliveB = { domain: 'withlive-archive', value: 'content-b' };
const fesA = { domain: 'fes-archive', value: 'content-a' };
const fesB = { domain: 'fes-archive', value: 'content-b' };

function createCollection(): UserArchiveCollectionState {
	return {
		playerId: 'player',
		watchedWithliveArchiveIds: [],
		watchedFesArchiveIds: [],
		watchedWithliveArchiveMemberships: [],
		watchedFesArchiveMemberships: [],
		userStickerStates: [],
	};
}

describe('archive watched history version round trip', () => {
	test('同じIDの異なるidentityを保持し、互換な履歴だけを投影する', () => {
		const collection = createCollection();
		markWithliveArchiveWatched(collection, 'archive-1', {
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: withliveA,
		});
		markFesArchiveWatched(collection, 'archive-1', {
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: fesA,
		});
		expect(
			projectArchiveWatchedHistory(collection, {
				withliveFingerprints: new Map([['archive-1', withliveB]]),
				fesFingerprints: new Map([['archive-1', fesB]]),
			}),
		).toMatchObject({
			watchedWithliveArchiveIds: [],
			watchedFesArchiveIds: [],
		});

		markWithliveArchiveWatched(collection, 'archive-1', {
			sourceMasterReleaseId: 'release-b',
			identityFingerprint: withliveB,
		});
		expect(collection.watchedWithliveArchiveMemberships).toHaveLength(2);
		expect(
			projectArchiveWatchedHistory(collection, {
				withliveFingerprints: new Map([['archive-1', withliveA]]),
				fesFingerprints: new Map([['archive-1', fesA]]),
			}),
		).toMatchObject({
			watchedWithliveArchiveIds: ['archive-1'],
			watchedFesArchiveIds: ['archive-1'],
		});
	});

	test('legacy IDはidentityを推測せず、存在する同じIDへ従来どおり投影する', () => {
		const collection = createCollection();
		collection.watchedWithliveArchiveIds = ['archive-1'];
		expect(
			projectArchiveWatchedHistory(collection, {
				withliveFingerprints: new Map([['archive-1', withliveB]]),
				fesFingerprints: new Map(),
			}).watchedWithliveArchiveIds,
		).toEqual(['archive-1']);
		expect(collection.watchedWithliveArchiveMemberships).toEqual([]);
	});
});
