import { readFile } from 'node:fs/promises';
import { resolvePlatformReleaseSources } from '../../master-archive/application/resolve-platform-release-sources.ts';
import { parsePlatformManifest } from '../../master-archive/domain/platform-manifest.ts';
import { masterManifestPath } from '../../master-archive/infrastructure/node-master-manifest-store.ts';
import type { RuntimeResourceSelection } from './runtime-resource-selection-schema.ts';

export async function resolveRuntimeResourceSelection(
	archiveRoot: string,
	selection: RuntimeResourceSelection,
) {
	const resolve = async (platform: 'android' | 'ios') => {
		const target = selection[platform];
		const source = await readManifest(
			archiveRoot,
			platform,
			target.resourceVersion,
		);
		if (source.manifest.clientVersion !== target.clientVersion)
			throw new Error(
				`${platform} saved master differs from the selected client version`,
			);
		return source;
	};
	const [android, ios] = await Promise.all([
		resolve('android'),
		resolve('ios'),
	]);
	const sources = resolvePlatformReleaseSources({
		android: android.manifest,
		ios: ios.manifest,
	});
	return {
		expectedReleaseId: sources.releaseIdentity,
		release: {
			kind: 'platform-selection' as const,
			manifests: { androidPath: android.path, iosPath: ios.path },
		},
	};
}

async function readManifest(
	archiveRoot: string,
	platform: 'android' | 'ios',
	resourceVersion: string,
) {
	const path = masterManifestPath({
		archiveRoot,
		directory: 'manifests',
		platform,
		resourceVersion,
	});
	let manifest: ReturnType<typeof parsePlatformManifest>;
	try {
		manifest = parsePlatformManifest(JSON.parse(await readFile(path, 'utf8')));
	} catch {
		throw new Error(`${platform} saved master is unavailable or invalid`);
	}
	if (
		manifest.platform !== platform ||
		manifest.resourceVersion !== resourceVersion
	)
		throw new Error(
			`${platform} saved master differs from the selected resource version`,
		);
	return { manifest, path };
}
