import type { AdminCardCatalogEntry } from '../domain/admin-card-catalog.ts';

type MemberFanLevel = {
	characterId: number;
	memberFanLevel: number;
};

export function selectReachableCardCatalogEntries(
	cardCatalog: readonly AdminCardCatalogEntry[],
	memberFanLevels: readonly MemberFanLevel[],
): AdminCardCatalogEntry[] {
	const fanLevelByCharacterId = new Map(
		memberFanLevels.map((memberFanLevel) => [
			memberFanLevel.characterId,
			memberFanLevel.memberFanLevel,
		]),
	);
	const selectedBySeriesId = new Map<number, AdminCardCatalogEntry>();
	for (const card of cardCatalog) {
		const memberFanLevel = fanLevelByCharacterId.get(card.characterId) ?? 1;
		if (card.requiredFanLevel > memberFanLevel) {
			continue;
		}
		const current = selectedBySeriesId.get(card.cardSeriesId);
		if (
			current === undefined ||
			card.evolveTimes > current.evolveTimes ||
			(card.evolveTimes === current.evolveTimes &&
				card.cardDatasId > current.cardDatasId)
		) {
			selectedBySeriesId.set(card.cardSeriesId, card);
		}
	}
	return [...selectedBySeriesId.values()];
}
