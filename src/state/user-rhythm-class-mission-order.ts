import type { UserRhythmGameStateOwner } from './user-rhythm-game-types.ts';
export function getUserRhythmGameClassMissionReceivedOrder(
	owner: Pick<UserRhythmGameStateOwner, 'rhythmGameClassMissionReceivedOrders'>,
	conditionType: number,
): number {
	return (
		owner.rhythmGameClassMissionReceivedOrders.find(
			(row) => row.conditionType === conditionType,
		)?.receivedOrder ?? 0
	);
}
export function setUserRhythmGameClassMissionReceivedOrder(
	owner: UserRhythmGameStateOwner,
	conditionType: number,
	receivedOrder: number,
): void {
	owner.rhythmGameClassMissionReceivedOrders = [
		...owner.rhythmGameClassMissionReceivedOrders.filter(
			(row) => row.conditionType !== conditionType,
		),
		{ conditionType, receivedOrder },
	].sort((a, b) => a.conditionType - b.conditionType);
}
