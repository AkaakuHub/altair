import type { BeginnerMissionStatus } from '../../state/beginner-mission-types.ts';
import type {
	HomeGetHomeResponse,
	HomeHighlightedBadgeInfo,
	HomePlan,
	HomeQuestQuitInfo,
} from '../responses/home-response.ts';
import type { ProfileInfo } from '../responses/profile-response.ts';
import type { HomeMembershipNotifications } from './home-content-repositories.ts';
import type { HomeStandardQuestSelection } from './home-standard-quest-selection.ts';

type HomeExternalContent = Readonly<{
	membershipNotifications: HomeMembershipNotifications;
	plans: readonly HomePlan[];
	expiredLimitedGachaTicketIds: readonly number[];
	questQuitInfo: HomeQuestQuitInfo | null;
	latestNewsId: string;
}>;

export function createNewUserHomeResponse(
	profileInfo: ProfileInfo,
	finishedSimpleTutorialList: number[],
	beginnerMissionStatus: BeginnerMissionStatus,
	standardQuestSelection: HomeStandardQuestSelection,
	highlightedBadgeInfo: HomeHighlightedBadgeInfo,
	externalContent: HomeExternalContent,
): HomeGetHomeResponse {
	return {
		beginner_mission_status: beginnerMissionStatus,
		expired_limited_gacha_ticket_id_confirm_list: [
			...externalContent.expiredLimitedGachaTicketIds,
		],
		finished_simple_tutorial_list: [...finishedSimpleTutorialList],
		has_daily_ticket: false,
		has_grand_prix_playable_count: false,
		highlighted_badge_info: highlightedBadgeInfo,
		is_finish_tutorial: false,
		is_first_home: false,
		is_login_bonus: false,
		is_not_watched_adv_from_current_season: false,
		latest_news_id: externalContent.latestNewsId,
		membership_pending_list: [
			...externalContent.membershipNotifications.pendingMembershipIds,
		],
		membership_update_confirm_list: [
			...externalContent.membershipNotifications
				.updateConfirmationMembershipIds,
		],
		plan_list: externalContent.plans.map((plan) => ({ ...plan })),
		profile_info: profileInfo,
		quest_quit_info: externalContent.questQuitInfo,
		standard_quest_areas_id: standardQuestSelection.standardQuestAreaId,
		standard_quest_stages_id: standardQuestSelection.standardQuestStageId,
	};
}
