import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
	createEntriesByPath,
	decodeServerStateEntries,
	encodeServerStateEntries,
	type StateEntry,
	stateEntryEquals,
} from './server-state-entry-codec.ts';
import type {
	PersistedServerState,
	ServerStateScope,
	ServerStateStore,
} from './server-state-store-port.ts';
import { writeServerStateScopes } from './sqlite-server-state-scope-writer.ts';
import type { JsonValue } from './state/json-state-utils.ts';

type StoreProjection = Readonly<{
	restore?: (db: Database, state: JsonValue, statePath: string) => void;
	project?: (value: unknown, scope: ServerStateScope) => unknown;
}>;

export function createSqliteServerStateStore(
	stateDbPath: string,
	projection: StoreProjection = {},
): ServerStateStore & { close(): void } {
	let persistedEntriesByPath: Map<string, StateEntry> | undefined;
	let database: Database | undefined;
	const connection = (): Database => {
		database ??= openStateDatabase(stateDbPath);
		return database;
	};
	return {
		description: stateDbPath,
		close: () => {
			database?.close();
			database = undefined;
			persistedEntriesByPath = undefined;
		},
		read: () => {
			const db = connection();
			const entries = readStateEntries(db);
			persistedEntriesByPath = createEntriesByPath(entries);
			if (entries.length === 0) return null;
			const state = decodeServerStateEntries(entries);
			projection.restore?.(db, state, stateDbPath);
			return state;
		},
		write: (state, scopes, transaction) => {
			const db = connection();
			if (scopes !== undefined) {
				if (persistedEntriesByPath === undefined)
					throw new Error('scoped state write requires an initialized store');
				transaction?.prepare(db, stateDbPath);
				writeServerStateScopes(
					db,
					state,
					scopes,
					persistedEntriesByPath,
					projection.project ?? ((value) => value),
					transaction,
				);
			} else {
				if (transaction !== undefined)
					throw new Error(
						'transaction writes must specify changed state scopes',
					);
				persistedEntriesByPath = writeStateDatabase(
					db,
					projection.project?.(state, []) ?? state,
					persistedEntriesByPath,
				);
			}
		},
	};
}
export function readPersistedServerState(
	stateDbPath: string,
	projection: StoreProjection = {},
): JsonValue | null {
	const db = openStateDatabase(stateDbPath);
	try {
		const entries = readStateEntries(db);
		if (entries.length === 0) return null;
		const state = decodeServerStateEntries(entries);
		projection.restore?.(db, state, stateDbPath);
		return state;
	} finally {
		db.close();
	}
}
export function writePersistedServerState(
	stateDbPath: string,
	state: PersistedServerState,
	previousEntriesByPath?: ReadonlyMap<string, StateEntry>,
): Map<string, StateEntry> {
	const db = openStateDatabase(stateDbPath);
	try {
		return writeStateDatabase(db, state, previousEntriesByPath);
	} finally {
		db.close();
	}
}

function writeStateDatabase(
	db: Database,
	state: unknown,
	previousEntriesByPath?: ReadonlyMap<string, StateEntry>,
): Map<string, StateEntry> {
	const entries = encodeServerStateEntries(state);
	const next = createEntriesByPath(entries);
	let transactionStarted = false;
	try {
		db.exec('begin immediate');
		transactionStarted = true;
		if (!previousEntriesByPath)
			db.query('delete from server_state_entries').run();
		else {
			const deleteEntry = db.query(
				'delete from server_state_entries where path = ?',
			);
			for (const path of previousEntriesByPath.keys())
				if (!next.has(path)) deleteEntry.run(path);
		}
		const upsert = db.query(
			`insert into server_state_entries (path, value_type, string_value, number_value, boolean_value, updated_at) values (?, ?, ?, ?, ?, ?) on conflict(path) do update set value_type = excluded.value_type, string_value = excluded.string_value, number_value = excluded.number_value, boolean_value = excluded.boolean_value, updated_at = excluded.updated_at`,
		);
		const updatedAt = new Date().toISOString();
		for (const entry of entries) {
			if (stateEntryEquals(entry, previousEntriesByPath?.get(entry.path)))
				continue;
			upsert.run(
				entry.path,
				entry.valueType,
				entry.stringValue,
				entry.numberValue,
				entry.booleanValue,
				updatedAt,
			);
		}
		db.exec('commit');
		transactionStarted = false;
	} catch (error) {
		if (transactionStarted) db.exec('rollback');
		throw error;
	}
	return next;
}
function readStateEntries(db: Database): StateEntry[] {
	return db
		.query<StateEntry, []>(
			'select path, value_type as valueType, string_value as stringValue, number_value as numberValue, boolean_value as booleanValue from server_state_entries',
		)
		.all();
}
function openStateDatabase(stateDbPath: string): Database {
	mkdirSync(dirname(stateDbPath), { recursive: true });
	const db = new Database(stateDbPath);
	db.exec(
		`create table if not exists server_state_entries (path text primary key, value_type text not null check (value_type in ('array', 'boolean', 'null', 'number', 'object', 'string')), string_value text, number_value real, boolean_value integer check (boolean_value in (0, 1) or boolean_value is null), updated_at text not null)`,
	);
	return db;
}
