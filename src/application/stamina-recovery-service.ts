import type { EntityProvenance } from '../state/entity-provenance.ts';
import type { UserInventoryState } from '../state/user-item-definition.ts';
import { consumeUserItems } from '../state/user-item-mutation.ts';
import {
	applyNaturalStaminaRecovery,
	updateStaminaRecoveryTime,
} from '../state/user-status-stamina.ts';
import type { UserStatusState } from '../state/user-status-types.ts';

const JEWEL_STAMINA_RECOVERY_TYPE = 1;
const ITEM_STAMINA_RECOVERY_TYPE = 2;
const STAMINA_RECOVERY_VALUE = 100;
export const staminaRecoveryPolicy = {
	staminaLimit: 999,
	maxJewelRecoveryCount: 40,
	jewelSettings: [
		{ jewelStaminaRecoveryCountLimit: 4, price: 50 },
		{ jewelStaminaRecoveryCountLimit: 7, price: 75 },
		{ jewelStaminaRecoveryCountLimit: 11, price: 100 },
		{ jewelStaminaRecoveryCountLimit: 16, price: 150 },
		{ jewelStaminaRecoveryCountLimit: 21, price: 200 },
		{ jewelStaminaRecoveryCountLimit: 26, price: 250 },
		{ jewelStaminaRecoveryCountLimit: 31, price: 300 },
		{ jewelStaminaRecoveryCountLimit: 36, price: 350 },
		{ jewelStaminaRecoveryCountLimit: 41, price: 400 },
	],
} as const;

export type StaminaRecoveryItemRequest = {
	d_item_datas_id: string;
	item_id: number;
	item_num: number;
};

export type StaminaRecoveryRequest = {
	recovery_count?: number;
	use_recovery_type: number;
	use_item_list: StaminaRecoveryItemRequest[] | null;
};

type StaminaRecoveryEffectResolver = (
	itemId: number,
) => { effectValue: number; provenance: EntityProvenance } | undefined;

export function recoverStamina(
	request: StaminaRecoveryRequest,
	status: UserStatusState,
	inventory: UserInventoryState,
	gameDate: string,
	now: Date,
	resolveItemEffect: StaminaRecoveryEffectResolver,
): boolean {
	if (request.use_recovery_type === JEWEL_STAMINA_RECOVERY_TYPE) {
		return recoverStaminaWithJewel(request, status, gameDate, now);
	}
	if (request.use_recovery_type !== ITEM_STAMINA_RECOVERY_TYPE) return false;
	return recoverStaminaWithItems(
		request,
		status,
		inventory,
		now,
		resolveItemEffect,
	);
}

function recoverStaminaWithItems(
	request: StaminaRecoveryRequest,
	status: UserStatusState,
	inventory: UserInventoryState,
	now: Date,
	resolveItemEffect: StaminaRecoveryEffectResolver,
): boolean {
	const useItemList = request.use_item_list;
	if (!Array.isArray(useItemList)) return false;
	let recoveryValue = 0;
	const consumptions = [];
	for (const item of useItemList) {
		const effect = resolveItemEffect(item.item_id);
		if (!effect) return false;
		consumptions.push({
			userItemId: item.d_item_datas_id,
			itemId: item.item_id,
			itemNum: item.item_num,
			provenance: effect.provenance,
		});
		recoveryValue += effect.effectValue * item.item_num;
	}
	if (!consumeUserItems(inventory, consumptions)) return false;
	applyNaturalStaminaRecovery(status, now);
	status.staminaNow = Math.min(
		staminaRecoveryPolicy.staminaLimit,
		status.staminaNow + recoveryValue,
	);
	updateStaminaRecoveryTime(status, now);
	return true;
}

function recoverStaminaWithJewel(
	request: StaminaRecoveryRequest,
	status: UserStatusState,
	gameDate: string,
	now: Date,
): boolean {
	const recoveryCount = request.recovery_count;
	if (
		recoveryCount === undefined ||
		recoveryCount < 1 ||
		request.use_item_list !== null
	) {
		return false;
	}
	const currentRecoveryCount =
		status.jewelStaminaRecoveryGameDate === gameDate
			? status.jewelStaminaRecoveryCount
			: 0;
	if (
		currentRecoveryCount + recoveryCount >
		staminaRecoveryPolicy.maxJewelRecoveryCount
	) {
		return false;
	}
	const price = calculateJewelStaminaRecoveryPrice(
		currentRecoveryCount,
		recoveryCount,
	);
	if (price === undefined || status.jewelFree < price) return false;
	applyNaturalStaminaRecovery(status, now);
	status.jewelFree -= price;
	status.jewelStaminaRecoveryGameDate = gameDate;
	status.jewelStaminaRecoveryCount = currentRecoveryCount + recoveryCount;
	status.staminaNow = Math.min(
		staminaRecoveryPolicy.staminaLimit,
		status.staminaNow + STAMINA_RECOVERY_VALUE * recoveryCount,
	);
	updateStaminaRecoveryTime(status, now);
	return true;
}

function calculateJewelStaminaRecoveryPrice(
	currentRecoveryCount: number,
	recoveryCount: number,
): number | undefined {
	let price = 0;
	for (let offset = 1; offset <= recoveryCount; offset += 1) {
		const countAfterRecovery = currentRecoveryCount + offset;
		const setting = staminaRecoveryPolicy.jewelSettings.find(
			(entry) => countAfterRecovery <= entry.jewelStaminaRecoveryCountLimit,
		);
		if (setting === undefined) return undefined;
		price += setting.price;
	}
	return price;
}
