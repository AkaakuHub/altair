import type { MemberFanLevelDefinition } from './member-fan-level-definition.ts';
import type {
	MemberFanLevelState,
	SeasonFanLevelState,
	SeasonMemberFanLevelState,
} from './user-status-types.ts';

const isDefault = (
	progress: MemberFanLevelState,
	definition: MemberFanLevelDefinition,
) =>
	progress.memberFanLevel === definition.memberFanLevel &&
	progress.memberFanExperience === 0 &&
	progress.dSeasonFanLevel === definition.dSeasonFanLevel &&
	progress.dSeasonFanExperience === 0;
const toSeason = (
	progress: Pick<
		MemberFanLevelState,
		'characterId' | 'dSeasonFanLevel' | 'dSeasonFanExperience'
	>,
): SeasonMemberFanLevelState => ({
	characterId: progress.characterId,
	dSeasonFanLevel: progress.dSeasonFanLevel,
	dSeasonFanExperience: progress.dSeasonFanExperience,
});

export function mergeMemberFanLevelProgresses(
	canonical: readonly MemberFanLevelState[],
	visible: readonly MemberFanLevelState[],
	definitions: readonly MemberFanLevelDefinition[],
): MemberFanLevelState[] {
	const visibleIds = new Set(definitions.map((item) => item.characterId));
	const next = canonical.filter((item) => !visibleIds.has(item.characterId));
	for (const progress of visible) {
		const definition = definitions.find(
			(item) => item.characterId === progress.characterId,
		);
		if (definition !== undefined && !isDefault(progress, definition))
			next.push({ ...progress });
	}
	return next;
}
export function mergeSeasonMemberFanLevelProgresses(
	canonical: readonly SeasonMemberFanLevelState[],
	visible: readonly Pick<
		MemberFanLevelState,
		'characterId' | 'dSeasonFanLevel' | 'dSeasonFanExperience'
	>[],
	definitions: readonly MemberFanLevelDefinition[],
): SeasonMemberFanLevelState[] {
	const visibleIds = new Set(definitions.map((item) => item.characterId));
	const next = canonical.filter((item) => !visibleIds.has(item.characterId));
	for (const progress of visible) {
		const definition = definitions.find(
			(item) => item.characterId === progress.characterId,
		);
		if (
			definition !== undefined &&
			(progress.dSeasonFanLevel !== definition.dSeasonFanLevel ||
				progress.dSeasonFanExperience !== 0)
		)
			next.push(toSeason(progress));
	}
	return next;
}
export function projectCurrentSeasonMemberFanLevels(
	progresses: readonly MemberFanLevelState[],
	season: SeasonFanLevelState,
	definitions: readonly MemberFanLevelDefinition[],
): MemberFanLevelState[] {
	const byId = new Map(progresses.map((item) => [item.characterId, item]));
	const seasonById = new Map(
		season.memberFanLevels.map((item) => [item.characterId, item]),
	);
	return definitions.map((definition) => {
		const base = byId.get(definition.characterId) ?? {
			characterId: definition.characterId,
			dSeasonFanLevel: definition.dSeasonFanLevel,
			dSeasonFanExperience: 0,
			memberFanLevel: definition.memberFanLevel,
			memberFanExperience: 0,
		};
		const current = seasonById.get(definition.characterId);
		return {
			...base,
			dSeasonFanLevel: current?.dSeasonFanLevel ?? base.dSeasonFanLevel,
			dSeasonFanExperience:
				current?.dSeasonFanExperience ?? base.dSeasonFanExperience,
		};
	});
}
export function compactMemberFanLevels(
	progresses: readonly MemberFanLevelState[],
	definitions: readonly MemberFanLevelDefinition[],
) {
	const byId = new Map(definitions.map((item) => [item.characterId, item]));
	return progresses.filter((progress) => {
		const definition = byId.get(progress.characterId);
		return definition === undefined || !isDefault(progress, definition);
	});
}
export function compactSeasonMemberFanLevels(
	progresses: readonly SeasonMemberFanLevelState[],
	definitions: readonly MemberFanLevelDefinition[],
) {
	const byId = new Map(definitions.map((item) => [item.characterId, item]));
	return progresses.filter((progress) => {
		const definition = byId.get(progress.characterId);
		return (
			definition === undefined ||
			progress.dSeasonFanLevel !== definition.dSeasonFanLevel ||
			progress.dSeasonFanExperience !== 0
		);
	});
}
