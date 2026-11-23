import { createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import { catalogChecksum } from '../assets/catalogChecksum.ts';
import { crc64 } from '../assets/crc64.ts';
import { hailstormSecret } from '../assets/hailstormSecret.ts';

const rawCrc32 = 0x1ab3db55;

export type ChartOuterPayload = {
	payload: Uint8Array;
	size: number;
	checksum: string;
};

export function encodeEncryptedLz4Asset(
	content: Uint8Array,
	label: string,
	encryptionSalt: bigint,
): ChartOuterPayload {
	if (!/^[\x20-\x7e]+$/.test(label)) {
		throw new Error('Chart asset label must be ASCII');
	}
	const frame = encodeUncompressedLz4Frame(content);
	const size = Math.ceil((frame.length + 1) / 16) * 16;
	const { key, iv } = deriveRawAssetKeys(label, encryptionSalt, size);
	const cipher = createCipheriv('aes-128-cbc', key, iv);
	const payload = Buffer.concat([cipher.update(frame), cipher.final()]);
	if (payload.length !== size) {
		throw new Error('Chart ciphertext size calculation failed');
	}
	return { payload, size, checksum: catalogChecksum(payload).toString() };
}

export function decodeEncryptedLz4Asset(
	payload: Uint8Array,
	label: string,
	encryptionSalt: bigint,
): Uint8Array {
	const { key, iv } = deriveRawAssetKeys(label, encryptionSalt, payload.length);
	const decipher = createDecipheriv('aes-128-cbc', key, iv);
	const frame = Buffer.concat([decipher.update(payload), decipher.final()]);
	return decodeLz4Frame(frame);
}

function deriveRawAssetKeys(
	label: string,
	encryptionSalt: bigint,
	size: number,
): { key: Uint8Array; iv: Uint8Array } {
	const salt = Buffer.alloc(8);
	salt.writeBigUInt64BE(encryptionSalt & 0x7fffffffffffffffn);
	const labelChecksum = Buffer.alloc(8);
	labelChecksum.writeBigUInt64BE(crc64(new TextEncoder().encode(label)));
	const rawChecksum = Buffer.alloc(4);
	rawChecksum.writeUInt32BE(rawCrc32);
	const digest = createHash('sha256')
		.update(hailstormSecret)
		.update(salt)
		.update(labelChecksum)
		.update(rawChecksum)
		.update(encodeVarint(size))
		.digest();
	return { key: digest.subarray(0, 16), iv: digest.subarray(16) };
}

export function encodeUncompressedLz4Frame(content: Uint8Array): Uint8Array {
	const descriptor = Buffer.alloc(10);
	descriptor[0] = 0x68;
	descriptor[1] = 0x40;
	descriptor.writeBigUInt64LE(BigInt(content.length), 2);
	const headerChecksum = (Bun.hash.xxHash32(descriptor) >>> 8) & 0xff;
	const blocks: Buffer[] = [
		Buffer.from([0x04, 0x22, 0x4d, 0x18]),
		descriptor,
		Buffer.from([headerChecksum]),
	];
	for (let offset = 0; offset < content.length; offset += 65536) {
		const block = content.subarray(offset, offset + 65536);
		const blockSize = Buffer.alloc(4);
		blockSize.writeUInt32LE((block.length | 0x80000000) >>> 0);
		blocks.push(blockSize, Buffer.from(block));
	}
	blocks.push(Buffer.alloc(4));
	return Buffer.concat(blocks);
}

export function decodeLz4Frame(frame: Uint8Array): Uint8Array {
	const buffer = Buffer.from(frame);
	if (!buffer.subarray(0, 4).equals(Buffer.from([0x04, 0x22, 0x4d, 0x18]))) {
		throw new Error('Chart LZ4 frame magic is invalid');
	}
	const contentSize = Number(buffer.readBigUInt64LE(6));
	const content: Uint8Array[] = [];
	const blockLinked = ((buffer[4] ?? 0) & 0x20) === 0;
	let dictionary = new Uint8Array();
	let offset = 15;
	while (offset + 4 <= buffer.length) {
		const encodedSize = buffer.readUInt32LE(offset);
		offset += 4;
		if (encodedSize === 0) {
			break;
		}
		const size = encodedSize & 0x7fffffff;
		const block = buffer.subarray(offset, offset + size);
		const decodedBlock =
			(encodedSize & 0x80000000) === 0
				? decodeLz4Block(block, dictionary)
				: block;
		content.push(decodedBlock);
		if (blockLinked) {
			dictionary = Buffer.concat([dictionary, decodedBlock]).subarray(-65536);
		}
		offset += size;
	}
	const decoded = Buffer.concat(content);
	if (decoded.length !== contentSize) {
		throw new Error('Chart LZ4 content size does not match frame');
	}
	return decoded;
}

function decodeLz4Block(block: Uint8Array, dictionary: Uint8Array): Uint8Array {
	const output: number[] = [...dictionary];
	const dictionaryLength = dictionary.length;
	let offset = 0;
	while (offset < block.length) {
		const token = block[offset];
		if (token === undefined) {
			throw new Error('LZ4 block token is missing');
		}
		offset += 1;
		const literal = readLz4Length(block, offset, token >>> 4);
		offset = literal.offset;
		if (offset + literal.length > block.length) {
			throw new Error('LZ4 literal exceeds block');
		}
		for (const byte of block.subarray(offset, offset + literal.length)) {
			output.push(byte);
		}
		offset += literal.length;
		if (offset === block.length) {
			break;
		}
		const low = block[offset];
		const high = block[offset + 1];
		if (low === undefined || high === undefined) {
			throw new Error('LZ4 match offset is missing');
		}
		offset += 2;
		const matchOffset = low | (high << 8);
		if (matchOffset === 0 || matchOffset > output.length) {
			throw new Error('LZ4 match offset is invalid');
		}
		const match = readLz4Length(block, offset, token & 0x0f);
		offset = match.offset;
		for (let index = 0; index < match.length + 4; index += 1) {
			const byte = output[output.length - matchOffset];
			if (byte === undefined) {
				throw new Error('LZ4 match source is missing');
			}
			output.push(byte);
		}
	}
	return Uint8Array.from(output.slice(dictionaryLength));
}

function readLz4Length(
	block: Uint8Array,
	offset: number,
	nibble: number,
): { length: number; offset: number } {
	let length = nibble;
	if (nibble !== 15) {
		return { length, offset };
	}
	let extension = 255;
	while (extension === 255) {
		extension = block[offset] ?? -1;
		if (extension < 0) {
			throw new Error('LZ4 length extension is missing');
		}
		length += extension;
		offset += 1;
	}
	return { length, offset };
}

function encodeVarint(value: number): Uint8Array {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error('Asset size must be a non-negative safe integer');
	}
	const bytes: number[] = [];
	let remaining = value;
	do {
		let byte = remaining & 0x7f;
		remaining = Math.floor(remaining / 128);
		if (remaining > 0) {
			byte |= 0x80;
		}
		bytes.push(byte);
	} while (remaining > 0);
	return Uint8Array.from(bytes);
}
