import { describe, expect, test } from 'bun:test';
import {
	createActivityRecordAdvIdentityFingerprint,
	createActivityRecordSeriesIdentityFingerprint,
} from '../src/master-data/activity-record-identity.ts';

describe('activity record identity', () => {
	test('表示文言・期間・order・balance変更をidentityに含めない', () => {
		const before = createActivityRecordAdvIdentityFingerprint({
			id: 101,
			adv_series_id: 10,
		});
		const after = createActivityRecordAdvIdentityFingerprint({
			id: 101,
			adv_series_id: 10,
		});

		expect(after).toEqual(before);
	});

	test('ADVの所属seriesとseries内のADV構造をidentityとして区別する', () => {
		expect(
			createActivityRecordAdvIdentityFingerprint({
				id: 101,
				adv_series_id: 20,
			}),
		).not.toEqual(
			createActivityRecordAdvIdentityFingerprint({
				id: 101,
				adv_series_id: 10,
			}),
		);
		expect(
			createActivityRecordSeriesIdentityFingerprint({ id: 10 }, [
				{ id: 102, adv_series_id: 10 },
			]),
		).not.toEqual(
			createActivityRecordSeriesIdentityFingerprint({ id: 10 }, [
				{ id: 101, adv_series_id: 10 },
			]),
		);
	});
});
