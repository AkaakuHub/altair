import type { Database } from 'bun:sqlite';
import type { RhythmGameGrandPrixSeriesRow } from '../../master-data/grand-prix-master-queries.ts';
import { createRhythmGameGrandPrixSeriesIdentityFingerprint } from '../../master-data/rhythm-game-grand-prix-series-identity.ts';
import type { EntityIdentityFingerprint } from '../../state/entity-provenance.ts';

export function getRhythmGameGrandPrixSeriesIdentityFingerprint(
	database: Database,
	seriesId: number,
): EntityIdentityFingerprint | undefined {
	const row = findRhythmGameGrandPrixSeriesRow(database, seriesId);
	return row === undefined
		? undefined
		: createRhythmGameGrandPrixSeriesIdentityFingerprint(row);
}

export function findGrandPrixIdByRhythmGameSeriesId(
	database: Database,
	grandPrixRhythmGameSeriesId: number,
): number | undefined {
	return findRhythmGameGrandPrixSeriesRow(database, grandPrixRhythmGameSeriesId)
		?.grand_prixes_id;
}

function findRhythmGameGrandPrixSeriesRow(
	database: Database,
	grandPrixRhythmGameSeriesId: number,
): RhythmGameGrandPrixSeriesRow | undefined {
	const row = database
		.query<RhythmGameGrandPrixSeriesRow, [number]>(
			[
				'SELECT id, grand_prixes_id, order_id, quest_musics_type, quest_musics_detail',
				'FROM master_grand_prix_rhythm_game_series',
				'WHERE id = ?',
			].join(' '),
		)
		.get(grandPrixRhythmGameSeriesId);
	return row ?? undefined;
}
