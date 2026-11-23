const integerPattern = /^-?\d+$/;

export function parseFormInteger(value: string): number | undefined {
	if (!integerPattern.test(value)) return undefined;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export function parseBoundedFormInteger(
	value: string,
	minimum: number,
	maximum: number,
): number | undefined {
	const parsed = parseFormInteger(value);
	if (parsed === undefined || parsed < minimum || parsed > maximum)
		return undefined;
	return parsed;
}
