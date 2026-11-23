import type { Context } from 'hono';
import { getActivityRecordMasterIdentityCatalogFromDatabase } from '../../master-data/activity-record-master.ts';
import { getArchiveIdentityFingerprints } from '../../master-data/archive-identity.ts';
import { getBeginnerMissionCategoriesFromDatabase } from '../../master-data/beginner-mission-master-data.ts';
import { projectActivityRecordState } from '../../state/activity-record-projection.ts';
import { projectArchiveWatchedHistory } from '../../state/archive-watched-history.ts';
import { createBeginnerMissionListResponse } from '../responses/mission-list-response.ts';
import { getRequestUser, persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createBeginnerMissionListHandler(
	routeContext: StateRouteContext,
) {
	return (c: Context) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const activityRecord = routeContext.state.userActivityRecords.find(
			(entry) => entry.playerId === user.playerId,
		);
		const archiveCollection = routeContext.state.userArchiveCollections.find(
			(entry) => entry.playerId === user.playerId,
		);
		const database = routeContext.resolveMasterDatabase(c, user);
		const missionSync = routeContext
			.resolveMissionProgress(c, user)
			.syncUserContent(user.playerId, {
				...(activityRecord
					? {
							activityRecord: projectActivityRecordState(
								activityRecord,
								getActivityRecordMasterIdentityCatalogFromDatabase(database),
							),
						}
					: {}),
				...(archiveCollection
					? {
							archiveCollection: projectArchiveWatchedHistory(
								archiveCollection,
								{
									withliveFingerprints: getArchiveIdentityFingerprints(
										database,
										'withlive',
									),
									fesFingerprints: getArchiveIdentityFingerprints(
										database,
										'fes',
									),
								},
							),
						}
					: {}),
			});
		persistRouteStateIfChanged(
			routeContext,
			missionSync.created || missionSync.progressChanged,
		);
		return c.json(
			createBeginnerMissionListResponse(
				missionSync.mission,
				getBeginnerMissionCategoriesFromDatabase(database),
			),
		);
	};
}
