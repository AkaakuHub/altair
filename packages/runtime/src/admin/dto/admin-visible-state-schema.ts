import { z } from 'zod';
import {
	accountLinkStateSchema,
	chapterRuntimeStateSchema,
	gradeChallengeRuntimeStateSchema,
	gradeLiveRuntimeStateSchema,
	grandPrixRuntimeStateSchema,
	maintenanceModeStateSchema,
	registeredUserStateSchema,
	resourceVersionOverridesStateSchema,
} from '../../../../../src/server-state-core-schema.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import type { ActivityRecordVisibleState } from '../../../../../src/state/activity-record-types.ts';
import type { UserLiveState } from '../../../../../src/state/user-live-state.ts';
import { objectSchema } from './dto-schema-utils.ts';

type AdminUserLiveState = Omit<
	UserLiveState,
	| 'rhythmMusicScores'
	| 'learningMusicMasteries'
	| 'gradeQuestProgressList'
	| 'gradeChallengeProgressList'
	| 'gradeChallengeSeasonProgressList'
	| 'grandPrixes'
> & {
	rhythmMusicScores: Array<
		Omit<
			UserLiveState['rhythmMusicScores'][number],
			'sourceMasterReleaseId' | 'identityFingerprint'
		>
	>;
	learningMusicMasteries: Array<
		Omit<
			UserLiveState['learningMusicMasteries'][number],
			'sourceMasterReleaseId' | 'identityFingerprint'
		>
	>;
	gradeQuestProgressList: Array<
		Omit<
			UserLiveState['gradeQuestProgressList'][number],
			'sourceMasterReleaseId' | 'identityFingerprint'
		>
	>;
	gradeChallengeProgressList: Array<
		Omit<
			UserLiveState['gradeChallengeProgressList'][number],
			'sourceMasterReleaseId' | 'identityFingerprint'
		>
	>;
	gradeChallengeSeasonProgressList: Array<
		Omit<
			UserLiveState['gradeChallengeSeasonProgressList'][number],
			'sourceMasterReleaseId' | 'identityFingerprint'
		>
	>;
	grandPrixes: Array<{
		grandPrixId: number;
		stageProgressList: Array<
			Omit<
				UserLiveState['grandPrixes'][number]['stageProgressList'][number],
				'sourceMasterReleaseId' | 'identityFingerprint'
			>
		>;
	}>;
};

const activityRecordVisibleStateSchema: z.ZodType<ActivityRecordVisibleState> =
	z.object({
		playerId: z.string(),
		watchedActivityRecordAdvDataIds: z.array(z.number()),
		displayedActivityRecordAdvSeriesIds: z.array(z.number()),
		unlockedActivityRecordAdvDataIds: z.array(z.number()),
	});

export const adminVisibleServerStateSchema = z.object({
	loginBonusActivations: z.array(
		objectSchema<ServerState['loginBonusActivations'][number]>(),
	),
	gachaSeriesActivations: z.array(
		objectSchema<ServerState['gachaSeriesActivations'][number]>(),
	),
	selectTicketSeriesActivations: z.array(
		objectSchema<ServerState['selectTicketSeriesActivations'][number]>(),
	),
	sessionIssueCount: z.number(),
	launcherInfo: z.record(z.string(), z.number()),
	maintenanceMode: maintenanceModeStateSchema,
	resourceVersionOverrides: resourceVersionOverridesStateSchema,
	chapter: chapterRuntimeStateSchema,
	grandPrix: grandPrixRuntimeStateSchema,
	gradeChallenge: gradeChallengeRuntimeStateSchema,
	gradeLive: gradeLiveRuntimeStateSchema,
	selectedAdminPlayerId: z.string().nullable(),
	registeredUsers: z.array(registeredUserStateSchema),
	userSessions: z.array(objectSchema<ServerState['userSessions'][number]>()),
	accountLinks: z.array(accountLinkStateSchema),
	userHeaders: z.array(objectSchema<ServerState['userHeaders'][number]>()),
	userStatuses: z.array(objectSchema<ServerState['userStatuses'][number]>()),
	userTutorials: z.array(objectSchema<ServerState['userTutorials'][number]>()),
	userInventories: z.array(
		objectSchema<ServerState['userInventories'][number]>(),
	),
	userCards: z.array(objectSchema<ServerState['userCards'][number]>()),
	userDecks: z.array(objectSchema<ServerState['userDecks'][number]>()),
	userPresentBoxes: z.array(
		objectSchema<ServerState['userPresentBoxes'][number]>(),
	),
	userActivityRecords: z.array(activityRecordVisibleStateSchema),
	userArchiveCollections: z.array(
		objectSchema<ServerState['userArchiveCollections'][number]>(),
	),
	archiveGiftPoints: z.array(
		objectSchema<ServerState['archiveGiftPoints'][number]>(),
	),
	contentReleaseEffects: z.array(
		objectSchema<ServerState['contentReleaseEffects'][number]>(),
	),
	followRelations: z.array(
		objectSchema<ServerState['followRelations'][number]>(),
	),
	userFriendCards: z.array(
		objectSchema<ServerState['userFriendCards'][number]>(),
	),
	circle: objectSchema<NonNullable<ServerState['circle']>>().nullable(),
	userSocials: z.array(objectSchema<ServerState['userSocials'][number]>()),
	userGachas: z.array(objectSchema<ServerState['userGachas'][number]>()),
	userProfileSettings: z.array(
		objectSchema<ServerState['userProfileSettings'][number]>(),
	),
	userProfileDesigns: z.array(
		objectSchema<ServerState['userProfileDesigns'][number]>(),
	),
	userSiscaStores: z.array(
		objectSchema<ServerState['userSiscaStores'][number]>(),
	),
	userShopExchanges: z.array(
		objectSchema<ServerState['userShopExchanges'][number]>(),
	),
	userNotifications: z.array(
		objectSchema<ServerState['userNotifications'][number]>(),
	),
	userCircleNotifications: z.array(
		objectSchema<ServerState['userCircleNotifications'][number]>(),
	),
	userLives: z.array(objectSchema<AdminUserLiveState>()),
	userChapters: z.array(objectSchema<ServerState['userChapters'][number]>()),
	userDailyQuestStates: z.array(
		objectSchema<ServerState['userDailyQuestStates'][number]>(),
	),
	userBeginnerMissions: z.array(
		objectSchema<ServerState['userBeginnerMissions'][number]>(),
	),
	userStepUpBeginnerMissions: z.array(
		objectSchema<ServerState['userStepUpBeginnerMissions'][number]>(),
	),
	userMissions: z.array(objectSchema<ServerState['userMissions'][number]>()),
	rewardClaims: z.array(objectSchema<ServerState['rewardClaims'][number]>()),
});

