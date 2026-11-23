export function findAdminEntryByKey<T, K extends PropertyKey>(
	entries: T[],
	key: K,
	getKey: (entry: T) => K,
): T | undefined {
	return entries.find((entry) => getKey(entry) === key);
}

export function hasAdminEntryByKey<T, K extends PropertyKey>(
	entries: T[],
	key: K,
	getKey: (entry: T) => K,
): boolean {
	return findAdminEntryByKey(entries, key, getKey) !== undefined;
}

export function replaceAdminEntryByKey<T, K extends PropertyKey>(
	entries: T[],
	nextEntry: T,
	getKey: (entry: T) => K,
): T[] {
	const nextKey = getKey(nextEntry);
	return [...entries.filter((entry) => getKey(entry) !== nextKey), nextEntry];
}
