export function appendMapArrayValue<TKey, TValue>(
	map: Map<TKey, TValue[]>,
	key: TKey,
	value: TValue,
): void {
	map.set(key, [...(map.get(key) ?? []), value]);
}
