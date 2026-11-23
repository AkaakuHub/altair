export type ByteRange = Readonly<{
	start: number;
	endExclusive: number;
}>;

type SingleByteRangeResult =
	| Readonly<{ kind: 'complete' }>
	| Readonly<{ kind: 'partial'; range: ByteRange }>
	| Readonly<{ kind: 'unsatisfiable' }>;

const byteRangePattern = /^bytes=(\d*)-(\d*)$/u;

export function parseSingleByteRange(
	value: string | undefined,
	size: number,
): SingleByteRangeResult {
	assertResourceSize(size);
	if (value === undefined) return { kind: 'complete' };
	const match = byteRangePattern.exec(value);
	if (match === null) return { kind: 'unsatisfiable' };
	const startText = match[1] ?? '';
	const endText = match[2] ?? '';
	if (startText.length === 0) {
		const suffixLength = parseDecimalInteger(endText);
		if (suffixLength === null || suffixLength === 0 || size === 0)
			return { kind: 'unsatisfiable' };
		return {
			kind: 'partial',
			range: {
				start: Math.max(0, size - suffixLength),
				endExclusive: size,
			},
		};
	}
	const start = parseDecimalInteger(startText);
	if (start === null || start >= size) return { kind: 'unsatisfiable' };
	if (endText.length === 0)
		return { kind: 'partial', range: { start, endExclusive: size } };
	const inclusiveEnd = parseDecimalInteger(endText);
	if (inclusiveEnd === null || inclusiveEnd < start)
		return { kind: 'unsatisfiable' };
	return {
		kind: 'partial',
		range: { start, endExclusive: Math.min(size, inclusiveEnd + 1) },
	};
}

function parseDecimalInteger(value: string): number | null {
	if (!/^\d+$/u.test(value)) return null;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) ? parsed : null;
}

function assertResourceSize(size: number): void {
	if (!Number.isSafeInteger(size) || size < 0)
		throw new Error('Resource size is invalid');
}
