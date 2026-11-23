import type { ServerConfig } from '../../config.ts';
import type { ServerStateStore } from '../../server-state-store-port.ts';

export type AdminStateDependencies = {
	stateStore: ServerStateStore;
	activeLoginBonusIds: readonly number[];
};
export type AdminRuntimeConfig = ServerConfig & AdminStateDependencies;
