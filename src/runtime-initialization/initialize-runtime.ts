import { Database } from 'bun:sqlite';
import { lstat, mkdir, open, readFile, unlink } from 'node:fs/promises';
import { dirname, join, sep } from 'node:path';
import { runtimeMaintenanceStateSchema } from '../application/runtime-switch/runtime-maintenance-state.ts';
import { createMasterReleasePair } from '../master-archive/domain/release-pair.ts';
import {
	assertActiveMasterDatabaseIdentity,
	readActiveMasterDatabaseIdentity,
} from '../master-data/active-master-database-identity.ts';
import { parseSelectedMasterRelease } from '../master-data/selected-master-release.ts';
import {
	type RuntimeInitializationConfiguration,
	runtimeInitializationConfigurationSchema,
} from './configuration.ts';

export async function initializeRuntime(
	configuration: RuntimeInitializationConfiguration,
) {
	const input = runtimeInitializationConfigurationSchema.parse(configuration);
	const maintenancePath = join(
		dirname(input.activeDatabasePath),
		'runtime',
		'maintenance.json',
	);
	const destinations = [input.selectedReleasePath, maintenancePath];
	if (
		new Set(destinations).size !== destinations.length ||
		destinations.some((path) =>
			destinations.some((other) => other.startsWith(`${path}${sep}`)),
		)
	)
		throw new Error(
			'Initialization destinations must be distinct and must not contain one another',
		);
	await Promise.all(destinations.map(assertAbsent));
	const pair = createMasterReleasePair(
		await Promise.all(
			[input.androidManifestPath, input.iosManifestPath].map(async (path) =>
				JSON.parse(await readFile(path, 'utf8')),
			),
		),
	);
	const database = new Database(input.activeDatabasePath, {
		readonly: true,
		strict: true,
	});
	const selection = (() => {
		try {
			const identity = readActiveMasterDatabaseIdentity(database);
			const value = parseSelectedMasterRelease({
				schemaVersion: 1,
				releaseId: pair.releaseId,
				databaseFingerprint: identity.databaseFingerprint,
				androidResourceVersion: pair.android.resourceVersion,
				iosResourceVersion: pair.ios.resourceVersion,
			});
			assertActiveMasterDatabaseIdentity(identity, value);
			return value;
		} finally {
			database.close();
		}
	})();
	const maintenance = runtimeMaintenanceStateSchema.parse({
		schemaVersion: 1,
		enabled: false,
		androidResourceVersion: selection.androidResourceVersion,
		iosResourceVersion: selection.iosResourceVersion,
	});
	const created: { path: string; ino: number; dev: number }[] = [];
	try {
		for (const [path, value] of [
			[input.selectedReleasePath, selection],
			[maintenancePath, maintenance],
		] as const) {
			await mkdir(dirname(path), { recursive: true });
			const file = await open(path, 'wx', 0o600);
			try {
				const identity = await file.stat();
				created.push({ path, ino: identity.ino, dev: identity.dev });
				await file.writeFile(`${JSON.stringify(value, null, 2)}\n`);
				await file.sync();
			} finally {
				await file.close();
			}
		}
	} catch (error) {
		const cleanup = await Promise.allSettled(
			created.map(async (entry) => {
				const current = await lstat(entry.path);
				if (current.ino === entry.ino && current.dev === entry.dev)
					await unlink(entry.path);
			}),
		);
		const failures: unknown[] = cleanup.flatMap((result) =>
			result.status === 'rejected' ? [result.reason] : [],
		);
		if (failures.length > 0)
			throw new AggregateError(
				[error, ...failures],
				'Runtime initialization and cleanup failed',
			);
		throw error;
	}
	return {
		selection,
		selectedReleasePath: input.selectedReleasePath,
		maintenancePath,
	};
}

async function assertAbsent(path: string): Promise<void> {
	try {
		await lstat(path);
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
			return;
		throw error;
	}
	throw new Error(`Initialization target already exists: ${path}`);
}
