import {
	normalizeMemberFanLevel,
	normalizeSeasonFanLevel,
} from '@altair/runtime/admin/domain/fan-level-normalization.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { calculateFanLevel } from '../../../../../../src/state/fan-level-calculation.ts';
import type { UserStatusForm } from './user-status-form.ts';

export function seasonOptionsWithCurrent(
	seasonList: AdminStateResponse['seasonList'],
	currentSeasonId: number,
	unknownSeasonName: string,
): AdminStateResponse['seasonList'] {
	if (seasonList.some((season) => season.seasonId === currentSeasonId)) {
		return seasonList;
	}
	return [
		{
			seasonId: currentSeasonId,
			name: unknownSeasonName,
			startTime: '',
			endTime: '',
			isSeasonFanLv: false,
		},
		...seasonList,
	];
}

export function selectSeasonFanLevel(
	form: UserStatusForm,
	seasonId: number,
): UserStatusForm {
	const seasonFanLevels = writeCurrentSeasonFanLevel(form);
	const selected = seasonFanLevels.find(
		(season) => season.seasonId === seasonId,
	);
	if (selected === undefined) {
		return {
			...form,
			seasonFanLevelSeasonId: seasonId,
			seasonFanLevelPointStock: '0',
			seasonFanLevelPointStockLimit: '0',
			memberFanLevels: form.memberFanLevels.map((member) => ({
				...member,
				dSeasonFanLevel: '1',
				dSeasonFanExperience: '0',
			})),
			seasonFanLevels,
		};
	}
	const selectedByCharacterId = new Map(
		selected.memberFanLevels.map((member) => [member.characterId, member]),
	);
	return {
		...form,
		seasonFanLevelSeasonId: seasonId,
		seasonFanLevelPointStock: selected.pointStock,
		seasonFanLevelPointStockLimit: selected.pointStockLimit,
		memberFanLevels: form.memberFanLevels.map((member) => {
			const selectedMember = selectedByCharacterId.get(member.characterId);
			return {
				...member,
				dSeasonFanLevel: selectedMember?.dSeasonFanLevel ?? '1',
				dSeasonFanExperience: selectedMember?.dSeasonFanExperience ?? '0',
			};
		}),
		seasonFanLevels,
	};
}

export function updateMemberFanLevel(
	form: UserStatusForm,
	index: number,
	values: Partial<UserStatusForm['memberFanLevels'][number]>,
	memberFanLevelTable: AdminStateResponse['memberFanLevelTable'],
	seasonFanLevelTable: AdminStateResponse['seasonFanLevelTable'],
): UserStatusForm {
	const memberFanLevels = form.memberFanLevels.map((member, currentIndex) => {
		if (currentIndex !== index) return member;
		let edited = { ...member, ...values };
		const numbers = {
			characterId: edited.characterId,
			dSeasonFanLevel: Number(edited.dSeasonFanLevel),
			dSeasonFanExperience: Number(edited.dSeasonFanExperience),
			memberFanLevel: Number(edited.memberFanLevel),
			memberFanExperience: Number(edited.memberFanExperience),
		};
		if (
			(values.memberFanLevel !== undefined ||
				values.memberFanExperience !== undefined) &&
			isIntegerDraft(edited.memberFanLevel) &&
			isIntegerDraft(edited.memberFanExperience)
		) {
			const normalized = normalizeMemberFanLevel(
				numbers,
				{
					...(values.memberFanLevel === undefined
						? {}
						: { memberFanLevel: Number(values.memberFanLevel) }),
					...(values.memberFanExperience === undefined
						? {}
						: { memberFanExperience: Number(values.memberFanExperience) }),
				},
				memberFanLevelTable,
			);
			edited = {
				...edited,
				memberFanLevel: String(normalized.memberFanLevel),
				memberFanExperience: String(normalized.memberFanExperience),
			};
		}
		if (
			(values.dSeasonFanLevel !== undefined ||
				values.dSeasonFanExperience !== undefined) &&
			isIntegerDraft(edited.dSeasonFanLevel) &&
			isIntegerDraft(edited.dSeasonFanExperience)
		) {
			const normalized = normalizeSeasonFanLevel(
				numbers,
				{
					...(values.dSeasonFanLevel === undefined
						? {}
						: { dSeasonFanLevel: Number(values.dSeasonFanLevel) }),
					...(values.dSeasonFanExperience === undefined
						? {}
						: { dSeasonFanExperience: Number(values.dSeasonFanExperience) }),
				},
				form.seasonFanLevelSeasonId,
				seasonFanLevelTable,
			);
			edited = {
				...edited,
				dSeasonFanLevel: String(normalized.dSeasonFanLevel),
				dSeasonFanExperience: String(normalized.dSeasonFanExperience),
			};
		}
		return edited;
	});
	const numericMembers = memberFanLevels.flatMap((member) =>
		isIntegerDraft(member.memberFanLevel)
			? [{ memberFanLevel: Number(member.memberFanLevel) }]
			: [],
	);
	return {
		...form,
		fanLevel:
			numericMembers.length === memberFanLevels.length
				? calculateFanLevel(numericMembers)
				: form.fanLevel,
		memberFanLevels,
	};
}

function writeCurrentSeasonFanLevel(
	form: UserStatusForm,
): UserStatusForm['seasonFanLevels'] {
	const current = {
		seasonId: form.seasonFanLevelSeasonId,
		pointStock: form.seasonFanLevelPointStock,
		pointStockLimit: form.seasonFanLevelPointStockLimit,
		memberFanLevels: form.memberFanLevels.map((member) => ({
			characterId: member.characterId,
			dSeasonFanLevel: member.dSeasonFanLevel,
			dSeasonFanExperience: member.dSeasonFanExperience,
		})),
	};
	return [
		...form.seasonFanLevels.filter(
			(season) => season.seasonId !== current.seasonId,
		),
		current,
	].sort((left, right) => left.seasonId - right.seasonId);
}

function isIntegerDraft(value: string): boolean {
	return value.trim().length > 0 && Number.isSafeInteger(Number(value));
}
