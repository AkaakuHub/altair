import type { Database } from 'bun:sqlite';
import { getCollectionStickerInfoListFromDatabase } from '../../master-data/collection-sticker-info.ts';
import { getStickerIdentityFingerprint } from '../../master-data/sticker-identity.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { getOwnedStickerIds } from '../../state/user-sticker-ownership.ts';
import { getShopExchangeMasterFromDatabase } from '../active-master-database/shop-exchange-responses.ts';
import { projectUserOwnedState } from './project-user-owned-state.ts';
import { hasUserItem } from './shop-notification-user-state.ts';

const STICKER_EXCHANGE_POINT_ITEM_ID = 3009001;

export function hasAvailableStickerExchangeFromDatabase(
	database: Database,
	state: ServerState,
	user: RegisteredUserState | undefined,
): boolean {
	if (!user) return false;
	const { inventory } = projectUserOwnedState(database, state, user.playerId);
	if (!inventory) return false;
	const stickerIds = new Set(
		getCollectionStickerInfoListFromDatabase(database).map(
			(sticker) => sticker.stickers_id,
		),
	);
	const collection = state.userArchiveCollections.find(
		(candidate) => candidate.playerId === user.playerId,
	);
	const ownedStickerIds = new Set(
		collection
			? getOwnedStickerIds(collection, (stickerId) =>
					getStickerIdentityFingerprint(database, stickerId),
				)
			: [],
	);
	return getShopExchangeMasterFromDatabase(database).stickerExchangeList.some(
		(item) =>
			item.productStickerId !== undefined &&
			item.materialItemNum !== undefined &&
			stickerIds.has(item.productStickerId) &&
			!ownedStickerIds.has(item.productStickerId) &&
			hasUserItem(
				inventory,
				STICKER_EXCHANGE_POINT_ITEM_ID,
				item.materialItemNum,
			),
	);
}
