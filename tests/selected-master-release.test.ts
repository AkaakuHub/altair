import { describe, expect, test } from 'bun:test';
import { parseSelectedMasterRelease } from '../src/master-data/selected-master-release.ts';

const hash = (character: string) => character.repeat(64);

describe('selected master release', () => {
	test('requires one explicit Android and iOS release pair', () => {
		expect(
			parseSelectedMasterRelease({
				schemaVersion: 1,
				releaseId: hash('a'),
				databaseFingerprint: hash('b'),
				androidResourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
				iosResourceVersion: 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
			}),
		).toEqual({
			schemaVersion: 1,
			releaseId: hash('a'),
			databaseFingerprint: hash('b'),
			androidResourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
			iosResourceVersion: 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
		});
	});

	test('rejects an incomplete selection', () => {
		expect(() =>
			parseSelectedMasterRelease({
				schemaVersion: 1,
				releaseId: hash('a'),
				databaseFingerprint: hash('b'),
				androidResourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
			}),
		).toThrow();
	});

	test('rejects unknown fields', () => {
		expect(() =>
			parseSelectedMasterRelease({
				schemaVersion: 1,
				releaseId: hash('a'),
				databaseFingerprint: hash('b'),
				androidResourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
				iosResourceVersion: 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
				unsupportedField: 'unsupported',
			}),
		).toThrow();
	});
});
