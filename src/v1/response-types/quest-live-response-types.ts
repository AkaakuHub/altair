import type { createQuestLiveInfoBody } from '../active-master-database/quest-live-info-response.ts';
import type {
	setQuestFinish,
	setQuestRetire,
	setQuestStart,
} from '../active-master-database/quest-live-lifecycle-responses.ts';
import type { getQuestLiveSetting } from '../active-master-database/quest-live-setting-responses.ts';

export type QuestLiveSettingResponse = NonNullable<
	ReturnType<typeof getQuestLiveSetting>
>['body'];
export type QuestLiveInfoResponse = ReturnType<typeof createQuestLiveInfoBody>;
export type QuestLiveStartResponse = NonNullable<
	ReturnType<typeof setQuestStart>
>['body'];
export type QuestLiveFinishResponse = NonNullable<
	ReturnType<typeof setQuestFinish>
>['body'];
export type QuestLiveRetireResponse = NonNullable<
	ReturnType<typeof setQuestRetire>
>['body'];
