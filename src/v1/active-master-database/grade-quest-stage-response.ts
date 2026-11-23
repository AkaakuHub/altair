import type { Database } from 'bun:sqlite';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { getGradeQuestStageMusicList } from './grade-quest-master.ts';
import { projectGradeQuest } from './grade-quest-projection.ts';
import { numberField } from './json-utils.ts';

export function getGradeStageData(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
) {
	const gradeQuest = projectGradeQuest(database, userLive.currentGradeQuest);
	if (gradeQuest === undefined) {
		return undefined;
	}
	const squareId = numberField(body, 'grade_quest_square_id');
	const square = gradeQuest.squares.find(
		(value) => value.squareId === squareId,
	);
	return {
		body: {
			live_point: square?.livePoint ?? 0,
			music_list: square
				? getGradeQuestStageMusicList(database, square.targetId)
				: [],
		},
		statusCode: 200,
	};
}
