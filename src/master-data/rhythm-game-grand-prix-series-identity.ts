import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';

type RhythmGameGrandPrixSeriesIdentitySource = {
	id: number;
	grand_prixes_id: number;
	order_id: number;
	quest_musics_type: number;
	quest_musics_detail: number;
};

export function createRhythmGameGrandPrixSeriesIdentityFingerprint(
	row: RhythmGameGrandPrixSeriesIdentitySource,
): EntityIdentityFingerprint {
	return {
		domain: 'rhythm-game-grand-prix-series',
		value: JSON.stringify([
			row.id,
			row.grand_prixes_id,
			row.quest_musics_type,
			row.quest_musics_detail,
		]),
	};
}
