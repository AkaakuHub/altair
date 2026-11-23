import type { Database } from 'bun:sqlite';
import { createUserStatusController } from './application/user-status-controller.ts';
import {
	getCardMemberFanLevelDefaultsFromDatabase,
	getDefaultMemberFanLevelsFromDatabase,
} from './master-data/member-fan-level-master.ts';

export function createMasterBackedUserStatusController(database: Database) {
	return createUserStatusController(
		getDefaultMemberFanLevelsFromDatabase(database),
		getCardMemberFanLevelDefaultsFromDatabase(database),
	);
}
