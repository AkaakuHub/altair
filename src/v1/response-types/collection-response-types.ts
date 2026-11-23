import type { CollectionStickerInfo } from '../../state/sticker-definition.ts';
import type { CollectionCharacterCard } from '../active-master-database/collection-character-read-model.ts';

export type CollectionMusicInfoResponse = {
	musics_id: number;
	is_mastery: boolean;
	play_count: number;
	latest_play_time: string;
};
export type CollectionMusicListResponse = {
	music_info_list: CollectionMusicInfoResponse[];
};
export type GallaryListResponse = {
	gallary_info_list: { comics_id: number; name: string }[];
};
export type CollectionStickerListResponse = {
	sticker_info_list: CollectionStickerInfo[];
};
export type CollectionCharacterInfoRequest = { character_id: number };
export type CollectionCharacterInfoResponse = {
	collection_character_info: {
		character_id: number;
		name_last: string;
		name_first: string;
		latin_alphabet_name_last: string;
		latin_alphabet_name_first: string;
		character_voice: string;
		theme_color: string;
		card_list: CollectionCharacterCard[];
	};
};
