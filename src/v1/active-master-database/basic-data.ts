import { currentJstIsoDateTime } from '../../master-data/master-time.ts';
import { STAMINA_RECOVERY_STOPPED_AT } from '../../state/stamina-recovery-time.ts';
import type { UserStaminaResponse } from '../response-types/common-response-types.ts';

export function stamina(): UserStaminaResponse {
	return {
		stamina_now: 100,
		stamina_max: 100,
		stamina_recovery_time: STAMINA_RECOVERY_STOPPED_AT,
	};
}
export function jstIsoNow(): string {
	return currentJstIsoDateTime();
}
