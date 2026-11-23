import type { EntityProvenance } from '../state/entity-provenance.ts';
import {
	addPresentBoxItem,
	type UserPresentBoxState,
} from '../state/user-presents-state.ts';

const ACTIVITY_RECORD_FIRST_WATCH_COMMENT = '活動記録の初回閲覧特典です。';
const PRESENT_RECEIPT_LIMIT_DAYS = 30;
const ITEM_REWARD_TYPE = 3;

type ActivityRecordWatchReward = {
	watch_reward_type: number;
	watch_reward_id: number;
	watch_reward_num: number;
};

type PresentItemDefinition = {
	itemId: number;
	itemType: number;
	name: string;
};

export function addActivityRecordFirstWatchPresents(
	presentBox: UserPresentBoxState,
	watchRewardList: readonly ActivityRecordWatchReward[],
	getItemDefinition: (itemId: number) => PresentItemDefinition | undefined,
	getRewardProvenance: (itemId: number, itemType: number) => EntityProvenance,
): void {
	const receiptLimitTime = new Date(
		Date.now() + PRESENT_RECEIPT_LIMIT_DAYS * 24 * 60 * 60 * 1000,
	).toISOString();
	const presents = [];
	for (const reward of watchRewardList) {
		if (reward.watch_reward_type !== ITEM_REWARD_TYPE) {
			continue;
		}
		const itemDefinition = getItemDefinition(reward.watch_reward_id);
		if (itemDefinition === undefined) {
			throw new Error(
				`activity record watch reward item not found: ${reward.watch_reward_id}`,
			);
		}
		presents.push({
			definition: {
				itemId: itemDefinition.itemId,
				itemType: itemDefinition.itemType,
				name: itemDefinition.name,
			},
			num: reward.watch_reward_num,
			provenance: getRewardProvenance(
				itemDefinition.itemId,
				itemDefinition.itemType,
			),
		});
	}
	for (const present of presents) {
		addPresentBoxItem(
			presentBox,
			present.definition,
			present.num,
			ACTIVITY_RECORD_FIRST_WATCH_COMMENT,
			receiptLimitTime,
			'',
			present.provenance,
		);
	}
}
