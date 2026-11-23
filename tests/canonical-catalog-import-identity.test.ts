import { describe, expect, test } from 'bun:test';
import {
	canonicalCatalogRelativePath,
	parseCatalogSourceFilename,
} from '../src/canonical-catalog-import/domain/catalog-import-identity.ts';

const resourceVersion = 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==';
const encodedResourceVersion =
	Buffer.from(resourceVersion).toString('base64url');

describe('canonical catalog identity', () => {
	test('platformごとのsource filenameを同じidentityへparseする', () => {
		expect(
			parseCatalogSourceFilename(
				'android',
				`5.1.0__${encodedResourceVersion}__cache__catalog.json.gz`,
			),
		).toEqual({
			platform: 'android',
			clientVersion: '5.1.0',
			resourceVersion,
		});
		expect(
			parseCatalogSourceFilename(
				'ios',
				`5.1.0__${encodedResourceVersion}.sqlite3`,
			),
		).toEqual({
			platform: 'ios',
			clientVersion: '5.1.0',
			resourceVersion,
		});
	});

	test('canonicalでないbase64urlと不完全resourceVersionを拒否する', () => {
		expect(() =>
			parseCatalogSourceFilename(
				'android',
				'5.1.0__UjI2MDYwMDI__cache__catalog.json.gz',
			),
		).toThrow();
		expect(() =>
			parseCatalogSourceFilename(
				'ios',
				`5.1__${encodedResourceVersion}.sqlite3`,
			),
		).toThrow();
	});

	test('platform別canonical relative pathを決定する', () => {
		const android = {
			platform: 'android' as const,
			clientVersion: '5.1.0',
			resourceVersion,
		};
		const ios = { ...android, platform: 'ios' as const };
		expect(canonicalCatalogRelativePath(android)).toBe(
			`android/5.1.0__${encodedResourceVersion}/cache/catalog.json.gz`,
		);
		expect(canonicalCatalogRelativePath(ios)).toBe(
			`ios/5.1.0__${encodedResourceVersion}.sqlite3`,
		);
	});
});
