import { platformDatabaseReleaseIdentity } from '../domain/platform-database-build.ts';
import {
	type PlatformManifest,
	platformManifestIdentity,
} from '../domain/platform-manifest.ts';

export function resolvePlatformReleaseSources(
	manifests: Readonly<{ android: PlatformManifest; ios: PlatformManifest }>,
) {
	const resolve = (manifest: PlatformManifest) => ({
		manifest,
		releaseIdentity: platformManifestIdentity(manifest),
		clientVersion: manifest.clientVersion,
		resourceVersion: manifest.resourceVersion,
	});
	const android = resolve(manifests.android);
	const ios = resolve(manifests.ios);
	return {
		android,
		ios,
		releaseIdentity: platformDatabaseReleaseIdentity({
			android: android.releaseIdentity,
			ios: ios.releaseIdentity,
		}),
	};
}
export type PlatformReleaseSources = ReturnType<
	typeof resolvePlatformReleaseSources
>;
