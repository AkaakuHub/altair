import type { Database } from 'bun:sqlite';
import type { GiftShopLiveKind } from './gift-shop-definition.ts';

export function getGiftShopLiveCharacterIds(
	database: Database,
	liveId: string,
	liveKind: GiftShopLiveKind,
): Set<number> {
	if (liveKind === 'withlive') {
		const row = database
			.query<{ characters: string }, [string]>(
				'SELECT characters FROM archive_detail WHERE archives_id = ?',
			)
			.get(liveId);
		return new Set(readGiftShopCharacterIds(row?.characters));
	}
	const detail = database
		.query<{ character_list: string }, [string]>(
			'SELECT characters AS character_list FROM with_station_detail WHERE live_id = ?',
		)
		.get(liveId);
	const row =
		detail ??
		database
			.query<{ character_list: string }, [string]>(
				'SELECT character_list FROM with_station_list WHERE live_id = ?',
			)
			.get(liveId);
	return new Set(readGiftShopCharacterIds(row?.character_list));
}

export function readGiftShopCharacterIds(
	jsonText: string | undefined,
): number[] {
	if (!jsonText) return [];
	const parsed: unknown = JSON.parse(jsonText);
	if (!Array.isArray(parsed)) return [];
	return parsed.flatMap((entry) =>
		isCharacterRecord(entry) ? [entry.character_id] : [],
	);
}
function isCharacterRecord(value: unknown): value is { character_id: number } {
	return (
		typeof value === 'object' &&
		value !== null &&
		'character_id' in value &&
		typeof value.character_id === 'number'
	);
}
