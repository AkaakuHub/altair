import type { ServerRuntimeConfig } from '../../config.ts';
import {
	officialUserInitialStateCatalog,
	readOfficialUserInitialStateObject,
} from '../../official-user-initial-state.ts';
import type { ResourceVersionRegistry } from '../../resource-versions.ts';
import { readResourceVersionRegistry } from '../../resource-versions.ts';
import type { JsonObject } from '../../state/json-state-utils.ts';
import {
	createDefaultResponseHeaders,
	createStandardResponseHeaders,
} from '../http/response-header-definitions.ts';

type StateRouteFixtures = {
	resourceVersions: ResourceVersionRegistry;
	defaultHeaders: ReadonlyArray<readonly [string, string]>;
	userLoginHeaders: ReadonlyArray<readonly [string, string]>;
	userCardGetList: JsonObject;
	userItemsGetList: JsonObject;
};

export function loadStateRouteFixtures(
	config: Pick<
		ServerRuntimeConfig,
		'officialUserInitialStateRoot' | 'resourceVersionRegistryRoot'
	>,
): StateRouteFixtures {
	return {
		resourceVersions: readResourceVersionRegistry(
			config.resourceVersionRegistryRoot,
		),
		defaultHeaders: createDefaultResponseHeaders(),
		userLoginHeaders: createStandardResponseHeaders(),
		userCardGetList: readOfficialUserInitialStateObject(
			config.officialUserInitialStateRoot,
			officialUserInitialStateCatalog.cards,
		),
		userItemsGetList: readOfficialUserInitialStateObject(
			config.officialUserInitialStateRoot,
			officialUserInitialStateCatalog.items,
		),
	};
}
