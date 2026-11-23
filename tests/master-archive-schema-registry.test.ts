import { describe, expect, test } from 'bun:test';
import type { PlatformManifest } from '../src/master-archive/domain/platform-manifest.ts';
import {
	compareManifestTables,
	schemaFingerprint,
} from '../src/master-archive/domain/schema-registry.ts';

const hash = (character: string) => character.repeat(64);

function manifest(tables: PlatformManifest['tables']): PlatformManifest {
	return {
		schemaVersion: 1,
		platform: 'android',
		clientVersion: '5.1.0',
		resourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
		catalog: { identitySha256: hash('a'), sourceSha256: hash('b') },
		tables,
	};
}

function table(
	label: string,
	blobSha256: string,
	schemaFingerprintValue: string,
): PlatformManifest['tables'][number] {
	return {
		label,
		catalogResourceIdentity: `${label}-resource`,
		encryptedResourceSha256: hash('c'),
		blobSha256,
		schemaFingerprint: schemaFingerprintValue,
		rowCount: 1,
		status: 'verified',
	};
}

describe('master schema registry domain', () => {
	test('fieldの追加と型変更を異なるfingerprintにする', () => {
		const id = { index: 0, crc: 100, typeCode: 0x20 };
		const name = { index: 1, crc: 200, typeCode: 0x10 };
		const fingerprint = schemaFingerprint('CardDatas', [id]);

		expect(fingerprint).not.toBe(schemaFingerprint('CardDatas', [id, name]));
		expect(fingerprint).not.toBe(
			schemaFingerprint('CardDatas', [{ ...id, typeCode: 0x33 }]),
		);
		expect(schemaFingerprint('CardDatas', [id, name])).toBe(
			schemaFingerprint('CardDatas', [name, id]),
		);
	});

	test('tableの追加、変更、削除を分類する', () => {
		const previous = manifest([
			table('CardDatas', hash('1'), hash('2')),
			table('MusicDatas', hash('3'), hash('4')),
			table('Characters', hash('5'), hash('6')),
		]);
		const next = manifest([
			table('CardDatas', hash('7'), hash('2')),
			table('Characters', hash('5'), hash('6')),
			table('ItemDatas', hash('8'), hash('9')),
		]);

		expect(compareManifestTables(previous, next)).toEqual({
			added: ['ItemDatas'],
			changed: ['CardDatas'],
			removed: ['MusicDatas'],
			unchanged: ['Characters'],
		});
	});
});
