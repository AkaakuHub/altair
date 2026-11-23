import type { RegisteredUserState } from '../server-state-schema.ts';
import {
	calculateRhythmGameClassMissionProgress,
	type RhythmGameClassMissionConditionType,
	rhythmGameClassMissionConditionTypes,
} from './rhythm-game-class-mission.ts';
import type { UserLiveState } from './user-live-state.ts';
import { getUserRhythmGameClassMissionReceivedOrder } from './user-rhythm-class-mission-order.ts';

type RhythmGameClassMissionNotificationState = {
	userLives: Array<
		Pick<
			UserLiveState,
			'playerId' | 'rhythmMusicScores' | 'rhythmGameClassMissionReceivedOrders'
		>
	>;
};

type RhythmGameClassMissionNotificationMaster = {
	getReceivableIds: (input: {
		conditionType: RhythmGameClassMissionConditionType;
		progress: number;
		receivedOrder: number;
	}) => readonly number[];
	projectScores: (
		scores: UserLiveState['rhythmMusicScores'],
	) => UserLiveState['rhythmMusicScores'];
};

export function getAchievedMissionNotificationList(
	state: RhythmGameClassMissionNotificationState,
	user: Pick<RegisteredUserState, 'playerId'> | undefined,
	master: RhythmGameClassMissionNotificationMaster,
): number[] {
	if (user === undefined) {
		return [];
	}
	const userLive = state.userLives.find(
		(live) => live.playerId === user.playerId,
	);
	if (userLive === undefined) {
		throw new Error(`Missing user live state: ${user.playerId}`);
	}
	const visibleScores = master.projectScores(userLive.rhythmMusicScores);
	return rhythmGameClassMissionConditionTypes().flatMap((conditionType) =>
		master.getReceivableIds({
			conditionType,
			progress: calculateRhythmGameClassMissionProgress(
				visibleScores,
				conditionType,
			),
			receivedOrder: getUserRhythmGameClassMissionReceivedOrder(
				userLive,
				conditionType,
			),
		}),
	);
}
