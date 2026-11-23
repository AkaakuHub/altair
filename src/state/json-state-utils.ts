export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

export type JsonObject = {
	[key: string]: JsonValue;
};

type UnknownObject = {
	[key: string]: unknown;
};

export function cloneRecord<TValue extends UnknownObject>(
	value: TValue,
): TValue {
	return structuredClone(value);
}

export function cloneJsonObject(value: unknown, label: string): JsonObject {
	if (!isJsonObject(value)) {
		throw new Error(`${label} must be a JSON object`);
	}
	return structuredClone(value);
}

export function readJsonObjectArray(
	value: unknown,
	label: string,
): JsonObject[] {
	if (!Array.isArray(value)) {
		throw new Error(`${label} must be a JSON object array`);
	}
	return value.map((item) => cloneJsonObject(item, label));
}

export function readNumber(value: unknown, label: string): number {
	if (typeof value !== 'number') {
		throw new Error(`${label} must be a number`);
	}
	return value;
}

export function stringField(body: unknown, name: string): string {
	if (!isRecord(body)) {
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

export function numberValue(value: unknown): number {
	return typeof value === 'number' ? value : 0;
}

export function isRecord(value: unknown): value is UnknownObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArrayOf<T>(
	value: unknown,
	isItem: (item: unknown) => item is T,
): value is T[] {
	return Array.isArray(value) && value.every(isItem);
}

export function isJsonObject(value: unknown): value is JsonObject {
	if (!isRecord(value)) {
		return false;
	}
	return Object.values(value).every(isJsonValue);
}

export function isJsonValue(value: unknown): value is JsonValue {
	if (
		value === null ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return true;
	}
	if (Array.isArray(value)) {
		return value.every(isJsonValue);
	}
	return isJsonObject(value);
}
