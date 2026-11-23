export function normalizeUtcDateTime(value: string): string {
	return value.endsWith('+00:00') ? `${value.slice(0, -6)}Z` : value;
}
