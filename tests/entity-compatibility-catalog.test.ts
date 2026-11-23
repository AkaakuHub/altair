import { describe, expect, test } from 'bun:test';
import {
	classifyEntityCompatibility,
	type EntityCompatibility,
	type EntityCompatibilityEntry,
} from '../src/application/entity-compatibility-catalog.ts';
import type { EntityIdentityFingerprint } from '../src/state/entity-provenance.ts';

describe('entity compatibility catalog', () => {
	test.each([
		{
			target: { domain: 'item', value: 'type=1;category=2' },
			expected: 'compatible',
		},
		{
			target: { domain: 'item', value: 'type=3;category=2' },
			expected: 'changed',
		},
		{ target: undefined, expected: 'absent' },
	] as const)(
		'classifies a target definition as $expected',
		({ target, expected }) => {
			const canonical: EntityIdentityFingerprint = {
				domain: 'item',
				value: 'type=1;category=2',
			};
			const expectedCompatibility: EntityCompatibility = expected;
			const result: EntityCompatibilityEntry<number> =
				classifyEntityCompatibility(10, canonical, target);

			expect(result.compatibility).toBe(expectedCompatibility);
			expect(result.definitionId).toBe(10);
		},
	);
});
