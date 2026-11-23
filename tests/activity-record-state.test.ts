import { describe, expect, test } from 'bun:test';
import { ensureUserActivityRecordState } from '../src/state/activity-record-aggregate.ts';

describe('activity record state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userActivityRecords: [] };

		const first = ensureUserActivityRecordState(state, 'player-a');
		const second = ensureUserActivityRecordState(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(state.userActivityRecords).toHaveLength(1);
	});
});
