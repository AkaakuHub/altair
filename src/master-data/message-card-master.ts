import type { Database } from 'bun:sqlite';
import type {
	MessageCardMaster,
	MessageCardShopMaster,
} from './gift-shop-definition.ts';

type MessageCardRow = {
	shop_item_id: number;
	item_id: number;
	name: string;
	order_id: number;
	description: string;
	item_type: number;
	item_quantity: number;
	is_paid_sis_ca_only: number;
	price: number;
	rarity: number;
	effect_value: number;
	start_time: string;
	end_time: string;
	message_length_limit: number;
};
export function getMessageCardShopItemsFromMaster(
	database: Database,
): MessageCardShopMaster[] {
	return database
		.query<MessageCardRow, []>(
			'SELECT s.id AS shop_item_id, s.item_id, i.name, s.order_id, i.description, s.item_type, s.item_num AS item_quantity, s.is_paid_sis_ca_only, s.price, i.rarity, i.effect_value, s.start_time, s.end_time, m.message_length_limit FROM master_sis_ca_store_datas s JOIN master_items i ON i.id = s.item_id JOIN master_message_cards m ON m.id = s.item_id WHERE s.item_type = 9 ORDER BY s.order_id, s.id',
		)
		.all()
		.map((row) => ({
			shopItemId: row.shop_item_id,
			itemId: row.item_id,
			name: row.name,
			orderId: row.order_id,
			description: row.description,
			itemType: row.item_type,
			itemQuantity: row.item_quantity,
			isPaidSiscaOnly: row.is_paid_sis_ca_only !== 0,
			price: row.price,
			rarity: row.rarity,
			effectValue: row.effect_value,
			startTime: toUtcZ(row.start_time),
			endTime: toUtcZ(row.end_time),
			limitCharactersNum: row.message_length_limit,
		}));
}
export function getMessageCardMasterByItemId(
	database: Database,
	itemId: number,
): MessageCardMaster | undefined {
	const row = database
		.query<
			{
				id: number;
				back_ground_color_code: string;
				message_text_color_code: string;
				message_text_size: number;
				is_message_text_bold: number;
				name_color_code: string;
			},
			[number]
		>(
			'SELECT id, back_ground_color_code, message_text_color_code, message_text_size, is_message_text_bold, name_color_code FROM master_message_cards WHERE id = ?',
		)
		.get(itemId);
	return row
		? {
				itemId: row.id,
				backgroundColor: row.back_ground_color_code,
				messageTextColor: row.message_text_color_code,
				messageTextSize: row.message_text_size,
				isMessageTextBold: row.is_message_text_bold !== 0,
				nameColor: row.name_color_code,
			}
		: undefined;
}
export function toUtcZ(value: string): string {
	return value.replace('+00:00', 'Z');
}
