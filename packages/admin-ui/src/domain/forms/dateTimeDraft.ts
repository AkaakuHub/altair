import type { AdminMessages } from '../../i18n/messages.ts';
export type DateTimeDraft = Readonly<{ value: string; source: string | null }>;

export function createDateTimeDraft(source: string | null): DateTimeDraft {
	return { value: source === null ? '' : toLocalInput(source), source };
}

export function dateTimeDraftToIso(
	draft: DateTimeDraft,
	copy: AdminMessages['validation'],
): string {
	if (draft.value.length === 0) return '';
	const localValue = normalizeLocalInput(draft.value, copy);
	const value =
		draft.source !== null && localValue === toLocalInput(draft.source)
			? draft.source
			: draft.value;
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) throw new Error(copy.dateTime);
	if (toLocalInput(date.toISOString()) !== localValue)
		throw new Error(copy.localTime);
	return date.toISOString();
}

function toLocalInput(value: string): string {
	const date = new Date(value);
	if (!Number.isFinite(date.getTime()))
		throw new Error('Invalid saved date and time');
	return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
		.toISOString()
		.slice(0, -1);
}

function normalizeLocalInput(
	value: string,
	copy: AdminMessages['validation'],
): string {
	const match =
		/^(\d{4,}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
			value,
		);
	const base = match?.[1];
	if (base === undefined) throw new Error(copy.dateTime);
	return `${base}:${match?.[2] ?? '00'}.${(match?.[3] ?? '').padEnd(3, '0')}`;
}
