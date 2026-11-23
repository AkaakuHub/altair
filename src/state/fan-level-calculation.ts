export function calculateFanLevel(
	memberFanLevels: ReadonlyArray<{ memberFanLevel: number }>,
): number {
	return memberFanLevels.reduce(
		(total, memberFanLevel) => total + memberFanLevel.memberFanLevel,
		0,
	);
}
