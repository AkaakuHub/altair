import { STAMINA_RECOVERY_STOPPED_AT } from './stamina-recovery-time.ts';
import type { UserStatusState } from './user-status-types.ts';

export const MAX_STAMINA_NATURAL_CAP = 300;
const STAMINA_RECOVERY_INTERVAL_MS = 6 * 60 * 1000;

type CurrentUserStamina = {
	staminaNow: number;
	staminaMax: number;
	staminaRecoveryTime: string;
};

export function consumeUserStamina(
	status: UserStatusState,
	useNum: number,
	now = new Date(),
): boolean {
	if (!Number.isSafeInteger(useNum) || useNum < 0) {
		return false;
	}
	applyNaturalStaminaRecovery(status, now);
	if (status.staminaNow < useNum) {
		return false;
	}
	status.staminaNow -= useNum;
	updateStaminaRecoveryTime(status, now);
	return true;
}

export function calculateCurrentUserStamina(
	status: UserStatusState,
	now = new Date(),
): CurrentUserStamina {
	if (status.staminaNow >= status.staminaMax) {
		return {
			staminaNow: status.staminaNow,
			staminaMax: status.staminaMax,
			staminaRecoveryTime: STAMINA_RECOVERY_STOPPED_AT,
		};
	}
	const recoveredStamina = calculateRecoveredStamina(status, now);
	if (recoveredStamina === undefined) {
		return {
			staminaNow: status.staminaNow,
			staminaMax: status.staminaMax,
			staminaRecoveryTime: status.staminaRecoveryTime,
		};
	}
	return recoveredStamina;
}

export function applyNaturalStaminaRecovery(
	status: UserStatusState,
	now = new Date(),
): void {
	const current = calculateCurrentUserStamina(status, now);
	status.staminaNow = current.staminaNow;
	status.staminaRecoveryTime = current.staminaRecoveryTime;
}

export function updateStaminaRecoveryTime(
	status: UserStatusState,
	now = new Date(),
): void {
	if (status.staminaNow >= status.staminaMax) {
		status.staminaRecoveryTime = STAMINA_RECOVERY_STOPPED_AT;
		return;
	}
	const missingStamina = status.staminaMax - status.staminaNow;
	status.staminaRecoveryTime = new Date(
		now.getTime() + missingStamina * STAMINA_RECOVERY_INTERVAL_MS,
	).toISOString();
}

export function normalizeStaminaRecoveryTime(
	status: UserStatusState,
	now = new Date(),
): void {
	if (status.staminaNow >= status.staminaMax) {
		status.staminaRecoveryTime = STAMINA_RECOVERY_STOPPED_AT;
		return;
	}
	if (status.staminaRecoveryTime === STAMINA_RECOVERY_STOPPED_AT) {
		updateStaminaRecoveryTime(status, now);
	}
}

export function addUserStaminaMax(
	status: UserStatusState,
	amount: number,
): void {
	if (!Number.isSafeInteger(amount) || amount <= 0) {
		return;
	}
	status.staminaMax = Math.min(
		MAX_STAMINA_NATURAL_CAP,
		status.staminaMax + amount,
	);
}

function calculateRecoveredStamina(
	status: UserStatusState,
	now: Date,
): CurrentUserStamina | undefined {
	const recoveryTime = Date.parse(status.staminaRecoveryTime);
	if (!Number.isFinite(recoveryTime)) {
		return undefined;
	}
	const remainingTimeMs = recoveryTime - now.getTime();
	if (remainingTimeMs <= 0) {
		return {
			staminaNow: status.staminaMax,
			staminaMax: status.staminaMax,
			staminaRecoveryTime: STAMINA_RECOVERY_STOPPED_AT,
		};
	}
	const remainingStamina = Math.ceil(
		remainingTimeMs / STAMINA_RECOVERY_INTERVAL_MS,
	);
	return {
		staminaNow: Math.max(0, status.staminaMax - remainingStamina),
		staminaMax: status.staminaMax,
		staminaRecoveryTime: status.staminaRecoveryTime,
	};
}
