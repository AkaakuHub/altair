import { describe, expect, test } from 'bun:test';
import type {
	GenericMasterCell,
	GenericMasterTable,
} from '../src/master-archive/domain/generic-master-binary.ts';
import { SavedReleaseDerivedSources } from '../src/master-archive/infrastructure/saved-release-derived-source-factory.ts';
import type { OfficialDecodedTable } from '../src/master-archive/infrastructure/source-adapters/source-input.ts';
import { resolveWebViewCards } from '../src/master-archive/infrastructure/source-adapters/webview-card-resolver.ts';

describe('WebView card resolver', () => {
	test('resolves a saved WebView card from the exact official master tables', () => {
		const result = resolveWebViewCards({
			documents: [
				{
					identity: '100',
					sha256: hash('a'),
					value: {
						rates: [
							{
								cards: [
									{
										name: 'Card',
										rarity: 'UR',
										IsParallel: false,
										description: '花帆',
										pickup: true,
									},
								],
							},
						],
					},
				},
			],
			officialTables: [
				decoded('carddatas.tsv', [
					{
						Id: 1001,
						Name: 'Card',
						Rarity: 3,
						IsParallelCard: 0,
						Description: 'other',
						CardSeriesId: 10,
						CharactersId: 7,
					},
				]),
				decoded('cardseries.tsv', [
					{
						Id: 10,
						Evolution0Id: 1001,
						Evolution1Id: 0,
						Evolution2Id: 0,
						Evolution3Id: 0,
						Evolution4Id: 0,
					},
				]),
				decoded('characters.tsv', [
					{
						Id: 7,
						DisplayFullName: '日野下 花帆',
						NameLast: '日野下',
						NameFirst: '花帆',
					},
				]),
				decoded('cardrarities.tsv', [{ Id: 3, RarityName: 'UR' }]),
				decoded('gachaseries.tsv', [
					{
						Id: 100,
						PickUpCardSeriesId_1: 10,
						PickUpCardSeriesId_2: 0,
						PickUpCardSeriesId_3: 0,
						PickUpCardSeriesId_4: 0,
						PickUpCardSeriesId_5: 0,
						PickUpCardSeriesId_6: 0,
					},
				]),
			],
		});

		expect(result.resolutions).toEqual([
			{
				gachaSeriesId: 100,
				rateIndex: 0,
				cardIndex: 0,
				cardDatasId: 1001,
				cardSeriesId: 10,
			},
		]);
	});

	test('builds all saved archive and WebView derived tables together', async () => {
		const document = (identity: string, value: unknown) => ({
			identity,
			sha256: hash('d'),
			value,
		});
		const characters = decoded('characters.tsv', [
			{
				Id: 7,
				NameFirst: '花帆',
				IconOrderId: 1,
				DisplayFullName: '日野下 花帆',
				NameLast: '日野下',
			},
		]);
		const sources = await new SavedReleaseDerivedSources({
			archiveList: document('archive-list', []),
			archiveDetails: document('archive-details', {}),
			withStationList: document('station-list', []),
			withStationDetails: document('station-details', {}),
			webViewGacha: [],
		}).load([
			characters,
			decoded('carddatas.tsv', []),
			decoded('cardseries.tsv', []),
			decoded('cardrarities.tsv', []),
			decoded('gachaseries.tsv', []),
		]);

		expect(sources.flatMap((source) => source.tables)).toHaveLength(11);
	});
});

function decoded(
	tableLabel: string,
	rows: readonly Readonly<Record<string, string | number>>[],
): OfficialDecodedTable {
	const fieldNames = Object.keys(rows[0] ?? {});
	const table: GenericMasterTable = {
		header: { magic: 'da00', formatBytes: [0, 1] },
		rowCount: rows.length,
		fieldCount: fieldNames.length,
		fields: fieldNames.map((name, index) => ({
			index,
			crc: index,
			typeCode: typeof rows[0]?.[name] === 'string' ? 0x10 : 0x20,
			typeName: typeof rows[0]?.[name] === 'string' ? 'string' : 'int32',
			officialFieldName: name,
		})),
		rows: rows.map((row, index) => ({
			index,
			cells: fieldNames.map((name): GenericMasterCell => {
				const value = row[name];
				return typeof value === 'string'
					? { kind: 'string', value }
					: {
							kind: 'int32',
							value: value ?? 0,
							encodedUnsigned: String(value ?? 0),
						};
			}),
		})),
	};
	return {
		tableLabel,
		blobSha256: hash('b'),
		schemaFingerprint: hash('c'),
		table,
	};
}

function hash(character: string): string {
	return character.repeat(64);
}
