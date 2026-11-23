import { createHash } from 'node:crypto';
import type {
	GenericMasterCell,
	GenericMasterTable,
} from '../../domain/generic-master-binary.ts';
import { ReleaseCandidateCompatibilityError } from '../../domain/release-candidate-compatibility.ts';
import {
	requireBoolean,
	requireList,
	requireRecord,
	requireString,
} from './json-value.ts';
import type {
	OfficialDecodedTable,
	SavedJsonDocument,
	WebViewCardResolution,
} from './source-input.ts';

const requiredTableLabels = [
	'carddatas.tsv',
	'cardseries.tsv',
	'characters.tsv',
	'cardrarities.tsv',
	'gachaseries.tsv',
] as const;

export function resolveWebViewCards(input: {
	documents: readonly SavedJsonDocument[];
	officialTables: readonly OfficialDecodedTable[];
}): Readonly<{
	resolutions: readonly WebViewCardResolution[];
	identity: string;
	sha256: string;
}> {
	const tables = new Map(
		input.officialTables.map((table) => [table.tableLabel, table]),
	);
	const records = Object.fromEntries(
		requiredTableLabels.map((label) => {
			const table = tables.get(label);
			if (table === undefined) {
				throw new ReleaseCandidateCompatibilityError({
					kind: 'derived-master-table-unavailable',
					source: 'webview-gacha',
					tableLabel: label,
				});
			}
			return [label, decodedRecords(table.table)];
		}),
	) as Record<(typeof requiredTableLabels)[number], readonly MasterRecord[]>;
	const cardSeries = indexByInteger(records['cardseries.tsv'], 'Id');
	if (
		records['carddatas.tsv'].some(
			(record) =>
				typeof record.IsParallelCard !== 'number' ||
				!Number.isSafeInteger(record.IsParallelCard),
		)
	) {
		throw new ReleaseCandidateCompatibilityError({
			kind: 'derived-master-field-unavailable',
			source: 'webview-gacha',
			tableLabel: 'carddatas.tsv',
			fieldName: 'IsParallelCard',
		});
	}
	const characters = indexByInteger(records['characters.tsv'], 'Id');
	const rarityNames = new Map(
		records['cardrarities.tsv'].map((row) => [
			requireInteger(row, 'Id'),
			requireText(row, 'RarityName'),
		]),
	);
	const gachaSeries = indexByInteger(records['gachaseries.tsv'], 'Id');
	const resolutions: WebViewCardResolution[] = [];
	for (const document of input.documents) {
		const seriesId = Number(document.identity);
		if (!Number.isSafeInteger(seriesId)) {
			throw new Error('WebView gacha identity must be a series ID');
		}
		const detail = requireRecord(document.value, document.identity);
		for (const [rateIndex, rateValue] of requireList(
			detail.rates,
			'rates',
		).entries()) {
			const rate = requireRecord(rateValue, 'rate');
			for (const [cardIndex, cardValue] of requireList(
				rate.cards,
				'cards',
			).entries()) {
				const webCard = requireRecord(cardValue, 'card');
				let candidates = records['carddatas.tsv'].filter((card) =>
					matchesWebCard(card, webCard, characters, rarityNames),
				);
				if (requireBoolean(webCard.pickup, 'card.pickup')) {
					const pickupSeries = pickupCardSeriesIds(gachaSeries.get(seriesId));
					const pickupCandidates = candidates.filter((card) =>
						pickupSeries.has(requireInteger(card, 'CardSeriesId')),
					);
					if (pickupCandidates.length > 0) candidates = pickupCandidates;
				}
				const unique = new Map(
					candidates.map((card) => {
						const cardSeriesId = requireInteger(card, 'CardSeriesId');
						const cardDatasId = baseCardDatasId(
							card,
							cardSeries.get(cardSeriesId),
						);
						return [
							`${cardDatasId}:${cardSeriesId}`,
							{ cardDatasId, cardSeriesId },
						];
					}),
				);
				if (unique.size !== 1) {
					throw new ReleaseCandidateCompatibilityError({
						kind: 'webview-card-unresolved',
						gachaSeriesId: seriesId,
						rateIndex,
						cardIndex,
					});
				}
				const resolved = unique.values().next().value;
				if (resolved === undefined)
					throw new Error('WebView card resolution is absent');
				resolutions.push({
					gachaSeriesId: seriesId,
					rateIndex,
					cardIndex,
					...resolved,
				});
			}
		}
	}
	const evidence = requiredTableLabels.map((label) => {
		const table = tables.get(label);
		if (table === undefined)
			throw new Error('WebView evidence table is absent');
		return {
			label,
			blobSha256: table.blobSha256,
			schemaFingerprint: table.schemaFingerprint,
		};
	});
	const identity = `webview-card-resolution:${createHash('sha256')
		.update(JSON.stringify(evidence))
		.digest('hex')}`;
	return {
		resolutions,
		identity,
		sha256: createHash('sha256')
			.update(
				JSON.stringify({
					documents: input.documents.map(({ identity: id, sha256 }) => ({
						id,
						sha256,
					})),
					evidence,
					resolutions,
				}),
			)
			.digest('hex'),
	};
}

