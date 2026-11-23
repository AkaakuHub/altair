import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import type {
	ActivityRecordAdvRow,
	ActivityRecordSeriesRow,
} from './activity-record-master-queries.ts';

export function createActivityRecordAdvIdentityFingerprint(
	adv: Pick<ActivityRecordAdvRow, 'id' | 'adv_series_id'>,
): EntityIdentityFingerprint {
	return {
		domain: 'activity-record-adv',
		value: JSON.stringify([adv.id, adv.adv_series_id]),
	};
}

export function createActivityRecordSeriesIdentityFingerprint(
	series: Pick<ActivityRecordSeriesRow, 'id'>,
	advRows: readonly Pick<ActivityRecordAdvRow, 'id' | 'adv_series_id'>[],
): EntityIdentityFingerprint {
	return {
		domain: 'activity-record-series',
		value: JSON.stringify([
			series.id,
			advRows
				.filter((adv) => adv.adv_series_id === series.id)
				.map((adv) => adv.id)
				.sort((left, right) => left - right),
		]),
	};
}
