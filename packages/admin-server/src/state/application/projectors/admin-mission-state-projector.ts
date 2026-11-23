import type { AdminVisibleServerState } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import type { AdminStatePage } from '../../domain/admin-state-page.ts';
import { projectUserLivesForAdmin } from './admin-user-live-projector.ts';

type MissionStateView = Pick<
	AdminVisibleServerState,
	| 'rewardClaims'
	| 'userBeginnerMissions'
	| 'userChapters'
	| 'userDailyQuestStates'
	| 'userLives'
	| 'userMissions'
	| 'userStepUpBeginnerMissions'
>;

export function projectAdminMissionState(
	state: ServerState,
	page: AdminStatePage,
): MissionStateView {
	const all = page === 'all';
	return {
		userLives: all || page === 'quest' ? projectUserLivesForAdmin(state) : [],
		userChapters:
			all || page === 'missions' || page === 'quest' ? state.userChapters : [],
		userDailyQuestStates:
			all || page === 'quest' ? state.userDailyQuestStates : [],
		userBeginnerMissions:
			all || page === 'missions' ? state.userBeginnerMissions : [],
		userStepUpBeginnerMissions:
			all || page === 'missions' ? state.userStepUpBeginnerMissions : [],
		userMissions:
			all || page === 'missions' || page === 'quest' ? state.userMissions : [],
		rewardClaims: all || page === 'missions' ? state.rewardClaims : [],
	};
}
