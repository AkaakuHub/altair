import type {
	setGradeQuestAction,
	setGradeQuestAddSkill,
	setGradeQuestStart,
} from '../active-master-database/grade-quest-session-responses.ts';
import type { getGradeStageData } from '../active-master-database/grade-quest-stage-response.ts';
import type {
	getGrandPrixStageData,
	getGrandPrixStageList,
	getGrandPrixStageSelect,
} from '../active-master-database/grand-prix-stage-responses.ts';
import type {
	getGrandPrixHistory,
	getGrandPrixRankingList,
	getGrandPrixTopInfo,
} from '../active-master-database/grand-prix-top-ranking-response-service.ts';
import type {
	getMusicLearningResult,
	getMusicLearningSelect,
	setMusicLearningMusic,
} from '../active-master-database/learning-live-response-service.ts';

export type GradeQuestStartResponse = NonNullable<
	ReturnType<typeof setGradeQuestStart>
>['body'];
export type GradeQuestActionResponse = NonNullable<
	ReturnType<typeof setGradeQuestAction>
>['body'];
export type GradeQuestAddSkillResponse = NonNullable<
	ReturnType<typeof setGradeQuestAddSkill>
>['body'];
export type GradeQuestStageDataResponse = NonNullable<
	ReturnType<typeof getGradeStageData>
>['body'];
export type MusicLearningSelectResponse = NonNullable<
	ReturnType<typeof getMusicLearningSelect>
>['body'];
export type MusicLearningMusicResponse = NonNullable<
	ReturnType<typeof setMusicLearningMusic>
>['body'];
export type MusicLearningResultResponse = NonNullable<
	ReturnType<typeof getMusicLearningResult>
>['body'];
export type GrandPrixTopInfoResponse = NonNullable<
	ReturnType<typeof getGrandPrixTopInfo>
>['body'];
export type GrandPrixRankingResponse = NonNullable<
	ReturnType<typeof getGrandPrixRankingList>
>['body'];
export type GrandPrixHistoryResponse = NonNullable<
	ReturnType<typeof getGrandPrixHistory>
>['body'];
export type GrandPrixStageSelectResponse = NonNullable<
	ReturnType<typeof getGrandPrixStageSelect>
>['body'];
export type GrandPrixStageListResponse = NonNullable<
	ReturnType<typeof getGrandPrixStageList>
>['body'];
export type GrandPrixStageDataResponse = NonNullable<
	ReturnType<typeof getGrandPrixStageData>
>['body'];
