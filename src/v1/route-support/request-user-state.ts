import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import { getBeginnerMissionCategoriesFromDatabase } from '../../master-data/beginner-mission-master-data.ts';
import { getChapterProvenance } from '../../master-data/chapter-identity.ts';
import { getActiveChapterMasterFromDatabase } from '../../master-data/chapter-master-data.ts';
import { getStepUpBeginnerMissionsFromDatabase } from '../../master-data/step-up-beginner-mission-master-data.ts';
import { ensureChapterRuntimeState } from '../../server-state.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { ensureUserActivityRecordState } from '../../state/activity-record-aggregate.ts';
import { ensureUserArchiveCollectionState } from '../../state/archive-collection-aggregate.ts';
import type { UserArchiveCollectionState } from '../../state/archive-collection-definition.ts';
import { ensureUserBeginnerMissionState } from '../../state/beginner-mission-aggregate-state.ts';
import type { UserBeginnerMissionState } from '../../state/beginner-mission-types.ts';
import { ensureUserChapterState } from '../../state/chapter-aggregate-state.ts';
import type { ActiveChapterMaster } from '../../state/chapter-definition.ts';
import type { UserChapterState } from '../../state/chapter-types.ts';
import {
	ensureUserDailyQuestState,
	type UserDailyQuestState,
} from '../../state/daily-quest-state.ts';
import type { EnsureStateResult } from '../../state/ensure-state-result.ts';
import { ensureUserStepUpBeginnerMissionState } from '../../state/step-up-beginner-mission-state.ts';
import {
	ensureUserLiveState,
	type UserLiveState,
} from '../../state/user-live-state.ts';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getRequestUserLiveState(
	c: Context,
	routeContext: StateRouteContext,
): EnsureStateResult<UserLiveState> | Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	return ensureUserLiveState(routeContext.state, user.playerId);
}

export function getRequestUserLiveSession(
	c: Context,
	routeContext: StateRouteContext,
):
	| {
			user: RegisteredUserState;
			userLive: UserLiveState;
			created: boolean;
	  }
	| Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	const result = ensureUserLiveState(routeContext.state, user.playerId);
	return { user, userLive: result.value, created: result.created };
}

export function ensureRouteUserLiveState(
	routeContext: StateRouteContext,
	playerId: string,
): EnsureStateResult<UserLiveState> {
	return ensureUserLiveState(routeContext.state, playerId);
}

export function ensureRouteUserArchiveCollectionState(
	routeContext: StateRouteContext,
	playerId: string,
) {
	return ensureUserArchiveCollectionState(routeContext.state, playerId);
}

export function getRequestUserArchiveCollectionState(
	c: Context,
	routeContext: StateRouteContext,
):
	| {
			user: RegisteredUserState;
			collection: UserArchiveCollectionState;
			created: boolean;
	  }
	| Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	const collectionResult = ensureRouteUserArchiveCollectionState(
		routeContext,
		user.playerId,
	);
	return {
		user,
		collection: collectionResult.value,
		created: collectionResult.created,
	};
}

export function getRequestUserChapterState(
	c: Context,
	routeContext: StateRouteContext,
):
	| (EnsureStateResult<UserChapterState> & {
			database: Database;
			master: ActiveChapterMaster;
	  })
	| Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
	const database = masterRelease.database;
	const currentChapters = routeContext.state.userChapters;
	const master = getActiveChapterMasterFromDatabase(
		database,
		ensureChapterRuntimeState(routeContext.state),
	);
	const provenance = getChapterProvenance(
		database,
		masterRelease.masterReleaseId,
		master.chapterId,
	);
	if (provenance === undefined) {
		return routeContext.respondError(c, 'chapterCategoryNotFound');
	}
	const result = ensureUserChapterState(
		currentChapters,
		user.playerId,
		master,
		provenance,
	);
	routeContext.state.userChapters = result.chapters;
	return {
		value: result.chapter,
		created: result.chapters !== currentChapters,
		database,
		master,
	};
}

export function getRequestUserBeginnerMissionSession(
	c: Context,
	routeContext: StateRouteContext,
):
	| {
			user: RegisteredUserState;
			mission: UserBeginnerMissionState;
			database: Database;
			masterReleaseId: string;
	  }
	| Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	const requestMasterRelease = routeContext.resolveRequestMasterRelease(
		c,
		user,
	);
	const { database } = requestMasterRelease;
	const result = ensureUserBeginnerMissionState(
		routeContext.state.userBeginnerMissions,
		user.playerId,
		getBeginnerMissionCategoriesFromDatabase(database),
	);
	routeContext.state.userBeginnerMissions = result.missions;
	return {
		user,
		mission: result.mission,
		database,
		masterReleaseId: requestMasterRelease.masterReleaseId,
	};
}

export function getRequestUserDailyQuestState(
	c: Context,
	routeContext: StateRouteContext,
): UserDailyQuestState | Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	return ensureRouteUserDailyQuestState(routeContext, user.playerId).value;
}

export function ensureRouteUserDailyQuestState(
	routeContext: StateRouteContext,
	playerId: string,
) {
	return ensureUserDailyQuestState(routeContext.state, playerId);
}

export function getRequestUserStepUpBeginnerMissionState(
	c: Context,
	routeContext: StateRouteContext,
) {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	return ensureRouteUserStepUpBeginnerMissionState(
		routeContext,
		user.playerId,
		routeContext.resolveMasterDatabase(c, user),
	);
}

function ensureRouteUserStepUpBeginnerMissionState(
	routeContext: StateRouteContext,
	playerId: string,
	database: Database,
) {
	return ensureUserStepUpBeginnerMissionState(
		routeContext.state,
		playerId,
		getStepUpBeginnerMissionsFromDatabase(database),
	);
}

export function ensureRouteUserActivityRecordState(
	routeContext: StateRouteContext,
	playerId: string,
) {
	return ensureUserActivityRecordState(routeContext.state, playerId);
}
