import { describe, expect, test } from 'bun:test';
import {
	getArchiveId,
	getNumberField,
	getStringField,
	isJsonRecord,
} from '../src/v1/route-support/request-fields.ts';

describe('request field readers', () => {
	test('getNumberField returns only number fields', () => {
		expect(getNumberField({ item_id: 10 }, 'item_id')).toBe(10);
		expect(getNumberField({ item_id: '10' }, 'item_id')).toBeUndefined();
		expect(getNumberField(null, 'item_id')).toBeUndefined();
		expect(getNumberField('body', 'item_id')).toBeUndefined();
	});

	test('getArchiveId reads string bodies and archives_id fields', () => {
		expect(getArchiveId('archive-1')).toBe('archive-1');
		expect(getArchiveId({ archives_id: 'archive-2' })).toBe('archive-2');
		expect(getArchiveId({ archives_id: 2 })).toBe('2');
	});

	test('getStringField preserves string fields and integer numbers', () => {
		expect(getStringField({ value: '' }, 'value')).toBe('');
		expect(getStringField({ value: '0010' }, 'value')).toBe('0010');
		expect(getStringField({ value: 10 }, 'value')).toBe('10');
		expect(getStringField({ value: 10.5 }, 'value')).toBe('');
		expect(getStringField({ value: Number.NaN }, 'value')).toBe('');
		expect(getStringField({ value: true }, 'value')).toBe('');
		expect(getStringField([], 'value')).toBe('');
	});

	test('isJsonRecord accepts only non-null non-array objects', () => {
		expect(isJsonRecord({})).toBe(true);
		expect(isJsonRecord({ value: undefined })).toBe(true);
		expect(isJsonRecord([])).toBe(false);
		expect(isJsonRecord(null)).toBe(false);
		expect(isJsonRecord('value')).toBe(false);
	});
});
