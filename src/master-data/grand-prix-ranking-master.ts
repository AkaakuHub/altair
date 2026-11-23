import type { Database } from 'bun:sqlite';
import type { GrandPrixRankingMaster } from '../state/grand-prix-ranking-definition.ts';
import { createGrandPrixIdentityFingerprint } from './grand-prix-identity.ts';
import {
	getGrandPrixQuestSeriesRows,
	getGrandPrixQuestStageRows,
	getRhythmGameGrandPrixSeriesRows,
} from './grand-prix-master-queries.ts';
import { getGrandPrixQuestStageIdentityFingerprint } from './quest-stage-identity.ts';
import { createRhythmGameGrandPrixSeriesIdentityFingerprint } from './rhythm-game-grand-prix-series-identity.ts';

export function getGrandPrixRankingMasterFromDatabase(
	database: Database,
	grandPrixId: number,
): GrandPrixRankingMaster {
	const schoolStageSeries = getGrandPrixQuestSeriesRows(
		database,
		grandPrixId,
	).map((series) => {
		const stageIds = getGrandPrixQuestStageRows(database, series.id).map(
			(stage) => stage.id,
		);
		return {
			stageIds,
			stageIdentityFingerprints: new Map(
				stageIds.flatMap((stageId) => {
					const fingerprint = getGrandPrixQuestStageIdentityFingerprint(
						database,
						stageId,
					);
					return fingerprint === undefined
						? []
						: [[stageId, fingerprint] as const];
				}),
			),
		};
	});
	const rhythmGameSeries = getRhythmGameGrandPrixSeriesRows(
		database,
		grandPrixId,
	);
	const schoolStageFingerprints = schoolStageSeries.flatMap((series) =>
		series.stageIds.flatMap((stageId) => {
			const fingerprint = getGrandPrixQuestStageIdentityFingerprint(
				database,
				stageId,
			);
			return fingerprint === undefined ? [] : [fingerprint];
		}),
	);
	const rhythmSeriesFingerprints = rhythmGameSeries.map(
		createRhythmGameGrandPrixSeriesIdentityFingerprint,
	);
	return {
		identityFingerprint: createGrandPrixIdentityFingerprint({
			grandPrixId,
			schoolStageFingerprints,
			rhythmSeriesFingerprints,
		}),
		schoolStageSeries,
		rhythmGameSeriesIds: rhythmGameSeries.map((series) => series.id),
		rhythmGameSeriesIdentityFingerprints: new Map(
			rhythmGameSeries.map((series) => [
				series.id,
				createRhythmGameGrandPrixSeriesIdentityFingerprint(series),
			]),
		),
	};
}
