import type { AdminUserStatusView } from '@altair/runtime/admin/dto/admin-user-status-view-schema.ts';
import {
	createDateTimeDraft,
	type DateTimeDraft,
	dateTimeDraftToIso,
} from '../../../domain/forms/dateTimeDraft.ts';
import type { AdminFormValues } from '../../../form-value.ts';
import type { AdminMessages } from '../../../i18n/messages.ts';

export const userStatusNumberKeys = [
	'jewelFree',
	'jewelPaidApple',
	'jewelPaidGoogle',
	'jewelStaminaRecoveryCount',
	'staminaNow',
	'staminaMax',
	'seasonFanLevelPointStock',
	'seasonFanLevelPointStockLimit',
] as const;
type NumberKey = (typeof userStatusNumberKeys)[number];
type MemberFanLevel = AdminUserStatusView['memberFanLevels'][number];
type MemberNumberKey = Exclude<keyof MemberFanLevel, 'characterId'>;
export type MemberFanLevelForm = Pick<MemberFanLevel, 'characterId'> &
	Record<MemberNumberKey, string>;
type SeasonFanLevelForm = {
	seasonId: number;
	pointStock: string;
	pointStockLimit: string;
	memberFanLevels: Pick<
		MemberFanLevelForm,
		'characterId' | 'dSeasonFanLevel' | 'dSeasonFanExperience'
	>[];
};
export type UserStatusForm = Pick<
	AdminUserStatusView,
	'fanLevel' | 'seasonFanLevelSeasonId'
> &
	Record<NumberKey, string> & {
		memberFanLevels: MemberFanLevelForm[];
		seasonFanLevels: SeasonFanLevelForm[];
		staminaRecoveryTime: DateTimeDraft;
	};

export function createMemberFanLevelForm(
	member: MemberFanLevel,
): MemberFanLevelForm {
	return {
		characterId: member.characterId,
		dSeasonFanLevel: String(member.dSeasonFanLevel),
		dSeasonFanExperience: String(member.dSeasonFanExperience),
		memberFanLevel: String(member.memberFanLevel),
		memberFanExperience: String(member.memberFanExperience),
	};
}

export function createUserStatusForm(
	status: AdminUserStatusView,
): UserStatusForm {
	return {
		fanLevel: status.fanLevel,
		seasonFanLevelSeasonId: status.seasonFanLevelSeasonId,
		jewelFree: String(status.jewelFree),
		jewelPaidApple: String(status.jewelPaidApple),
		jewelPaidGoogle: String(status.jewelPaidGoogle),
		jewelStaminaRecoveryCount: String(status.jewelStaminaRecoveryCount),
		staminaNow: String(status.staminaNow),
		staminaMax: String(status.staminaMax),
		seasonFanLevelPointStock: String(status.seasonFanLevelPointStock),
		seasonFanLevelPointStockLimit: String(status.seasonFanLevelPointStockLimit),
		staminaRecoveryTime: createDateTimeDraft(status.staminaRecoveryTime),
		memberFanLevels: status.memberFanLevels.map(createMemberFanLevelForm),
		seasonFanLevels: status.seasonFanLevels.map((season) => ({
			...season,
			pointStock: String(season.pointStock),
			pointStockLimit: String(season.pointStockLimit),
			memberFanLevels: season.memberFanLevels.map((member) => ({
				characterId: member.characterId,
				dSeasonFanLevel: String(member.dSeasonFanLevel),
				dSeasonFanExperience: String(member.dSeasonFanExperience),
			})),
		})),
	};
}

export function userStatusFormValues(
	playerId: string,
	form: UserStatusForm,
	messages: AdminMessages,
): AdminFormValues {
	return {
		playerId,
		...Object.fromEntries(
			userStatusNumberKeys.map((key) => [key, Number(form[key])]),
		),
		seasonFanLevelSeasonId: form.seasonFanLevelSeasonId,
		staminaRecoveryTime: dateTimeDraftToIso(
			form.staminaRecoveryTime,
			messages.validation,
		),
		...Object.fromEntries(
			form.memberFanLevels.flatMap((member) => [
				[
					`dSeasonFanLevel:${member.characterId}`,
					Number(member.dSeasonFanLevel),
				],
				[
					`dSeasonFanExperience:${member.characterId}`,
					Number(member.dSeasonFanExperience),
				],
				[`memberFanLevel:${member.characterId}`, Number(member.memberFanLevel)],
				[
					`memberFanExperience:${member.characterId}`,
					Number(member.memberFanExperience),
				],
			]),
		),
	};
}
