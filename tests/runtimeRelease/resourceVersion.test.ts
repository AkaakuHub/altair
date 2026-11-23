import { expect, test } from 'bun:test';
import { completeResourceVersionSchema } from '../../src/master-archive/domain/resource-version.ts';
import { parseSelectedMasterRelease } from '../../src/master-data/selected-master-release.ts';
import { serializeResourceVersion } from '../../src/resources/domain/assets/resourceVersion.ts';

const official = [
	'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
	'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
] as const;
const laterVersions = [
	'R2607016@ZeFlMiBMb0ob5c8TKh4+POCrmgY=',
	'R2607016@epThWT2AjexExysPRoNTMdCqmgY=',
] as const;

test('公式と実生成した非公式カタログの完全resource versionを同じ形式で検証する', () => {
	for (const value of [...official, ...laterVersions])
		expect(completeResourceVersionSchema.parse(value)).toBe(value);
	expect(
		parseSelectedMasterRelease({
			schemaVersion: 1,
			releaseId: 'a'.repeat(64),
			databaseFingerprint: 'b'.repeat(64),
			androidResourceVersion: laterVersions[0],
			iosResourceVersion: laterVersions[1],
		}).androidResourceVersion,
	).toBe(laterVersions[0]);
});

test('カタログサイズの可変長整数の境界を共通encoderと同じ契約で受理する', () => {
	for (const size of [127, 128, 16383, 16384, 2097151, 2097152, 13014496]) {
		const value = serializeResourceVersion({
			revision: 'R2607016',
			checksum: 1n,
			seed: 2n,
			size,
		});
		expect(completeResourceVersionSchema.parse(value)).toBe(value);
	}
});

test('省略した識別子・不正なbase64・非正規の可変長整数を拒否する', () => {
	const metadata = Buffer.alloc(18);
	metadata[16] = 0x80;
	metadata[17] = 0;
	for (const value of [
		'R2607016',
		'R2607016@AAAA',
		'R2607016@not-base64',
		`${laterVersions[0]} `,
		`${laterVersions[0]}!`,
		`R2607016@${metadata.toString('base64')}`,
	])
		expect(completeResourceVersionSchema.safeParse(value).success).toBeFalse();
});
