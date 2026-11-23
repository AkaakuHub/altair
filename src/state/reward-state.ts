import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';
import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import type { ItemCatalogEntry } from './item-definition.ts';
import {
	GRADE_POINT_ITEM_TYPE,
	type GradePlayPointCapBonusResolver,
	PLAY_POINT_CAP_UP_ITEM_ID,
	syncGradePlayPointCap,
} from './play-point-cap-state.ts';
import { addFreeSisca, addPaidSisca } from './sisca-state.ts';
import { ensureUserCards, findUserCards } from './user-card-aggregate-state.ts';
import {
	addUserCardFromTemplate,
	canApplyUserCardProvenance,
} from './user-card-template-state.ts';
import type { UserCardTemplateState } from './user-card-types.ts';
import {
	ensureUserInventory,
	findUserInventory,
} from './user-inventory-aggregate.ts';
import {
	addUserItemQuantity,
	canApplyUserItemProvenance,
} from './user-item-mutation.ts';
import type { UserStatusAccess } from './user-status-port.ts';
import { addUserStaminaMax } from './user-status-stamina.ts';

type UserReward = {
	itemId: number;
	itemType: number;
	amount: number;
};

export function canApplyUserRewards(
	state: ServerState,
	user: RegisteredUserState,
	rewards: readonly UserReward[],
	masterData: RewardMasterData,
): boolean {
	const cards = findUserCards(state, user.playerId);
	const inventory = findUserInventory(state, user.playerId);
	for (const reward of rewards) {
		if (reward.amount <= 0) return false;
		if (
			reward.itemId === 1001001 ||
			reward.itemId === 1002001 ||
			reward.itemId === PLAY_POINT_CAP_UP_ITEM_ID
		) {
			continue;
		}
		if (reward.itemType === 2) {
			const template = masterData.getCardDetailTemplateByCardDatasId(
				reward.itemId,
			);
			const identityFingerprint = masterData.getCardFingerprint(reward.itemId);
			if (
				template === undefined ||
				identityFingerprint === undefined ||
				(cards !== undefined &&
					!canApplyUserCardProvenance(cards, template, {
						sourceMasterReleaseId: masterData.sourceMasterReleaseId,
						identityFingerprint,
					}))
			) {
				return false;
			}
			continue;
		}
		const item = masterData.itemCatalog.find(
			(entry) => entry.itemId === reward.itemId,
		);
		const identityFingerprint = masterData.getItemFingerprint(reward.itemId);
		if (
			item === undefined ||
			identityFingerprint === undefined ||
			(inventory !== undefined &&
				!canApplyUserItemProvenance(inventory, reward.itemId, {
					sourceMasterReleaseId: masterData.sourceMasterReleaseId,
					identityFingerprint,
				}))
		) {
			return false;
		}
	}
	return true;
}

export type RewardMasterData = {
	sourceMasterReleaseId: string;
	userCardGetList: unknown;
	userItemsGetList: unknown;
	itemCatalog: readonly ItemCatalogEntry[];
	getCardDetailTemplateByCardDatasId: (
		cardDatasId: number,
	) => UserCardTemplateState | undefined;
	getCardFingerprint: (
		cardDatasId: number,
	) => EntityIdentityFingerprint | undefined;
	getItemFingerprint: (itemId: number) => EntityIdentityFingerprint | undefined;
	resolveGradePlayPointCapBonus: GradePlayPointCapBonusResolver;
};

export function applyUserReward(
	state: ServerState,
	user: RegisteredUserState,
	reward: UserReward,
	masterData: RewardMasterData,
	userStatus: UserStatusAccess,
	source: string,
): void {
	if (reward.amount <= 0) {
		throw new Error(
			`${source} reward amount must be positive: ${reward.amount}`,
		);
	}
	if (reward.itemId === 1001001) {
		addPaidSisca(state, user, reward.amount, userStatus);
		return;
	}
	if (reward.itemId === 1002001) {
		addFreeSisca(state, user.playerId, reward.amount, userStatus);
		return;
	}
	if (reward.itemId === PLAY_POINT_CAP_UP_ITEM_ID) {
		addUserStaminaMax(
			userStatus.ensure(state, user.playerId).value,
			reward.amount,
		);
		return;
	}
	if (reward.itemType === 2) {
		const cards = ensureUserCards(
			state,
			user.playerId,
			masterData.userCardGetList,
		).value;
		const template = masterData.getCardDetailTemplateByCardDatasId(
			reward.itemId,
		);
		if (!template) {
			throw new Error(`${source} card reward not found: ${reward.itemId}`);
		}
		const identityFingerprint = masterData.getCardFingerprint(reward.itemId);
		if (identityFingerprint === undefined) {
			throw new Error(`${source} card fingerprint not found: ${reward.itemId}`);
		}
		addUserCardFromTemplate(cards, template, {
			sourceMasterReleaseId: masterData.sourceMasterReleaseId,
			identityFingerprint,
		});
		return;
	}
	const { value: inventory } = ensureUserInventory(
		state,
		user.playerId,
		masterData.userItemsGetList,
	);
	const item = masterData.itemCatalog.find(
		(entry) => entry.itemId === reward.itemId,
	);
	if (!item) {
		throw new Error(`${source} item reward not found: ${reward.itemId}`);
	}
	const identityFingerprint = masterData.getItemFingerprint(reward.itemId);
	if (identityFingerprint === undefined) {
		throw new Error(`${source} item fingerprint not found: ${reward.itemId}`);
	}
	addUserItemQuantity(
		state,
		user.playerId,
		{
			itemId: item.itemId,
			itemType: item.itemType,
			itemCategory: item.itemCategory,
			rarity: item.rarity,
			resourceFileName: item.resourceFileName,
			limitDateTime: item.limitDateTime,
		},
		reward.amount,
		{
			sourceMasterReleaseId: masterData.sourceMasterReleaseId,
			identityFingerprint,
		},
	);
	if (reward.itemType === GRADE_POINT_ITEM_TYPE) {
		syncGradePlayPointCap(
			userStatus.ensure(state, user.playerId).value,
			inventory,
			masterData.resolveGradePlayPointCapBonus,
		);
	}
}
