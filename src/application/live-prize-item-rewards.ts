import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';
import {
	type applyUserReward,
	canApplyUserRewards,
	type RewardMasterData,
} from '../state/reward-state.ts';
import {
	findUserCards,
	hasUserCardTemplateSeries,
	readUserCardSeriesId,
} from '../state/user-card-aggregate-state.ts';

export function canApplyLivePrizeItemRewards(
	state: ServerState,
	user: RegisteredUserState,
	rewards: readonly Parameters<typeof applyUserReward>[2][],
	masterData: RewardMasterData,
): boolean {
	if (!canApplyUserRewards(state, user, rewards, masterData)) return false;
	const ownedCards = findUserCards(state, user.playerId);
	const cardSeriesIds = new Set<number>();
	for (const reward of rewards) {
		if (reward.itemType !== 2) continue;
		const template = masterData.getCardDetailTemplateByCardDatasId(
			reward.itemId,
		);
		if (
			template === undefined ||
			reward.amount !== 1 ||
			(ownedCards !== undefined &&
				hasUserCardTemplateSeries(ownedCards, template))
		)
			return false;
		const seriesId = readUserCardSeriesId(template);
		if (cardSeriesIds.has(seriesId)) return false;
		cardSeriesIds.add(seriesId);
	}
	return true;
}
