import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { canonicalCatalogRelativePath } from '../../canonical-catalog-import/domain/catalog-import-identity.ts';
import { resolveRuntimeStorageLayout } from '../../configuration/runtime-storage-layout.ts';
import type { ResourceVersionRegistry } from '../../resource-versions.ts';

export type SavedJsonReference = Readonly<{
	identity: string;
	path: string;
}>;

export type SavedDerivedSources = Readonly<{
	archiveList?: SavedJsonReference;
	archiveDetails?: SavedJsonReference;
	withStationList?: SavedJsonReference;
	withStationDetails?: SavedJsonReference;
	webViewGacha: readonly SavedJsonReference[];
}>;

export function resolveMasterArchiveRoot(
	environment: NodeJS.ProcessEnv = process.env,
): string {
	return resolveRuntimeStorageLayout(environment).masterArchiveRoot;
}

export async function locateSavedDerivedSources(
	environment: NodeJS.ProcessEnv = process.env,
): Promise<SavedDerivedSources> {
	const storage = resolveRuntimeStorageLayout(environment);
	const archiveDataRoot = existsSync(storage.archiveSourceRoot)
		? storage.archiveSourceRoot
		: undefined;
	const gachaRoot = existsSync(storage.webViewGachaSourceRoot)
		? storage.webViewGachaSourceRoot
		: undefined;
	const webViewGacha =
		gachaRoot === undefined
			? []
			: Array.from(
					new Bun.Glob('*.json').scanSync({ cwd: gachaRoot, absolute: true }),
				)
					.sort()
					.map((path) => ({
						identity: basename(path, '.json'),
						path,
					}));
	if (gachaRoot !== undefined && webViewGacha.length === 0) {
		throw new Error('Saved WebView gacha sources are empty');
	}
	return {
		...(archiveDataRoot === undefined
			? {}
			: { archiveList: savedJsonReference(archiveDataRoot, 'archive.json') }),
		...(archiveDataRoot === undefined
			? {}
			: {
					archiveDetails: savedJsonReference(
						archiveDataRoot,
						'archive-details.json',
					),
				}),
		...(archiveDataRoot === undefined
			? {}
			: {
					withStationList: savedJsonReference(
						archiveDataRoot,
						'with-station.json',
					),
				}),
		...(archiveDataRoot === undefined
			? {}
			: {
					withStationDetails: savedJsonReference(
						archiveDataRoot,
						'with-station-details.json',
					),
				}),
		webViewGacha,
	};
}

export async function savedCatalogProfiles(
	registry: ResourceVersionRegistry,
	catalogRoot: string,
): Promise<
	readonly Readonly<{
		platform: 'android' | 'ios';
		clientVersion: string;
		resourceVersion: string;
		path: string;
	}>[]
> {
	const indexed = (['android', 'ios'] as const).flatMap((platform) =>
		Object.entries(registry[platform]).flatMap(
			([clientVersion, resourceVersions]) =>
				resourceVersions.map((resourceVersion) => {
					const profile = { platform, clientVersion, resourceVersion };
					return {
						...profile,
						path: join(catalogRoot, canonicalCatalogRelativePath(profile)),
					};
				}),
		),
	);
	const available = await Promise.all(
		indexed.map(async (profile) => ({
			profile,
			exists: await Bun.file(profile.path).exists(),
		})),
	);
	return available
		.filter((entry) => entry.exists)
		.map((entry) => entry.profile);
}

export async function fileSha256(path: string): Promise<string> {
	return createHash('sha256')
		.update(await Bun.file(path).bytes())
		.digest('hex');
}

export function savedJsonReference(
	root: string,
	identity: string,
): SavedJsonReference {
	return { identity, path: join(root, identity) };
}

export function savedJsonReferences(
	root: string,
): readonly SavedJsonReference[] {
	const paths = Array.from(
		new Bun.Glob('*.json').scanSync({ cwd: root, absolute: true }),
	).sort();
	if (paths.length === 0)
		throw new Error(`Saved JSON sources are empty: ${root}`);
	return paths.map((path) => ({ identity: basename(path), path }));
}
