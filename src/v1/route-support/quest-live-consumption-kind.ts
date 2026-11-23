type QuestLiveConsumptionKind = 'dailyTicket' | 'playPoint';

export function questLiveConsumptionKind(
	questLiveType: number,
): QuestLiveConsumptionKind {
	return questLiveType === 2 ? 'dailyTicket' : 'playPoint';
}
