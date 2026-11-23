import { describe, expect, test } from 'bun:test';
import { createTestApp } from './test-app.ts';

describe('test app', () => {
	test('starts from the canonical active master fixture', () => {
		expect(() => createTestApp()).not.toThrow();
	});
});
