import { parseBoundedFormInteger } from '@altair/runtime/admin/domain/forms/integer.ts';
import type { AdminMessages } from '../../i18n/messages.ts';

export function parseFiniteFormNumber(value: string): number | undefined {
	if (value.trim().length === 0) return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

export function requireFiniteFormNumber(
	value: string,
	label: string,
	copy: AdminMessages['validation'],
): number {
	if (value.trim().length === 0) throw new Error(copy.required(label));
	const parsed = parseFiniteFormNumber(value);
	if (parsed === undefined) throw new Error(copy.number(label));
	return parsed;
}

export function parseSafeFormInteger(
	value: string,
	minimum: number,
): number | undefined {
	const parsed = parseFiniteFormNumber(value);
	return parsed === undefined
		? undefined
		: parseBoundedFormInteger(String(parsed), minimum, Number.MAX_SAFE_INTEGER);
}

export function requireSafeFormInteger(
	value: string,
	label: string,
	minimum: number,
	copy: AdminMessages['validation'],
): number {
	const parsed = parseSafeFormInteger(value, minimum);
	if (parsed === undefined) throw new Error(copy.integer(label));
	return parsed;
}
