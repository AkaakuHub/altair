import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cloneJsonObject, type JsonObject } from './state/json-state-utils.ts';

export const officialUserInitialStateCatalog = {
	cards: 'user_card_get_list_official.json',
	items: 'user_items_get_list_official.json',
} as const;

export function readOfficialUserInitialStateObject(
	root: string,
	fileName: (typeof officialUserInitialStateCatalog)[keyof typeof officialUserInitialStateCatalog],
): JsonObject {
	return cloneJsonObject(
		JSON.parse(readFileSync(join(root, fileName), 'utf8')),
		fileName,
	);
}
