import type { FollowMutationSource } from '../../state/follow-state.ts';
import type { FollowResponseSource } from '../responses/follow-response-source.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createFollowResponseSource(
	state: StateRouteContext['state'],
): FollowResponseSource {
	return {
		followRelations: state.followRelations,
		registeredUsers: state.registeredUsers,
		userCards: state.userCards,
		userFriendCards: state.userFriendCards,
		userProfileDesigns: state.userProfileDesigns,
		userProfileSettings: state.userProfileSettings,
		userSocials: state.userSocials,
		userStatuses: state.userStatuses,
	};
}

export function createFollowMutationSource(
	state: StateRouteContext['state'],
): FollowMutationSource {
	return {
		followRelations: state.followRelations,
		registeredUsers: state.registeredUsers,
	};
}
