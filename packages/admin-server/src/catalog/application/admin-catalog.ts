import type { AdminCardCatalogEntry } from '../domain/admin-card-catalog.ts';

export type AdminCardCatalogReader = {
	read(): AdminCardCatalogEntry[];
};

export function getAdminCardCatalog(
	reader: AdminCardCatalogReader,
): AdminCardCatalogEntry[] {
	return reader.read();
}
