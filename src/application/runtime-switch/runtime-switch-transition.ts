export type RuntimeSwitchState =
	| 'initial'
	| 'manifests-validated'
	| 'pair-validated'
	| 'maintenance-enabled'
	| 'public-maintenance-verified'
	| 'api-stopped'
	| 'candidate-built'
	| 'candidate-verified'
	| 'active-database-exchanged'
	| 'selected-release-exchanged'
	| 'api-started'
	| 'runtime-verified'
	| 'maintenance-disabled';

export type RuntimeSwitchEvent = Exclude<RuntimeSwitchState, 'initial'>;

const transitions: Readonly<
	Record<RuntimeSwitchState, RuntimeSwitchEvent | null>
> = {
	initial: 'manifests-validated',
	'manifests-validated': 'pair-validated',
	'pair-validated': 'candidate-built',
	'candidate-built': 'candidate-verified',
	'candidate-verified': 'maintenance-enabled',
	'maintenance-enabled': 'public-maintenance-verified',
	'public-maintenance-verified': 'api-stopped',
	'api-stopped': 'active-database-exchanged',
	'active-database-exchanged': 'selected-release-exchanged',
	'selected-release-exchanged': 'api-started',
	'api-started': 'maintenance-disabled',
	'maintenance-disabled': 'runtime-verified',
	'runtime-verified': null,
};

export function advanceRuntimeSwitch(
	state: RuntimeSwitchState,
	event: RuntimeSwitchEvent,
): RuntimeSwitchState {
	if (transitions[state] !== event) {
		throw new Error(`Invalid runtime switch transition: ${state} -> ${event}`);
	}
	return event;
}
