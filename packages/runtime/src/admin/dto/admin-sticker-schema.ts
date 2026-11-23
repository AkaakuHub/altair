import { z } from 'zod';

export const adminStickerCatalogEntrySchema = z.object({
	stickers_id: z.number(),
	name: z.string(),
	text: z.string(),
	character_id: z.number(),
});

export const adminUserStickerSchema = adminStickerCatalogEntrySchema.extend({
	requirement_num: z.number(),
	requirement_progress: z.number(),
	variant_requirement_num: z.number(),
	variant_requirement_progress: z.number(),
	is_owned: z.boolean(),
	is_available_variant: z.boolean(),
	create_time: z.string().nullable(),
});

export const adminStickerCollectionSchema = z.object({
	playerId: z.string(),
	stickerInfoList: z.array(adminUserStickerSchema),
});

export type AdminStickerCatalogEntry = z.infer<
	typeof adminStickerCatalogEntrySchema
>;

export type AdminUserSticker = z.infer<typeof adminUserStickerSchema>;

export type AdminStickerCollection = z.infer<
	typeof adminStickerCollectionSchema
>;
