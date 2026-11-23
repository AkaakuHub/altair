import { z } from 'zod';
import type {
	ActivityRecordAdvAdminSummaryMaster,
	ActivityRecordSeriesAdminSummaryMaster,
} from '../../../../../src/master-data/activity-record-master.ts';
import type { SelectTicketSeriesExchangeTicketMaster } from '../../../../../src/master-data/gacha-select-ticket-master.ts';
import type { GachaSeriesSummaryMaster } from '../../../../../src/master-data/gacha-series-master.ts';
import type {
	LoginBonusAdminRewardSummaryMaster,
	LoginBonusAdminSummaryMaster,
} from '../../../../../src/master-data/login-bonus-master.ts';
import type { GachaGuaranteeExchangeRate } from '../../../../../src/state/gacha-definition.ts';
import type { MissionGroupMaster } from '../../../../../src/state/mission-master.ts';
import { objectSchema } from './dto-schema-utils.ts';

const beginnerMissionEntrySchema = z.object({
	missionId: z.number(),
	name: z.string(),
	description: z.string(),
	conditionAchieveNum: z.number(),
	transitionContentsId: z.number(),
	sortOrder: z.number(),
});

const beginnerMissionCategorySchema = z.object({
	missionType: z.number(),
	missionList: z.array(beginnerMissionEntrySchema),
});

const gachaSeriesSummarySchema: z.ZodType<GachaSeriesSummaryMaster> = z.object({
	gachaSeriesId: z.number(),
	title: z.string(),
	gachaType: z.number(),
	isPartyGacha: z.boolean(),
	cardList: z.array(z.number()),
	cardCount: z.number(),
	guaranteeExchangeRateList: z.array(
		objectSchema<GachaGuaranteeExchangeRate>(),
	),
	guaranteeExchangeRateCount: z.number(),
	isSingleEnable: z.boolean(),
	isConsectiveEnable: z.boolean(),
	isPaidEnable: z.boolean(),
	isCurrentlyOpen: z.boolean(),
	startTime: z.string(),
	endTime: z.string(),
	timeLimitGachaEndTime: z.string().nullable(),
});

const loginBonusRewardSummarySchema: z.ZodType<LoginBonusAdminRewardSummaryMaster> =
	z.object({
		dayCount: z.number(),
		rewardType: z.number(),
		rewardId: z.number(),
		amount: z.number(),
		name: z.string(),
	});

const loginBonusSummarySchema: z.ZodType<LoginBonusAdminSummaryMaster> =
	z.object({
		loginBonusId: z.number(),
		loginBonusKind: z.enum(['normal', 'event']),
		name: z.string(),
		dayCount: z.number(),
		startTime: z.string(),
		endTime: z.string(),
		rewards: z.array(loginBonusRewardSummarySchema),
	});

const activityRecordAdvSummarySchema: z.ZodType<ActivityRecordAdvAdminSummaryMaster> =
	z.object({
		advDataId: z.number(),
		title: z.string(),
		orderId: z.number(),
	});

const activityRecordSeriesSummarySchema: z.ZodType<ActivityRecordSeriesAdminSummaryMaster> =
	z.object({
		advSeriesId: z.number(),
		name: z.string(),
		advList: z.array(activityRecordAdvSummarySchema),
	});

const selectTicketSeriesSummarySchema: z.ZodType<SelectTicketSeriesExchangeTicketMaster> =
	z.object({
		selectTicketSeriesId: z.number(),
		exchangeTicketId: z.number(),
		startTime: z.string(),
		endTime: z.string(),
	});

export const seedSummarySchema = z.object({
	gachaSeries: z.array(gachaSeriesSummarySchema),
	selectTicketSeries: z.array(selectTicketSeriesSummarySchema),
	beginnerMissionCategories: z.array(beginnerMissionCategorySchema),
	stepUpBeginnerMissionList: z.array(z.object({ missionId: z.number() })),
	loginBonuses: z.array(loginBonusSummarySchema),
	missionGroups: z.array(objectSchema<MissionGroupMaster>()),
	activityRecordSeries: z.array(activityRecordSeriesSummarySchema),
	userCardCount: z.number(),
	itemCategoryCount: z.number(),
});

export type AdminSeedSummary = z.infer<typeof seedSummarySchema>;
export type ActivityRecordAdvSummary = z.infer<
	typeof activityRecordAdvSummarySchema
>;
export type ActivityRecordSeriesSummary = z.infer<
	typeof activityRecordSeriesSummarySchema
>;
export type BeginnerMissionEntry = z.infer<typeof beginnerMissionEntrySchema>;
export type GachaSeriesSummary = z.infer<typeof gachaSeriesSummarySchema>;
export type SelectTicketSeriesSummary = z.infer<
	typeof selectTicketSeriesSummarySchema
>;
export type LoginBonusSummary = z.infer<typeof loginBonusSummarySchema>;
export type MissionCatalogEntry =
	AdminSeedSummary['missionGroups'][number]['missionList'][number];