export type AdminVisibleServerState = z.infer<
	typeof adminVisibleServerStateSchema
>;
export type AdminChapterRuntime = AdminVisibleServerState['chapter'];
export type AdminGrandPrixRuntime = AdminVisibleServerState['grandPrix'];
export type AdminRegisteredUser =
	AdminVisibleServerState['registeredUsers'][number];
export type AdminAccountLink = AdminVisibleServerState['accountLinks'][number];
export type AdminUserSession = AdminVisibleServerState['userSessions'][number];
export type AdminLoginBonusActivation =
	AdminVisibleServerState['loginBonusActivations'][number];
export type AdminLoginBonusProgress =
	AdminUserSession['loginBonusProgresses'][number];
export type AdminGachaSeriesActivation =
	AdminVisibleServerState['gachaSeriesActivations'][number];
export type AdminSelectTicketSeriesActivation =
	AdminVisibleServerState['selectTicketSeriesActivations'][number];
export type AdminCircle = NonNullable<AdminVisibleServerState['circle']>;
export type AdminCircleMember = AdminCircle['members'][number];
export type AdminUserGacha = AdminVisibleServerState['userGachas'][number];
export type AdminGachaPurchasePlan = AdminUserGacha['purchasePlans'][number];
export type AdminUserLive = AdminVisibleServerState['userLives'][number];
export type AdminUserDailyQuest =
	AdminVisibleServerState['userDailyQuestStates'][number];
export type AdminQuestStageProgress =
	AdminUserLive['questStageProgressList'][number];
export type AdminDreamLiveProgress =
	AdminUserLive['dreamLiveProgressList'][number];
export type AdminLearningMusicMastery =
	AdminUserLive['learningMusicMasteries'][number];
export type AdminGradeQuestProgress =
	AdminUserLive['gradeQuestProgressList'][number];
export type AdminGrandPrixStageProgress =
	AdminUserLive['grandPrixes'][number]['stageProgressList'][number];
export type AdminUserMission = AdminVisibleServerState['userMissions'][number];
export type AdminUserBeginnerMission =
	AdminVisibleServerState['userBeginnerMissions'][number];
export type AdminBeginnerMissionProgress =
	AdminUserBeginnerMission['missionProgresses'][number];
export type AdminUserStepUpBeginnerMission =
	AdminVisibleServerState['userStepUpBeginnerMissions'][number];
export type AdminUserActivityRecord =
	AdminVisibleServerState['userActivityRecords'][number];
export type AdminUserChapter = AdminVisibleServerState['userChapters'][number];
export type AdminChapterMissionProgress =
	AdminUserChapter['missionProgresses'][number];
export type UserItem =
	AdminVisibleServerState['userInventories'][number]['itemCategoryList'][number]['userItemList'][number];
export type UserPresent =
	AdminVisibleServerState['userPresentBoxes'][number]['presentList'][number];
