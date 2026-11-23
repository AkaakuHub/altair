import type { MemberFanLevelState } from './user-status-types.ts';

export type CardMemberFanLevelState = {
	characterId: number;
	memberFanLevel: number;
};

export function createCardMemberFanLevels(
	memberFanLevels: readonly MemberFanLevelState[],
	cardMemberFanLevelDefaults: readonly CardMemberFanLevelState[],
): CardMemberFanLevelState[] {
	const memberFanLevelByCharacterId = new Map(
		memberFanLevels.map((memberFanLevel) => [
			memberFanLevel.characterId,
			memberFanLevel.memberFanLevel,
		]),
	);
	return cardMemberFanLevelDefaults.map((defaultLevel) => {
		const currentLevel = memberFanLevelByCharacterId.get(
			defaultLevel.characterId,
		);
		return {
			characterId: defaultLevel.characterId,
			memberFanLevel:
				currentLevel === undefined ? defaultLevel.memberFanLevel : currentLevel,
		};
	});
}
