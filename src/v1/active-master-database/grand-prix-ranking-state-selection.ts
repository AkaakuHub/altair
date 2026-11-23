import type { RegisteredUserState } from '../../server-state-schema.ts';
import type { CircleState } from '../../state/circle-types.ts';
import type { UserGrandPrixState } from '../../state/user-grand-prix-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';

type GrandPrixHistoryTarget = {
	user: RegisteredUserState;
	stage: UserGrandPrixState['stageProgressList'][number];
};

export function isCircleGrandPrixRankingType(rankingType: number): boolean {
	return [1, 3, 30, 31].includes(rankingType);
}

export function collectGrandPrixHistoryTargets(
	grandPrix: UserGrandPrixState,
	user: RegisteredUserState,
	circle: CircleState | null,
	registeredUsers: RegisteredUserState[],
	userLives: UserLiveState[],
): GrandPrixHistoryTarget[] {
	const memberIds = circle?.members.map((member) => member.playerId) ?? [
		user.playerId,
	];
	return memberIds.flatMap((playerId) => {
		const targetUser =
			registeredUsers.find(
				(registeredUser) => registeredUser.playerId === playerId,
			) ?? (playerId === user.playerId ? user : null);
		const targetGrandPrix = userLives
			.find((live) => live.playerId === playerId)
			?.grandPrixes.find(
				(current) => current.grandPrixId === grandPrix.grandPrixId,
			);
		if (!targetUser || !targetGrandPrix) return [];
		return targetGrandPrix.stageProgressList.map((stage) => ({
			user: targetUser,
			stage,
		}));
	});
}

export function findGrandPrixStagePlayReport(
	user: RegisteredUserState,
	userLives: UserLiveState[],
): string {
	return (
		userLives.find((live) => live.playerId === user.playerId)?.currentQuestLive
			?.playReport ?? '{}'
	);
}
