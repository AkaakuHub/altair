import type { EntityIdentityFingerprint } from '../../state/entity-provenance.ts';
import type { UserCardDataState } from '../../state/user-card-types.ts';
import type { UserItemState } from '../../state/user-item-definition.ts';
import { classifyOwnedEntityMutation } from '../user-owned-entity-mutation.ts';

export type CardGrowthMutationGuard = Readonly<{
	preflight: (
		card: UserCardDataState,
		items: readonly UserItemState[],
	) => boolean;
}>;

export function createCardGrowthMutationGuard(input: {
	sourceMasterReleaseId: string;
	getCardFingerprint: (
		cardDatasId: number,
	) => EntityIdentityFingerprint | undefined;
	getItemFingerprint: (itemId: number) => EntityIdentityFingerprint | undefined;
}): CardGrowthMutationGuard {
	return {
		preflight: (card, items) => {
			const cardDatasId = card.card_datas_id;
			const targetCardFingerprint = input.getCardFingerprint(cardDatasId);
			const storedCardFingerprint =
				card.identity_fingerprint ?? legacyCardFingerprint(card);
			if (
				classifyOwnedEntityMutation(
					cardDatasId,
					storedCardFingerprint,
					targetCardFingerprint,
				) !== 'compatible'
			)
				return false;
			const itemFingerprints = items.map((item) => ({
				item,
				stored: item.identityFingerprint ?? legacyItemFingerprint(item),
				target: input.getItemFingerprint(item.itemId),
			}));
			if (
				!itemFingerprints.every(
					(item) =>
						classifyOwnedEntityMutation(
							item.item.itemId,
							item.stored,
							item.target,
						) === 'compatible',
				)
			)
				return false;
			if (
				card.identity_fingerprint === undefined &&
				targetCardFingerprint !== undefined
			) {
				card.identity_fingerprint = targetCardFingerprint;
				card.source_master_release_id = input.sourceMasterReleaseId;
			}
			for (const entry of itemFingerprints) {
				if (
					entry.item.identityFingerprint === undefined &&
					entry.target !== undefined
				) {
					entry.item.identityFingerprint = entry.target;
					entry.item.sourceMasterReleaseId = input.sourceMasterReleaseId;
				}
			}
			return true;
		},
	};
}

function legacyCardFingerprint(
	card: UserCardDataState,
): EntityIdentityFingerprint | undefined {
	if (typeof card.character_id !== 'number') return undefined;
	return {
		domain: 'card',
		value: JSON.stringify([
			card.card_datas_id,
			Math.trunc(card.card_datas_id / 10),
			card.character_id,
			card.card_datas_id % 10,
		]),
	};
}

function legacyItemFingerprint(
	item: UserItemState,
): EntityIdentityFingerprint | undefined {
	if (item.itemCategory === undefined) return undefined;
	return {
		domain: 'item',
		value: JSON.stringify([item.itemId, item.itemType, item.itemCategory]),
	};
}
