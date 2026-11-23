import { describe, expect, test } from 'bun:test';
import { createArchiveIdentityFingerprint } from '../src/master-data/archive-identity.ts';

const structuralRow = {
	archives_id: 'archive-1',
	content_code: 100,
	characters: '[{"character_id":1021},{"character_id":1031}]',
	costume_ids: '[20,10]',
	live_location_id: 3,
	selectable_camera_types: '[2,1]',
	timeline_ids: '[200,100]',
	has_extra: 1,
	is_horizontal: 0,
	live_type: 2,
};

describe('archive identity', () => {
	test('表示文言・期間・order・balanceと配列順序をidentityから除外する', () => {
		const reordered = {
			...structuralRow,
			characters: '[{"character_id":1031},{"character_id":1021}]',
			costume_ids: '[10,20]',
			selectable_camera_types: '[1,2]',
			timeline_ids: '[100,200]',
			title: 'changed title',
			live_start_time: '2099-01-01T00:00:00Z',
			row_index: 99,
			gift_stars_threshold_for_extra_admission: 999,
		};
		expect(createArchiveIdentityFingerprint('withlive', reordered)).toEqual(
			createArchiveIdentityFingerprint('withlive', structuralRow),
		);
	});

	test('content構造とarchive種別を区別する', () => {
		expect(
			createArchiveIdentityFingerprint('withlive', {
				...structuralRow,
				content_code: 200,
			}),
		).not.toEqual(createArchiveIdentityFingerprint('withlive', structuralRow));
		expect(createArchiveIdentityFingerprint('fes', structuralRow)).not.toEqual(
			createArchiveIdentityFingerprint('withlive', structuralRow),
		);
	});

	test('保存済みnullを空配列と区別し、空文字を受理しない', () => {
		const withNull = createArchiveIdentityFingerprint('withlive', {
			...structuralRow,
			characters: null,
		});
		const withEmptyList = createArchiveIdentityFingerprint('withlive', {
			...structuralRow,
			characters: '[]',
		});

		expect(withNull).not.toEqual(withEmptyList);
		expect(() =>
			createArchiveIdentityFingerprint('withlive', {
				...structuralRow,
				characters: '',
			}),
		).toThrow();
	});
});
