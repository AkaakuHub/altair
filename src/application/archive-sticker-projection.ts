export function projectOwnedStickerIds(
	ownedStickerIds: readonly number[],
	supportedStickerIds: ReadonlySet<number>,
): number[] {
	return ownedStickerIds.filter((stickerId) =>
		supportedStickerIds.has(stickerId),
	);
}
