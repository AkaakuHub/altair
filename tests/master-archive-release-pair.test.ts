import { describe, expect, test } from 'bun:test';
import type { PlatformManifest } from '../src/master-archive/domain/platform-manifest.ts';
import { createMasterReleasePair } from '../src/master-archive/domain/release-pair.ts';

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
			identitySha256: platform === 'android' ? hash('a') : hash('b'),
			sourceSha256: platform === 'android' ? hash('c') : hash('d'),
		},
		tables: [
			{
				label: 'CardDatas',
				catalogResourceIdentity: `${platform}-card-resource`,
				encryptedResourceSha256: platform === 'android' ? hash('e') : hash('f'),
				blobSha256: platform === 'android' ? hash('1') : hash('2'),
				schemaFingerprint: hash('3'),
				rowCount: 10,
				status: 'verified',
			},
		],
	};
}

describe('AndroidとiOSのmaster release pair', () => {
	test('両platformを独立manifestのまま組み合わせる', () => {
		const android = manifest('android');
		const ios = manifest('ios');
		const pair = createMasterReleasePair([android, ios]);

		expect(pair.android).toEqual(android);
		expect(pair.ios).toEqual(ios);
		expect(pair.android.tables[0]?.blobSha256).not.toBe(
			pair.ios.tables[0]?.blobSha256,
		);
		expect(createMasterReleasePair([ios, android]).releaseId).toBe(
			pair.releaseId,
		);
	});

	test('片platformだけでは成立しない', () => {
		expect(() => createMasterReleasePair([manifest('android')])).toThrow(
			'exactly Android and iOS',
		);
		expect(() =>
			createMasterReleasePair([manifest('android'), manifest('android')]),
		).toThrow('one Android and one iOS');
	});

	test('片方が公式完全resource versionでなければ成立しない', () => {
		const ios = manifest('ios');
		expect(() =>
			createMasterReleasePair([
				manifest('android'),
				{ ...ios, resourceVersion: 'R2606002@aW9z' },
			]),
		).toThrow();
	});

	test('client versionまたはresource revisionが異なる組合せを拒否する', () => {
		const ios = manifest('ios');
		expect(() =>
			createMasterReleasePair([
				manifest('android'),
				{ ...ios, clientVersion: '5.0.0' },
			]),
		).toThrow('client versions differ');
		expect(() =>
			createMasterReleasePair([
				manifest('android'),
				{ ...ios, resourceVersion: 'R2604100@1CdW1tAe1gjHzZQAnTe+NoDSYA==' },
			]),
		).toThrow('resource revisions differ');
	});
});
