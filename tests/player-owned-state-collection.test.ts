import { describe, expect, test } from 'bun:test';
import { removePlayerOwnedEntries } from '../src/state/player-owned-state-collection.ts';

describe('removePlayerOwnedEntries', () => {
	test('指定playerのentryだけを除外し入力collectionを変更しない', () => {
		const entries = [
			{ playerId: 'player-1', value: 1 },
			{ playerId: 'player-2', value: 2 },
		];
		expect(removePlayerOwnedEntries(entries, 'player-1')).toEqual([
			{ playerId: 'player-2', value: 2 },
		]);
		expect(entries).toHaveLength(2);
	});
});
