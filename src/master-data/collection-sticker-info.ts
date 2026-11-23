import type { Database } from 'bun:sqlite';
import type { CollectionStickerInfo } from '../state/sticker-definition.ts';
import { currentUtcIsoDateTime } from './master-time.ts';

type StickerRow = {
	id: number;
	category_type: number;
	category_name: number;
	name: string;
	text: string;
	characters_id: number;
	is_variant: number;
	season_id: number;
	requirement_value: number;
	requirement_text: string;
	edit_requirement_value: number;
	edit_requirement_text: string;
};

export function getCollectionStickerInfoListFromDatabase(
	database: Database,
): CollectionStickerInfo[] {
	const now = currentUtcIsoDateTime();
	return activeStickerRows(database, now).map((sticker) => ({
		stickers_id: sticker.id,
		category_type: sticker.category_type,
		category_name: sticker.category_name,
		name: sticker.name,
		text: sticker.text,
		character_id: sticker.characters_id,
		is_variant: sticker.is_variant,
		season_id: sticker.season_id,
		requirement_text: sticker.requirement_text,
		requirement_num: sticker.requirement_value,
		requirement_progress: 0,
		variant_requirement_text: sticker.edit_requirement_text,
		variant_requirement_num: sticker.edit_requirement_value,
		variant_requirement_progress: 0,
		is_owned: false,
		is_available_variant: false,
		create_time: null,
	}));
}

function activeStickerRows(database: Database, now: string): StickerRow[] {
	return database
		.query<StickerRow, [string, string]>(
			[
				'SELECT id, category_type, category_name, name, text, characters_id,',
				'is_variant, season_id, requirement_value, requirement_text,',
				'edit_requirement_value, edit_requirement_text',
				'FROM master_stickers',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id',
			].join(' '),
		)
		.all(now, now);
}
