import type { UserStatusController } from '../../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import type { OfficialDataMigrationDump } from '../official-data-migration-dump.ts';
import { applyFanLevelInfoResponse } from './official-data-migration-fan-level-response.ts';
import { applyStaminaRecoveryInfoResponse } from './official-data-migration-stamina-response.ts';
import { applyStatusHeadersFromEvents } from './official-data-migration-status-headers.ts';

export function applyUserStatusFromDump(
	state: ServerState,
	playerId: string,
	dump: OfficialDataMigrationDump,
	userStatusController: UserStatusController,
): boolean {
	const status = userStatusController.ensure(state, playerId).value;
	let applied = applyStatusHeadersFromEvents(status, dump.events);
	const fanLevelResponse = dump.responsesByPath.get(
		'/v1/profile/get_fan_level_info',
	);
	if (fanLevelResponse !== undefined) {
		applyFanLevelInfoResponse(status, fanLevelResponse);
		applied = true;
	}
	if (applyStaminaRecoveryInfoResponse(status, dump)) {
		applied = true;
	}
	return applied;
}
