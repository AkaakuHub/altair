import { jstGameDate } from '../../../../../../src/master-data/master-time.ts';
import type { UserStatusState } from '../../../../../../src/state/user-status-types.ts';
import type { OfficialDataMigrationDump } from '../official-data-migration-dump.ts';
import {
	readNumber,
	readRecord,
	readString,
} from '../official-data-migration-dump.ts';

export function applyStaminaRecoveryInfoResponse(
	status: UserStatusState,
	dump: OfficialDataMigrationDump,
): boolean {
	const response = dump.responsesByPath.get(
		'/v1/out_quest_live/get_stamina_recovery_info',
	);
	if (response === undefined) {
		return false;
	}
	const userStamina = readRecord(response.user_stamina);
	const staminaNow = readNumber(userStamina?.stamina_now);
	const staminaMax = readNumber(userStamina?.stamina_max);
	const staminaRecoveryTime = readString(userStamina?.stamina_recovery_time);
	const jewelRecoveryCount = readNumber(response.jewel_st_recovery_count);
	let applied = false;
	if (staminaNow !== null) {
		status.staminaNow = staminaNow;
		applied = true;
	}
	if (staminaMax !== null) {
		status.staminaMax = staminaMax;
		applied = true;
	}
	if (staminaRecoveryTime !== null) {
		status.staminaRecoveryTime = staminaRecoveryTime;
		applied = true;
	}
	if (jewelRecoveryCount !== null) {
		status.jewelStaminaRecoveryCount = jewelRecoveryCount;
		status.jewelStaminaRecoveryGameDate = readDumpCreatedGameDate(
			dump.preview.createdAtUtc,
		);
		applied = true;
	}
	return applied;
}

function readDumpCreatedGameDate(createdAtUtc: string | null): string | null {
	if (createdAtUtc === null) {
		return null;
	}
	const date = new Date(createdAtUtc);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return jstGameDate(date);
}
