import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	readPersistedServerState,
	writePersistedServerState,
} from '../src/sqlite-server-state-store.ts';
import { STAMINA_RECOVERY_STOPPED_AT } from '../src/state/stamina-recovery-time.ts';
import { mockPlayerNames } from './mock-player-names.ts';

describe('server state store', () => {
	test('restores nested arrays and objects from persisted entries', () => {
		const dbPath = join(
			mkdtempSync(join(tmpdir(), 'link-like-state-')),
			'state.sqlite',
		);
		const state = {
			registeredUsers: [
				{
					playerId: 'A',
					'encoded/key': 'value',
				},
				{
					playerId: 'B',
				},
			],
			userStatuses: [
				{
					playerId: 'A',
					jewelFree: 10,
					staminaRecoveryTime: STAMINA_RECOVERY_STOPPED_AT,
				},
			],
		};

		writePersistedServerState(dbPath, state);

		expect(readPersistedServerState(dbPath)).toEqual(state);
	});

	test('updates only changed entries when a previous snapshot is supplied', () => {
		const dbPath = join(
			mkdtempSync(join(tmpdir(), 'link-like-state-')),
			'state.sqlite',
		);
		const firstState = {
			registeredUsers: [{ playerId: 'A', playerName: mockPlayerNames[0] }],
			userStatuses: [
				{ playerId: 'A', staminaRecoveryTime: STAMINA_RECOVERY_STOPPED_AT },
			],
		};
		const secondState = {
			registeredUsers: [{ playerId: 'A', playerName: mockPlayerNames[1] }],
			userStatuses: [],
		};
		const firstSnapshot = writePersistedServerState(dbPath, firstState);
		writePersistedServerState(dbPath, secondState, firstSnapshot);

		const db = new Database(dbPath, { readonly: true });
		try {
			const staleRow = db
				.query(
					`select path
					from server_state_entries
					where path = 'userStatuses/0/playerId'`,
				)
				.get();
			expect(staleRow).toBeNull();
		} finally {
			db.close();
		}
		expect(readPersistedServerState(dbPath)).toEqual(secondState);
	});
});
