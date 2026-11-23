import { Hono } from 'hono';
import { projectUserDecks } from '../../../application/user-deck-projection.ts';
import {
	getProjectedUserCardDataIds,
	projectUserCards,
} from '../../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../../master-data/user-owned-master-support.ts';
import { ensureUserCards } from '../../../state/user-card-aggregate-state.ts';
import { ensureUserDecks } from '../../../state/user-deck-aggregate.ts';
import { getDefaultDecks } from '../../../state/user-deck-defaults.ts';
import {
	getQuestLiveSetting,
	setQuestLiveSetting,
} from '../../active-master-database/quest-live-setting-responses.ts';
import { readJson } from '../../http/read-json.ts';
import type {
	QuestLiveInfoResponse,
	QuestLiveSettingResponse,
} from '../../response-types/quest-live-response-types.ts';
import type {
	QuestLiveSettingRequest,
	QuestLiveSettingUpdateRequest,
} from '../../response-types/quest-request-types.ts';
import { createCardMemberFanLevelsForResponse } from '../../responses/card-member-fan-levels.ts';
import { createQuestLiveFriendCardList } from '../../responses/quest-friend-card-response.ts';
import { createUserCardDataListWithMemberFanLevels } from '../../responses/user-card-response.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import { createFanLevelList } from '../../route-support/fan-level-response-mapper.ts';
import { getRequestUserLiveSession } from '../../route-support/request-user-state.ts';
import {
	persistRouteState,
	persistRouteStateIfChanged,
} from '../../route-support/route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createQuestLiveSettingRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored, state, userCardGetList } =
		routeContext;
	typedEndpoint<QuestLiveSettingRequest, QuestLiveSettingResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/get_live_setting', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		const { user, userLive } = session;
		const userDeckResult = ensureUserDecks(
			state,
			userLive.playerId,
			getDefaultDecks(),
		);
		const database = routeContext.resolveMasterDatabase(c, user);
		const support = createUserOwnedMasterSupport(database);
		const cardsResult = ensureUserCards(
			state,
			userLive.playerId,
			userCardGetList,
		);
		const cards = projectUserCards(cardsResult.value, support);
		const userDeck = projectUserDecks(
			userDeckResult.value,
			getProjectedUserCardDataIds(cards),
		);
		const userStatus = routeContext.resolveUserStatus(c, user);
		const statusResult = userStatus.ensure(state, userLive.playerId);
		const response = getQuestLiveSetting(
			database,
			await readJson(c.req.raw),
			userLive,
			createUserCardDataListWithMemberFanLevels(
				cards,
				createCardMemberFanLevelsForResponse(userStatus, statusResult.value),
			),
			userDeck,
			createQuestLiveFriendCardList(
				{
					requestPlayerId: userLive.playerId,
					friendCardSlot: 'schoolIdolStage',
					followRelations: state.followRelations,
					registeredUsers: state.registeredUsers,
					userCards: state.userCards,
					userFriendCards: state.userFriendCards,
					userProfileDesigns: state.userProfileDesigns,
					userSocials: state.userSocials,
					userStatuses: state.userStatuses,
				},
				userStatus,
				support,
			),
		);
		persistRouteStateIfChanged(
			routeContext,
			session.created ||
				userDeckResult.created ||
				cardsResult.created ||
				statusResult.created,
		);
		return respondStored(c, defaultHeaders, response);
	});
	typedEndpoint<QuestLiveSettingUpdateRequest, QuestLiveInfoResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/set_live_setting', async (c) => {
		const session = getRequestUserLiveSession(c, routeContext);
		if (session instanceof Response) return session;
		const { user, userLive } = session;
		const canonicalUserDeck = ensureUserDecks(
			state,
			userLive.playerId,
			getDefaultDecks(),
		).value;
		const canonicalCards = ensureUserCards(
			state,
			userLive.playerId,
			userCardGetList,
		).value;
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const support = createUserOwnedMasterSupport(masterRelease.database);
		const cards = projectUserCards(canonicalCards, support);
		const userDeck = projectUserDecks(
			canonicalUserDeck,
			getProjectedUserCardDataIds(cards),
		);
		const userStatus = routeContext.resolveUserStatus(c, user);
		const status = userStatus.ensure(state, userLive.playerId).value;
		const response = setQuestLiveSetting(
			masterRelease.database,
			masterRelease.masterReleaseId,
			await readJson(c.req.raw),
			userLive,
			userDeck,
			createUserCardDataListWithMemberFanLevels(
				cards,
				createCardMemberFanLevelsForResponse(userStatus, status),
			),
			createFanLevelList(userStatus.getCurrentSeasonMemberFanLevels(status)),
		);
		if (response === undefined) {
			return routeContext.respondError(c, 'questLiveSettingInvalid');
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, response);
	});
	return app;
}
