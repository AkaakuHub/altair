import type { UserInventoryState } from './user-item-definition.ts';
import { MAX_STAMINA_NATURAL_CAP } from './user-status-stamina.ts';
import type { UserStatusState } from './user-status-types.ts';

export const GRADE_POINT_ITEM_TYPE = 8;
export const PLAY_POINT_CAP_UP_ITEM_ID = 3001100;

const INITIAL_STAMINA_NATURAL_CAP = 100;

export type GradePlayPointCapBonusResolver = (gradePoint: number) => number;

export function syncGradePlayPointCap(
	status: UserStatusState,
	inventory: UserInventoryState,
	resolveGradePlayPointCapBonus: GradePlayPointCapBonusResolver,
): void {
	const gradePoint = totalGradePoint(inventory);
	status.staminaMax = Math.max(
		status.staminaMax,
		calculateGradePlayPointNaturalCap(
			gradePoint,
			resolveGradePlayPointCapBonus(gradePoint),
		),
	);
}

function calculateGradePlayPointNaturalCap(
	_gradePoint: number,
	gradePlayPointCapBonus: number,
): number {
	return Math.min(
		MAX_STAMINA_NATURAL_CAP,
		INITIAL_STAMINA_NATURAL_CAP + gradePlayPointCapBonus,
	);
}

function totalGradePoint(inventory: UserInventoryState): number {
	return inventory.itemCategoryList
		.flatMap((category) => category.userItemList)
		.filter((item) => item.itemType === GRADE_POINT_ITEM_TYPE)
		.reduce((total, item) => total + item.itemNum, 0);
}
