import type { Context } from 'hono';
import { getBeginnerMissionCategoriesFromDatabase } from '../../master-data/beginner-mission-master-data.ts';
import { ensureUserBeginnerMissionState } from '../../state/beginner-mission-aggregate-state.ts';
import { ensureUserProfileDesign } from '../../state/profile-design-state.ts';
import { ensureUserProfileSettings } from '../../state/profile-settings-state.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { ensureUserPresentBox } from '../../state/user-presents-state.ts';
import { ensureUserSession } from '../../state/user-session-state.ts';
import { ensureUserTutorialState } from '../../state/user-tutorial-state.ts';
import {
	ensureRouteUserArchiveCollectionState,
	ensureRouteUserDailyQuestState,
	ensureRouteUserLiveState,
} from './request-user-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function ensureHomeUserState(
	routeContext: StateRouteContext,
	c: Context,
	playerId: string,
): boolean {
	const { state, userCardGetList, userItemsGetList } = routeContext;
	const profileDesignResult = ensureUserProfileDesign(state, playerId);
	const userCardsResult = ensureUserCards(state, playerId, userCardGetList);
	const userLiveResult = ensureRouteUserLiveState(routeContext, playerId);
	const dailyQuestResult = ensureRouteUserDailyQuestState(
		routeContext,
		playerId,
	);
	const user = state.registeredUsers.find(
		(registeredUser) => registeredUser.playerId === playerId,
	);
	if (user === undefined) {
		throw new Error(`Home user is missing: ${playerId}`);
	}
	const beginnerMissionsBefore = state.userBeginnerMissions;
	const beginnerMissionResult = ensureUserBeginnerMissionState(
		beginnerMissionsBefore,
		playerId,
		getBeginnerMissionCategoriesFromDatabase(
			routeContext.resolveMasterDatabase(c, user),
		),
	);
	state.userBeginnerMissions = beginnerMissionResult.missions;
	const userStatusResult = routeContext
		.resolveUserStatus(c, user)
		.ensure(state, playerId);
	const profileSettingsResult = ensureUserProfileSettings(state, playerId);
	const archiveCollectionResult = ensureRouteUserArchiveCollectionState(
		routeContext,
		playerId,
	);
	const inventoryResult = ensureUserInventory(
		state,
		playerId,
		userItemsGetList,
	);
	const presentBoxResult = ensureUserPresentBox(state, playerId);
	const tutorialResult = ensureUserTutorialState(state, playerId);
	const sessionResult = ensureUserSession(state, playerId);
	return (
		profileDesignResult.created ||
		userCardsResult.created ||
		beginnerMissionResult.missions !== beginnerMissionsBefore ||
		userLiveResult.created ||
		dailyQuestResult.created ||
		userStatusResult.created ||
		profileSettingsResult.created ||
		archiveCollectionResult.created ||
		inventoryResult.created ||
		presentBoxResult.created ||
		tutorialResult.created ||
		sessionResult.created
	);
}
