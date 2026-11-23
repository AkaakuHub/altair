import type { UserActivityRecordState } from '../../../../../../src/state/activity-record-types.ts';
import {
	type JsonRecord,
	readNumber,
	readRecordArray,
} from '../official-data-migration-dump.ts';

export function createActivityRecordFromResponse(
	playerId: string,
	response: JsonRecord | undefined,
): UserActivityRecordState | null {
	if (response === undefined) {
		return null;
	}
	const monthlyInfoList = readRecordArray(
		response.activity_record_monthly_info_list,
	);
	const advInfoList = monthlyInfoList.flatMap((monthlyInfo) =>
		readRecordArray(monthlyInfo.adv_info_list),
	);
	return {
		playerId,
		watchedActivityRecordAdvDataIds: advInfoList
			.filter((advInfo) => advInfo.is_not_watched === false)
			.map((advInfo) => readNumber(advInfo.adv_data_id))
			.filter((advDataId): advDataId is number => advDataId !== null),
		displayedActivityRecordAdvSeriesIds: monthlyInfoList
			.filter((monthlyInfo) => monthlyInfo.is_not_displayed_new_part === false)
			.map((monthlyInfo) => readNumber(monthlyInfo.adv_series_id))
			.filter((advSeriesId): advSeriesId is number => advSeriesId !== null),
		unlockedActivityRecordAdvDataIds: advInfoList
			.filter((advInfo) => (readNumber(advInfo.watchable_status) ?? 0) > 0)
			.map((advInfo) => readNumber(advInfo.adv_data_id))
			.filter((advDataId): advDataId is number => advDataId !== null),
		watchedActivityRecordAdvMemberships: [],
		displayedActivityRecordAdvSeriesMemberships: [],
		unlockedActivityRecordAdvMemberships: [],
	};
}
