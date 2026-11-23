import type { Context } from 'hono';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { initializeLearningMusicState } from '../../state/initial-learning-music-state.ts';
import { ensureUserProfileDesign } from '../../state/profile-design-state.ts';
import { saveRegisteredUser } from '../../state/registered-user-state.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { ensureUserHeaderState } from '../../state/user-header-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { ensureUserPresentBox } from '../../state/user-presents-state.ts';
import { ensureUserSession } from '../../state/user-session-state.ts';
import { ensureUserTutorialState } from '../../state/user-tutorial-state.ts';
import { ensureRouteUserLiveState } from './request-user-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function initializeNewUserState(
	routeContext: StateRouteContext,
	c: Context,
	user: RegisteredUserState,
): void {
	const { state, userCardGetList, userItemsGetList } = routeContext;
	saveRegisteredUser(state, user);
	ensureUserProfileDesign(state, user.playerId);
	ensureUserHeaderState(state, user.playerId);
	routeContext.resolveUserStatus(c, user).ensure(state, user.playerId);
	ensureUserCards(state, user.playerId, userCardGetList);
	ensureUserInventory(state, user.playerId, userItemsGetList);
	initializeLearningMusicState(
		ensureRouteUserLiveState(routeContext, user.playerId).value,
	);
	ensureUserPresentBox(state, user.playerId);
	ensureUserTutorialState(state, user.playerId);
	ensureUserSession(state, user.playerId);
}
