import { link, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveOfficialRuntimeRelease } from '../application/runtime-switch/runtime-switch-release-resolver.ts';
import { resolveRuntimeStorageLayout } from '../configuration/runtime-storage-layout.ts';
import { buildSavedReleaseActiveDatabase } from '../master-archive/infrastructure/build-saved-release-active-database.ts';
import { parseCandidateBuildArgument } from '../master-archive/infrastructure/candidate-build-arguments.ts';

const [argument, payload, extra] = Bun.argv.slice(2);
if (
	argument === '--candidate' &&
	payload !== undefined &&
	extra === undefined
) {
	const { kind, releaseId, ...paths } = parseCandidateBuildArgument(payload);
	if (kind !== 'official' && kind !== 'platform-selection')
		throw new Error('Unknown candidate release kind');
	console.log(
		JSON.stringify(
			await buildSavedReleaseActiveDatabase({
				...paths,
				release: { kind, expectedReleaseIdentity: releaseId },
			}),
			null,
			2,
		),
	);
} else {
	if (
		argument === undefined ||
		payload !== undefined ||
		!/^[0-9a-f]{64}$/u.test(argument)
	)
		throw new Error('Usage: master-archive:build-active <release-id>');
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
		console.log(
			JSON.stringify(
				{ ...result, androidManifestPath, iosManifestPath },
				null,
				2,
			),
		);
	} finally {
		await rm(staging, { recursive: true, force: true });
	}
}
