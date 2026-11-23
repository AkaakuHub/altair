type JsonRecord = Record<string, unknown>;

export function isJsonRecord(value: unknown): value is JsonRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getStringField(body: unknown, name: string): string {
	if (!isJsonRecord(body)) {
		return '';
	}
	const value = body[name];
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' && Number.isInteger(value)) {
		return String(value);
	}
	return '';
}

export function getNumberField(
	body: unknown,
	fieldName: string,
): number | undefined {
	if (typeof body !== 'object' || body === null) {
		return undefined;
	}
	if (!isJsonRecord(body)) {
		return undefined;
	}
	const value = body[fieldName];
	return typeof value === 'number' ? value : undefined;
}

export function getArchiveId(body: unknown): string {
	if (typeof body === 'string') {
		return body;
	}
	return getStringField(body, 'archives_id');
}
