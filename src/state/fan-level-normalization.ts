import type {
	MemberFanLevelBoundary,
	SeasonFanLevelBoundary,
} from './member-fan-level-definition.ts';
import type { MemberFanLevelState } from './user-status-types.ts';

type MemberFanLevelPatch = Partial<
	Pick<MemberFanLevelState, 'memberFanLevel' | 'memberFanExperience'>
>;

type SeasonFanLevelPatch = Partial<
	Pick<MemberFanLevelState, 'dSeasonFanLevel' | 'dSeasonFanExperience'>
>;

type FanLevelBoundary = {
	level: number;
	cumulativeExperience: number;
};

export function normalizeMemberFanLevel(
	memberFanLevel: MemberFanLevelState,
	patch: MemberFanLevelPatch,
	memberFanLevelTable: readonly MemberFanLevelBoundary[],
): MemberFanLevelState {
	requireFanLevelTable(memberFanLevelTable, 'member fan level');
	const next = { ...memberFanLevel, ...patch };
	if (patch.memberFanLevel !== undefined) {
		const level = normalizeLevel(patch.memberFanLevel, memberFanLevelTable);
		return {
			...next,
			memberFanLevel: level,
			memberFanExperience: cumulativeExperienceForLevel(
				memberFanLevelTable,
				level,
			),
		};
	}
	if (patch.memberFanExperience !== undefined) {
		const experience = Math.max(0, patch.memberFanExperience);
		return {
			...next,
			memberFanLevel: levelForCumulativeExperience(
				memberFanLevelTable,
				experience,
			),
			memberFanExperience: experience,
		};
	}
	return next;
}

export function normalizeSeasonFanLevel(
	memberFanLevel: MemberFanLevelState,
	patch: SeasonFanLevelPatch,
	seasonId: number,
	seasonFanLevelTable: readonly SeasonFanLevelBoundary[],
): MemberFanLevelState {
	const table = seasonFanLevelTable.filter(
		(boundary) => boundary.seasonId === seasonId,
	);
	requireFanLevelTable(table, `season fan level for season ${seasonId}`);
	const next = { ...memberFanLevel, ...patch };
	if (patch.dSeasonFanLevel !== undefined) {
		const level = normalizeLevel(patch.dSeasonFanLevel, table);
		return {
			...next,
			dSeasonFanLevel: level,
			dSeasonFanExperience: cumulativeExperienceForLevel(table, level),
		};
	}
	if (patch.dSeasonFanExperience !== undefined) {
		const experience = Math.max(0, patch.dSeasonFanExperience);
		return {
			...next,
			dSeasonFanLevel: levelForCumulativeExperience(table, experience),
			dSeasonFanExperience: experience,
		};
	}
	return next;
}

function normalizeLevel(
	level: number,
	levelTable: readonly FanLevelBoundary[],
): number {
	const normalizedLevel = Math.max(1, level);
	const maxLevel = levelTable.at(-1)?.level;
	if (maxLevel === undefined) {
		throw new Error('fan level table is empty');
	}
	return Math.min(maxLevel, normalizedLevel);
}

function cumulativeExperienceForLevel(
	levelTable: readonly FanLevelBoundary[],
	level: number,
): number {
	if (level <= 1) {
		return 0;
	}
	return (
		levelTable.find((boundary) => boundary.level === level)
			?.cumulativeExperience ?? 0
	);
}

function levelForCumulativeExperience(
	levelTable: readonly FanLevelBoundary[],
	experience: number,
): number {
	let level = 1;
	for (const boundary of levelTable) {
		if (boundary.cumulativeExperience > experience) {
			break;
		}
		level = boundary.level;
	}
	return level;
}

function requireFanLevelTable(
	levelTable: readonly FanLevelBoundary[],
	tableName: string,
): void {
	if (levelTable.length === 0) {
		throw new Error(`${tableName} table is empty`);
	}
}
