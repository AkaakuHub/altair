import { createHash } from 'node:crypto';
import {
	type PlatformManifest,
	parsePlatformManifest,
	platformManifestIdentity,
} from './platform-manifest.ts';
import { resourceVersionRevision } from './resource-version.ts';

type MasterReleasePair = Readonly<{
	releaseId: string;
	android: PlatformManifest;
	ios: PlatformManifest;
}>;

export function createMasterReleasePair(
	manifestValues: readonly unknown[],
): MasterReleasePair {
	const { android, ios } = parsePlatformManifests(manifestValues);
	if (android.clientVersion !== ios.clientVersion) {
		throw new Error('release pair client versions differ');
	}
	if (
		resourceVersionRevision(android.resourceVersion) !==
		resourceVersionRevision(ios.resourceVersion)
	) {
		throw new Error('release pair resource revisions differ');
	}
	const releaseId = createHash('sha256')
		.update(
			JSON.stringify({
				androidManifestIdentity: platformManifestIdentity(android),
				iosManifestIdentity: platformManifestIdentity(ios),
			}),
		)
		.digest('hex');
	return { releaseId, android, ios };
}

export function parsePlatformManifests(manifestValues: readonly unknown[]) {
	const manifests = manifestValues.map(parsePlatformManifest);
	if (manifests.length !== 2) {
		throw new Error('release pair requires exactly Android and iOS manifests');
	}
	const android = manifests.find((manifest) => manifest.platform === 'android');
	const ios = manifests.find((manifest) => manifest.platform === 'ios');
	if (android === undefined || ios === undefined) {
		throw new Error('release pair requires one Android and one iOS manifest');
	}

	return { android, ios };
}
