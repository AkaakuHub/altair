import { describe, expect, test } from 'bun:test';
import {
	ensureUserProfileSettings,
	isUserProfileSettingsState,
} from '../src/state/profile-settings-state.ts';

describe('profile settings state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userProfileSettings: [] };

		const first = ensureUserProfileSettings(state, 'player-a');
		const second = ensureUserProfileSettings(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(state.userProfileSettings).toHaveLength(1);
	});

	test('display cardのmaster release provenanceを受理する', () => {
		const settings = ensureUserProfileSettings(
			{ userProfileSettings: [] },
			'player-a',
		).value;
		settings.displayCardSourceMasterReleaseId = 'release-1';
		settings.displayCardIdentityFingerprint = {
			domain: 'card',
			value: 'fingerprint',
		};

		expect(isUserProfileSettingsState(settings)).toBe(true);
	});
});
