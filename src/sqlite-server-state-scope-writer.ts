import type { Database } from 'bun:sqlite';
import {
	encodeServerStateEntries,
	type StateEntry,
	stateEntryEquals,
} from './server-state-entry-codec.ts';
import type {
	ServerStateScope,
	StateWriteTransaction,
} from './server-state-store-port.ts';
import { isRecord } from './state/json-state-utils.ts';

export function writeServerStateScopes(
	db: Database,
	state: unknown,
	scopes: readonly ServerStateScope[],
	previous: Map<string, StateEntry>,
	project: (value: unknown, scope: ServerStateScope) => unknown,
	transaction?: StateWriteTransaction,
): void {
	const branches = scopes.map((scope) => {
		if (scope.length === 0) throw new Error('state scope must not be empty');
		const path = scope
			.map((part) => encodeURIComponent(String(part)))
			.join('/');
		const value = readScope(state, scope);
		return {
			path,
			entries: new Map(
				encodeServerStateEntries(project(value, scope), path).map((entry) => [
					entry.path,
					entry,
				]),
			),
		};
	});
	const changes = new Map<string, StateEntry>();
	const removed = new Set<string>();
	const readPaths = db.query<{ path: string }, [string, string, string]>(
		'select path from server_state_entries where path = ? or (path >= ? and path < ?)',
	);
	const deleteEntry = db.query(
		'delete from server_state_entries where path = ?',
	);
	const upsert = db.query(
		'insert into server_state_entries (path, value_type, string_value, number_value, boolean_value, updated_at) values (?, ?, ?, ?, ?, ?) on conflict(path) do update set value_type = excluded.value_type, string_value = excluded.string_value, number_value = excluded.number_value, boolean_value = excluded.boolean_value, updated_at = excluded.updated_at',
	);
	const updatedAt = new Date().toISOString();
	db.exec('begin immediate');
	try {
		transaction?.write(db);
		for (const branch of branches) {
			for (const { path } of readPaths.all(
				branch.path,
				`${branch.path}/`,
				`${branch.path}0`,
			)) {
				if (branch.entries.has(path)) continue;
				deleteEntry.run(path);
				removed.add(path);
			}
			for (const entry of branch.entries.values()) {
				if (stateEntryEquals(entry, previous.get(entry.path))) continue;
				upsert.run(
					entry.path,
					entry.valueType,
					entry.stringValue,
					entry.numberValue,
					entry.booleanValue,
					updatedAt,
				);
				changes.set(entry.path, entry);
			}
		}
		db.exec('commit');
	} catch (cause) {
		db.exec('rollback');
		throw cause;
	}
	for (const path of removed) previous.delete(path);
	for (const [path, entry] of changes) previous.set(path, entry);
}

function readScope(state: unknown, scope: ServerStateScope): unknown {
	let value = state;
	for (const part of scope) {
		if (
			Array.isArray(value) &&
			typeof part === 'number' &&
			Number.isSafeInteger(part) &&
			part >= 0
		)
			value = value[part];
		else if (isRecord(value) && typeof part === 'string') value = value[part];
		else throw new Error('state scope does not reference a container');
	}
	return value;
}
