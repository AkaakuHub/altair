import type { Database } from 'bun:sqlite';
import { recoverStamina } from '../../application/stamina-recovery-service.ts';
import { getItemEffectFromDatabase } from '../../master-data/item-master.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import type { UserStatusState } from '../../state/user-status-types.ts';
import { readStaminaRecoveryRequest } from '../requests/stamina-recovery-request.ts';
import {
	createStaminaRecoveryInfoResponse,
	createStaminaRecoveryResultResponse,
	type StaminaRecoveryResultResponse,
} from '../responses/stamina-recovery-response.ts';
import { createMasterReleaseItemProvenance } from './item-consumption.ts';

export { createStaminaRecoveryInfoResponse };

export function recoverStaminaFromRequest(
	database: Database,
	masterReleaseId: string,
	body: unknown,
	status: UserStatusState,
	inventory: UserInventoryState,
	gameDate: string,
	now: Date,
): StaminaRecoveryResultResponse | undefined {
	const request = readStaminaRecoveryRequest(body);
	if (request === undefined) return undefined;
	const recovered = recoverStamina(
		request,
		status,
		inventory,
		gameDate,
		now,
		(itemId) => {
			const effect = getItemEffectFromDatabase(database, itemId);
			const provenance = createMasterReleaseItemProvenance(
				database,
				masterReleaseId,
				itemId,
			);
			return effect === undefined || provenance === undefined
				? undefined
				: { effectValue: effect.effectValue, provenance };
		},
	);
	return recovered
		? createStaminaRecoveryResultResponse(status, now)
		: undefined;
}
