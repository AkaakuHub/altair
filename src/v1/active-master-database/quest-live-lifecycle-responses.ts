import type { UserLiveState } from '../../state/user-live-state.ts';
import { getStringField } from '../route-support/request-fields.ts';
import { jstIsoNow } from './basic-data.ts';
import { numberField } from './json-utils.ts';

export function setQuestStart(body: unknown, userLive: UserLiveState) {
	const currentQuestLive = userLive.currentQuestLive;
	if (!currentQuestLive) return undefined;
	const questLiveId = getStringField(body, 'quest_live_id');
	if (questLiveId.length > 0) {
		currentQuestLive.questLiveId = questLiveId;
	}
	currentQuestLive.startTime = jstIsoNow();
	return {
		body: { quest_start_time: currentQuestLive.startTime },
		statusCode: 200,
	};
}

export function setQuestFinish(body: unknown, userLive: UserLiveState) {
	const currentQuestLive = userLive.currentQuestLive;
	if (!currentQuestLive) return undefined;
	currentQuestLive.score = numberField(body, 'score');
	currentQuestLive.playReport = getStringField(body, 'play_report');
	return {
		body: {
			quest_live_type: currentQuestLive.questLiveType,
			quest_result: true,
			return_resource: 0,
			applied_campaign_types: [] satisfies [],
		},
		statusCode: 200,
	};
}

export function setQuestRetire(userLive: UserLiveState) {
	const currentQuestLive = userLive.currentQuestLive;
	if (!currentQuestLive) return undefined;
	const questLiveType = currentQuestLive.questLiveType;
	userLive.currentQuestLive = null;
	return {
		body: { quest_live_type: questLiveType, return_resource: 0 },
		statusCode: 200,
	};
}
