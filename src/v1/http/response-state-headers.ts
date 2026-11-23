import { Buffer } from 'node:buffer';
import { ensureChapterRuntimeState } from '../../server-state.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { getRequestUserChapterHeader } from '../../state/chapter-progress-state.ts';
import { isGrandPrixPlayable } from '../../state/grand-prix-runtime-status.ts';
import { getUserHeaderState } from '../../state/user-header-state.ts';
import type { ResponseHeaderContext } from './response-header-context.ts';
import { renderLauncherHeaderValue } from './response-launcher-headers.ts';
import { renderNotificationHeaderValue } from './response-notification-headers.ts';

export function renderStateHeaderValue(
	name: string,
	state: ServerState,
	context: ResponseHeaderContext,
): string | undefined {
	const user = context.user;
	const userStatus = context.getUserStatusView(state, user);
	const userHeader = getUserHeaderState(state, user);
	const notificationValue = renderNotificationHeaderValue(
		name,
		state,
		user,
		userHeader,
		context,
	);
	if (notificationValue !== undefined) return notificationValue;
	const launcherValue = renderLauncherHeaderValue(
		name,
		state,
		userStatus.fanLevel,
		context,
	);
	if (launcherValue !== undefined) return launcherValue;
	switch (name) {
		case 'chapter_rank_id':
			return String(currentChapterHeader(state, user, context).currentRank);
		case 'chapter_total_point':
			return String(currentChapterHeader(state, user, context).currentPoint);
		case 'fan_level':
			return String(userStatus.fanLevel);
		case 'is_grand_prix_open':
			return String(isGrandPrixPlayable(state.grandPrix));
		case 'jewel_free':
			return String(userStatus.jewelFree);
		case 'jewel_paid_apple':
			return String(userStatus.jewelPaidApple);
		case 'jewel_paid_google':
			return String(userStatus.jewelPaidGoogle);
		case 'presentbox_count':
			return String(userStatus.presentBoxCount);
		case 'name':
			return Buffer.from(user?.playerName ?? '', 'utf8').toString('base64');
		case 'user_stamina':
			return JSON.stringify({
				stamina_now: userStatus.staminaNow,
				stamina_max: userStatus.staminaMax,
				stamina_recovery_time: userStatus.staminaRecoveryTime,
			});
		default:
			return undefined;
	}
}

function currentChapterHeader(
	state: ServerState,
	user: RegisteredUserState | undefined,
	context: ResponseHeaderContext,
): { currentRank: number; currentPoint: number } {
	if (user === undefined) {
		return { currentRank: 0, currentPoint: 0 };
	}
	const header = getRequestUserChapterHeader(
		state,
		user.playerId,
		context.getActiveChapterMaster(ensureChapterRuntimeState(state)).chapterId,
		context.getChapterRank,
	);
	return header ?? { currentRank: 0, currentPoint: 0 };
}
