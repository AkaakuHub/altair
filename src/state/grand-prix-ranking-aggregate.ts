import type { ServerState } from '../server-state-schema.ts';
import type { CircleState } from './circle-types.ts';
import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';
import type {
	GrandPrixCircleRankingState,
	GrandPrixPersonalRankingState,
	GrandPrixRankingMaster,
	GrandPrixRankingState,
} from './grand-prix-ranking-definition.ts';
import { getGrandPrixRankingScoreSource } from './grand-prix-ranking-score.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';

type RankingInput = {
	id: string;
	point: number;
};

export function ensureGrandPrixRankingState(
	state: Pick<ServerState, 'grandPrixRankings'>,
	grandPrixId: number,
	identityFingerprint?: EntityIdentityFingerprint,
	sourceMasterReleaseId?: string,
): GrandPrixRankingState {
	const existing = findGrandPrixRankingState(
		state,
		grandPrixId,
		identityFingerprint,
	);
	if (existing !== undefined) return existing;
	const ranking = {
		grandPrixId,
		...(sourceMasterReleaseId === undefined ? {} : { sourceMasterReleaseId }),
		...(identityFingerprint === undefined ? {} : { identityFingerprint }),
		personalRankings: [],
		circleRankings: [],
	};
	state.grandPrixRankings = [...state.grandPrixRankings, ranking];
	return ranking;
}

export function findGrandPrixRankingState(
	state: Pick<ServerState, 'grandPrixRankings'>,
	grandPrixId: number,
	identityFingerprint?: EntityIdentityFingerprint,
): GrandPrixRankingState | undefined {
	if (identityFingerprint !== undefined) {
		return findCompatibleMasterBoundProgress(
			state.grandPrixRankings,
			(ranking) => ranking.grandPrixId === grandPrixId,
			identityFingerprint,
		);
	}
	return state.grandPrixRankings.find(
		(ranking) => ranking.grandPrixId === grandPrixId,
	);
}

export function updateGrandPrixRankingsFromProgress(
	state: Pick<
		ServerState,
		'circle' | 'grandPrixRankings' | 'registeredUsers' | 'userLives'
	>,
	grandPrixId: number,
	master: GrandPrixRankingMaster,
	sourceMasterReleaseId?: string,
): GrandPrixRankingState {
	const current = ensureGrandPrixRankingState(
		state,
		grandPrixId,
		master.identityFingerprint,
		sourceMasterReleaseId,
	);
	const rankingState =
		current.identityFingerprint === undefined
			? {
					...current,
					...(sourceMasterReleaseId === undefined
						? {}
						: { sourceMasterReleaseId }),
					identityFingerprint: master.identityFingerprint,
				}
			: current;
	if (rankingState !== current) {
		state.grandPrixRankings = [
			...state.grandPrixRankings.filter(
				(ranking) =>
					!(
						ranking.grandPrixId === grandPrixId &&
						isSameEntityIdentity(
							ranking.identityFingerprint,
							master.identityFingerprint,
						)
					),
			),
			rankingState,
		];
	}
	rankingState.personalRankings = assignGrandPrixRanks(
		state.registeredUsers
			.map((user) => ({
				id: user.playerId,
				point: getGrandPrixRankingScoreSource(
					state,
					grandPrixId,
					user.playerId,
					master,
				).point,
			}))
			.filter((ranking) => ranking.point > 0),
	).map((ranking) => ({
		playerId: ranking.id,
		rank: ranking.rank,
		point: ranking.point,
	}));
	rankingState.circleRankings =
		state.circle === null
			? []
			: [createCircleRanking(state, grandPrixId, state.circle, master)].filter(
					(ranking): ranking is GrandPrixCircleRankingState =>
						ranking !== undefined,
				);
	return rankingState;
}

export function getGrandPrixPersonalRanking(
	ranking: GrandPrixRankingState | undefined,
	playerId: string,
): GrandPrixPersonalRankingState | undefined {
	return ranking?.personalRankings.find(
		(personalRanking) => personalRanking.playerId === playerId,
	);
}

export function getGrandPrixCircleRanking(
	ranking: GrandPrixRankingState | undefined,
	circle: CircleState | null,
): GrandPrixCircleRankingState | undefined {
	if (circle === null) return undefined;
	return ranking?.circleRankings.find(
		(circleRanking) => circleRanking.searchGuildKey === circle.searchGuildKey,
	);
}

export function assignGrandPrixRanks<T extends RankingInput>(
	rankings: readonly T[],
): Array<T & { rank: number }> {
	const sorted = [...rankings].sort(
		(left, right) =>
			right.point - left.point || left.id.localeCompare(right.id),
	);
	let previousPoint: number | undefined;
	let previousRank = 0;
	return sorted.map((ranking, index) => {
		const rank =
			ranking.point === previousPoint && previousRank > 0
				? previousRank
				: index + 1;
		previousPoint = ranking.point;
		previousRank = rank;
		return { ...ranking, rank };
	});
}

function createCircleRanking(
	state: Pick<ServerState, 'userLives'>,
	grandPrixId: number,
	circle: CircleState,
	master: GrandPrixRankingMaster,
): GrandPrixCircleRankingState | undefined {
	const memberRankings = assignGrandPrixRanks(
		circle.members
			.map((member) => ({
				id: member.playerId,
				point: getGrandPrixRankingScoreSource(
					state,
					grandPrixId,
					member.playerId,
					master,
				).point,
			}))
			.filter((ranking) => ranking.point > 0),
	).map((ranking) => ({
		playerId: ranking.id,
		rank: ranking.rank,
		point: ranking.point,
	}));
	const point = memberRankings.reduce(
		(total, ranking) => total + ranking.point,
		0,
	);
	return point <= 0
		? undefined
		: { searchGuildKey: circle.searchGuildKey, rank: 1, point, memberRankings };
}
