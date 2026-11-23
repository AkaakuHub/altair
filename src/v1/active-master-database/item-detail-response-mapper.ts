import type { ItemDetailTemplateResponse } from '../response-types/shop-inventory-response-types.ts';
export type ItemDetailRow = {
	id: number;
	name: string;
	description: string;
	item_type: number;
};
export function mapItemDetailResponse(row: ItemDetailRow): {
	itemId: number;
	response: { body: ItemDetailTemplateResponse; statusCode: 200 };
} {
	return {
		itemId: row.id,
		response: {
			body: {
				d_item_datas_id: '',
				description: row.description,
				item_num: 0,
				item_type: row.item_type,
				limit_date_time: null,
				name: row.name,
				quest_list: [],
				resource_file_name: '',
				transition_scene: '',
			},
			statusCode: 200,
		},
	};
}
