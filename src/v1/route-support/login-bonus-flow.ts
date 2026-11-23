import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import { createPresentRewardProvenance } from '../../application/present-reward-provenance.ts';
import { runRewardClaimMutation } from '../../application/reward-claim-service.ts';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import {
	getEnabledLoginBonusMastersFromDatabase,
	getReceivedLoginBonusRewards,
	type LoginBonusReceivedReward,
} from '../../master-data/login-bonus-master.ts';
import { addUtcDays } from '../../master-data/master-time.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { getEnabledLoginBonusIds } from '../../state/login-bonus-activation-state.ts';
import {
	areEnabledLoginBonusesReceivedToday,
	refreshDailyLoginBonusState,
} from '../../state/login-bonus-progress-state.ts';
import { receiveLoginBonuses } from '../../state/login-bonus-receive-flow.ts';
import {
	addPresentBoxItem,
	ensureUserPresentBox,
} from '../../state/user-presents-state.ts';
import {
	ensureUserSession,
	type UserSessionState,
} from '../../state/user-session-state.ts';
import type { LoginBonusResponse } from '../response-types/archive-chapter-login-response-types.ts';
import { createLoginBonusResponse } from '../responses/login-bonus-response.ts';
import type { StateRouteContext } from './state-route-context.ts';

const MUSIC_POINT_ITEM_ID = 3009000;

type EnabledLoginBonusState = {
	gameDate: string;
	loginBonusMasters: ReturnType<typeof getEnabledLoginBonusMastersFromDatabase>;
};

export function refreshLoginBonusSession(
	routeContext: StateRouteContext,
	c: Context,
	user: RegisteredUserState,
): UserSessionState {
	const database = routeContext.resolveMasterDatabase(c, user);
	return refreshLoginBonusSessionWithState(
		routeContext,
		user,
		readEnabledLoginBonusState(routeContext, database),
	);
}

export function receiveLoginBonus(
	routeContext: StateRouteContext,
	c: Context,
	user: RegisteredUserState,
): LoginBonusResponse {
	return runRewardClaimMutation(routeContext.state, () =>
		receiveLoginBonusTransaction(routeContext, c, user),
	);
}

function receiveLoginBonusTransaction(
	routeContext: StateRouteContext,
	c: Context,
	user: RegisteredUserState,
): LoginBonusResponse {
	const { state } = routeContext;
	const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
	const database = masterRelease.database;
	const { gameDate, loginBonusMasters } = readEnabledLoginBonusState(
		routeContext,
		database,
	);
	const session = refreshLoginBonusSessionWithState(routeContext, user, {
		gameDate,
		loginBonusMasters,
	});
	const receiveResult = receiveLoginBonuses(
		session.loginBonusProgresses,
		[
			...loginBonusMasters.eventLoginBonuses.map(
				(loginBonus) => loginBonus.loginBonusId,
			),
			...loginBonusMasters.loginBonuses.map(
				(loginBonus) => loginBonus.loginBonusId,
			),
		],
		loginBonusMasters.maxDayCountByLoginBonusId,
		gameDate,
		loginBonusMasters.identityFingerprintsByLoginBonusId,
		masterRelease.masterReleaseId,
	);
	session.loginBonusProgresses = receiveResult.progresses;
	applyLoginBonusRewards(
		routeContext,
		user,
		masterRelease,
		getReceivedLoginBonusRewards(
			loginBonusMasters,
			session.loginBonusProgresses,
			receiveResult.receivedNowLoginBonusIds,
		),
	);
	session.isLoginBonusReceived = areEnabledLoginBonusesReceivedToday(
		session.loginBonusProgresses,
		state.loginBonusActivations,
		gameDate,
		loginBonusMasters.maxDayCountByLoginBonusId,
		loginBonusMasters.identityFingerprintsByLoginBonusId,
	);
	return createLoginBonusResponse(
		loginBonusMasters,
		session.loginBonusProgresses,
		receiveResult.receivedNowLoginBonusIds,
	);
}

function refreshLoginBonusSessionWithState(
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	enabledState: EnabledLoginBonusState,
): UserSessionState {
	const { state } = routeContext;
	const session = ensureUserSession(state, user.playerId).value;
	refreshDailyLoginBonusState(
		session,
		state.loginBonusActivations,
		enabledState.gameDate,
		enabledState.loginBonusMasters.maxDayCountByLoginBonusId,
		enabledState.loginBonusMasters.identityFingerprintsByLoginBonusId,
	);
	return session;
}

function readEnabledLoginBonusState(
	routeContext: StateRouteContext,
	database: Database,
): EnabledLoginBonusState {
	const { state } = routeContext;
	return {
		gameDate: routeContext.date.currentGameDate(),
		loginBonusMasters: getEnabledLoginBonusMastersFromDatabase(
			database,
			getEnabledLoginBonusIds(state.loginBonusActivations),
		),
	};
}

function applyLoginBonusRewards(
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	masterRelease: { database: Database; masterReleaseId: string },
	rewards: readonly LoginBonusReceivedReward[],
): void {
	for (const reward of rewards) {
		applyLoginBonusReward(routeContext, user, masterRelease, reward);
	}
}

function applyLoginBonusReward(
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	masterRelease: { database: Database; masterReleaseId: string },
	reward: LoginBonusReceivedReward,
): void {
	const { state } = routeContext;
	const { database, masterReleaseId } = masterRelease;
	const provenance = createPresentRewardProvenance(
		database,
		masterReleaseId,
		reward.rewardId,
		reward.rewardType,
	);
	if (reward.rewardType === 2) {
		const template = getCardDetailTemplateByCardDatasIdFromDatabase(
			database,
			reward.rewardId,
		);
		if (!template) {
			throw new Error(`login bonus reward card not found: ${reward.rewardId}`);
		}
		addPresentBoxItem(
			ensureUserPresentBox(state, user.playerId).value,
			{
				itemId: reward.rewardId,
				itemType: reward.rewardType,
				name: template.card_name,
			},
			reward.amount,
			reward.name,
			loginBonusReceiptLimitTime(reward),
			'',
			provenance,
		);
		return;
	}
	const itemDefinition = getItemDefinitionByItemIdFromDatabase(
		database,
		reward.rewardId,
	);
	if (!itemDefinition) {
		throw new Error(`login bonus reward item not found: ${reward.rewardId}`);
	}
	addPresentBoxItem(
		ensureUserPresentBox(state, user.playerId).value,
		{
			itemId: itemDefinition.itemId,
			itemType: itemDefinition.itemType,
			name: itemDefinition.name,
		},
		reward.amount,
		reward.name,
		loginBonusReceiptLimitTime(reward),
		'',
		provenance,
	);
}

function loginBonusReceiptLimitTime(reward: LoginBonusReceivedReward): string {
	const now = new Date();
	return addUtcDays(now, reward.rewardId === MUSIC_POINT_ITEM_ID ? 365 : 30);
}
