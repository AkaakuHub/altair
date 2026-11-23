import type { Database } from 'bun:sqlite';
import {
	getReceivableRhythmGameClassDataFromDatabase,
	getRhythmGameClassMissionRewardsFromDatabase,
	type RhythmGameClassMissionReward,
} from '../../master-data/rhythm-game-class-missions.ts';
import {
	calculateRhythmGameClassMissionProgress,
	isRhythmGameClassMissionConditionType,
	rhythmGameClassMissionConditionTypes,
} from '../../state/rhythm-game-class-mission.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	getUserRhythmGameClassMissionReceivedOrder,
	setUserRhythmGameClassMissionReceivedOrder,
} from '../../state/user-rhythm-class-mission-order.ts';
import { isJsonRecord } from '../route-support/request-fields.ts';
import { numberField } from './json-utils.ts';
import type { JsonRecord, StoredResponse } from './types.ts';

export type RhythmGameClassMissionResponse = JsonRecord & {
	condition_type: number;
	progress_num: number;
	received_order: number;
};

type RhythmGameReceiveClassMissionResponse = JsonRecord & {
	received_class_data_ids: number[];
	class_mission_info: RhythmGameClassMissionResponse;
};

type RhythmGameReceiveClassMissionStoredResponse = StoredResponse & {
	body: RhythmGameReceiveClassMissionResponse;
};

type RhythmGameReceiveClassMissionResult = {
	response: RhythmGameReceiveClassMissionStoredResponse;
	rewards: RhythmGameClassMissionReward[];
};

export function createRhythmGameClassMissionList(
	userLive: UserLiveState,
): RhythmGameClassMissionResponse[] {
	return rhythmGameClassMissionConditionTypes().map((conditionType) => ({
		condition_type: conditionType,
		progress_num: calculateRhythmGameClassMissionProgress(
			userLive.rhythmMusicScores,
			conditionType,
		),
		received_order: getUserRhythmGameClassMissionReceivedOrder(
			userLive,
			conditionType,
		),
	}));
}

export function receiveRhythmGameClassMission(
	body: unknown,
	userLive: UserLiveState,
	database: Database,
): RhythmGameReceiveClassMissionResult | undefined {
	if (!isJsonRecord(body)) {
		return undefined;
	}
	const targetConditionType = numberField(body, 'target_condition_type');
	if (!isRhythmGameClassMissionConditionType(targetConditionType)) {
		return undefined;
	}
	const progress = calculateRhythmGameClassMissionProgress(
		userLive.rhythmMusicScores,
		targetConditionType,
	);
	const receivedOrder = getUserRhythmGameClassMissionReceivedOrder(
		userLive,
		targetConditionType,
	);
	const receivableClassData = getReceivableRhythmGameClassDataFromDatabase(
		database,
		{
			conditionType: targetConditionType,
			progress,
			receivedOrder,
		},
	);
	const receivedClassDataIds = receivableClassData.map((row) => row.id);
	const nextReceivedOrder =
		receivableClassData.at(-1)?.orderId ?? receivedOrder;
	if (nextReceivedOrder !== receivedOrder) {
		setUserRhythmGameClassMissionReceivedOrder(
			userLive,
			targetConditionType,
			nextReceivedOrder,
		);
	}
	return {
		response: {
			body: {
				received_class_data_ids: receivedClassDataIds,
				class_mission_info: {
					condition_type: targetConditionType,
					progress_num: progress,
					received_order: nextReceivedOrder,
				},
			},
			statusCode: 200,
		},
		rewards: getRhythmGameClassMissionRewardsFromDatabase(
			database,
			receivedClassDataIds,
		),
	};
}
