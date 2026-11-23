import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assertCatalogAssetPath } from '../../resources/domain/assets/catalogAssetPath.ts';
import type { MasterResourcePayloadReader } from '../domain/master-resource-import.ts';

export class FileMasterResourcePayloadReader
	implements MasterResourcePayloadReader
{
	constructor(private readonly root: string) {}
	async read(assetPath: string): Promise<Uint8Array> {
		assertCatalogAssetPath(assetPath);
		return new Uint8Array(await readFile(join(this.root, assetPath)));
	}
}
