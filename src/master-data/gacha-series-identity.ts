import type { Database } from 'bun:sqlite';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from '../state/entity-provenance.ts';

type GachaSeriesIdentityRow = Readonly<{
	id: number;
	gacha_type: number;
	limited_gacha_reset_type: number;
	gacha_exchange_point_id: number;
	exchange_point_lock_flag: number;
	filter_type: number;
	pick_up_card_series_id_1: number;
	pick_up_card_series_id_2: number;
	pick_up_card_series_id_3: number;
	pick_up_card_series_id_4: number;
	pick_up_card_series_id_5: number;
	pick_up_card_series_id_6: number;
	gacha_time_limit_type: number;
	is_gacha_prize: number;
}>;

export function createGachaSeriesIdentityFingerprint(
	row: GachaSeriesIdentityRow,
): EntityIdentityFingerprint {
	return {
		domain: 'gacha-series',
		value: JSON.stringify([
			row.id,
			row.gacha_type,
			row.limited_gacha_reset_type,
			row.gacha_exchange_point_id,
			row.exchange_point_lock_flag,
			row.filter_type,
			row.pick_up_card_series_id_1,
			row.pick_up_card_series_id_2,
			row.pick_up_card_series_id_3,
			row.pick_up_card_series_id_4,
			row.pick_up_card_series_id_5,
			row.pick_up_card_series_id_6,
			row.gacha_time_limit_type,
			row.is_gacha_prize,
		]),
	};
}

export function getGachaSeriesProvenance(
	database: Database,
	sourceMasterReleaseId: string,
	gachaSeriesId: number,
): EntityProvenance | undefined {
	const identityFingerprint = getGachaSeriesIdentityFingerprint(
		database,
		gachaSeriesId,
	);
	return identityFingerprint === undefined
		? undefined
		: { sourceMasterReleaseId, identityFingerprint };
}

function getGachaSeriesIdentityFingerprint(
	database: Database,
	gachaSeriesId: number,
): EntityIdentityFingerprint | undefined {
	const row = database
		.query<GachaSeriesIdentityRow, [number]>(
			[
				'SELECT id, gacha_type, limited_gacha_reset_type,',
				'gacha_exchange_point_id, exchange_point_lock_flag, filter_type,',
				'pick_up_card_series_id_1, pick_up_card_series_id_2,',
				'pick_up_card_series_id_3, pick_up_card_series_id_4,',
				'pick_up_card_series_id_5, pick_up_card_series_id_6,',
				'gacha_time_limit_type, is_gacha_prize',
				'FROM master_gacha_series WHERE id = ?',
			].join(' '),
		)
		.get(gachaSeriesId);
	return row === null ? undefined : createGachaSeriesIdentityFingerprint(row);
}
