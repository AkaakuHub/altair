import { createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import {
	decodeLz4Frame,
	encodeUncompressedLz4Frame,
} from '../music/chartOuterPayload.ts';
import { crc64 } from './crc64.ts';
import { hailstormSecret } from './hailstormSecret.ts';
import type { ResourceVersion } from './resourceVersion.ts';

const platformCrc32 = {
	android: 0x92bcb62d,
	ios: 0x932e7e53,
} as const;

export function encodeCatalogOuterPayload(
	innerCatalog: Uint8Array,
	version: Pick<ResourceVersion, 'revision' | 'seed'>,
	platform: keyof typeof platformCrc32,
	clientVersion: string,
): Uint8Array {
	const frame = encodeUncompressedLz4Frame(innerCatalog);
	const size = Math.ceil((frame.length + 1) / 16) * 16;
	const { key, iv } = deriveCatalogKeys(version, platform, clientVersion, size);
	const cipher = createCipheriv('aes-128-cbc', key, iv);
	return Buffer.concat([cipher.update(frame), cipher.final()]);
}

export function decodeCatalogOuterPayload(
	payload: Uint8Array,
	version: Pick<ResourceVersion, 'revision' | 'seed'>,
	platform: keyof typeof platformCrc32,
	clientVersion: string,
): Uint8Array {
	const { key, iv } = deriveCatalogKeys(
		version,
		platform,
		clientVersion,
		payload.length,
	);
	const decipher = createDecipheriv('aes-128-cbc', key, iv);
	const frame = Buffer.concat([decipher.update(payload), decipher.final()]);
	return decodeLz4Frame(frame);
}

export function deriveCatalogKeys(
	version: Pick<ResourceVersion, 'revision' | 'seed'>,
	platform: keyof typeof platformCrc32,
	clientVersion: string,
	size: number,
): { key: Uint8Array; iv: Uint8Array } {
	const seed = Buffer.alloc(8);
	seed.writeBigUInt64BE(version.seed);
	const versionCrc = Buffer.alloc(8);
	versionCrc.writeBigUInt64BE(
		crc64(new TextEncoder().encode(`${clientVersion}:${version.revision}`)),
	);
	const platformCrc = Buffer.alloc(4);
	platformCrc.writeUInt32BE(platformCrc32[platform]);
	const digest = createHash('sha256')
		.update(hailstormSecret)
		.update(seed)
		.update(versionCrc)
		.update(platformCrc)
		.update(encodeVarUint(size))
		.digest();
	return { key: digest.subarray(0, 16), iv: digest.subarray(16) };
}

function encodeVarUint(value: number): Uint8Array {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error('Catalog size is outside varuint range');
	}
	const bytes: number[] = [];
	let remaining = BigInt(value);
	do {
		const byte = Number(remaining & 0x7fn);
		remaining >>= 7n;
		bytes.push(remaining === 0n ? byte : byte | 0x80);
	} while (remaining !== 0n);
	return Uint8Array.from(bytes);
}
