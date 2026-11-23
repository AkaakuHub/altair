import type { Database } from 'bun:sqlite';
import { getStickerIdentityFingerprint } from '../../master-data/sticker-identity.ts';
import type { UserArchiveCollectionState } from '../../state/archive-collection-definition.ts';
import type { CollectionStickerInfo } from '../../state/sticker-definition.ts';
import { createUserStickerInfoList } from '../../state/user-sticker-ownership.ts';
import type { CollectionStickerListResponse } from '../response-types/collection-response-types.ts';

export function createCollectionStickerListResponse(
	collection: UserArchiveCollectionState,
	stickerCatalog: readonly CollectionStickerInfo[],
	database: Database,
): CollectionStickerListResponse {
	return {
		sticker_info_list: createUserStickerInfoList(
			collection,
			stickerCatalog,
			(stickerId) => getStickerIdentityFingerprint(database, stickerId),
		),
	};
}
