import { z } from 'zod';
import {
	accountLinkStateSchema,
	chapterRuntimeStateSchema,
	gradeChallengeRuntimeStateSchema,
	gradeLiveRuntimeStateSchema,
	grandPrixRuntimeStateSchema,
	type grandPrixStageRuntimeOverrideSchema,
	maintenanceModeStateSchema,
	registeredUserStateSchema,
	resourceVersionOverridesStateSchema,
} from './server-state-core-schema.ts';
import type { UserActivityRecordState } from './state/activity-record-types.ts';
import { isUserActivityRecordState } from './state/activity-record-validator.ts';
import {
	isUserArchiveCollectionState,
	type UserArchiveCollectionState,
} from './state/archive-collection-definition.ts';
import {
	type ArchiveGiftPointState,
	isArchiveGiftPointState,
} from './state/archive-gift-state.ts';
import type { UserBeginnerMissionState } from './state/beginner-mission-types.ts';
import { isUserBeginnerMissionState } from './state/beginner-mission-validator.ts';
import { isUserChapterState } from './state/chapter-state-validator.ts';
import type { UserChapterState } from './state/chapter-types.ts';
import {
	isUserCircleNotificationState,
	type UserCircleNotificationState,
} from './state/circle-notification-state.ts';
import { isCircleState } from './state/circle-state-validator.ts';
import type { CircleState } from './state/circle-types.ts';
import {
	type ContentReleaseEffectState,
	isContentReleaseEffectState,
} from './state/content-release-state.ts';
import {
	isUserDailyQuestState,
	type UserDailyQuestState,
} from './state/daily-quest-state.ts';
import {
	type FollowRelationState,
	isFollowRelationState,
} from './state/follow-state.ts';
import { isUserFriendCardState } from './state/friend-card-state-validator.ts';
import type { UserFriendCardState } from './state/friend-card-types.ts';
import {
	type GachaSeriesActivationState,
	isGachaSeriesActivationState,
} from './state/gacha-activation-state.ts';
import { isUserGachaState } from './state/gacha-state-validator.ts';
import type { UserGachaState } from './state/gacha-types.ts';
import {
	type GrandPrixRankingState,
	isGrandPrixRankingState,
} from './state/grand-prix-ranking-definition.ts';
import type { LoginBonusActivationState } from './state/login-bonus-types.ts';
import { isLoginBonusActivationState } from './state/login-bonus-validator.ts';
import { isUserMissionState } from './state/mission-state-validator.ts';
import type { UserMissionState } from './state/mission-types.ts';
import {
	isUserProfileDesignState,
	type UserProfileDesignState,
} from './state/profile-design-state.ts';
import {
	isUserProfileSettingsState,
	type UserProfileSettingsState,
} from './state/profile-settings-state.ts';
import {
	isRewardClaimRecord,
	type RewardClaimRecord,
} from './state/reward-claim-ledger-state.ts';
import {
	isSelectTicketSeriesActivationState,
	type SelectTicketSeriesActivationState,
} from './state/select-ticket-activation-state.ts';
import type { UserShopExchangeState } from './state/shop-exchange-types.ts';
import { isUserShopExchangeState } from './state/shop-exchange-validator.ts';
import {
	isUserSiscaStoreState,
	type UserSiscaStoreState,
} from './state/sisca-store-state.ts';
import { isUserSocialState } from './state/social-state-validator.ts';
import type { UserSocialState } from './state/social-types.ts';
import {
	isUserStepUpBeginnerMissionState,
	type UserStepUpBeginnerMissionState,
} from './state/step-up-beginner-mission-state.ts';
import type { UserCardCollectionState } from './state/user-card-aggregate-state.ts';
import { isUserCardCollectionState } from './state/user-card-validator.ts';
import type { UserDeckState } from './state/user-deck-definition.ts';
import { isUserDeckState } from './state/user-deck-validator.ts';
import {
	isUserHeaderState,
	type UserHeaderState,
} from './state/user-header-state.ts';
import type { UserInventoryState } from './state/user-item-definition.ts';
import { isUserInventoryState } from './state/user-item-validator.ts';
import type { UserLiveState } from './state/user-live-state.ts';
import { isUserLiveState } from './state/user-live-state-validator.ts';
import {
	isUserNotificationState,
	type UserNotificationState,
} from './state/user-notifications-state.ts';
import {
	isUserPresentBoxState,
	type UserPresentBoxState,
} from './state/user-presents-state.ts';
import {
	isUserSessionState,
	type UserSessionState,
} from './state/user-session-state.ts';
import type { UserStatusState } from './state/user-status-types.ts';
import { isUserStatusState } from './state/user-status-validator.ts';
import {
	isUserTutorialState,
	type UserTutorialState,
} from './state/user-tutorial-state.ts';

