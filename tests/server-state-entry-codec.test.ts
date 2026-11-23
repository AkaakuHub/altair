import { describe, expect, test } from 'bun:test';
import {
	decodeServerStateEntries,
	encodeServerStateEntries,
} from '../src/server-state-entry-codec.ts';

describe('server state entry codec', () => {
	test('escaped pathを含むJSONを同じ値へ復元する', () => {
		const value = { 'a/b': { 'space key': [true, null, 3, 'text'] } };
		const entries = encodeServerStateEntries(value);
		expect(entries.map((entry) => entry.path)).toContain('a%2Fb/space%20key/0');
		expect(decodeServerStateEntries(entries)).toEqual(value);
	});
});
