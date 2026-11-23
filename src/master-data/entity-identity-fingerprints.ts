import type { Database } from 'bun:sqlite';
import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import { findMusicSource } from './music-source.ts';

export function getItemIdentityFingerprint(
	database: Database,
	itemId: number,
): EntityIdentityFingerprint | undefined {
	const row = database
		.query<
			{
				id: number;
				item_type: number;
				item_category: number;
			},
			[number]
		>('SELECT id, item_type, item_category FROM master_items WHERE id = ?')
		.get(itemId);
	return row === null
		? undefined
		: {
				domain: 'item',
				value: JSON.stringify([row.id, row.item_type, row.item_category]),
			};
}

export function getCardIdentityFingerprint(
	database: Database,
	cardDatasId: number,
): EntityIdentityFingerprint | undefined {
	const row = database
		.query<
			{
				id: number;
				card_series_id: number;
				characters_id: number;
				evolve_times: number;
			},
			[number]
		>(
			[
				'SELECT id, card_series_id, characters_id, evolve_times',
				'FROM master_card_datas WHERE id = ?',
			].join(' '),
		)
		.get(cardDatasId);
	return row === null
		? undefined
		: {
				domain: 'card',
				value: JSON.stringify([
					row.id,
					row.card_series_id,
					row.characters_id,
					row.evolve_times,
				]),
			};
}

export function getMusicIdentityFingerprint(
	database: Database,
	musicId: number,
): EntityIdentityFingerprint | undefined {
	const row = findMusicSource(database, musicId);
	return row === null
		? undefined
		: {
				domain: 'music',
				value: JSON.stringify([row.id, row.sound_id]),
			};
}

export function getMusicIdentityFingerprints(
	database: Database,
): ReadonlyMap<number, EntityIdentityFingerprint> {
	const rows = database
		.query<{ id: number; sound_id: number }, []>(
			'SELECT id, sound_id FROM master_musics',
		)
		.all();
	return new Map(
		rows.map((row) => [
			row.id,
			{
				domain: 'music',
				value: JSON.stringify([row.id, row.sound_id]),
			},
		]),
	);
}

export function getItemIdentityFingerprints(
	database: Database,
): ReadonlyMap<number, EntityIdentityFingerprint> {
	const rows = database
		.query<{ id: number; item_type: number; item_category: number }, []>(
			'SELECT id, item_type, item_category FROM master_items',
		)
		.all();
	return new Map(
		rows.map((row) => [
			row.id,
			{
				domain: 'item',
				value: JSON.stringify([row.id, row.item_type, row.item_category]),
			},
		]),
	);
}

export function getCardIdentityFingerprints(
	database: Database,
): ReadonlyMap<number, EntityIdentityFingerprint> {
	const rows = database
		.query<
			{
				id: number;
				card_series_id: number;
				characters_id: number;
				evolve_times: number;
			},
			[]
		>(
			'SELECT id, card_series_id, characters_id, evolve_times FROM master_card_datas',
		)
		.all();
	return new Map(
		rows.map((row) => [
			row.id,
			{
				domain: 'card',
				value: JSON.stringify([
					row.id,
					row.card_series_id,
					row.characters_id,
					row.evolve_times,
				]),
			},
		]),
	);
}
