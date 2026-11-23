import type {
	ActivityRecordAdvRow,
	ActivityRecordSeriesRow,
} from './activity-record-master-queries.ts';

export type ActivityRecordMonthlyInfo = {
	adv_series_id: number;
	monthly_title: string;
	monthly_description: string;
	is_monthly_not_watched: boolean;
	is_current_season: boolean;
	monthly_start_date: string;
	monthly_end_date: string;
	adv_info_list: ActivityRecordAdvInfo[];
	is_not_displayed_new_part: boolean;
};

type ActivityRecordAdvInfo = {
	adv_data_id: number;
	title: string;
	order_id: number;
	subtitle: string;
	description: string;
	watchable_status: number;
	is_not_watched: boolean;
	open_season_fan_level: number;
	watch_reward_list: ActivityRecordWatchReward[];
	adv_unlock_item_num: number;
};

export type ActivityRecordWatchReward = {
	watch_reward_type: number;
	watch_reward_id: number;
	watch_reward_num: number;
};

export function createActivityRecordMonthlyInfoList(
	seriesRows: readonly ActivityRecordSeriesRow[],
	advRows: readonly ActivityRecordAdvRow[],
	currentSeriesId: number | null,
	watchedAdvDataIds: ReadonlySet<number>,
	displayedAdvSeriesIds: ReadonlySet<number>,
	unlockedAdvDataIds: ReadonlySet<number>,
	unlockItemNumByItemId: ReadonlyMap<number, number>,
): ActivityRecordMonthlyInfo[] {
	return seriesRows.map((series) => {
		const advInfoList = advRows
			.filter((adv) => adv.adv_series_id === series.id)
			.map((adv) =>
				createAdvInfo(
					adv,
					watchedAdvDataIds,
					unlockedAdvDataIds,
					unlockItemNumByItemId,
				),
			);
		return {
			adv_series_id: series.id,
			monthly_title: series.name,
			monthly_description: series.description,
			is_monthly_not_watched: advInfoList.some((adv) => adv.is_not_watched),
			is_current_season: series.id === currentSeriesId,
			monthly_start_date: formatUtcDateTime(series.start_time),
			monthly_end_date: formatUtcDateTime(series.end_time),
			adv_info_list: advInfoList,
			is_not_displayed_new_part:
				series.is_badge_display_type === 1 &&
				!displayedAdvSeriesIds.has(series.id),
		};
	});
}

export function createActivityRecordWatchRewardList(
	adv: ActivityRecordAdvRow,
): ActivityRecordWatchReward[] {
	const rewardTypes = splitNumberList(adv.reward_type);
	const rewardIds = splitNumberList(adv.watch_reward_id);
	const rewardNums = splitNumberList(adv.watch_reward_num);
	if (
		rewardTypes.length === 0 ||
		rewardTypes.length !== rewardIds.length ||
		rewardTypes.length !== rewardNums.length
	) {
		return [];
	}
	return rewardTypes.map((rewardType, index) => ({
		watch_reward_type: rewardType,
		watch_reward_id: rewardIds[index] ?? 0,
		watch_reward_num: rewardNums[index] ?? 0,
	}));
}

function createAdvInfo(
	adv: ActivityRecordAdvRow,
	watchedAdvDataIds: ReadonlySet<number>,
	unlockedAdvDataIds: ReadonlySet<number>,
	unlockItemNumByItemId: ReadonlyMap<number, number>,
): ActivityRecordAdvInfo {
	return {
		adv_data_id: adv.id,
		title: adv.name,
		order_id: adv.order_id,
		subtitle: adv.sub_title_name,
		description: adv.description,
		watchable_status: createWatchableStatus(
			adv,
			watchedAdvDataIds,
			unlockedAdvDataIds,
		),
		is_not_watched: !watchedAdvDataIds.has(adv.id),
		open_season_fan_level: adv.open_season_fan_level,
		watch_reward_list: createActivityRecordWatchRewardList(adv),
		adv_unlock_item_num:
			adv.adv_unlock_item_id > 0
				? (unlockItemNumByItemId.get(adv.adv_unlock_item_id) ?? 0)
				: 0,
	};
}

function createWatchableStatus(
	adv: ActivityRecordAdvRow,
	watchedAdvDataIds: ReadonlySet<number>,
	unlockedAdvDataIds: ReadonlySet<number>,
): number {
	if (watchedAdvDataIds.has(adv.id) || unlockedAdvDataIds.has(adv.id)) {
		return 1;
	}
	if (
		adv.adv_unlock_condition_value > 0 &&
		!watchedAdvDataIds.has(adv.adv_unlock_condition_value) &&
		!unlockedAdvDataIds.has(adv.adv_unlock_condition_value)
	) {
		return 7;
	}
	if (adv.adv_unlock_item_num > 0) {
		return 6;
	}
	return 1;
}

function splitNumberList(value: string | null): number[] {
	if (value === null || value.length === 0) {
		return [];
	}
	return value.split(',').map((entry) => Number.parseInt(entry, 10));
}

function formatUtcDateTime(value: string): string {
	return value.replace('+00:00', 'Z');
}
