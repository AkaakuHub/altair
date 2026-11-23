import type { GrandPrixRankingMaster } from './grand-prix-ranking-definition.ts';
import { findRhythmGameGrandPrixSeriesProgress } from './rhythm-game-grand-prix-series-progress.ts';
import { findGrandPrixStageProgress } from './user-grand-prix-state.ts';
import type { UserLiveState } from './user-live-state.ts';

type GrandPrixRankingProgressState = {
	userLives: Array<
		Pick<UserLiveState, 'playerId' | 'grandPrixes' | 'rhythmGameGrandPrixes'>
	>;
};

type GrandPrixRankingScoreSource = {
	point: number;
	contentsType: 1 | 2;
};

export function getGrandPrixRankingScoreSource(
	state: GrandPrixRankingProgressState,
	grandPrixId: number,
	playerId: string,
	master: GrandPrixRankingMaster,
): GrandPrixRankingScoreSource {
	const schoolStagePoint = calculateSchoolStageGrandPrixPoint(
		state,
		grandPrixId,
		playerId,
		master,
	);
	const rhythmGamePoint = calculateRhythmGameGrandPrixPoint(
		state,
		grandPrixId,
		playerId,
		master,
	);
	if (rhythmGamePoint > schoolStagePoint) {
		return { point: rhythmGamePoint, contentsType: 2 };
	}
	return {
		point: schoolStagePoint,
		contentsType: schoolStagePoint > 0 ? 1 : 2,
	};
}

function calculateSchoolStageGrandPrixPoint(
	state: GrandPrixRankingProgressState,
	grandPrixId: number,
	playerId: string,
	master: GrandPrixRankingMaster,
): number {
	const grandPrix = state.userLives
		.find((live) => live.playerId === playerId)
		?.grandPrixes.find((current) => current.grandPrixId === grandPrixId);
	if (grandPrix === undefined) return 0;
	return master.schoolStageSeries.reduce((total, series) => {
		const seriesPoint = series.stageIds.reduce((max, stageId) => {
			const progress = findGrandPrixStageProgress(
				grandPrix,
				stageId,
				series.stageIdentityFingerprints.get(stageId),
			);
			return Math.max(max, progress.dailyBestScore);
		}, 0);
		return total + seriesPoint;
	}, 0);
}

function calculateRhythmGameGrandPrixPoint(
	state: GrandPrixRankingProgressState,
	grandPrixId: number,
	playerId: string,
	master: GrandPrixRankingMaster,
): number {
	const grandPrix = state.userLives
		.find((live) => live.playerId === playerId)
		?.rhythmGameGrandPrixes.find(
			(current) => current.grandPrixId === grandPrixId,
		);
	if (grandPrix === undefined) return 0;
	return master.rhythmGameSeriesIds.reduce((total, seriesId) => {
		const progress = findRhythmGameGrandPrixSeriesProgress(
			grandPrix,
			seriesId,
			master.rhythmGameSeriesIdentityFingerprints.get(seriesId),
		);
		return total + progress.currentDailyPoint;
	}, 0);
}
