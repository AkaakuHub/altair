import { describe, expect, test } from 'bun:test';
import {
	advanceRuntimeSwitch,
	type RuntimeSwitchEvent,
} from '../src/application/runtime-switch/runtime-switch-transition.ts';

describe('runtime switch transition', () => {
	test('requires the complete switch order', () => {
		const events: readonly RuntimeSwitchEvent[] = [
			'manifests-validated',
			'pair-validated',
			'candidate-built',
			'candidate-verified',
			'maintenance-enabled',
			'public-maintenance-verified',
			'api-stopped',
			'active-database-exchanged',
			'selected-release-exchanged',
			'api-started',
			'maintenance-disabled',
			'runtime-verified',
		];
		let state: 'initial' | RuntimeSwitchEvent = 'initial';
		for (const event of events) state = advanceRuntimeSwitch(state, event);
		expect(state).toBe('runtime-verified');
	});

	test('API起動前のmaintenance解除を許可しない', () => {
		expect(() =>
			advanceRuntimeSwitch(
				'selected-release-exchanged',
				'maintenance-disabled',
			),
		).toThrow('Invalid runtime switch transition');
	});
});
