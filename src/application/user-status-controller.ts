import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';
import {
	type CardMemberFanLevelState,
	createCardMemberFanLevels,
} from '../state/card-member-fan-level-state.ts';
import type { EnsureStateResult } from '../state/ensure-state-result.ts';
import { calculateFanLevel } from '../state/fan-level-calculation.ts';
import type {
	MemberFanLevelDefinition,
	SeasonFanLevelBoundary,
} from '../state/member-fan-level-definition.ts';
import {
	getCurrentSeasonFanLevelPointStock,
	setCurrentSeasonFanLevelState,
} from '../state/season-fan-level-current-aggregate.ts';
import { migrateUserStatusSeasonFanLevels } from '../state/season-fan-level-migration.ts';
import {
	applySeasonFanLevelPointStocks,
	type UseSeasonFanLevelPointStock,
} from '../state/season-fan-level-point-stock.ts';
import { addMemberFanExperience } from '../state/user-status-member-fan-level.ts';
import { getUserStatusView } from '../state/user-status-projection.ts';
import {
	ensureUserStatus,
	updateUserStatus,
} from '../state/user-status-state.ts';
import type {
	MemberFanLevelState,
	UserStatusState,
} from '../state/user-status-types.ts';

export type UserStatusController = {
	ensure: (
		state: { userStatuses: UserStatusState[] },
		playerId: string,
	) => EnsureStateResult<UserStatusState>;
	getMemberFanLevels: (status: UserStatusState) => MemberFanLevelState[];
	getCurrentSeasonMemberFanLevels: (
		status: UserStatusState,
	) => MemberFanLevelState[];
	getView: (
		state: ServerState,
		user: RegisteredUserState | undefined,
	) => ReturnType<typeof getUserStatusView>;
	update: (
		state: ServerState,
		playerId: string,
		values: Parameters<typeof updateUserStatus>[2],
	) => boolean;
	getCurrentSeasonFanLevelPointStock: (
		status: UserStatusState,
	) => ReturnType<typeof getCurrentSeasonFanLevelPointStock>;
	setCurrentSeasonFanLevelState: (
		status: UserStatusState,
		values: Parameters<typeof setCurrentSeasonFanLevelState>[1],
	) => void;
	migrateSeasonFanLevels: (status: UserStatusState) => void;
	applySeasonFanLevelPointStocks: (
		status: UserStatusState,
		useStockList: readonly UseSeasonFanLevelPointStock[],
		seasonFanLevelTable: readonly SeasonFanLevelBoundary[],
	) => ReturnType<typeof applySeasonFanLevelPointStocks>;
	getCardMemberFanLevels: (
		status: UserStatusState,
	) => CardMemberFanLevelState[];
	addMemberFanExperience: (
		status: UserStatusState,
		characterId: number,
		experience: number,
		memberFanLevelTable: Parameters<typeof addMemberFanExperience>[3],
	) => ReturnType<typeof addMemberFanExperience>;
};

export type UserStatusControllerProvider = () => UserStatusController;

export function createUserStatusController(
	definitions: readonly MemberFanLevelDefinition[],
	cardDefinitions: readonly CardMemberFanLevelState[],
): UserStatusController {
	return {
		ensure: (state, playerId) => ensureUserStatus(state, playerId),
		getMemberFanLevels: (status) =>
			projectMemberFanLevels(status.memberFanLevels, definitions),
		getCurrentSeasonMemberFanLevels: (status) =>
			createCurrentSeasonMemberFanLevels(status, definitions),
		getCardMemberFanLevels: (status) =>
			createCardMemberFanLevels(
				projectMemberFanLevels(status.memberFanLevels, definitions),
				cardDefinitions,
			),
		getView: (state, user) => {
			const view = getUserStatusView(state, user, definitions);
			if (user === undefined) {
				return view;
			}
			const status = ensureUserStatus(state, user.playerId).value;
			return {
				...view,
				fanLevel: calculateFanLevel(
					projectMemberFanLevels(status.memberFanLevels, definitions),
				),
				memberFanLevels: createCurrentSeasonMemberFanLevels(
					status,
					definitions,
				),
			};
		},
		update: (state, playerId, values) =>
			updateUserStatus(state, playerId, values, definitions),
		getCurrentSeasonFanLevelPointStock: (status) =>
			getCurrentSeasonFanLevelPointStock(status),
		setCurrentSeasonFanLevelState: (status, values) =>
			setCurrentSeasonFanLevelState(status, values, definitions),
		migrateSeasonFanLevels: (status) =>
			migrateUserStatusSeasonFanLevels(status, definitions),
		applySeasonFanLevelPointStocks: (status, useStockList, table) =>
			applySeasonFanLevelPointStocks(status, useStockList, table, definitions),
		addMemberFanExperience: (
			status,
			characterId,
			experience,
			memberFanLevelTable,
		) => {
			const definition = definitions.find(
				(candidate) => candidate.characterId === characterId,
			);
			return definition === undefined
				? undefined
				: addMemberFanExperience(
						status,
						definition,
						experience,
						memberFanLevelTable,
					);
		},
	};
}

function createCurrentSeasonMemberFanLevels(
	status: UserStatusState,
	definitions: readonly MemberFanLevelDefinition[],
): MemberFanLevelState[] {
	const memberFanLevels = projectMemberFanLevels(
		status.memberFanLevels,
		definitions,
	);
	const season = status.seasonFanLevels?.find(
		(entry) => entry.seasonId === status.seasonFanLevelSeasonId,
	);
	const seasonByCharacterId = new Map(
		season?.memberFanLevels.map((entry) => [entry.characterId, entry]),
	);
	return memberFanLevels.map((entry) => {
		const seasonEntry = seasonByCharacterId.get(entry.characterId);
		return {
			...entry,
			dSeasonFanLevel: seasonEntry?.dSeasonFanLevel ?? entry.dSeasonFanLevel,
			dSeasonFanExperience:
				seasonEntry?.dSeasonFanExperience ?? entry.dSeasonFanExperience,
		};
	});
}

function projectMemberFanLevels(
	progresses: readonly MemberFanLevelState[],
	definitions: readonly MemberFanLevelDefinition[],
): MemberFanLevelState[] {
	const progressByCharacterId = new Map(
		progresses.map((progress) => [progress.characterId, progress]),
	);
	return definitions.map((definition) => {
		const progress = progressByCharacterId.get(definition.characterId);
		return progress === undefined
			? {
					characterId: definition.characterId,
					dSeasonFanLevel: definition.dSeasonFanLevel,
					dSeasonFanExperience: 0,
					memberFanLevel: definition.memberFanLevel,
					memberFanExperience: 0,
				}
			: { ...progress };
	});
}
