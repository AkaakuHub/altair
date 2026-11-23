import { createHash } from 'node:crypto';
import { crc64 } from './crc64.ts';

const base32Alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
const maximumUint64 = 0xffffffffffffffffn;

export function catalogLabelCrc(label: string): bigint {
	return crc64(new TextEncoder().encode(label));
}

export function catalogAssetRealName(
	label: string,
	checksum: bigint,
	size: number,
): string {
	if (checksum < 0n || checksum > maximumUint64) {
		throw new Error('Asset checksum is outside uint64 range');
	}
	const identity = Buffer.alloc(16);
	identity.writeBigUInt64BE(checksum);
	identity.writeBigUInt64BE(catalogLabelCrc(label), 8);
	const digest = createHash('md5')
		.update(identity)
		.update(encodeVarUint(size))
		.digest();
	return encodeBase32(digest);
}

function encodeVarUint(value: number): Uint8Array {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error('Asset size is outside varuint range');
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

function encodeBase32(bytes: Uint8Array): string {
	let bits = 0;
	let value = 0;
	let result = '';
	for (const byte of bytes) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			result += base32Alphabet[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
		value &= (1 << bits) - 1;
	}
	if (bits > 0) {
		result += base32Alphabet[(value << (5 - bits)) & 31];
	}
	return result;
}
