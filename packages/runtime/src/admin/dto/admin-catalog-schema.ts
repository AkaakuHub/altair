import { z } from 'zod';

export const cardCatalogViewEntrySchema = z.object({
	cardDatasId: z.number(),
	dCardDatasId: z.string(),
	cardName: z.string(),
	characterId: z.number(),
	styleLevel: z.number(),
	maxStyleLevel: z.number(),
	limitBreakTimes: z.number(),
	maxLimitBreakTimes: z.number(),
});

export const userCardSchema = z.object({
	cardName: z.string(),
	d_card_datas_id: z.string(),
	card_datas_id: z.number(),
	style_level: z.number(),
	max_style_level: z.number(),
	limit_break_times: z.number(),
	max_limit_break_times: z.number(),
});

export const adminCardCollectionSchema = z.object({
	playerId: z.string(),
	userCardDataList: z.array(userCardSchema),
});

export type CardCatalogViewEntry = z.infer<typeof cardCatalogViewEntrySchema>;
export type UserCard = z.infer<typeof userCardSchema>;
export type AdminCardCollection = z.infer<typeof adminCardCollectionSchema>;
