import { describe, expect, test } from 'bun:test';
import { shouldAddActivityRecordFirstWatchPresent } from '../src/application/activity-record-play-service.ts';

const state = {
	playerId: 'p1',
	displayedActivityRecordAdvSeriesIds: [],
	watchedActivityRecordAdvDataIds: [1],
	unlockedActivityRecordAdvDataIds: [],
};
const identityFingerprint = { domain: 'activity-record-adv', value: '[1,10]' };

describe('activity record play service', () => {
	test('最新seriesの初回再生だけpresent対象にする', () => {
		expect(
			shouldAddActivityRecordFirstWatchPresent(
				state,
				2,
				true,
				identityFingerprint,
			),
		).toBe(true);
		expect(
			shouldAddActivityRecordFirstWatchPresent(
				state,
				1,
				true,
				identityFingerprint,
			),
		).toBe(false);
		expect(
			shouldAddActivityRecordFirstWatchPresent(
				state,
				2,
				false,
				identityFingerprint,
			),
		).toBe(false);
	});
});
