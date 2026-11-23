import type {
	StaminaRecoveryItemRequest,
	StaminaRecoveryRequest,
} from '../../application/stamina-recovery-service.ts';
import { isRecord } from '../../state/json-state-utils.ts';

export function readStaminaRecoveryRequest(
	body: unknown,
): StaminaRecoveryRequest | undefined {
	if (!isRecord(body)) return undefined;
	const useRecoveryType = readInteger(body.use_recovery_type);
	if (useRecoveryType === undefined) return undefined;
	const useItemList = readUseItemList(body.use_item_list);
	if (useItemList === undefined) return undefined;
	const request: StaminaRecoveryRequest = {
		use_recovery_type: useRecoveryType,
		use_item_list: useItemList,
	};
	const recoveryCount = readInteger(body.recovery_count);
	if (recoveryCount !== undefined) request.recovery_count = recoveryCount;
	return request;
}

function readUseItemList(
	value: unknown,
): StaminaRecoveryItemRequest[] | null | undefined {
	if (value === null) return null;
	if (!Array.isArray(value)) return undefined;
	const items: StaminaRecoveryItemRequest[] = [];
	for (const item of value) {
		const request = readStaminaRecoveryItemRequest(item);
		if (request === undefined) return undefined;
		items.push(request);
	}
	return items;
}

function readStaminaRecoveryItemRequest(
	value: unknown,
): StaminaRecoveryItemRequest | undefined {
	if (!isRecord(value)) return undefined;
	const itemId = readInteger(value.item_id);
	const itemNum = readInteger(value.item_num);
	if (itemId === undefined || itemNum === undefined) return undefined;
	return {
		d_item_datas_id:
			typeof value.d_item_datas_id === 'string' ? value.d_item_datas_id : '',
		item_id: itemId,
		item_num: itemNum,
	};
}

function readInteger(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isInteger(value)
		? value
		: undefined;
}
