import type {
	MemberFanLevelBoundary,
	MemberFanLevelDefinition,
} from './member-fan-level-definition.ts';
import { cloneFanLevelEarnProgress } from './user-status-history.ts';
import type {
	FanLevelEarnProgressState,
	UserStatusState,
} from './user-status-types.ts';

export function getFanLevelEarnProgressesForCharacter(
	status: UserStatusState,
	characterId: number,
): FanLevelEarnProgressState[] {
	return status.fanLevelEarnProgresses
		.filter((progress) => progress.characterId === characterId)
		.map(cloneFanLevelEarnProgress);
}

export function addMemberFanExperience(
	status: UserStatusState,
	definition: MemberFanLevelDefinition,
	experience: number,
	memberFanLevelTable: readonly MemberFanLevelBoundary[],
): { beforeLevel: number; beforeExperience: number } | undefined {
	if (!Number.isSafeInteger(definition.characterId) || experience <= 0) {
		return undefined;
	}
	let memberFanLevel = status.memberFanLevels.find(
		(level) => level.characterId === definition.characterId,
	);
	if (memberFanLevel === undefined) {
		memberFanLevel = {
			characterId: definition.characterId,
			dSeasonFanLevel: definition.dSeasonFanLevel,
			dSeasonFanExperience: 0,
			memberFanLevel: definition.memberFanLevel,
			memberFanExperience: 0,
		};
		status.memberFanLevels.push(memberFanLevel);
	}
	const before = {
		beforeLevel: memberFanLevel.memberFanLevel,
		beforeExperience: memberFanLevel.memberFanExperience,
	};
	memberFanLevel.memberFanExperience += experience;
	memberFanLevel.memberFanLevel = memberLevelForExperience(
		memberFanLevelTable,
		memberFanLevel.memberFanExperience,
	);
	return before;
}

function memberLevelForExperience(
	memberFanLevelTable: readonly MemberFanLevelBoundary[],
	experience: number,
): number {
	let level = 1;
	for (const boundary of memberFanLevelTable) {
		if (boundary.cumulativeExperience > experience) {
			break;
		}
		level = boundary.level;
	}
	return level;
}
