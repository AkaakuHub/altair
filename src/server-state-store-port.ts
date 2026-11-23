import type { Database } from 'bun:sqlite';
import type { ServerState } from './server-state-schema.ts';
import type { JsonValue } from './state/json-state-utils.ts';

export type PersistedServerState = JsonValue | ServerState;
export type ServerStateScope = readonly (string | number)[];

export type StateWriteTransaction = {
	prepare(db: Database, path: string): void;
	write(db: Database): void;
};

export type ServerStateStore = {
	initialize?(state: ServerState, persisted: PersistedServerState | null): void;
	readonly description: string;
	read(): PersistedServerState | null;
	write(
		state: ServerState,
		scopes?: readonly ServerStateScope[],
		transaction?: StateWriteTransaction,
	): void;
};

export function createNoopServerStateStore(): ServerStateStore {
	return { description: 'noop', read: () => null, write: () => {} };
}
