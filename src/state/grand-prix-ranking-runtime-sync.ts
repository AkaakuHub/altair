import type { ServerState } from '../server-state-schema.ts';
import { ensureGrandPrixRankingState } from './grand-prix-ranking-aggregate.ts';
import type { GrandPrixRankingState } from './grand-prix-ranking-definition.ts';

type GrandPrixRuntimeRankingSyncOptions = {
	syncCircle: boolean;
	syncPersonal: boolean;
};

export function syncGrandPrixRankingFromRuntime(
	state: Pick<
		ServerState,
		| 'circle'
		| 'grandPrix'
		| 'grandPrixRankings'
		| 'registeredUsers'
		| 'selectedAdminPlayerId'
	>,
	options: GrandPrixRuntimeRankingSyncOptions,
): void {
	const rankingState = ensureGrandPrixRankingState(
		state,
		state.grandPrix.activeGrandPrixId,
	);
	if (options.syncPersonal) {
		syncPersonalRankingFromRuntime(state, rankingState);
	}
	if (options.syncCircle && state.circle !== null) {
		const existingMembers =
			rankingState.circleRankings.find(
				(ranking) => ranking.searchGuildKey === state.circle?.searchGuildKey,
			)?.memberRankings ?? [];
		rankingState.circleRankings = [
			...rankingState.circleRankings.filter(
				(ranking) => ranking.searchGuildKey !== state.circle?.searchGuildKey,
			),
			{
				searchGuildKey: state.circle.searchGuildKey,
				rank: state.grandPrix.guildRanking,
				point: state.grandPrix.guildTotalPoint,
				memberRankings: existingMembers,
			},
		];
	}
}

function syncPersonalRankingFromRuntime(
	state: Pick<
		ServerState,
		'grandPrix' | 'registeredUsers' | 'selectedAdminPlayerId'
	>,
	rankingState: GrandPrixRankingState,
): void {
	const playerId = selectRuntimePersonalRankingPlayerId(state);
	if (playerId === undefined) return;
	rankingState.personalRankings = [
		...rankingState.personalRankings.filter(
			(ranking) => ranking.playerId !== playerId,
		),
		{
			playerId,
			rank: state.grandPrix.personalRanking,
			point: state.grandPrix.personalTotalPoint,
		},
	].filter((ranking) => ranking.rank > 0 || ranking.point > 0);
}

function selectRuntimePersonalRankingPlayerId(
	state: Pick<ServerState, 'registeredUsers' | 'selectedAdminPlayerId'>,
): string | undefined {
	if (
		state.selectedAdminPlayerId !== null &&
		state.registeredUsers.some(
			(user) => user.playerId === state.selectedAdminPlayerId,
		)
	) {
		return state.selectedAdminPlayerId;
	}
	return state.registeredUsers.length === 1
		? state.registeredUsers[0]?.playerId
		: undefined;
}
