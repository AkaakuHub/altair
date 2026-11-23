import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import type { UserCardCollectionState } from '../state/user-card-aggregate-state.ts';
import type { UserCardDataState } from '../state/user-card-types.ts';
import type {
	UserInventoryState,
	UserItemState,
} from '../state/user-item-definition.ts';
import { projectCanonicalState } from './canonical-state-projection.ts';

export type UserOwnedMasterSupport = Readonly<{
	hasItem: (itemId: number) => boolean;
	hasCard: (cardDatasId: number) => boolean;
	getItemFingerprint: (itemId: number) => EntityIdentityFingerprint | undefined;
	getCardFingerprint: (
		cardDatasId: number,
	) => EntityIdentityFingerprint | undefined;
}>;

export function projectUserInventory(
	canonical: UserInventoryState,
	support: Pick<UserOwnedMasterSupport, 'getItemFingerprint' | 'hasItem'>,
): UserInventoryState {
	return {
		playerId: canonical.playerId,
		itemCategoryList: canonical.itemCategoryList.map((category) => ({
			itemCategory: category.itemCategory,
			userItemList: projectCanonicalState(category.userItemList, {
				readDefinitionId: readUserItemDefinitionId,
				isSupported: (itemId) => support.hasItem(itemId),
				isEntrySupported: (item) =>
					isStoredFingerprintCompatible(
						item.identityFingerprint,
						support.getItemFingerprint(item.itemId),
					),
			}).visibleEntries,
		})),
	};
}

export function projectUserCards(
	canonical: UserCardCollectionState,
	support: Pick<UserOwnedMasterSupport, 'getCardFingerprint' | 'hasCard'>,
): UserCardCollectionState {
	return {
		playerId: canonical.playerId,
		userCardDataList: projectCanonicalState(canonical.userCardDataList, {
			readDefinitionId: readUserCardDefinitionId,
			isSupported: (cardDatasId) => support.hasCard(cardDatasId),
			isEntrySupported: (card) =>
				isStoredFingerprintCompatible(
					card.identity_fingerprint,
					support.getCardFingerprint(card.card_datas_id),
				),
		}).visibleEntries,
	};
}

function isStoredFingerprintCompatible(
	stored: EntityIdentityFingerprint | undefined,
	target: EntityIdentityFingerprint | undefined,
): boolean {
	return (
		stored === undefined ||
		(target !== undefined &&
			stored.domain === target.domain &&
			stored.value === target.value)
	);
}

export function getProjectedUserCardDataIds(
	cards: UserCardCollectionState,
): ReadonlySet<string> {
	return new Set(cards.userCardDataList.map((card) => card.d_card_datas_id));
}

function readUserItemDefinitionId(item: UserItemState): number {
	return item.itemId;
}

function readUserCardDefinitionId(card: UserCardDataState): number {
	const cardDatasId = card.card_datas_id;
	if (typeof cardDatasId !== 'number') {
		throw new Error('user card card_datas_id is invalid');
	}
	return cardDatasId;
}