export const serverStateSchema = z.object({
	loginBonusActivations: stateArraySchema<LoginBonusActivationState>(
		isLoginBonusActivationState,
	),
	gachaSeriesActivations: stateArraySchema<GachaSeriesActivationState>(
		isGachaSeriesActivationState,
	).prefault([]),
	selectTicketSeriesActivations:
		stateArraySchema<SelectTicketSeriesActivationState>(
			isSelectTicketSeriesActivationState,
		).prefault([]),
	sessionIssueCount: z.number(),
	launcherInfo: z.record(z.string(), z.number()),
	resourceVersionOverrides: resourceVersionOverridesStateSchema,
	maintenanceMode: maintenanceModeStateSchema.prefault({ isEnabled: false }),
	chapter: chapterRuntimeStateSchema,
	grandPrix: grandPrixRuntimeStateSchema,
	grandPrixRankings: stateArraySchema<GrandPrixRankingState>(
		isGrandPrixRankingState,
	).prefault([]),
	gradeChallenge: gradeChallengeRuntimeStateSchema.optional(),
	gradeLive: gradeLiveRuntimeStateSchema.optional(),
	selectedAdminPlayerId: z.string().nullable().prefault(null),
	registeredUsers: z.array(registeredUserStateSchema),
	userSessions: stateArraySchema<UserSessionState>(isUserSessionState),
	accountLinks: z.array(accountLinkStateSchema),
	userHeaders: stateArraySchema<UserHeaderState>(isUserHeaderState).prefault(
		[],
	),
	userStatuses: stateArraySchema<UserStatusState>(isUserStatusState),
	userTutorials: stateArraySchema<UserTutorialState>(isUserTutorialState),
	userInventories: stateArraySchema<UserInventoryState>(isUserInventoryState),
	userCards: stateArraySchema<UserCardCollectionState>(
		isUserCardCollectionState,
	),
	userDecks: stateArraySchema<UserDeckState>(isUserDeckState),
	userPresentBoxes: stateArraySchema<UserPresentBoxState>(
		isUserPresentBoxState,
	),
	userArchiveCollections: stateArraySchema<UserArchiveCollectionState>(
		isUserArchiveCollectionState,
	),
	userActivityRecords: stateArraySchema<UserActivityRecordState>(
		isUserActivityRecordState,
	).prefault([]),
	archiveGiftPoints: stateArraySchema<ArchiveGiftPointState>(
		isArchiveGiftPointState,
	),
	contentReleaseEffects: stateArraySchema<ContentReleaseEffectState>(
		isContentReleaseEffectState,
	),
	followRelations: stateArraySchema<FollowRelationState>(isFollowRelationState),
	userFriendCards: stateArraySchema<UserFriendCardState>(isUserFriendCardState),
	circle: z.custom<CircleState>(isCircleState).nullable(),
	userSocials: stateArraySchema<UserSocialState>(isUserSocialState),
	userGachas: stateArraySchema<UserGachaState>(isUserGachaState),
	userProfileSettings: stateArraySchema<UserProfileSettingsState>(
		isUserProfileSettingsState,
	),
	userProfileDesigns: stateArraySchema<UserProfileDesignState>(
		isUserProfileDesignState,
	),
	userSiscaStores: stateArraySchema<UserSiscaStoreState>(isUserSiscaStoreState),
	userShopExchanges: stateArraySchema<UserShopExchangeState>(
		isUserShopExchangeState,
	),
	userNotifications: stateArraySchema<UserNotificationState>(
		isUserNotificationState,
	),
	userCircleNotifications: stateArraySchema<UserCircleNotificationState>(
		isUserCircleNotificationState,
	).prefault([]),
	userLives: stateArraySchema<UserLiveState>(isUserLiveState),
	userChapters: stateArraySchema<UserChapterState>(isUserChapterState),
	userDailyQuestStates: stateArraySchema<UserDailyQuestState>(
		isUserDailyQuestState,
	).prefault([]),
	userBeginnerMissions: stateArraySchema<UserBeginnerMissionState>(
		isUserBeginnerMissionState,
	),
	userStepUpBeginnerMissions: stateArraySchema<UserStepUpBeginnerMissionState>(
		isUserStepUpBeginnerMissionState,
	).prefault([]),
	userMissions: stateArraySchema<UserMissionState>(isUserMissionState),
	rewardClaims: stateArraySchema<RewardClaimRecord>(
		isRewardClaimRecord,
	).prefault([]),
});

export type LauncherInfo = Record<string, number>;
export type RegisteredUserState = z.infer<typeof registeredUserStateSchema>;
export type AccountLinkState = z.infer<typeof accountLinkStateSchema>;
export type ChapterRuntimeState = z.infer<typeof chapterRuntimeStateSchema>;
export type GrandPrixRuntimeState = z.infer<typeof grandPrixRuntimeStateSchema>;
export type GrandPrixStageRuntimeOverride = z.infer<
	typeof grandPrixStageRuntimeOverrideSchema
>;
export type GradeLiveRuntimeState = z.infer<typeof gradeLiveRuntimeStateSchema>;
export type GradeChallengeRuntimeState = z.infer<
	typeof gradeChallengeRuntimeStateSchema
>;
export type ServerState = z.infer<typeof serverStateSchema>;

function stateArraySchema<T>(
	isState: (value: unknown) => value is T,
): z.ZodArray<z.ZodType<T>> {
	return z.array(z.custom<T>(isState));
}
