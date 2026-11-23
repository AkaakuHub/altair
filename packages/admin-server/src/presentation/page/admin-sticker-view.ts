import type { Database } from 'bun:sqlite';
import type {
	AdminStickerCatalogEntry,
	AdminStickerCollection,
	AdminUserSticker,
} from '@altair/runtime/admin/dto/admin-sticker-schema.ts';
import { getStickerIdentityFingerprint } from '../../../../../src/master-data/sticker-identity.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import type { CollectionStickerInfo } from '../../../../../src/state/sticker-definition.ts';
import { createUserStickerInfoList } from '../../../../../src/state/user-sticker-ownership.ts';

export function createAdminStickerCatalogView(
	stickerCatalog: readonly CollectionStickerInfo[],
): AdminStickerCatalogEntry[] {
	return stickerCatalog.map((sticker) => ({
		stickers_id: sticker.stickers_id,
		name: sticker.name,
		text: sticker.text,
		character_id: sticker.character_id,
	}));
}

export function createAdminStickerCollectionView(
	state: ServerState,
	stickerCatalog: readonly CollectionStickerInfo[],
	database: Database,
): AdminStickerCollection | null {
	const selectedAdminPlayerId = state.selectedAdminPlayerId;
	if (selectedAdminPlayerId === null) {
		return null;
	}
	const collection = state.userArchiveCollections.find(
		(entry) => entry.playerId === selectedAdminPlayerId,
	);
	if (collection === undefined) {
		return null;
	}
	return {
		playerId: collection.playerId,
		stickerInfoList: createUserStickerInfoList(
			collection,
			stickerCatalog,
			(stickerId) => getStickerIdentityFingerprint(database, stickerId),
		)
			.filter((sticker) => sticker.is_owned)
			.map(createAdminUserStickerView),
	};
}

function createAdminUserStickerView(
	sticker: CollectionStickerInfo,
): AdminUserSticker {
	return {
		stickers_id: sticker.stickers_id,
		name: sticker.name,
		text: sticker.text,
		character_id: sticker.character_id,
		requirement_num: sticker.requirement_num,
		requirement_progress: sticker.requirement_progress,
		variant_requirement_num: sticker.variant_requirement_num,
		variant_requirement_progress: sticker.variant_requirement_progress,
		is_owned: sticker.is_owned,
		is_available_variant: sticker.is_available_variant,
		create_time: sticker.create_time,
	};
}
