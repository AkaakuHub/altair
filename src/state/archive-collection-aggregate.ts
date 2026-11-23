import type { ServerState } from '../server-state-schema.ts';
import type { UserArchiveCollectionState } from './archive-collection-definition.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';

export function ensureUserArchiveCollectionState(
	state: Pick<ServerState, 'userArchiveCollections'>,
	playerId: string,
): EnsureStateResult<UserArchiveCollectionState> {
	const existing = state.userArchiveCollections.find(
		(collection) => collection.playerId === playerId,
	);
	if (existing) return { value: existing, created: false };
	const collection: UserArchiveCollectionState = {
		playerId,
		watchedWithliveArchiveIds: [],
		watchedFesArchiveIds: [],
		watchedWithliveArchiveMemberships: [],
		watchedFesArchiveMemberships: [],
		userStickerStates: [],
	};
	state.userArchiveCollections = [...state.userArchiveCollections, collection];
	return { value: collection, created: true };
}
