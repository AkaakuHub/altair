export type CollectionStickerInfo = {
	stickers_id: number;
	category_type: number;
	category_name: number;
	name: string;
	text: string;
	character_id: number;
	is_variant: number;
	season_id: number;
	requirement_text: string;
	requirement_num: number;
	requirement_progress: number;
	variant_requirement_text: string;
	variant_requirement_num: number;
	variant_requirement_progress: number;
	is_owned: boolean;
	is_available_variant: boolean;
	create_time: string | null;
};
