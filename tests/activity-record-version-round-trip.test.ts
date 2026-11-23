import { describe, expect, test } from 'bun:test';
import {
	playActivityRecordAdvData,
	setActivityRecordMonthDisplayed,
} from '../src/state/activity-record-mutation.ts';
import { projectActivityRecordState } from '../src/state/activity-record-projection.ts';
import type { UserActivityRecordState } from '../src/state/activity-record-types.ts';

const advA = { domain: 'activity-record-adv', value: '[101,10]' };
const advB = { domain: 'activity-record-adv', value: '[101,20]' };
const seriesA = { domain: 'activity-record-series', value: '[10,[101]]' };
const seriesB = { domain: 'activity-record-series', value: '[10,[102]]' };

function createState(): UserActivityRecordState {
	return {
		playerId: 'player',
		watchedActivityRecordAdvDataIds: [],
		displayedActivityRecordAdvSeriesIds: [],
		unlockedActivityRecordAdvDataIds: [],
		watchedActivityRecordAdvMemberships: [],
		displayedActivityRecordAdvSeriesMemberships: [],
		unlockedActivityRecordAdvMemberships: [],
	};
}

describe('activity record version round trip', () => {
	test('同じIDの異なるidentityを別々に保持し、対象master releaseと互換な進捗だけを投影する', () => {
		const state = createState();
		playActivityRecordAdvData(state, 101, {
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: advA,
		});
		setActivityRecordMonthDisplayed(state, 10, true, {
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: seriesA,
		});

		expect(
			projectActivityRecordState(state, {
				advFingerprints: new Map([[101, advB]]),
				seriesFingerprints: new Map([[10, seriesB]]),
			}),
		).toMatchObject({
			watchedActivityRecordAdvDataIds: [],
			displayedActivityRecordAdvSeriesIds: [],
		});

		playActivityRecordAdvData(state, 101, {
			sourceMasterReleaseId: 'release-b',
			identityFingerprint: advB,
		});
		setActivityRecordMonthDisplayed(state, 10, true, {
			sourceMasterReleaseId: 'release-b',
			identityFingerprint: seriesB,
		});

		expect(state.watchedActivityRecordAdvMemberships).toHaveLength(2);
		expect(
			projectActivityRecordState(state, {
				advFingerprints: new Map([[101, advA]]),
				seriesFingerprints: new Map([[10, seriesA]]),
			}),
		).toMatchObject({
			watchedActivityRecordAdvDataIds: [101],
			displayedActivityRecordAdvSeriesIds: [10],
		});
	});

	test('legacyのID配列はidentityを推測せず、存在する同じIDへ従来どおり投影する', () => {
		const state = createState();
		state.watchedActivityRecordAdvDataIds = [101];

		expect(
			projectActivityRecordState(state, {
				advFingerprints: new Map([[101, advB]]),
				seriesFingerprints: new Map(),
			}).watchedActivityRecordAdvDataIds,
		).toEqual([101]);
		expect(state.watchedActivityRecordAdvMemberships).toEqual([]);
	});
});
