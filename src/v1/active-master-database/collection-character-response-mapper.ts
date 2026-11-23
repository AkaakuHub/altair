import type { CollectionCharacterInfoResponse } from '../response-types/collection-response-types.ts';
import type { CollectionCharacterReadModel } from './collection-character-read-model.ts';
import type { StoredResponse } from './types.ts';

export function createCollectionCharacterStoredResponse(
	characterId: number,
	characters: ReadonlyMap<number, CollectionCharacterReadModel>,
): StoredResponse<CollectionCharacterInfoResponse> | undefined {
	if (!Number.isInteger(characterId) || characterId <= 0) {
		return undefined;
	}
	const character = characters.get(characterId);
	if (!character) {
		return undefined;
	}
	return {
		body: {
			collection_character_info: {
				character_id: character.characterId,
				name_last: character.nameLast,
				name_first: character.nameFirst,
				latin_alphabet_name_last: character.latinAlphabetNameLast,
				latin_alphabet_name_first: character.latinAlphabetNameFirst,
				character_voice: character.characterVoice,
				theme_color: character.themeColor,
				card_list: character.cards,
			},
		},
		statusCode: 200,
	};
}
