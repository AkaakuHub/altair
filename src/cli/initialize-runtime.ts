import { link, mkdtemp, rm, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveOfficialRuntimeRelease } from '../application/runtime-switch/runtime-switch-release-resolver.ts';
import { resolveRuntimeStorageLayout } from '../configuration/runtime-storage-layout.ts';
import { buildSavedReleaseActiveDatabase } from '../master-archive/infrastructure/build-saved-release-active-database.ts';
import { initializeRuntime } from '../runtime-initialization/initialize-runtime.ts';

const [argument, extra] = Bun.argv.slice(2);
if (
	argument === undefined ||
	extra !== undefined ||
	!/^[0-9a-f]{64}$/u.test(argument)
)
	throw new Error('Usage: runtime:initialize <release-id>');
const storage = resolveRuntimeStorageLayout();
if (await Bun.file(storage.activeMasterDatabasePath).exists())
	throw new Error(
		'Active database already exists. Use runtime:switch to change releases.',
	);
const manifests = await resolveOfficialRuntimeRelease(
	storage.masterArchiveRoot,
	argument,
);
const staging = await mkdtemp(join(storage.masterArchiveRoot, '.initial-'));
try {
	const candidatePath = join(staging, 'active.sqlite');
	const androidManifestPath = manifests.androidPath;
	const iosManifestPath = manifests.iosPath;
	const result = await buildSavedReleaseActiveDatabase({
		androidManifestPath,
		iosManifestPath,
		candidatePath,
		release: { kind: 'official', expectedReleaseIdentity: argument },
	});
	await link(candidatePath, storage.activeMasterDatabasePath);
	try {
		const initialization = await initializeRuntime({
			activeDatabasePath: storage.activeMasterDatabasePath,
			selectedReleasePath: storage.selectedMasterReleasePath,
			androidManifestPath,
			iosManifestPath,
		});
		console.log(JSON.stringify({ ...result, ...initialization }, null, 2));
	} catch (error) {
		await unlink(storage.activeMasterDatabasePath);
		throw error;
	}
} finally {
	await rm(staging, { recursive: true, force: true });
}
