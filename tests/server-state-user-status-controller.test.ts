import { describe, expect, test } from 'bun:test';
import { createUserStatusController } from '../src/application/user-status-controller.ts';
import {
	createServerState,
	ensureGradeChallengeRuntimeState,
	ensureGradeLiveRuntimeState,
	resetServerState,
} from '../src/server-state.ts';
import type { ServerState } from '../src/server-state-schema.ts';
import type { ServerStateStore } from '../src/server-state-store-port.ts';
import { createNoopServerStateStore } from '../src/server-state-store-port.ts';
import { testServerRuntimeDefaults } from './server-runtime-defaults.ts';

describe('server state user status controller', () => {
	test('initializes master activations only from the injected master selection', () => {
		const state = createServerState(
			createNoopServerStateStore(),
			[2001],
			[1001, 1002],
			testServerRuntimeDefaults,
			() => createUserStatusController([], []),
		);

		expect(state.gachaSeriesActivations).toEqual([
			{ gachaSeriesId: 1001, isEnabled: true },
			{ gachaSeriesId: 1002, isEnabled: true },
		]);
		expect(state.loginBonusActivations).toEqual([
			{ loginBonusId: 2001, isEnabled: true },
		]);
		expect(state.chapter).toEqual(testServerRuntimeDefaults.chapter);
		expect(state.grandPrix).toEqual(testServerRuntimeDefaults.grandPrix);
	});

	test('resets runtime state from the explicitly selected defaults', () => {
		const store = createNoopServerStateStore();
		const state = createServerState(
			store,
			[],
			[],
			testServerRuntimeDefaults,
			() => createUserStatusController([], []),
		);
		const nextDefaults = {
			...testServerRuntimeDefaults,
			chapter: { ...testServerRuntimeDefaults.chapter, activeChapterId: 99 },
			gradeLive: {
				...testServerRuntimeDefaults.gradeLive,
				activeGradeQuestSeasonId: 88,
			},
		};

		resetServerState(state, store, [], [], nextDefaults);

		expect(state.chapter.activeChapterId).toBe(99);
		expect(state.gradeLive?.activeGradeQuestSeasonId).toBe(88);
	});

	test('initializes each persisted user from the controller selected for its platform', () => {
		const empty = createUserStatusController([], []);
		const state = createServerState(
			createNoopServerStateStore(),
			[],
			[],
			testServerRuntimeDefaults,
			() => empty,
		);
		state.registeredUsers = [
			createUser('android-player', 1),
			createUser('ios-player', 2),
		];
		state.userStatuses = [];
		state.chapter.activeChapterId = 77;
		const store: ServerStateStore = {
			description: 'user status startup test',
			read: () => structuredClone(state),
			write: () => undefined,
		};
		const android = createUserStatusController(
			[{ characterId: 10, dSeasonFanLevel: 1, memberFanLevel: 1 }],
			[],
		);
		const ios = createUserStatusController(
			[{ characterId: 20, dSeasonFanLevel: 1, memberFanLevel: 1 }],
			[],
		);

		const loaded = createServerState(
			store,
			[],
			[],
			testServerRuntimeDefaults,
			(_serverState, user) => (user.platformType === 1 ? android : ios),
		);
		expect(loaded.chapter.activeChapterId).toBe(77);

		expect(
			loaded.userStatuses.find((status) => status.playerId === 'android-player')
				?.memberFanLevels,
		).toEqual([]);
		expect(
			loaded.userStatuses.find((status) => status.playerId === 'ios-player')
				?.memberFanLevels,
		).toEqual([]);
		expect(
			android.getView(loaded, loaded.registeredUsers[0]).memberFanLevels,
		).toEqual([
			{
				characterId: 10,
				dSeasonFanLevel: 1,
				dSeasonFanExperience: 0,
				memberFanLevel: 1,
				memberFanExperience: 0,
			},
		]);
	});

	test('保存済みresource versionで欠落runtimeのdefaultsを解決する', () => {
		const state = createServerState(
			createNoopServerStateStore(),
			[],
			[],
			testServerRuntimeDefaults,
			() => createUserStatusController([], []),
		);
		state.resourceVersionOverrides = { android: 'R2605000@android' };
		state.gradeChallenge = undefined;
		state.gradeLive = undefined;
		const store: ServerStateStore = {
			description: 'runtime defaults startup test',
			read: () => structuredClone(state),
			write: () => undefined,
		};
		const selectedDefaults = {
			...testServerRuntimeDefaults,
			gradeChallenge: {
				...testServerRuntimeDefaults.gradeChallenge,
				activeGradeChallengeSeasonId: 5000,
			},
			gradeLive: {
				...testServerRuntimeDefaults.gradeLive,
				activeGradeQuestSeasonId: 5000,
			},
		};

		const selections: ServerState['resourceVersionOverrides'][] = [];
		const loaded = createServerState(
			store,
			[],
			[],
			(overrides) => {
				selections.push(overrides);
				return overrides.android === undefined
					? testServerRuntimeDefaults
					: selectedDefaults;
			},
			() => createUserStatusController([], []),
		);

		expect(selections).toEqual([{}, { android: 'R2605000@android' }]);
		expect(loaded.gradeChallenge?.activeGradeChallengeSeasonId).toBe(5000);
		expect(loaded.gradeLive?.activeGradeQuestSeasonId).toBe(5000);
	});

	test('migration後に欠落runtimeを固定値で補完しない', () => {
		const state = createServerState(
			createNoopServerStateStore(),
			[],
			[],
			testServerRuntimeDefaults,
			() => createUserStatusController([], []),
		);
		state.gradeChallenge = undefined;
		state.gradeLive = undefined;
		expect(() => ensureGradeChallengeRuntimeState(state)).toThrow(
			'missing after migration',
		);
		expect(() => ensureGradeLiveRuntimeState(state)).toThrow(
			'missing after migration',
		);
	});
});

function createUser(playerId: string, platformType: number) {
	return {
		playerId,
		deviceSpecificId: `${playerId}-device`,
		sessionToken: `${playerId}-session`,
		playerName: playerId,
		birthday: '2000-01-01',
		entryTime: '2026-01-01T00:00:00.000Z',
		lastLoginDate: '2026-01-01T00:00:00.000Z',
		playerLevel: 1,
		platformType,
	};
}
