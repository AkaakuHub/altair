import type { Database } from 'bun:sqlite';
import type { ArchiveGiftPointState } from '../../state/archive-gift-state.ts';
import { readArchiveListCatalog } from './archive-list-master-query.ts';
import { projectArchiveGiftProgress } from './archive-list-master-release-projection.ts';
import { parseArchiveListRequest } from './archive-list-request-parser.ts';
import { applyArchiveListRequest } from './archive-list-response-mapper.ts';

export function createArchiveListResponse(
	database: Database,
	archiveGiftPoints: readonly ArchiveGiftPointState[],
	playerId: string,
	request: unknown = {},
) {
	const catalog = readArchiveListCatalog(database);
	const projected = projectArchiveGiftProgress(
		database,
		catalog.archives,
		archiveGiftPoints,
		playerId,
		catalog.findPrizeMaster,
	);
	return {
		archive_list: applyArchiveListRequest(
			projected,
			parseArchiveListRequest(request),
			catalog.findPrizeMaster,
		),
		filterable_characters: catalog.filterableCharacters,
		sortable_fields: catalog.sortableFields,
	};
}
