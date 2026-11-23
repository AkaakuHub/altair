import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { resolveRuntimeStorageLayout } from './configuration/runtime-storage-layout.ts';
import type { ActiveMasterRepository } from './master-data/active-master-repository.ts';
import { assertPersistentStorageOutsideRepository } from './persistent-storage-location.ts';
import type { ServerStateStore } from './server-state-store-port.ts';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

const serverEnvironmentSchema = z.object({
	HOST: z.string().min(1),
	PORT: z.coerce.number().int().positive().max(65535),
	ASSET_BASE_URL: z.string().url().optional(),
	REQUEST_LOG_ENABLED: z
		.preprocess(
			(value) =>
				typeof value === 'string' ? value.toLowerCase().trim() : value,
			z
				.union([z.boolean(), z.enum(['0', '1', 'false', 'true', 'off', 'on'])])
				.prefault(false),
		)
		.transform(
			(value) =>
				value === true || value === '1' || value === 'true' || value === 'on',
		),
});

export type ServerConfig = {
	root: string;
	host: string;
	port: number;
	assetBaseUrl?: string;
	commentsDb: string;
	officialUserInitialStateRoot: string;
	resourceVersionRegistryRoot: string;
	requestLogEnabled: boolean;
	requestLogDbPath: string;
	stateDbPath: string;
	activeMasterDatabasePath: string;
	selectedMasterReleasePath: string;
	stateStore?: ServerStateStore;
	activeLoginBonusIds?: readonly number[];
	currentDate: () => Date;
	activeMasterRepository?: ActiveMasterRepository;
};
export type ServerRuntimeConfig = ServerConfig & {
	stateStore: ServerStateStore;
	activeLoginBonusIds: readonly number[];
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
	const parsed = serverEnvironmentSchema.parse(env);
	const storage = resolveRuntimeStorageLayout(env);
	assertPersistentStorageOutsideRepository(repositoryRoot, [
		{ name: 'DATA_ROOT', path: storage.root },
	]);
	return {
		root: storage.inputs,
		host: parsed.HOST,
		port: parsed.PORT,
		...(parsed.ASSET_BASE_URL === undefined
			? {}
			: { assetBaseUrl: parsed.ASSET_BASE_URL }),
		commentsDb: storage.commentsDb,
		officialUserInitialStateRoot: join(
			repositoryRoot,
			'official-user-initial-state',
		),
		resourceVersionRegistryRoot: storage.resourceVersionRegistryRoot,
		requestLogEnabled: parsed.REQUEST_LOG_ENABLED,
		requestLogDbPath: storage.requestLogDbPath,
		stateDbPath: storage.stateDbPath,
		activeMasterDatabasePath: storage.activeMasterDatabasePath,
		selectedMasterReleasePath: storage.selectedMasterReleasePath,
		currentDate: () => new Date(),
	};
}
