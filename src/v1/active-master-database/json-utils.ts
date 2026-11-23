import {
	isJsonValue as isStateJsonValue,
	type JsonValue,
} from '../../state/json-state-utils.ts';
import { isJsonRecord } from '../route-support/request-fields.ts';
export function parseJson(value: string): JsonValue {
	return JSON.parse(value) as JsonValue;
}

export function parseCommaSeparatedIntegerList(value: string | null): number[] {
	if (!value) {
		return [];
	}
	return value
		.split(',')
		.map((part) => Number.parseInt(part, 10))
		.filter((value) => Number.isInteger(value));
}

export function isJsonValue(value: unknown): value is JsonValue {
	return isStateJsonValue(value);
}
export function numberValue(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
export function numberField(body: unknown, name: string): number {
	return isJsonRecord(body) ? numberValue(body[name]) : 0;
}
export function booleanField(body: unknown, name: string): boolean {
	return isJsonRecord(body) && body[name] === true;
}
