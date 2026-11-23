import type { Database } from 'bun:sqlite';
import { getGradeQuestRewardData } from '../../master-data/grade-quest-rewards.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { isRecord } from '../../state/json-state-utils.ts';
import {
	applyUserReward,
	canApplyUserRewards,
} from '../../state/reward-state.ts';
import { createRewardMasterData } from './reward-master-data.ts';
import type { StateRouteContext } from './state-route-context.ts';

type GradeQuestGoalClearDataRequest = {
	clear_grade_quest_rewards_id_list: number[];
};

type GradeQuestRewardRequest = {
	goal_clear_data: GradeQuestGoalClearDataRequest;
};

export function applyGradeQuestRewards(
	c: Context,
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	body: unknown,
	masterDatabase: Database,
	masterReleaseId: string,
): void {
	const request = readGradeQuestRewardRequest(body);
	if (!request) {
		return;
	}
	const rewardData = getGradeQuestRewardData(
		masterDatabase,
		request.goal_clear_data.clear_grade_quest_rewards_id_list,
	);
	const rewardMasterData = createRewardMasterData(
		{ database: masterDatabase, masterReleaseId },
		routeContext,
	);
	if (
		!canApplyUserRewards(routeContext.state, user, rewardData, rewardMasterData)
	) {
		throw new Error('grade quest rewards are incompatible');
	}
	for (const reward of rewardData) {
		applyUserReward(
			routeContext.state,
			user,
			reward,
			rewardMasterData,
			routeContext.resolveUserStatus(c, user),
			'grade quest',
		);
	}
}

function readGradeQuestRewardRequest(
	body: unknown,
): GradeQuestRewardRequest | undefined {
	if (!isRecord(body) || !isRecord(body.goal_clear_data)) {
		return undefined;
	}
	const rewardIds = body.goal_clear_data.clear_grade_quest_rewards_id_list;
	if (
		!Array.isArray(rewardIds) ||
		!rewardIds.every(
			(rewardId) =>
				typeof rewardId === 'number' && Number.isSafeInteger(rewardId),
		)
	) {
		return undefined;
	}
	return {
		goal_clear_data: {
			clear_grade_quest_rewards_id_list: rewardIds,
		},
	};
}

import type { Context } from 'hono';
