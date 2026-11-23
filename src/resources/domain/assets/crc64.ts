const polynomial = 0x42f0e1eba9ea3693n;
const mask = 0xffffffffffffffffn;

export function crc64(bytes: Uint8Array): bigint {
	let checksum = 0n;
	for (const byte of bytes) {
		checksum ^= BigInt(byte) << 56n;
		for (let bit = 0; bit < 8; bit += 1) {
			checksum =
				(checksum & 0x8000000000000000n) !== 0n
					? ((checksum << 1n) ^ polynomial) & mask
					: (checksum << 1n) & mask;
		}
	}
	return checksum;
}
