export function requireRecord(
	value: unknown,
	identity: string,
): Readonly<Record<string, unknown>> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error(`${identity} must contain an object`);
	}
	return value as Readonly<Record<string, unknown>>;
}

export function requireList(
	value: unknown,
	identity: string,
): readonly unknown[] {
	if (!Array.isArray(value)) throw new Error(`${identity} must contain a list`);
	return value;
}

export function requireString(value: unknown, identity: string): string {
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(`${identity} must be a string`);
	}
	return value;
}

export function requireNumber(value: unknown, identity: string): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
		throw new Error(`${identity} must be an integer`);
	}
	return value;
}

export function requireBoolean(value: unknown, identity: string): boolean {
	if (typeof value !== 'boolean') {
		throw new Error(`${identity} must be a boolean`);
	}
	return value;
}
