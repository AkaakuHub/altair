import { createHash } from 'node:crypto';
import { mkdir, open, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SavedMasterVersionsImportPorts } from '../application/saved-master-versions-import-service.ts';

type ManifestStore = SavedMasterVersionsImportPorts['manifestStore'];

export class NodeMasterManifestStore implements ManifestStore {
	constructor(private readonly archiveRoot: string) {}

	async writeCatalog(
		manifest: Parameters<ManifestStore['writeCatalog']>[0],
	): Promise<void> {
		await writeImmutableJson(
			masterManifestPath({
				archiveRoot: this.archiveRoot,
				directory: 'catalog-manifests',
				platform: manifest.platform,
				resourceVersion: manifest.resourceVersion,
			}),
			manifest,
		);
	}

	async writeVerified(
		manifest: Parameters<ManifestStore['writeVerified']>[0],
	): Promise<void> {
		await writeImmutableJson(
			masterManifestPath({
				archiveRoot: this.archiveRoot,
				directory: 'manifests',
				platform: manifest.platform,
				resourceVersion: manifest.resourceVersion,
			}),
			manifest,
		);
	}
}

export function masterManifestPath(input: {
	archiveRoot: string;
	directory: 'catalog-manifests' | 'manifests';
	platform: 'android' | 'ios';
	resourceVersion: string;
}): string {
	const id = createHash('sha256').update(input.resourceVersion).digest('hex');
	return join(input.archiveRoot, input.directory, input.platform, `${id}.json`);
}

async function writeImmutableJson(path: string, value: unknown): Promise<void> {
	const bytes = new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
	await mkdir(dirname(path), { recursive: true });
	try {
		const handle = await open(path, 'wx');
		try {
			await handle.writeFile(bytes);
		} finally {
			await handle.close();
		}
	} catch (error) {
		if (!isNodeError(error, 'EEXIST')) throw error;
		const existing = await readFile(path);
		if (!existing.equals(bytes)) {
			throw new Error(`Master manifest already differs: ${path}`);
		}
	}
}

function isNodeError(
	error: unknown,
	code: string,
): error is Error & { code: string } {
	return error instanceof Error && 'code' in error && error.code === code;
}
