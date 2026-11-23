import { isRecord } from '../state/json-state-utils.ts';

export function migrateRawUserStickerStates(
	state: Record<string, unknown>,
): void {
	if (!Array.isArray(state.userArchiveCollections)) return;
	for (const collection of state.userArchiveCollections) {
		if (!isRecord(collection)) continue;
		if (!Array.isArray(collection.userStickerStates)) {
			const stickerInfoList = collection.stickerInfoList;
			collection.userStickerStates = Array.isArray(stickerInfoList)
				? stickerInfoList.flatMap((sticker) =>
						isRecord(sticker) && typeof sticker.stickers_id === 'number'
							? [
									{
										stickerId: sticker.stickers_id,
										requirementProgress:
											typeof sticker.requirement_progress === 'number'
												? sticker.requirement_progress
												: 0,
										variantRequirementProgress:
											typeof sticker.variant_requirement_progress === 'number'
												? sticker.variant_requirement_progress
												: 0,
										isOwned: sticker.is_owned === true,
										isAvailableVariant: sticker.is_available_variant === true,
										createTime:
											typeof sticker.create_time === 'string'
												? sticker.create_time
												: null,
									},
								]
							: [],
					)
				: [];
		}
		delete collection.stickerInfoList;
	}
}
