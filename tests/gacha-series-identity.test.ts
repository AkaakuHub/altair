import { describe, expect, test } from 'bun:test';
import { createGachaSeriesIdentityFingerprint } from '../src/master-data/gacha-series-identity.ts';

const series = {
	id: 1001,
	gacha_type: 1,
	limited_gacha_reset_type: 0,
	gacha_exchange_point_id: 11,
	exchange_point_lock_flag: 0,
	filter_type: 1,
	pick_up_card_series_id_1: 101,
	pick_up_card_series_id_2: 102,
	pick_up_card_series_id_3: 0,
	pick_up_card_series_id_4: 0,
	pick_up_card_series_id_5: 0,
	pick_up_card_series_id_6: 0,
	gacha_time_limit_type: 0,
	is_gacha_prize: 0,
};

describe('gacha series identity', () => {
	test('is stable for the same structural master columns', () => {
		expect(createGachaSeriesIdentityFingerprint({ ...series })).toEqual(
			createGachaSeriesIdentityFingerprint(series),
		);
	});

	test('changes when exchange or pickup structure changes', () => {
		const identity = createGachaSeriesIdentityFingerprint(series);

		expect(
			createGachaSeriesIdentityFingerprint({
				...series,
				gacha_exchange_point_id: 12,
			}),
		).not.toEqual(identity);
		expect(
			createGachaSeriesIdentityFingerprint({
				...series,
				pick_up_card_series_id_1: 103,
			}),
		).not.toEqual(identity);
	});
});
