import type { CatalogSourceReader } from '../../resources/application/catalog/sourceReader.ts';
import type {
	MasterResourceCatalog,
	MasterResourceCatalogEntry,
} from '../domain/master-resource-import.ts';
import {
	isMasterResource,
	mapMasterCatalogEntry,
} from './master-catalog-entry-mapper.ts';

export class IosMasterCatalogAdapter implements MasterResourceCatalog {
	constructor(
		private readonly sourceReader: CatalogSourceReader,
		private readonly resourceVersion: string,
	) {}

	async readMasterEntries(): Promise<readonly MasterResourceCatalogEntry[]> {
		const entries = await this.sourceReader.read();
		return entries
			.filter(isMasterResource)
			.map((entry) =>
				mapMasterCatalogEntry('ios', this.resourceVersion, entry),
			);
	}
}
