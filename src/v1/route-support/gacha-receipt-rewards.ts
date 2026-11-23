import type { Database } from 'bun:sqlite';
import { classifyOwnedEntityMutation } from '../../application/user-owned-entity-mutation.ts';
import { getItemIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import type { GachaReceiptItemState } from '../../state/gacha-guarantee-types.ts';
import {
	ensureUserInventory,
	findUserInventory,
} from '../../state/user-inventory-aggregate.ts';
import { addUserItemQuantity } from '../../state/user-item-mutation.ts';
import { canReceiveGachaReceiptItems } from './item-receive-availability.ts';
import type { StateRouteContext } from './state-route-context.ts';

const PETAL_COIN_ITEM_TYPE = 3;
const PETAL_COIN_ITEM_ID = 3007001;
const LIMIT_BREAK_MATERIAL_ITEM_TYPE = 4;

type ItemReward = {
	amount: number;
	definition: NonNullable<
		ReturnType<typeof getItemDefinitionByItemIdFromDatabase>
	>;
};

export function applyGachaReceiptRewardsToState(
	database: Database,
	routeContext: StateRouteContext,
	playerId: string,
	userItemsGetList: unknown,
	receiptItems: readonly GachaReceiptItemState[],
	sourceMasterReleaseId: string,
	consumeCost: () => boolean = () => true,
): boolean {
	const { state } = routeContext;
	const itemRewards: ItemReward[] = [];
	let petalCoinItemNum = 0;
	for (const receiptItem of receiptItems) {
		if (receiptItem.get_num <= 0) {
			return false;
		}
		if (receiptItem.get_item_type === LIMIT_BREAK_MATERIAL_ITEM_TYPE) {
			const definition = getItemDefinitionByItemIdFromDatabase(
				database,
				receiptItem.get_id,
			);
			if (!definition) {
				return false;
			}
			itemRewards.push({
				amount: receiptItem.get_num,
				definition,
			});
			continue;
		}
		if (
			receiptItem.get_item_type === PETAL_COIN_ITEM_TYPE &&
			receiptItem.get_id === PETAL_COIN_ITEM_ID
		) {
			petalCoinItemNum += receiptItem.get_num;
		}
	}
	if (itemRewards.length > 0 || petalCoinItemNum > 0) {
		ensureUserInventory(state, playerId, userItemsGetList);
		const inventory = findUserInventory(state, playerId);
		if (
			!inventory ||
			!canReceiveGachaReceiptItems(database, inventory, receiptItems)
		) {
			return false;
		}
	}
	for (const itemReward of itemRewards) {
		if (
			!canMutateItem(database, state, playerId, itemReward.definition.itemId)
		) {
			return false;
		}
	}
	const petalCoinDefinition =
		petalCoinItemNum > 0
			? getItemDefinitionByItemIdFromDatabase(database, PETAL_COIN_ITEM_ID)
			: undefined;
	const petalCoinIdentityFingerprint =
		petalCoinItemNum > 0
			? getItemIdentityFingerprint(database, PETAL_COIN_ITEM_ID)
			: undefined;
	if (
		petalCoinItemNum > 0 &&
		(petalCoinDefinition === undefined ||
			petalCoinIdentityFingerprint === undefined ||
			!canMutateItem(database, state, playerId, PETAL_COIN_ITEM_ID))
	) {
		return false;
	}
	if (!consumeCost()) return false;
	if (itemRewards.length > 0) {
		for (const itemReward of itemRewards) {
			const identityFingerprint = getItemIdentityFingerprint(
				database,
				itemReward.definition.itemId,
			);
			if (identityFingerprint === undefined) return false;
			addUserItemQuantity(
				state,
				playerId,
				itemReward.definition,
				itemReward.amount,
				{
					sourceMasterReleaseId,
					identityFingerprint,
				},
			);
		}
	}
	if (petalCoinItemNum > 0) {
		if (!petalCoinDefinition || !petalCoinIdentityFingerprint) return false;
		return (
			addUserItemQuantity(
				state,
				playerId,
				petalCoinDefinition,
				petalCoinItemNum,
				{
					sourceMasterReleaseId,
					identityFingerprint: petalCoinIdentityFingerprint,
				},
			) !== undefined
		);
	}
	return true;
}

function canMutateItem(
	database: Database,
	state: StateRouteContext['state'],
	playerId: string,
	itemId: number,
): boolean {
	const existing = findUserInventory(state, playerId)
		?.itemCategoryList.flatMap((category) => category.userItemList)
		.find((item) => item.itemId === itemId);
	if (existing === undefined) return true;
	return (
		classifyOwnedEntityMutation(
			itemId,
			existing.identityFingerprint,
			getItemIdentityFingerprint(database, itemId),
		) === 'compatible'
	);
}
