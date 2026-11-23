import type { UserStatusController } from './application/user-status-controller.ts';
import type { ServerRuntimeDefaults } from './server-runtime-defaults.ts';
import type {
	ChapterRuntimeState,
	GradeChallengeRuntimeState,
	GradeLiveRuntimeState,
	GrandPrixRuntimeState,
	ServerState,
} from './server-state-schema.ts';
import type { ServerStateStore } from './server-state-store-port.ts';
import { parseServerState } from './server-state-validation.ts';
import { createInitialGachaSeriesActivations } from './state/gacha-activation-state.ts';
import { createDefaultLauncherInfo } from './state/launcher-info-state.ts';
import type { LoginBonusActivationState } from './state/login-bonus-types.ts';
import { findRegisteredUser } from './state/registered-user-state.ts';
import { applyRawServerStateMigrations } from './state-migrations/raw-server-state-migrations.ts';
import { applyServerStateMigrations } from './state-migrations/typed-server-state-migrations.ts';

export function createServerState(
	stateStore: ServerStateStore,
	activeLoginBonusIds: readonly number[],
	activeGachaSeriesIds: readonly number[],
	runtimeDefaultsSource:
		| ServerRuntimeDefaults
		| ((
				overrides: ServerState['resourceVersionOverrides'],
		  ) => ServerRuntimeDefaults),
	resolveUserStatus: (
		state: ServerState,
		user: ServerState['registeredUsers'][number],
	) => UserStatusController,
): ServerState {
	const persisted = stateStore.read();
	const initialRuntimeDefaults = resolveRuntimeDefaults(
		runtimeDefaultsSource,
		{},
	);
	const parsed = parseServerState(
		applyRawServerStateMigrations(persisted, initialRuntimeDefaults.chapter),
	);
	if (parsed !== undefined) {
		stateStore.initialize?.(parsed, persisted);
		const runtimeDefaults = resolveRuntimeDefaults(
			runtimeDefaultsSource,
			parsed.resourceVersionOverrides,
		);
		const resolvePlayerUserStatus = (playerId: string) => {
			const user = findRegisteredUser(parsed, playerId);
			if (user === undefined) {
				throw new Error(`User status owner is missing: ${playerId}`);
			}
			return resolveUserStatus(parsed, user);
		};
		applyServerStateMigrations(
			parsed,
			resolvePlayerUserStatus,
			runtimeDefaults,
		);
		for (const user of parsed.registeredUsers) {
			resolveUserStatus(parsed, user).ensure(parsed, user.playerId);
		}
		persistServerState(stateStore, parsed);
		return parsed;
	}
	if (persisted !== null) {
		throw new Error(
			`Invalid persisted server state: ${stateStore.description}`,
		);
	}
	const initialState = createInitialServerState(
		activeLoginBonusIds,
		activeGachaSeriesIds,
		initialRuntimeDefaults,
	);
	stateStore.initialize?.(initialState, null);
	return initialState;
}

function resolveRuntimeDefaults(
	source:
		| ServerRuntimeDefaults
		| ((
				overrides: ServerState['resourceVersionOverrides'],
		  ) => ServerRuntimeDefaults),
	overrides: ServerState['resourceVersionOverrides'],
): ServerRuntimeDefaults {
	return typeof source === 'function' ? source(overrides) : source;
}

export function persistServerState(
	stateStore: ServerStateStore,
	state: ServerState,
): void {
	stateStore.write(state);
}

function createInitialServerState(
	activeLoginBonusIds: readonly number[],
	activeGachaSeriesIds: readonly number[],
	runtimeDefaults: ServerRuntimeDefaults,
): ServerState {
	const state: ServerState = {
		loginBonusActivations:
			createInitialLoginBonusActivations(activeLoginBonusIds),
		gachaSeriesActivations:
			createInitialGachaSeriesActivations(activeGachaSeriesIds),
		selectTicketSeriesActivations: [],
		sessionIssueCount: 0,
		launcherInfo: createDefaultLauncherInfo(),
		resourceVersionOverrides: {},
		maintenanceMode: { isEnabled: false },
		chapter: structuredClone(runtimeDefaults.chapter),
		grandPrix: structuredClone(runtimeDefaults.grandPrix),
		grandPrixRankings: [],
		gradeChallenge: structuredClone(runtimeDefaults.gradeChallenge),
		gradeLive: structuredClone(runtimeDefaults.gradeLive),
		selectedAdminPlayerId: null,
		registeredUsers: [],
		userSessions: [],
		accountLinks: [],
		userHeaders: [],
		userStatuses: [],
		userTutorials: [],
		userInventories: [],
		userCards: [],
		userDecks: [],
		userPresentBoxes: [],
		userArchiveCollections: [],
		userActivityRecords: [],
		archiveGiftPoints: [],
		contentReleaseEffects: [],
		followRelations: [],
		userFriendCards: [],
		circle: null,
		userSocials: [],
		userGachas: [],
		userProfileSettings: [],
		userProfileDesigns: [],
		userSiscaStores: [],
		userShopExchanges: [],
		userNotifications: [],
		userCircleNotifications: [],
		userLives: [],
		userChapters: [],
		userDailyQuestStates: [],
		userBeginnerMissions: [],
		userStepUpBeginnerMissions: [],
		userMissions: [],
		rewardClaims: [],
	};
	return state;
}

export function resetServerState(
	state: ServerState,
	stateStore: ServerStateStore,
	activeLoginBonusIds: readonly number[],
	activeGachaSeriesIds: readonly number[],
	runtimeDefaults: ServerRuntimeDefaults,
): void {
	const initialState = createInitialServerState(
		activeLoginBonusIds,
		activeGachaSeriesIds,
		runtimeDefaults,
	);
	stateStore.initialize?.(initialState, null);
	Object.assign(state, initialState);
	persistServerState(stateStore, state);
}

function createInitialLoginBonusActivations(
	activeLoginBonusIds: readonly number[],
): LoginBonusActivationState[] {
	return activeLoginBonusIds.map((loginBonusId) => ({
		loginBonusId,
		isEnabled: true,
	}));
}

export function ensureGrandPrixRuntimeState(
	state: ServerState,
): GrandPrixRuntimeState {
	return state.grandPrix;
}

export function ensureChapterRuntimeState(
	state: ServerState,
): ChapterRuntimeState {
	return state.chapter;
}

export function ensureGradeLiveRuntimeState(
	state: ServerState,
): GradeLiveRuntimeState {
	if (state.gradeLive) {
		return state.gradeLive;
	}
	throw new Error('Grade live runtime state is missing after migration');
}

export function ensureGradeChallengeRuntimeState(
	state: ServerState,
): GradeChallengeRuntimeState {
	if (state.gradeChallenge) {
		return state.gradeChallenge;
	}
	throw new Error('Grade challenge runtime state is missing after migration');
}
