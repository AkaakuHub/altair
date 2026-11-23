import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parsePlatformManifest } from '../../master-archive/domain/platform-manifest.ts';
import { createMasterReleasePair } from '../../master-archive/domain/release-pair.ts';
import { parseRuntimeReleaseIndex } from '../../master-archive/domain/runtime-release-index.ts';
import { masterManifestPath } from '../../master-archive/infrastructure/node-master-manifest-store.ts';

export async function resolveOfficialRuntimeRelease(
	archiveRoot: string,
	releaseId: string,
): Promise<Readonly<{ androidPath: string; iosPath: string }>> {
	const index = parseRuntimeReleaseIndex(
		JSON.parse(
			await readFile(join(archiveRoot, 'releases', 'index.json'), 'utf8'),
		),
	);
	const release = index[releaseId];
	if (release === undefined) {
		throw new Error('Runtime release ID is not saved');
	}
	const androidPath = masterManifestPath({
		archiveRoot,
		directory: 'manifests',
		platform: 'android',
		resourceVersion: release.android,
	});
	const iosPath = masterManifestPath({
		archiveRoot,
		directory: 'manifests',
		platform: 'ios',
		resourceVersion: release.ios,
	});
	const pair = createMasterReleasePair([
		parsePlatformManifest(JSON.parse(await readFile(androidPath, 'utf8'))),
		parsePlatformManifest(JSON.parse(await readFile(iosPath, 'utf8'))),
	]);
	if (pair.releaseId !== releaseId) {
		throw new Error('Runtime release index differs from saved manifests');
	}
	return { androidPath, iosPath };
}
