import type { AdminVisibleServerState } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import { projectCompletedTutorialIds } from '../../../../../../src/state/user-tutorial-state.ts';
import type { AdminStatePage } from '../../domain/admin-state-page.ts';

type AccountSocialStateView = Pick<
	AdminVisibleServerState,
	| 'accountLinks'
	| 'circle'
	| 'contentReleaseEffects'
	| 'followRelations'
	| 'userCircleNotifications'
	| 'userFriendCards'
	| 'userHeaders'
	| 'userNotifications'
	| 'userProfileDesigns'
	| 'userProfileSettings'
	| 'userSessions'
	| 'userSiscaStores'
	| 'userSocials'
	| 'userStatuses'
	| 'userTutorials'
>;

export function projectAdminAccountSocialState(
	state: ServerState,
	page: AdminStatePage,
	supportedTutorialIds: ReadonlySet<number>,
): AccountSocialStateView {
	const all = page === 'all';
	return {
		userSessions:
			all || page === 'login-bonus' || page === 'users'
				? state.userSessions
				: [],
		accountLinks: all || page === 'users' ? state.accountLinks : [],
		userHeaders: all || page === 'users' ? state.userHeaders : [],
		userStatuses:
			all || page === 'archive' || page === 'user-status'
				? state.userStatuses
				: [],
		userTutorials: all
			? state.userTutorials.map((tutorial) => ({
					playerId: tutorial.playerId,
					completedTutorialIds: projectCompletedTutorialIds(
						tutorial,
						supportedTutorialIds,
					),
				}))
			: [],
		contentReleaseEffects: all ? state.contentReleaseEffects : [],
		followRelations: all ? state.followRelations : [],
		userFriendCards: all ? state.userFriendCards : [],
		circle: all || page === 'circle' ? state.circle : null,
		userSocials: all || page === 'social' ? state.userSocials : [],
		userProfileSettings: all ? state.userProfileSettings : [],
		userProfileDesigns: all ? state.userProfileDesigns : [],
		userSiscaStores: all ? state.userSiscaStores : [],
		userNotifications: all ? state.userNotifications : [],
		userCircleNotifications:
			all || page === 'circle' ? state.userCircleNotifications : [],
	};
}
