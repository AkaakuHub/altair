import { describe, expect, test } from 'bun:test';
import {
	createDefaultResponseHeaders,
	createStandardResponseHeaders,
} from '../src/v1/http/response-header-definitions.ts';
import { notificationReadState } from '../src/v1/http/response-notification-headers.ts';

describe('response header values', () => {
	test('notification対象がなければ既読として返す', () => {
		expect(notificationReadState(false, false)).toBe(true);
		expect(notificationReadState(true, false)).toBe(false);
		expect(notificationReadState(true, true)).toBe(true);
	});

	test('state headerの後に共通のstatic headerを返す', () => {
		const headers = createDefaultResponseHeaders();

		expect(headers.slice(-6)).toEqual([...createStandardResponseHeaders()]);
		expect(headers.some(([name]) => name === 'launcher_info')).toBe(true);
		expect(headers.some(([name]) => name === 'user_stamina')).toBe(true);
	});
});
