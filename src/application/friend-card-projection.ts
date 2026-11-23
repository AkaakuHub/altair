import type { UserCardDataState } from '../state/user-card-types.ts';
import { isUserCardDataState } from '../state/user-card-validator.ts';
import {
	projectUserCards,
	type UserOwnedMasterSupport,
} from './user-owned-master-projection.ts';

export function isFriendCardVisible(
	card: UserCardDataState,
	masterSupport: Pick<UserOwnedMasterSupport, 'getCardFingerprint' | 'hasCard'>,
): boolean {
	return (
		projectUserCards({ playerId: '', userCardDataList: [card] }, masterSupport)
			.userCardDataList.length === 1
	);
}

export function projectFriendCardInfo<
	TEntry extends { user_card_info: object },
>(
	entries: readonly TEntry[],
	masterSupport: Pick<UserOwnedMasterSupport, 'getCardFingerprint' | 'hasCard'>,
): TEntry[] {
	return entries
		.filter(
			(entry) =>
				isUserCardDataState(entry.user_card_info) &&
				isFriendCardVisible(entry.user_card_info, masterSupport),
		)
		.map((entry) => {
			const responseEntry = structuredClone(entry);
			if (isUserCardDataState(responseEntry.user_card_info)) {
				delete responseEntry.user_card_info.source_master_release_id;
				delete responseEntry.user_card_info.identity_fingerprint;
			}
			return responseEntry;
		});
}
