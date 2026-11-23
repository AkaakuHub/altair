import type { Database } from 'bun:sqlite';
import { getAdminCardCatalogFromDatabase } from '../../../../../src/master-data/card-catalog.ts';
import type { AdminCardCatalogReader } from '../application/admin-catalog.ts';

export class MasterDataAdminCardCatalogReader
	implements AdminCardCatalogReader
{
	constructor(private readonly database: Database) {}

	read() {
		return getAdminCardCatalogFromDatabase(this.database);
	}
}
