import type { GrandPrixRuntimeState } from '../../server-state-schema.ts';
import type { UserDailyQuestState } from '../../state/daily-quest-state.ts';
import { isGrandPrixPlayable } from '../../state/grand-prix-runtime-status.ts';

export type HomePlayableBadgeProjection = Readonly<{
	hasDailyTicket: boolean;
	hasGrandPrixPlayableCount: boolean;
}>;

export function projectHomePlayableBadges(
	dailyQuest: UserDailyQuestState,
	grandPrix: GrandPrixRuntimeState,
): HomePlayableBadgeProjection {
	return {
		hasDailyTicket: dailyQuest.userDailyTicketInfo.num > 0,
		hasGrandPrixPlayableCount:
			isGrandPrixPlayable(grandPrix) && grandPrix.dailyPlayableCount > 0,
	};
}
