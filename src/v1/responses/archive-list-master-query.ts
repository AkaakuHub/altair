import type { Database } from 'bun:sqlite';
import {
	getArchiveFilterableCharactersFromDatabase,
	getArchiveListFromDatabase,
	getArchivePrizeMasterFromDatabase,
	getArchiveSortableFieldsFromDatabase,
} from '../../master-data/archive-master-data.ts';

export function readArchiveListCatalog(database: Database) {
	return {
		archives: getArchiveListFromDatabase(database),
		filterableCharacters: getArchiveFilterableCharactersFromDatabase(database),
		sortableFields: getArchiveSortableFieldsFromDatabase(database),
		findPrizeMaster: (archiveId: string) =>
			getArchivePrizeMasterFromDatabase(database, archiveId),
	};
}
