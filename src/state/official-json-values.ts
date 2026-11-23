export const OFFICIAL_EMPTY_STRING_JSON = '""';

export function jsonStringToOfficialResponseJson(value: string): string {
	const normalized = normalizeJsonString(value);
	return emptyObjectJsonToEmptyStringJson(normalized);
}

function emptyObjectJsonToEmptyStringJson(value: string): string {
	return value === '{}' ? OFFICIAL_EMPTY_STRING_JSON : value;
}

function normalizeJsonString(value: string): string {
	const normalized = JSON.stringify(JSON.parse(value));
	if (normalized === undefined) {
		throw new Error('Official JSON string value cannot be undefined');
	}
	return normalized;
}
