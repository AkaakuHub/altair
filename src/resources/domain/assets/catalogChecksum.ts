export function catalogChecksum(payload: Uint8Array): bigint {
	return Bun.hash.xxHash64(payload, BigInt(payload.length));
}
