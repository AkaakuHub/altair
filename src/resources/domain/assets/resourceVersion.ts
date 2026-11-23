import { catalogAssetRealName } from './catalogAssetIdentity.ts';

export type ResourceVersion = {
	revision: string;
	checksum: bigint;
	seed: bigint;
	size: number;
};

const maximumUint64 = 0xffffffffffffffffn;

export function parseResourceVersion(value: string): ResourceVersion {
	const separator = value.indexOf('@');
	if (separator <= 0 || value.indexOf('@', separator + 1) !== -1) {
		throw new Error('Resource version format is invalid');
	}
	const revision = value.slice(0, separator);
	if (!/^R\d+$/.test(revision)) {
		throw new Error('Resource revision is invalid');
	}
	const metadata = Buffer.from(value.slice(separator + 1), 'base64');
	if (metadata.length < 17) {
		throw new Error('Resource version metadata is truncated');
	}
	const { value: size, nextOffset } = decodeVarUint(metadata, 16);
	if (nextOffset !== metadata.length) {
		throw new Error('Resource version metadata has trailing bytes');
	}
	return {
		revision,
		checksum: metadata.readBigUInt64BE(0),
		seed: metadata.readBigUInt64BE(8),
		size,
	};
}

export function serializeResourceVersion(version: ResourceVersion): string {
	if (!/^R\d+$/.test(version.revision)) {
		throw new Error('Resource revision is invalid');
	}
	assertUint64(version.checksum, 'Resource checksum');
	assertUint64(version.seed, 'Resource seed');
	const header = Buffer.alloc(16);
	header.writeBigUInt64BE(version.checksum);
	header.writeBigUInt64BE(version.seed, 8);
	const metadata = Buffer.concat([
		header,
		Buffer.from(encodeVarUint(version.size)),
	]);
	return `${version.revision}@${metadata.toString('base64')}`;
}

export function catalogManifestRealName(version: ResourceVersion): string {
	return catalogAssetRealName(version.revision, version.checksum, version.size);
}

function assertUint64(value: bigint, label: string) {
	if (value < 0n || value > maximumUint64) {
		throw new Error(`${label} is outside uint64 range`);
	}
}

function encodeVarUint(value: number): Uint8Array {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error('Resource size is outside varuint range');
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

function decodeVarUint(
	bytes: Uint8Array,
	offset: number,
): { value: number; nextOffset: number } {
	let value = 0n;
	for (
		let index = offset, shift = 0n;
		index < bytes.length;
		index += 1, shift += 7n
	) {
		if (shift > 63n) throw new Error('Resource size varuint is too long');
		const byte = bytes[index];
		if (byte === undefined) throw new Error('Resource size is truncated');
		value |= BigInt(byte & 0x7f) << shift;
		if ((byte & 0x80) === 0) {
			const number = Number(value);
			if (!Number.isSafeInteger(number)) {
				throw new Error('Resource size exceeds safe integer range');
			}
			return { value: number, nextOffset: index + 1 };
		}
	}
	throw new Error('Resource size is truncated');
}
