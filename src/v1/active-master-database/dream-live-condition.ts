import type { UserCardCollectionState } from '../../state/user-card-aggregate-state.ts';
import { hasUserCardSeries } from '../../state/user-card-aggregate-state.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import type { MemberFanLevelState } from '../../state/user-status-types.ts';
import type {
	DreamLiveConditionRow,
	DreamQuestSeriesRow,
} from './dream-live-master.ts';
import type { JsonRecord } from './types.ts';

const dreamLiveItemIds = new Map<number, number>([
	[1001, 3008001],
	[1002, 3008002],
	[1003, 3008003],
]);

export function createDreamLiveConditionResponse(
	condition: DreamLiveConditionRow,
	series: DreamQuestSeriesRow,
	userCards: UserCardCollectionState,
	inventory: UserInventoryState,
	memberFanLevels: ReadonlyArray<MemberFanLevelState>,
	itemName: string | undefined,
): JsonRecord {
	const achievedCount = dreamConditionAchievedCount(
		condition,
		series,
		userCards,
		inventory,
		memberFanLevels,
	);
	const requiredCount = dreamConditionRequiredCount(condition);
	return {
		condition_text: dreamConditionText(condition, series, itemName),
		achieve_count: achievedCount,
		is_release: achievedCount >= requiredCount,
		is_display_progress_num: condition.conditions_type !== 6,
	};
}

export function dreamLiveConditionItemId(
	condition: DreamLiveConditionRow,
	series: DreamQuestSeriesRow,
): number | undefined {
	if (
		condition.conditions_type === series.characters_id ||
		(condition.conditions_type !== 3 && condition.conditions_type !== 5)
	) {
		return undefined;
	}
	const itemId = dreamLiveItemIds.get(series.dream_live_series_list_id);
	if (itemId === undefined) {
		throw new Error(
			`Dream Live item not found: ${series.dream_live_series_list_id}`,
		);
	}
	return itemId;
}

function dreamConditionAchievedCount(
	condition: DreamLiveConditionRow,
	series: DreamQuestSeriesRow,
	userCards: UserCardCollectionState,
	inventory: UserInventoryState,
	memberFanLevels: ReadonlyArray<MemberFanLevelState>,
): number {
	if (condition.conditions_type === 1 || condition.conditions_type === 6) {
		return 0;
	}
	if (condition.conditions_type === 8) {
		return condition.conditions_values.filter((cardSeriesId) =>
			hasUserCardSeries(userCards, cardSeriesId),
		).length;
	}
	if (condition.conditions_type === series.characters_id) {
		return memberFanLevel(memberFanLevels, series.characters_id);
	}
	const itemId = dreamLiveConditionItemId(condition, series);
	return itemId === undefined ? 0 : userItemNum(inventory, itemId);
}

function memberFanLevel(
	memberFanLevels: ReadonlyArray<MemberFanLevelState>,
	characterId: number,
): number {
	const row = memberFanLevels.find(
		(memberFanLevel) => memberFanLevel.characterId === characterId,
	);
	if (row === undefined) {
		throw new Error(`Member fan level not found: ${characterId}`);
	}
	return row.memberFanLevel;
}

function dreamConditionRequiredCount(condition: DreamLiveConditionRow): number {
	return condition.conditions_type === 8
		? condition.conditions_values.length
		: firstConditionValue(condition);
}

function dreamConditionText(
	condition: DreamLiveConditionRow,
	series: DreamQuestSeriesRow,
	itemName: string | undefined,
): string {
	if (condition.conditions_type === 1) return '前のクエストをクリアしよう';
	if (condition.conditions_type === 6) return 'Gradeをシルバー1まで上げよう';
	if (condition.conditions_type === 8) {
		return 'Oracle Étude既存8枚をすべて入手しよう';
	}
	if (condition.conditions_type === series.characters_id) {
		return `${series.name}のファンレベルを${firstConditionValue(condition)}まで上げよう`;
	}
	if (condition.conditions_type === 3 || condition.conditions_type === 5) {
		if (itemName === undefined) {
			throw new Error(
				`Dream Live item name not found: ${series.dream_live_series_list_id}`,
			);
		}
		return `${itemName}を${firstConditionValue(condition)}個集めよう`;
	}
	throw new Error(
		`Unsupported Dream Live condition type: ${condition.conditions_type}`,
	);
}

function firstConditionValue(condition: DreamLiveConditionRow): number {
	const value = condition.conditions_values[0];
	if (value === undefined) {
		throw new Error(
			`Dream Live condition value not found: ${condition.conditions_type}`,
		);
	}
	return value;
}

function userItemNum(inventory: UserInventoryState, itemId: number): number {
	for (const category of inventory.itemCategoryList) {
		const item = category.userItemList.find(
			(userItem) => userItem.itemId === itemId,
		);
		if (item !== undefined) return item.itemNum;
	}
	return 0;
}
