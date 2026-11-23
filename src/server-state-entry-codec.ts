import {
	isRecord,
	type JsonObject,
	type JsonValue,
} from './state/json-state-utils.ts';

export type StateEntry = {
	path: string;
	valueType: 'array' | 'boolean' | 'null' | 'number' | 'object' | 'string';
	stringValue: string | null;
	numberValue: number | null;
	booleanValue: number | null;
};
type StateEntryIndex = {
	entriesByPath: ReadonlyMap<string, StateEntry>;
	childKeysByPath: ReadonlyMap<string, ReadonlySet<string>>;
};

export function encodeServerStateEntries(
	value: unknown,
	prefix = '',
): StateEntry[] {
	const entries: StateEntry[] = [];
	collectStateEntries(value, prefix, entries);
	return entries;
}
export function decodeServerStateEntries(entries: StateEntry[]): JsonValue {
	return buildStateValue(createStateEntryIndex(entries), '');
}
export function createEntriesByPath(
	entries: readonly StateEntry[],
): Map<string, StateEntry> {
	return new Map(entries.map((entry) => [entry.path, entry]));
}
export function stateEntryEquals(
	left: StateEntry,
	right: StateEntry | undefined,
): boolean {
	return (
		right !== undefined &&
		left.valueType === right.valueType &&
		left.stringValue === right.stringValue &&
		left.numberValue === right.numberValue &&
		left.booleanValue === right.booleanValue
	);
}
function collectStateEntries(
	value: unknown,
	path: string,
	entries: StateEntry[],
): void {
	if (value === null) {
		entries.push(createStateEntry(path, 'null'));
		return;
	}
	if (Array.isArray(value)) {
		entries.push(createStateEntry(path, 'array'));
		value.forEach((item, index) => {
			collectStateEntries(item, createChildPath(path, String(index)), entries);
		});
		return;
	}
	if (isRecord(value)) {
		entries.push(createStateEntry(path, 'object'));
		for (const [key, item] of Object.entries(value))
			collectStateEntries(item, createChildPath(path, key), entries);
		return;
	}
	if (typeof value === 'string')
		entries.push(createStateEntry(path, 'string', value));
	else if (typeof value === 'number')
		entries.push(createStateEntry(path, 'number', null, value));
	else if (typeof value === 'boolean')
		entries.push(createStateEntry(path, 'boolean', null, null, value ? 1 : 0));
}
function createStateEntry(
	path: string,
	valueType: StateEntry['valueType'],
	stringValue: string | null = null,
	numberValue: number | null = null,
	booleanValue: number | null = null,
): StateEntry {
	return { path, valueType, stringValue, numberValue, booleanValue };
}
function buildStateValue(index: StateEntryIndex, path: string): JsonValue {
	const entry = index.entriesByPath.get(path);
	if (!entry) throw new Error(`Missing persisted state entry: ${path}`);
	switch (entry.valueType) {
		case 'array':
			return getChildKeys(index, path)
				.map(Number)
				.sort((a, b) => a - b)
				.map((i) => buildStateValue(index, createChildPath(path, String(i))));
		case 'boolean':
			return entry.booleanValue === 1;
		case 'null':
			return null;
		case 'number':
			return entry.numberValue;
		case 'object': {
			const result: JsonObject = {};
			for (const key of getChildKeys(index, path))
				result[key] = buildStateValue(index, createChildPath(path, key));
			return result;
		}
		case 'string':
			return entry.stringValue ?? '';
	}
}
function createStateEntryIndex(entries: StateEntry[]): StateEntryIndex {
	const entriesByPath = new Map<string, StateEntry>();
	const childKeysByPath = new Map<string, Set<string>>();
	for (const entry of entries) {
		entriesByPath.set(entry.path, entry);
		if (entry.path === '') continue;
		const { parentPath, childKey } = splitEntryPath(entry.path);
		const keys = childKeysByPath.get(parentPath) ?? new Set<string>();
		keys.add(decodeURIComponent(childKey));
		childKeysByPath.set(parentPath, keys);
	}
	return { entriesByPath, childKeysByPath };
}
function getChildKeys(index: StateEntryIndex, path: string): string[] {
	return [...(index.childKeysByPath.get(path) ?? [])];
}
function splitEntryPath(path: string): {
	parentPath: string;
	childKey: string;
} {
	const i = path.lastIndexOf('/');
	return i === -1
		? { parentPath: '', childKey: path }
		: { parentPath: path.slice(0, i), childKey: path.slice(i + 1) };
}
function createChildPath(path: string, key: string): string {
	const encoded = encodeURIComponent(key);
	return path === '' ? encoded : `${path}/${encoded}`;
}
