export function upsertByNumberKey<T>(
	current: readonly T[],
	next: readonly T[],
	getKey: (value: T) => number,
): T[] {
	return upsertByStringKey(current, next, (value) => `${getKey(value)}`);
}

export function upsertByStringKey<T>(
	current: readonly T[],
	next: readonly T[],
	getKey: (value: T) => string,
): T[] {
	const values = new Map(current.map((value) => [getKey(value), value]));
	for (const value of next) {
		values.set(getKey(value), value);
	}
	return [...values.values()];
}
