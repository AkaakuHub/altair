import { describe, expect, test } from 'bun:test';
import {
	type PlatformManifest,
	parsePlatformManifest,
	platformManifestIdentity,
} from '../src/master-archive/domain/platform-manifest.ts';

const hash = (character: string) => character.repeat(64);

function manifest(platform: 'android' | 'ios'): PlatformManifest {
	return {
		schemaVersion: 1,
		platform,
		clientVersion: '5.1.0',
		resourceVersion:
			platform === 'android'
				? 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ=='
				: 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
		catalog: {
			identitySha256: hash('a'),
			sourceSha256: hash('b'),
		},
		tables: [
			{
				label: 'CardDatas',
				catalogResourceIdentity: 'card-resource',
				encryptedResourceSha256: hash('c'),
				blobSha256: hash('d'),
				schemaFingerprint: hash('e'),
				rowCount: 10,
				status: 'verified',
			},
			{
				label: 'MusicDatas',
				catalogResourceIdentity: 'music-resource',
				encryptedResourceSha256: hash('f'),
				blobSha256: hash('1'),
				schemaFingerprint: hash('2'),
				rowCount: 4,
				status: 'verified',
			},
		],
	};
}

describe('platform master manifest', () => {
	test('AndroidとiOSを独立したmanifestとしてparseする', () => {
		const android = manifest('android');
		const ios = manifest('ios');

		expect(parsePlatformManifest(android)).toEqual(android);
		expect(parsePlatformManifest(ios)).toEqual(ios);
		expect(platformManifestIdentity(android)).not.toBe(
			platformManifestIdentity(ios),
		);
	});

	test('table順に依存しないidentityを計算する', () => {
		const source = manifest('android');
		const reordered = { ...source, tables: [...source.tables].reverse() };

		expect(platformManifestIdentity(source)).toBe(
			platformManifestIdentity(reordered),
		);
	});

	test('完全resource versionでないmanifestを拒否する', () => {
		expect(() =>
			parsePlatformManifest({
				...manifest('android'),
				resourceVersion: 'R2606002',
			}),
		).toThrow();
		expect(() =>
			parsePlatformManifest({
				...manifest('android'),
				resourceVersion: 'R2606002@android-token',
			}),
		).toThrow();
		expect(() =>
			parsePlatformManifest({
				...manifest('android'),
				resourceVersion: 'R2606002@YW5kcm9pZA==',
			}),
		).toThrow();
	});

	test('pathとYAML identityをschema外fieldとして拒否する', () => {
		expect(() =>
			parsePlatformManifest({
				...manifest('android'),
				path: '/saved/master.bin',
			}),
		).toThrow();
		expect(() =>
			parsePlatformManifest({
				...manifest('android'),
				yamlSha256: hash('3'),
			}),
		).toThrow();
	});

	test('重複table labelを拒否する', () => {
		const source = manifest('android');
		const firstTable = source.tables[0];
		if (firstTable === undefined) {
			throw new Error('test manifest table is missing');
		}

		expect(() =>
			parsePlatformManifest({
				...source,
				tables: [...source.tables, { ...firstTable }],
			}),
		).toThrow('duplicate master table label');
	});
});
