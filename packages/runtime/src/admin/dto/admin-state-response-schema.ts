import { z } from 'zod';
import type {
	MemberFanLevelBoundary,
	SeasonFanLevelBoundary,
} from '../../../../../src/master-data/member-fan-level-master.ts';
import type { SeasonMasterEntry } from '../../../../../src/master-data/season-master-data.ts';
import type { ItemCatalogEntry } from '../../../../../src/state/item-definition.ts';
import {
	adminCardCollectionSchema,
	cardCatalogViewEntrySchema,
} from './admin-catalog-schema.ts';
import { chapterSummarySchema } from './admin-chapter-schema.ts';
import { gradeChallengeSummarySchema } from './admin-grade-challenge-schema.ts';
import { gradeLiveSummarySchema } from './admin-grade-live-schema.ts';
import {
	grandPrixDetailSchema,
	grandPrixSummarySchema,
	musicLevelBoundarySchema,
} from './admin-grand-prix-schema.ts';
import { seedSummarySchema } from './admin-seed-schema.ts';
import { standardQuestAreaSchema } from './admin-standard-quest-schema.ts';
import {
	adminStickerCatalogEntrySchema,
	adminStickerCollectionSchema,
} from './admin-sticker-schema.ts';
import { userStatusViewSchema } from './admin-user-status-view-schema.ts';
import { adminVisibleServerStateSchema } from './admin-visible-state-schema.ts';
import { objectSchema } from './dto-schema-utils.ts';
import { runtimeReleaseOptionSchema } from './runtime-resource-version-schema.ts';

export const adminStateResponseSchema = z.object({
	state: adminVisibleServerStateSchema,
	userStatus: userStatusViewSchema,
	seed: seedSummarySchema,
	itemCatalog: z.array(objectSchema<ItemCatalogEntry>()),
	cardCatalog: z.array(cardCatalogViewEntrySchema),
	cardCollection: adminCardCollectionSchema.nullable(),
	stickerCatalog: z.array(adminStickerCatalogEntrySchema),
	stickerCollection: adminStickerCollectionSchema.nullable(),
	memberFanLevelTable: z.array(objectSchema<MemberFanLevelBoundary>()),
	seasonFanLevelTable: z.array(objectSchema<SeasonFanLevelBoundary>()),
	seasonList: z.array(objectSchema<SeasonMasterEntry>()),
	musicLevelTable: z.array(musicLevelBoundarySchema),
	standardQuestAreas: z.array(standardQuestAreaSchema),
	chapterList: z.array(chapterSummarySchema),
	grandPrixList: z.array(grandPrixSummarySchema),
	grandPrixDetail: grandPrixDetailSchema,
	gradeChallengeList: z.array(gradeChallengeSummarySchema),
	gradeLiveList: z.array(gradeLiveSummarySchema),
	runtimeReleaseOptions: z.array(runtimeReleaseOptionSchema),
});

export type AdminStateResponse = z.infer<typeof adminStateResponseSchema>;

export function parseAdminStateResponse(value: unknown): AdminStateResponse {
	return adminStateResponseSchema.parse(value);
}
