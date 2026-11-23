import type { Database } from 'bun:sqlite';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from '../state/entity-provenance.ts';

type StickerIdentityRow = {
	id: number;
	category_type: number;
	season_id: number;
	characters_id: number;
	is_variant: number;
};

export function createStickerIdentityFingerprint(
	row: StickerIdentityRow,
): EntityIdentityFingerprint {
	return {
		domain: 'sticker',
		value: JSON.stringify([
			row.id,
			row.category_type,
			row.season_id,
			row.characters_id,
			row.is_variant,
		]),
	};
}

export function getStickerIdentityFingerprint(
	database: Database,
	stickerId: number,
): EntityIdentityFingerprint | undefined {
	const row = database
		.query<StickerIdentityRow, [number]>(
			[
				'SELECT id, category_type, season_id, characters_id, is_variant',
				'FROM master_stickers WHERE id = ?',
			].join(' '),
		)
		.get(stickerId);
	return row === null ? undefined : createStickerIdentityFingerprint(row);
}

export function getStickerProvenance(
	database: Database,
	sourceMasterReleaseId: string,
	stickerId: number,
): EntityProvenance | undefined {
	const identityFingerprint = getStickerIdentityFingerprint(
		database,
		stickerId,
	);
	return identityFingerprint === undefined
		? undefined
		: { sourceMasterReleaseId, identityFingerprint };
}
