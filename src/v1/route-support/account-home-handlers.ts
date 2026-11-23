import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import {
	getActivityRecordMasterIdentityCatalogFromDatabase,
	getActivityRecordMonthlyInfoListFromDatabase,
} from '../../master-data/activity-record-master.ts';
import { getBeginnerMissionCategoriesFromDatabase } from '../../master-data/beginner-mission-master-data.ts';
import { getReceivableCommonMissionRewardsFromDatabase } from '../../master-data/common-mission-master-data.ts';
import { projectActivityRecordState } from '../../state/activity-record-projection.ts';
import type { UserActivityRecordState } from '../../state/activity-record-types.ts';
import {
	hasUnreceivedCommonMissionReward,
	projectHomeActivityRecordBadges,
} from '../../state/home-highlighted-badge-projection.ts';
import { getCommonMissionStarTotal } from '../../state/mission-star-progress-sync.ts';
import { ensureUserProfileSettings } from '../../state/profile-settings-state.ts';
import { ensureHomeUserState } from './account-home-user-state.ts';
import { createProfileInfoForUser } from './account-profile-info.ts';
import { projectHomeBeginnerMissionStatus } from './home-beginner-mission-status.ts';
import {
	emptyHomeEventScheduleRepository,
	emptyHomeExpiredLimitedGachaTicketNotificationRepository,
	emptyHomeMembershipRepository,
	emptyHomeNewsRepository,
	emptyHomePlanRepository,
	emptyHomeQuestQuitNotificationRepository,
} from './home-content-repositories.ts';
import { emptyHomeExchangeNotificationRepository } from './home-exchange-notification-repository.ts';
import { createHomeHighlightedBadgeInfo } from './home-highlighted-badge-info.ts';
import { projectHomePlayableBadges } from './home-playable-badge-projection.ts';
import { projectHomeStandardQuestSelectionFromDatabase } from './home-standard-quest-selection.ts';
import { receiveLoginBonus } from './login-bonus-flow.ts';
import {
	ensureRouteUserActivityRecordState,
	ensureRouteUserDailyQuestState,
	ensureRouteUserLiveState,
} from './request-user-state.ts';
import {
	persistRouteState,
	persistRouteStateIfChanged,
	withRequestUser,
} from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';
import { createNewUserHomeResponse } from './user-response-helpers.ts';

export function getLoginBonus(
	c: Context,
	context: StateRouteContext,
): Response | Promise<Response> {
	return withRequestUser(c, context, (user) => {
		const response = receiveLoginBonus(context, c, user);
		persistRouteState(context);
		context.applyResponseHeaders(c, context.defaultHeaders);
		return c.json(response);
	});
}

export function getHome(
	c: Context,
	context: StateRouteContext,
): Response | Promise<Response> {
	return withRequestUser(c, context, (requestUser) => {
		const database = context.resolveMasterDatabase(c, requestUser);
		const homeUserStateChanged = ensureHomeUserState(
			context,
			c,
			requestUser.playerId,
		);
		const settings = ensureUserProfileSettings(
			context.state,
			requestUser.playerId,
		).value;
		const activityRecordResult = ensureRouteUserActivityRecordState(
			context,
			requestUser.playerId,
		);
		const userLive = ensureRouteUserLiveState(
			context,
			requestUser.playerId,
		).value;
		const missionSync = context
			.resolveMissionProgress(c, requestUser)
			.syncLiveStars(requestUser.playerId, userLive);
		const beginnerMission = context.state.userBeginnerMissions.find(
			(mission) => mission.playerId === requestUser.playerId,
		);
		if (beginnerMission === undefined) {
			throw new Error(
				`Home beginner mission is missing: ${requestUser.playerId}`,
			);
		}
		persistRouteStateIfChanged(
			context,
			homeUserStateChanged ||
				activityRecordResult.created ||
				missionSync.changed,
		);
		context.applyResponseHeaders(c, context.defaultHeaders, {
			user: requestUser,
		});
		const response = createNewUserHomeResponse(
			createProfileInfoForUser(context, c, requestUser.playerId),
			settings.finishedSimpleTutorialIds,
			projectHomeBeginnerMissionStatus(
				beginnerMission,
				getBeginnerMissionCategoriesFromDatabase(database),
			),
			projectHomeStandardQuestSelectionFromDatabase(
				database,
				ensureRouteUserLiveState(context, requestUser.playerId).value,
			),
			createHomeHighlightedBadgeInfo(
				database,
				context.state,
				requestUser,
				emptyHomeExchangeNotificationRepository.getPendingNotifications(
					requestUser.playerId,
				),
				projectHomePlayableBadges(
					ensureRouteUserDailyQuestState(context, requestUser.playerId).value,
					context.state.grandPrix,
				),
				emptyHomeNewsRepository.getLatestNewsId(),
				emptyHomeEventScheduleRepository.getNextSchedule(),
				projectHomeActivityRecordBadges(
					createHomeActivityRecordMonthlyInfoList(
						database,
						activityRecordResult.value,
					),
				),
				hasUnreceivedCommonMissionReward(
					missionSync.mission,
					getReceivableCommonMissionRewardsFromDatabase(
						database,
						getCommonMissionStarTotal(missionSync.mission),
						0,
					),
				),
			),
			{
				membershipNotifications:
					emptyHomeMembershipRepository.getPendingNotifications(),
				plans: emptyHomePlanRepository.listActivePlans(),
				expiredLimitedGachaTicketIds:
					emptyHomeExpiredLimitedGachaTicketNotificationRepository.listPendingTicketIds(),
				questQuitInfo:
					emptyHomeQuestQuitNotificationRepository.getPendingQuestQuit(),
				latestNewsId: emptyHomeNewsRepository.getLatestNewsId(),
			},
		);
		return c.json(response);
	});
}

function createHomeActivityRecordMonthlyInfoList(
	database: Database,
	activityRecord: UserActivityRecordState,
) {
	const visibleActivityRecord = projectActivityRecordState(
		activityRecord,
		getActivityRecordMasterIdentityCatalogFromDatabase(database),
	);
	return getActivityRecordMonthlyInfoListFromDatabase(
		database,
		new Set(visibleActivityRecord.watchedActivityRecordAdvDataIds),
		new Set(visibleActivityRecord.displayedActivityRecordAdvSeriesIds),
		new Set(visibleActivityRecord.unlockedActivityRecordAdvDataIds),
		new Map(),
	);
}
