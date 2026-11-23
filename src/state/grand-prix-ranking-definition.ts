import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isRecord } from './json-state-utils.ts';

export type GrandPrixPersonalRankingState = {
	playerId: string;
	rank: number;
	point: number;
};

type GrandPrixCircleMemberRankingState = {
	playerId: string;
	rank: number;
	point: number;
};

export type GrandPrixCircleRankingState = {
	searchGuildKey: string;
	rank: number;
	point: number;
	memberRankings: GrandPrixCircleMemberRankingState[];
};

export type GrandPrixRankingState = {
	grandPrixId: number;
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	personalRankings: GrandPrixPersonalRankingState[];
	circleRankings: GrandPrixCircleRankingState[];
};

export type GrandPrixRankingMaster = {
	identityFingerprint: EntityIdentityFingerprint;
	schoolStageSeries: ReadonlyArray<{
		stageIds: readonly number[];
		stageIdentityFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
	}>;
	rhythmGameSeriesIds: readonly number[];
	rhythmGameSeriesIdentityFingerprints: ReadonlyMap<
		number,
		EntityIdentityFingerprint
	>;
};

export function isGrandPrixRankingState(
	value: unknown,
): value is GrandPrixRankingState {
	return (
		isRecord(value) &&
		typeof value.grandPrixId === 'number' &&
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string')) &&
		Array.isArray(value.personalRankings) &&
		value.personalRankings.every(isGrandPrixPersonalRankingState) &&
		Array.isArray(value.circleRankings) &&
		value.circleRankings.every(isGrandPrixCircleRankingState)
	);
}

function isGrandPrixPersonalRankingState(
	value: unknown,
): value is GrandPrixPersonalRankingState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		typeof value.rank === 'number' &&
		typeof value.point === 'number'
	);
}

function isGrandPrixCircleRankingState(
	value: unknown,
): value is GrandPrixCircleRankingState {
	return (
		isRecord(value) &&
		typeof value.searchGuildKey === 'string' &&
		typeof value.rank === 'number' &&
		typeof value.point === 'number' &&
		Array.isArray(value.memberRankings) &&
		value.memberRankings.every(isGrandPrixCircleMemberRankingState)
	);
}

function isGrandPrixCircleMemberRankingState(
	value: unknown,
): value is GrandPrixCircleMemberRankingState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		typeof value.rank === 'number' &&
		typeof value.point === 'number'
	);
}
