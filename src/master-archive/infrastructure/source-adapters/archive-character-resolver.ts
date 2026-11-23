import { createHash } from 'node:crypto';
import type {
	GenericMasterCell,
	GenericMasterTable,
} from '../../domain/generic-master-binary.ts';
import { requireList, requireRecord } from './json-value.ts';
import type {
	ArchiveFilterableCharacter,
	OfficialDecodedTable,
	SavedJsonDocument,
} from './source-input.ts';

export function resolveArchiveFilterableCharacters(input: {
	archiveDetails: SavedJsonDocument;
	withStationDetails: SavedJsonDocument;
	characters: OfficialDecodedTable;
}): Readonly<{
	characters: readonly ArchiveFilterableCharacter[];
	identity: string;
	sha256: string;
}> {
	if (input.characters.tableLabel !== 'characters.tsv') {
		throw new Error('Archive character resolver requires characters.tsv');
	}
	const characterIds = new Set<number>();
	for (const document of [input.archiveDetails, input.withStationDetails]) {
		for (const detail of Object.values(
			requireRecord(document.value, document.identity),
		)) {
			const record = requireRecord(detail, document.identity);
			if (record.characters === undefined) continue;
			for (const value of requireList(
				record.characters,
				`${document.identity}.characters`,
			)) {
				const character = requireRecord(
					value,
					`${document.identity}.character`,
				);
				if (
					typeof character.character_id === 'number' &&
					Number.isSafeInteger(character.character_id)
				) {
					characterIds.add(character.character_id);
				}
			}
		}
	}
	const idIndex = fieldIndex(input.characters.table, 'Id');
	const nameIndex = fieldIndex(input.characters.table, 'NameFirst');
	const orderIndex = fieldIndex(input.characters.table, 'IconOrderId');
	const characters = input.characters.table.rows
		.map((row) => ({
			characterId: requireIntegerCell(row.cells[idIndex], 'Characters.Id'),
			label: requireStringCell(row.cells[nameIndex], 'Characters.NameFirst'),
			officialOrderId: requireIntegerCell(
				row.cells[orderIndex],
				'Characters.IconOrderId',
			),
		}))
		.filter(
			(character) =>
				characterIds.has(character.characterId) && character.label.length > 0,
		)
		.sort(
			(left, right) =>
				left.officialOrderId - right.officialOrderId ||
				left.characterId - right.characterId,
		)
		.map((character, orderId) => ({
			characterId: character.characterId,
			label: character.label,
			orderId,
		}));
	const identity = `archive-characters:${input.characters.blobSha256}`;
	return {
		characters,
		identity,
		sha256: createHash('sha256')
			.update(
				JSON.stringify({
					archiveDetails: input.archiveDetails.sha256,
					withStationDetails: input.withStationDetails.sha256,
					charactersBlob: input.characters.blobSha256,
					charactersSchema: input.characters.schemaFingerprint,
					characters,
				}),
			)
			.digest('hex'),
	};
}

function fieldIndex(
	table: GenericMasterTable,
	officialFieldName: string,
): number {
	const field = table.fields.find(
		(candidate) => candidate.officialFieldName === officialFieldName,
	);
	if (field === undefined) {
		throw new Error(`Characters field is unresolved: ${officialFieldName}`);
	}
	return field.index;
}

function requireIntegerCell(
	cell: GenericMasterCell | undefined,
	identity: string,
): number {
	if (cell?.kind !== 'int32') throw new Error(`${identity} must be int32`);
	return cell.value;
}

function requireStringCell(
	cell: GenericMasterCell | undefined,
	identity: string,
): string {
	if (cell?.kind !== 'string') throw new Error(`${identity} must be string`);
	return cell.value;
}
