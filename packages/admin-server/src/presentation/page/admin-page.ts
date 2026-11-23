import type { Database } from 'bun:sqlite';
import type { AdminSeedSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import { getActivityRecordAdminSummaryFromDatabase } from '../../../../../src/master-data/activity-record-master.ts';
import { getBeginnerMissionCategoriesFromDatabase } from '../../../../../src/master-data/beginner-mission-master-data.ts';
import { getAdminCardCatalogCountFromDatabase } from '../../../../../src/master-data/card-catalog.ts';
import { getSelectTicketSeriesExchangeTicketsFromDatabase } from '../../../../../src/master-data/gacha-select-ticket-master.ts';
import { getGachaSeriesAdminSummaryFromDatabase } from '../../../../../src/master-data/gacha-series-master.ts';
import { getItemCategoryCountFromDatabase } from '../../../../../src/master-data/item-master.ts';
import { getLoginBonusAdminSummaryFromDatabase } from '../../../../../src/master-data/login-bonus-master.ts';
import { getMissionGroupsFromDatabase } from '../../../../../src/master-data/mission-group-master-repository.ts';
import { getStepUpBeginnerMissionsFromDatabase } from '../../../../../src/master-data/step-up-beginner-mission-master-data.ts';
import type { AdminStatePage } from '../../state/domain/admin-state-page.ts';

function readSeedSummary(database: Database): AdminSeedSummary {
	return {
		gachaSeries: getGachaSeriesAdminSummaryFromDatabase(database),
		selectTicketSeries:
			getSelectTicketSeriesExchangeTicketsFromDatabase(database),
		beginnerMissionCategories:
			getBeginnerMissionCategoriesFromDatabase(database),
		stepUpBeginnerMissionList: getStepUpBeginnerMissionsFromDatabase(database),
		loginBonuses: getLoginBonusAdminSummaryFromDatabase(database),
		missionGroups: getMissionGroupsFromDatabase(database),
		activityRecordSeries: getActivityRecordAdminSummaryFromDatabase(database),
		userCardCount: getAdminCardCatalogCountFromDatabase(database),
		itemCategoryCount: getItemCategoryCountFromDatabase(database),
	};
}

export function readSeedSummaryForAdminPage(
	page: AdminStatePage,
	database: Database,
): AdminSeedSummary {
	if (page === 'all') {
		return readSeedSummary(database);
	}
	return {
		gachaSeries:
			page === 'gacha' || page === 'gacha-server'
				? getGachaSeriesAdminSummaryFromDatabase(database)
				: [],
		selectTicketSeries:
			page === 'gacha' || page === 'gacha-server'
				? getSelectTicketSeriesExchangeTicketsFromDatabase(database)
				: [],
		beginnerMissionCategories:
			page === 'missions'
				? getBeginnerMissionCategoriesFromDatabase(database)
				: [],
		stepUpBeginnerMissionList:
			page === 'missions'
				? getStepUpBeginnerMissionsFromDatabase(database)
				: [],
		loginBonuses:
			page === 'login-bonus' || page === 'login-bonus-server'
				? getLoginBonusAdminSummaryFromDatabase(database)
				: [],
		missionGroups:
			page === 'missions' ? getMissionGroupsFromDatabase(database) : [],
		activityRecordSeries:
			page === 'activity-record'
				? getActivityRecordAdminSummaryFromDatabase(database)
				: [],
		userCardCount: getAdminCardCatalogCountFromDatabase(database),
		itemCategoryCount: getItemCategoryCountFromDatabase(database),
	};
}
