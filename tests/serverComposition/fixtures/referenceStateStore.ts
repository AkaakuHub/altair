import type { ServerState } from '../../../src/server-state-schema.ts';
import type { ServerStateStore } from '../../../src/server-state-store-port.ts';

export function createReferenceStateStore(reference: {
	current?: ServerState;
}): ServerStateStore {
	return {
		description: 'reference state',
		read: () => null,
		write: (state) => {
			reference.current = state;
		},
	};
}
