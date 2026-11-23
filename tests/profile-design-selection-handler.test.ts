import { describe, expect, test } from 'bun:test';
import { profileDesignSelectionError } from '../src/v1/route-support/profile-design-selection-handler.ts';

describe('profile design selection handler', () => {
	test('CardとIconの公式errorを区別する', () => {
		expect(profileDesignSelectionError(1)).toBe('profileDesignCardIdRequired');
		expect(profileDesignSelectionError(2)).toBe('profileDesignIconIdRequired');
	});
});
