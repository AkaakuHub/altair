import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import {
	parseBoundedFormInteger,
	parseFormInteger,
} from '@altair/runtime/admin/domain/forms/integer.ts';
import type { JsonObject } from '../../../../../src/state/json-state-utils.ts';

export type AdminForm = JsonObject;

const MAX_ADMIN_ID = 9_999_999_999;

export function getFormString(form: AdminForm, key: string): string {
	const value = form[key];
	return typeof value === 'string' ? value : '';
}

export function getOptionalFormString(
	form: AdminForm,
	key: string,
): string | undefined {
	return Object.hasOwn(form, key) ? getFormString(form, key) : undefined;
}

export function getFormInteger(
	form: AdminForm,
	key: string,
	currentValue: number,
): number {
	const parsed = parseFormInteger(getFormString(form, key));
	return parsed ?? currentValue;
}

export function getFormBoolean(form: AdminForm, key: string): boolean {
	return getFormString(form, key) === 'true';
}

export function getAdminItemQuantity(
	form: AdminForm,
	key: string,
	minimum: number,
): number | undefined {
	return getAdminBoundedInteger(form, key, minimum, MAX_ADMIN_ITEM_QUANTITY);
}

export function getAdminPositiveId(
	form: AdminForm,
	key: string,
): number | undefined {
	return getAdminBoundedInteger(form, key, 1, MAX_ADMIN_ID);
}

export function getAdminBoundedInteger(
	form: AdminForm,
	key: string,
	minimum: number,
	maximum: number,
): number | undefined {
	return parseBoundedFormInteger(getFormString(form, key), minimum, maximum);
}
