import { expect, test } from 'bun:test';
import {
	createDateTimeDraft,
	dateTimeDraftToIso,
} from '../../packages/admin-ui/src/domain/forms/dateTimeDraft.ts';
import {
	requireFiniteFormNumber,
	requireSafeFormInteger,
} from '../../packages/admin-ui/src/domain/forms/number.ts';
import { adminLocales } from '../../packages/admin-ui/src/i18n/messages.ts';

for (const [locale, { messages }] of Object.entries(adminLocales)) {
	test(`${locale}: validation uses translated messages and preserves values`, () => {
		const copy = messages.validation;
		expect(requireFiniteFormNumber('1.25', 'Value', copy)).toBe(1.25);
		expect(requireSafeFormInteger('12', 'Value', 0, copy)).toBe(12);
		expect(() => requireFiniteFormNumber('', 'Value', copy)).toThrow(
			copy.required('Value'),
		);
		expect(() => requireFiniteFormNumber('Infinity', 'Value', copy)).toThrow(
			copy.number('Value'),
		);
		expect(() => requireSafeFormInteger('1.2', 'Value', 0, copy)).toThrow(
			copy.integer('Value'),
		);
		expect(() =>
			dateTimeDraftToIso({ value: 'invalid', source: null }, copy),
		).toThrow(copy.dateTime);
		expect(
			dateTimeDraftToIso(createDateTimeDraft('2026-01-01T00:00:00.123Z'), copy),
		).toBe('2026-01-01T00:00:00.123Z');
		expect(dateTimeDraftToIso(createDateTimeDraft(null), copy)).toBe('');
	});
}
