import { describe, expect, test } from 'bun:test';
import { mapItemDetailResponse } from '../src/v1/active-master-database/item-detail-response-mapper.ts';

describe('item detail response mapper', () => {
	test('公式のitem detail固定fieldを維持する', () => {
		expect(
			mapItemDetailResponse({
				id: 1,
				name: 'Item',
				description: 'Description',
				item_type: 2,
			}),
		).toEqual({
			itemId: 1,
			response: {
				body: {
					d_item_datas_id: '',
					description: 'Description',
					item_num: 0,
					item_type: 2,
					limit_date_time: null,
					name: 'Item',
					quest_list: [],
					resource_file_name: '',
					transition_scene: '',
				},
				statusCode: 200,
			},
		});
	});
});
