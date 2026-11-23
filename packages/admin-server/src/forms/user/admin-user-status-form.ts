import type { Database } from 'bun:sqlite';
import {
	normalizeMemberFanLevel,
	normalizeSeasonFanLevel,
} from '@altair/runtime/admin/domain/fan-level-normalization.ts';
import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
import {
	getMemberFanLevelTableFromDatabase,
	getSeasonFanLevelTableFromDatabase,
} from '../../../../../src/master-data/member-fan-level-master.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { STAMINA_RECOVERY_STOPPED_AT } from '../../../../../src/state/stamina-recovery-time.ts';
import type { FanLevelEarnProgressState } from '../../../../../src/state/user-status-types.ts';
import { isFanLevelEarnProgressState } from '../../../../../src/state/user-status-validator.ts';
import { findAdminEntryByKey } from '../../state/domain/admin-state-writer.ts';
import {
	type AdminForm,
	getFormInteger,
	getFormString,
	getOptionalFormString,
} from '../shared/admin-form-values.ts';

export function updateUserStatusFromForm(
	form: AdminForm,
	state: ServerState,
	userStatus: UserStatusController,
	database: Database,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const user = findAdminEntryByKey(
		state.registeredUsers,
		playerId,
		(registeredUser) => registeredUser.playerId,
	);
	if (!user) {
		return false;
	}
	const current = userStatus.getView(state, user);
	const staminaRecoveryTime = getOptionalFormString(
		form,
		'staminaRecoveryTime',
	);
	const fanLevelEarnProgressesJson = getOptionalFormString(
		form,
		'fanLevelEarnProgressesJson',
	);
	const seasonFanLevelSeasonId = getFormInteger(
		form,
		'seasonFanLevelSeasonId',
		current.seasonFanLevelSeasonId,
	);
	const memberFanLevelTable = getMemberFanLevelTableFromDatabase(database);
	const seasonFanLevelTable = getSeasonFanLevelTableFromDatabase(database);
	userStatus.ensure(state, playerId);
	return userStatus.update(state, playerId, {
		jewelFree: getFormInteger(form, 'jewelFree', current.jewelFree),
		jewelPaidApple: getFormInteger(
			form,
			'jewelPaidApple',
			current.jewelPaidApple,
		),
		jewelPaidGoogle: getFormInteger(
			form,
			'jewelPaidGoogle',
			current.jewelPaidGoogle,
		),
		jewelStaminaRecoveryCount: getFormInteger(
			form,
			'jewelStaminaRecoveryCount',
			current.jewelStaminaRecoveryCount,
		),
		jewelStaminaRecoveryGameDate: current.jewelStaminaRecoveryGameDate,
		staminaNow: getFormInteger(form, 'staminaNow', current.staminaNow),
		staminaMax: getFormInteger(form, 'staminaMax', current.staminaMax),
		seasonFanLevelSeasonId,
		seasonFanLevelPointStock: getFormInteger(
			form,
			'seasonFanLevelPointStock',
			current.seasonFanLevelPointStock,
		),
		seasonFanLevelPointStockLimit: getFormInteger(
			form,
			'seasonFanLevelPointStockLimit',
			current.seasonFanLevelPointStockLimit,
		),
		staminaRecoveryTime:
			staminaRecoveryTime === undefined
				? current.staminaRecoveryTime
				: staminaRecoveryTime || STAMINA_RECOVERY_STOPPED_AT,
		memberFanLevels: current.memberFanLevels.map((memberFanLevel) => {
			const memberNormalized = normalizeMemberFanLevel(
				memberFanLevel,
				getMemberFanLevelPatch(form, memberFanLevel),
				memberFanLevelTable,
			);
			return normalizeSeasonFanLevel(
				memberNormalized,
				getSeasonFanLevelPatch(form, memberFanLevel),
				seasonFanLevelSeasonId,
				seasonFanLevelTable,
			);
		}),
		fanLevelEarnProgresses:
			fanLevelEarnProgressesJson === undefined
				? current.fanLevelEarnProgresses
				: parseFanLevelEarnProgresses(fanLevelEarnProgressesJson),
	});
}

function getMemberFanLevelPatch(
	form: AdminForm,
	memberFanLevel: { characterId: number },
): {
	memberFanLevel?: number;
	memberFanExperience?: number;
} {
	const experienceKey = `memberFanExperience:${memberFanLevel.characterId}`;
	if (Object.hasOwn(form, experienceKey)) {
		return { memberFanExperience: getFormInteger(form, experienceKey, 0) };
	}
	const levelKey = `memberFanLevel:${memberFanLevel.characterId}`;
	if (Object.hasOwn(form, levelKey)) {
		return { memberFanLevel: getFormInteger(form, levelKey, 1) };
	}
	return {};
}

function getSeasonFanLevelPatch(
	form: AdminForm,
	memberFanLevel: { characterId: number },
): {
	dSeasonFanLevel?: number;
	dSeasonFanExperience?: number;
} {
	const experienceKey = `dSeasonFanExperience:${memberFanLevel.characterId}`;
	if (Object.hasOwn(form, experienceKey)) {
		return { dSeasonFanExperience: getFormInteger(form, experienceKey, 0) };
	}
	const levelKey = `dSeasonFanLevel:${memberFanLevel.characterId}`;
	if (Object.hasOwn(form, levelKey)) {
		return { dSeasonFanLevel: getFormInteger(form, levelKey, 1) };
	}
	return {};
}

function parseFanLevelEarnProgresses(
	value: string,
): FanLevelEarnProgressState[] {
	if (value.trim().length === 0) {
		return [];
	}
	const parsed: unknown = JSON.parse(value);
	if (!Array.isArray(parsed) || !parsed.every(isFanLevelEarnProgressState)) {
		throw new Error('fanLevelEarnProgressesJson is invalid');
	}
	return parsed;
}
