export function upsertMigrationPlayerState<T extends { playerId: string }>(
	list: T[],
	value: T,
): void {
	const index = list.findIndex((entry) => entry.playerId === value.playerId);
	if (index < 0) list.push(value);
	else list[index] = value;
}
