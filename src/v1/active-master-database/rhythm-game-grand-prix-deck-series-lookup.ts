import type { Database } from 'bun:sqlite';
import type { EntityIdentityFingerprint } from '../../state/entity-provenance.ts';
import {
	findGrandPrixIdByRhythmGameSeriesId,
	getRhythmGameGrandPrixSeriesIdentityFingerprint,
} from './rhythm-game-grand-prix-series-master.ts';

export function findRhythmGameGrandPrixDeckSeries(
	database: Database,
	seriesId: number,
):
	| { grandPrixId: number; identityFingerprint: EntityIdentityFingerprint }
	| undefined {
	const grandPrixId = findGrandPrixIdByRhythmGameSeriesId(database, seriesId);
	const identityFingerprint = getRhythmGameGrandPrixSeriesIdentityFingerprint(
		database,
		seriesId,
	);
	return grandPrixId === undefined || identityFingerprint === undefined
		? undefined
		: { grandPrixId, identityFingerprint };
}