type MasterRecord = Readonly<Record<string, string | number | bigint>>;

function decodedRecords(table: GenericMasterTable): readonly MasterRecord[] {
	const fieldNames = table.fields.map((field) => {
		if (field.officialFieldName === null) {
			throw new Error('WebView resolver field is unresolved');
		}
		return field.officialFieldName;
	});
	return table.rows.map((row) =>
		Object.fromEntries(
			row.cells.map((cell, index) => [fieldNames[index], cellValue(cell)]),
		),
	);
}

function cellValue(cell: GenericMasterCell): string | number | bigint {
	return cell.kind === 'int64' ? BigInt(cell.value) : cell.value;
}

function indexByInteger(records: readonly MasterRecord[], field: string) {
	return new Map(
		records.map((record) => [requireInteger(record, field), record]),
	);
}

function matchesWebCard(
	card: MasterRecord,
	webCard: Readonly<Record<string, unknown>>,
	characters: ReadonlyMap<number, MasterRecord>,
	rarityNames: ReadonlyMap<number, string>,
): boolean {
	if (requireText(card, 'Name') !== requireString(webCard.name, 'card.name'))
		return false;
	const rarityName = rarityNames.get(requireInteger(card, 'Rarity'));
	const webRarity = requireString(webCard.rarity, 'card.rarity');
	if (
		rarityName === undefined ||
		(webRarity !== rarityName && webRarity !== `m${rarityName}`)
	)
		return false;
	if (
		Boolean(requireInteger(card, 'IsParallelCard')) !==
		requireBoolean(webCard.IsParallel, 'card.IsParallel')
	)
		return false;
	const description = requireString(webCard.description, 'card.description');
	const descriptions = new Set([requireText(card, 'Description')]);
	const character = characters.get(requireInteger(card, 'CharactersId'));
	if (character !== undefined) {
		for (const field of ['DisplayFullName', 'NameFirst']) {
			const value = optionalText(character, field);
			if (value.length > 0) descriptions.add(value);
		}
		const fullName =
			`${optionalText(character, 'NameLast')} ${optionalText(character, 'NameFirst')}`.trim();
		if (fullName.length > 0) descriptions.add(fullName);
	}
	return descriptions.has(description);
}

function pickupCardSeriesIds(gacha: MasterRecord | undefined): Set<number> {
	if (gacha === undefined) return new Set();
	return new Set(
		Array.from({ length: 6 }, (_, index) =>
			requireInteger(gacha, `PickUpCardSeriesId_${index + 1}`),
		).filter((id) => id > 0),
	);
}

function baseCardDatasId(
	card: MasterRecord,
	series: MasterRecord | undefined,
): number {
	if (series !== undefined) {
		for (let evolution = 0; evolution <= 4; evolution += 1) {
			const id = requireInteger(series, `Evolution${evolution}Id`);
			if (id > 0) return id;
		}
	}
	return requireInteger(card, 'Id');
}

function requireInteger(record: MasterRecord, field: string): number {
	const value = record[field];
	if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
		throw new Error(`Official master field must be a safe integer: ${field}`);
	}
	return value;
}

function requireText(record: MasterRecord, field: string): string {
	const value = record[field];
	if (typeof value !== 'string')
		throw new Error(`Official master field must be text: ${field}`);
	return value;
}

function optionalText(record: MasterRecord, field: string): string {
	const value = record[field];
	if (typeof value !== 'string')
		throw new Error(`Official master field must be text: ${field}`);
	return value;
}
