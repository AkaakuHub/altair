import type { Database } from 'bun:sqlite';
import { queryCollectionCharacterMasterRows } from './collection-character-master-query.ts';
import { createCollectionCharacterReadModels } from './collection-character-read-model.ts';
import { createCollectionCharacterStoredResponse } from './collection-character-response-mapper.ts';

export function createCollectionCharacterInfoResponse(
	database: Database,
	characterId: number,
): ReturnType<typeof createCollectionCharacterStoredResponse> {
	return createCollectionCharacterStoredResponse(
		characterId,
		createCollectionCharacterReadModels(
			queryCollectionCharacterMasterRows(database),
		),
	);
}
