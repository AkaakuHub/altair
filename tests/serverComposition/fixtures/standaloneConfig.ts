import { Database } from 'bun:sqlite';
import { join, resolve } from 'node:path';
import type { ServerConfig } from '../../../src/config.ts';
import type { PersistedServerState } from '../../../src/server-state-store-port.ts';
import { externalFixturePath } from '../../externalFixtures/sourcePath.ts';

export function createStandaloneConfig(archiveRoot: string): {
	config: ServerConfig;
	database: Database;
} {
	const database = new Database(
		join(archiveRoot, 'master-archive/active.sqlite'),
		{ readonly: true },
	);
	const saved: { state: PersistedServerState | null } = { state: null };
	const config: ServerConfig = {
		root: archiveRoot,
		host: '127.0.0.1',
		port: 8080,
		commentsDb: externalFixturePath('..', 'comments', 'comments.sqlite'),
		officialUserInitialStateRoot: resolve(
			import.meta.dir,
			'../../../official-user-initial-state',
		),
		resourceVersionRegistryRoot: join(archiveRoot, 'resource-version-registry'),
		requestLogEnabled: false,
		requestLogDbPath: ':memory:',
		stateDbPath: ':memory:',
		activeMasterDatabasePath: join(archiveRoot, 'master-archive/active.sqlite'),
		selectedMasterReleasePath: join(
			archiveRoot,
			'master-archive/releases/selected-release.json',
		),
		stateStore: {
			description: 'standalone-test',
			read: () => structuredClone(saved.state),
			write: (state) => {
				saved.state = structuredClone(state);
			},
		},
		currentDate: () => new Date(),
		activeMasterRepository: {
			selection: {
				releaseId: 'r2606002',
				databaseFingerprint: 'standalone-test',
				androidResourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
				iosResourceVersion: 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
				database,
			},
			close: () => database.close(),
		},
	};
	return { config, database };
}
