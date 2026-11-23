import type { Database } from 'bun:sqlite';
import { currentUtcIsoDateTime } from './master-time.ts';
import { composeMissionGroups } from './mission-group-composition.ts';
import { queryMissionGroupRows } from './mission-group-master-query.ts';

export function getMissionGroupsFromDatabase(database: Database) {
	return composeMissionGroups(
		queryMissionGroupRows(database, currentUtcIsoDateTime()),
	);
}
