import { staminaRecoveryPolicy } from '../../application/stamina-recovery-service.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import { calculateCurrentUserStamina } from '../../state/user-status-stamina.ts';
import type { UserStatusState } from '../../state/user-status-types.ts';
import type { UserStaminaResponse } from '../response-types/common-response-types.ts';

const STAMINA_RECOVERY_ITEM_IDS = [1004001, 3001002, 3001001] as const;

export type StaminaRecoveryResultResponse = {
	user_stamina: UserStaminaResponse;
	stamina_present: 0;
};

type JewelStaminaRecoverySetting =
	(typeof staminaRecoveryPolicy.jewelSettings)[number];

export type StaminaRecoveryInfoResponse = {
	user_stamina: UserStaminaResponse;
	item_list: {
		d_item_datas_id: string;
		item_id: (typeof STAMINA_RECOVERY_ITEM_IDS)[number];
		item_num: number;
		limit_date_time: string | null;
	}[];
	use_jewel_settings: {
		jewel_st_recovery_count_limit: JewelStaminaRecoverySetting['jewelStaminaRecoveryCountLimit'];
		price: JewelStaminaRecoverySetting['price'];
		effect_value: number;
	}[];
	jewel_st_recovery_count: number;
	stamina_limit: typeof staminaRecoveryPolicy.staminaLimit;
	max_st_recovery_count: typeof staminaRecoveryPolicy.maxJewelRecoveryCount;
};

export function createStaminaRecoveryInfoResponse(
	status: UserStatusState,
	inventory: UserInventoryState,
	gameDate: string,
	now: Date,
): StaminaRecoveryInfoResponse {
	return {
		user_stamina: createUserStaminaResponse(status, now),
		item_list: STAMINA_RECOVERY_ITEM_IDS.map((itemId) => {
			const item = findUserItemByItemId(inventory, itemId);
			return {
				d_item_datas_id: item?.userItemId ?? '',
				item_id: itemId,
				item_num: item?.itemNum ?? 0,
				limit_date_time: item?.limitDateTime ?? null,
			};
		}).filter((item) => item.item_num > 0),
		use_jewel_settings: createJewelStaminaRecoverySettings(),
		jewel_st_recovery_count:
			status.jewelStaminaRecoveryGameDate === gameDate
				? status.jewelStaminaRecoveryCount
				: 0,
		stamina_limit: staminaRecoveryPolicy.staminaLimit,
		max_st_recovery_count: staminaRecoveryPolicy.maxJewelRecoveryCount,
	};
}

export function createStaminaRecoveryResultResponse(
	status: UserStatusState,
	now: Date,
): StaminaRecoveryResultResponse {
	return {
		user_stamina: createUserStaminaResponse(status, now),
		stamina_present: 0,
	};
}

function createUserStaminaResponse(
	status: UserStatusState,
	now: Date,
): UserStaminaResponse {
	const currentStamina = calculateCurrentUserStamina(status, now);
	return {
		stamina_now: currentStamina.staminaNow,
		stamina_max: currentStamina.staminaMax,
		stamina_recovery_time: currentStamina.staminaRecoveryTime,
	};
}

function createJewelStaminaRecoverySettings() {
	return staminaRecoveryPolicy.jewelSettings.map((setting) => ({
		jewel_st_recovery_count_limit: setting.jewelStaminaRecoveryCountLimit,
		price: setting.price,
		effect_value: 100,
	}));
}
