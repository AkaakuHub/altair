import type { getDreamResult } from '../active-master-database/dream-quest-result-responses.ts';
import type { getGradeQuestList } from '../active-master-database/grade-quest-list-response.ts';
import type {
	getGradeResult,
	retireGradeQuest,
} from '../active-master-database/grade-quest-result-responses.ts';
import type { getGrandPrixResult } from '../active-master-database/grand-prix-result-responses.ts';
import type { getQuestResult } from '../active-master-database/quest-live-result-response.ts';
import type { skipQuest } from '../active-master-database/quest-skip-responses.ts';
export type DreamQuestResultResponse = NonNullable<
	ReturnType<typeof getDreamResult>
>['body'];
export type GradeQuestListResponse = NonNullable<
	ReturnType<typeof getGradeQuestList>
>['body'];
export type GradeQuestResultResponse = NonNullable<
	ReturnType<typeof getGradeResult>
>['body'];
export type GradeQuestRetireResponse = NonNullable<
	ReturnType<typeof retireGradeQuest>
>['body'];
export type StandardQuestResultResponse = NonNullable<
	ReturnType<typeof getQuestResult>
>['body'];
export type QuestSkipResponse = NonNullable<
	ReturnType<typeof skipQuest>
>['body'];
export type GrandPrixResultResponse = NonNullable<
	ReturnType<typeof getGrandPrixResult>
>['body'];
export type QuestResultResponse =
	| StandardQuestResultResponse
	| GrandPrixResultResponse;
