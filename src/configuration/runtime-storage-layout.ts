import { join } from 'node:path';
import { readRequiredEnvironmentPath } from './environment.ts';

export function resolveRuntimeStorageLayout(
	environment: NodeJS.ProcessEnv = process.env,
) {
	const root = readRequiredEnvironmentPath(environment, 'DATA_ROOT');
	const inputs = join(root, 'inputs');
	const masterArchiveRoot = join(root, 'master-archive');
	return {
		root,
		inputs,
		catalogRoot: join(inputs, 'catalogs'),
		resourceVersionRegistryRoot: join(inputs, 'resource-version-registry'),
		archiveSourceRoot: join(inputs, 'archives'),
		webViewGachaSourceRoot: join(inputs, 'webview', 'gacha-detail'),
		commentsDb: join(inputs, 'comments', 'comments.sqlite'),
		stateDbPath: join(root, 'state.sqlite'),
		requestLogDbPath: join(root, 'requests.sqlite'),
		masterArchiveRoot,
		activeMasterDatabasePath: join(masterArchiveRoot, 'active.sqlite'),
		selectedMasterReleasePath: join(
			masterArchiveRoot,
			'releases',
			'selected-release.json',
		),
	};
}
