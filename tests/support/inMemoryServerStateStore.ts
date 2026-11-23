import type { ServerState } from '../../src/server-state-schema.ts';
import type { ServerStateStore } from '../../src/server-state-store-port.ts';

export function createInMemoryServerStateStore() {
	let current: ServerState | null = null;
	const store: ServerStateStore = {
		description: 'memory',
		read: () => current,
		write: (state) => {
			current = state;
		},
	};
	return {
		store,
		getState(): ServerState {
			if (current === null) throw new Error('Server state has not been saved');
			return current;
		},
	};
}
