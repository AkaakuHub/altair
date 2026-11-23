import { createHash } from 'node:crypto';
import type {
	ActiveDatabaseIndex,
	ActiveDatabaseTable,
} from '../../domain/active-database-build.ts';
import type { GenericMasterTable } from '../../domain/generic-master-binary.ts';

export type OfficialReadModelDefinition = Readonly<{
	tableLabel: string;
	databaseTableName: string;
	columns: readonly OfficialReadModelColumn[];
	primaryKey: readonly string[];
	indexes: readonly ActiveDatabaseIndex[];
}>;

export type OfficialReadModelColumn =
	| Readonly<{
			source: 'field';
			fieldCrc: number;
			columnName: string;
			type: 'INTEGER' | 'TEXT';
			binaryTypeCode: 0x10 | 0x20 | 0x33;
	  }>
	| Readonly<{
			source: 'row-index';
			columnName: '__row_index';
			type: 'INTEGER';
	  }>;

export type OfficialDecodedTable = Readonly<{
	tableLabel: string;
	blobSha256: string;
	schemaFingerprint: string;
	table: GenericMasterTable;
}>;

export type SavedJsonDocument = Readonly<{
	identity: string;
	sha256: string;
	value: unknown;
}>;

export type ArchiveFilterableCharacter = Readonly<{
	characterId: number;
	label: string;
	orderId: number;
}>;

export type WebViewCardResolution = Readonly<{
	gachaSeriesId: number;
	rateIndex: number;
	cardIndex: number;
	cardDatasId: number;
	cardSeriesId: number;
}>;

export function sourceSetIdentity(
	sources: readonly SavedJsonDocument[],
): string {
	return sources
		.map((source) => source.identity)
		.sort()
		.join('+');
}

export function sourceSetHash(sources: readonly SavedJsonDocument[]): string {
	return createHash('sha256')
		.update(
			JSON.stringify(
				sources
					.map(({ identity, sha256 }) => ({ identity, sha256 }))
					.sort((left, right) => left.identity.localeCompare(right.identity)),
			),
		)
		.digest('hex');
}

export type ArchiveSourceExtension = Readonly<{
	documents: readonly SavedJsonDocument[];
	tables: readonly ActiveDatabaseTable[];
}>;
