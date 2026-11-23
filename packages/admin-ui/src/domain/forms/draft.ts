import type { FormValue } from '../../form-value.ts';

export type AdminDraftValue =
	| FormValue
	| null
	| undefined
	| readonly AdminDraftValue[]
	| { readonly [key: string]: AdminDraftValue };
export type AdminDraftValues = Readonly<Record<string, unknown>>;
export type AdminDraftChangeDetector<T extends AdminDraftValues> = (
	source: T,
	value: T,
) => boolean;
export type AdminFormDraft<T extends AdminDraftValues> = Readonly<{
	source: T;
	value: T;
	conflicted: boolean;
}>;

export function createAdminFormDraft<T extends AdminDraftValues>(
	source: T,
): AdminFormDraft<T> {
	return { source, value: source, conflicted: false };
}

export function hasAdminDraftChanges(
	source: AdminDraftValues,
	value: AdminDraftValues,
): boolean {
	return !equalValues(source, value);
}

export function editAdminFormDraft<T extends AdminDraftValues>(
	draft: AdminFormDraft<T>,
	value: T,
	hasChanges: AdminDraftChangeDetector<T> = hasAdminDraftChanges,
): AdminFormDraft<T> {
	return {
		...draft,
		value,
		conflicted: draft.conflicted && hasChanges(draft.source, value),
	};
}

export function reconcileAdminFormDraft<T extends AdminDraftValues>(
	draft: AdminFormDraft<T>,
	source: T,
	hasChanges: AdminDraftChangeDetector<T> = hasAdminDraftChanges,
): AdminFormDraft<T> {
	if (!hasChanges(draft.source, source)) return draft;
	if (
		!hasChanges(draft.source, draft.value) ||
		!hasChanges(source, draft.value)
	)
		return createAdminFormDraft(source);
	return { source, value: draft.value, conflicted: true };
}

function equalValues(left: unknown, right: unknown): boolean {
	if (left === right) return true;
	if (isDraftArray(left) || isDraftArray(right))
		return (
			isDraftArray(left) &&
			isDraftArray(right) &&
			left.length === right.length &&
			left.every((value, index) => equalValues(value, right[index]))
		);
	if (!isDraftRecord(left) || !isDraftRecord(right)) return false;
	const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
	return [...keys].every((key) => equalValues(left[key], right[key]));
}

function isDraftArray(value: unknown): value is readonly unknown[] {
	return Array.isArray(value);
}

function isDraftRecord(
	value: unknown,
): value is Readonly<Record<string, unknown>> {
	if (value === null || typeof value !== 'object') return false;
	const prototype: unknown = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
