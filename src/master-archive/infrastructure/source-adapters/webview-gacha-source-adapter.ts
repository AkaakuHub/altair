import type { ActiveMasterSource } from '../../application/active-database-builder.ts';
import type {
	ActiveDatabaseTable,
	ActiveDatabaseValue,
	ActiveMasterSourceResult,
} from '../../domain/active-database-build.ts';
import {
	requireBoolean,
	requireList,
	requireNumber,
	requireRecord,
	requireString,
} from './json-value.ts';
import {
	type SavedJsonDocument,
	sourceSetHash,
	sourceSetIdentity,
	type WebViewCardResolution,
} from './source-input.ts';

export class WebViewGachaSourceAdapter implements ActiveMasterSource {
	constructor(
		private readonly input: Readonly<{
			documents: readonly SavedJsonDocument[];
			resolutions: readonly WebViewCardResolution[];
			resolutionIdentity: string;
			resolutionSha256: string;
		}>,
	) {}

	async load(): Promise<ActiveMasterSourceResult> {
		return {
			kind: 'webview-gacha',
			identity:
				this.input.documents.length === 0
					? 'webview-gacha:empty'
					: sourceSetIdentity(this.input.documents),
			sha256: sourceSetHash([
				...this.input.documents,
				{
					identity: this.input.resolutionIdentity,
					sha256: this.input.resolutionSha256,
					value: this.input.resolutions,
				},
			]),
			schemaFingerprints: [],
			tables: webViewTables(this.input.documents, this.input.resolutions),
		};
	}
}

function webViewTables(
	documents: readonly SavedJsonDocument[],
	resolutions: readonly WebViewCardResolution[],
): ActiveDatabaseTable[] {
	const detailRows: Array<Record<string, ActiveDatabaseValue>> = [];
	const rateRows: Array<Record<string, ActiveDatabaseValue>> = [];
	const rarityRows: Array<Record<string, ActiveDatabaseValue>> = [];
	const cardRows: Array<Record<string, ActiveDatabaseValue>> = [];
	const itemRows: Array<Record<string, ActiveDatabaseValue>> = [];
	for (const document of documents) {
		const seriesId = Number(document.identity);
		if (!Number.isSafeInteger(seriesId)) {
			throw new Error('WebView gacha identity must be a series ID');
		}
		const detail = requireRecord(document.value, document.identity);
		detailRows.push({
			gacha_series_id: seriesId,
			title: requireString(detail.title, 'title'),
			giftless: requireBoolean(detail.giftless, 'giftless') ? 1 : 0,
			paidlimited: requireBoolean(detail.paidlimited, 'paidlimited') ? 1 : 0,
			notice_json: JSON.stringify(detail.notice),
		});
		for (const [rateIndex, rateValue] of requireList(
			detail.rates,
			'rates',
		).entries()) {
			const rate = requireRecord(rateValue, 'rate');
			rateRows.push({
				gacha_series_id: seriesId,
				rate_index: rateIndex,
				min_draw_count: requireNumber(rate.min, 'min'),
				max_draw_count: requireNumber(rate.max, 'max'),
			});
			appendRarityRows(rarityRows, seriesId, rateIndex, rate);
			appendCardRows(cardRows, seriesId, rateIndex, rate, resolutions);
			appendItemRows(itemRows, seriesId, rateIndex, rate);
		}
	}
	return [
		fixedTable(
			'top_webview_gacha_detail',
			detailRows,
			[
				['gacha_series_id', 'INTEGER', false],
				['title', 'TEXT', false],
				['giftless', 'INTEGER', false],
				['paidlimited', 'INTEGER', false],
				['notice_json', 'TEXT', false],
			],
			['gacha_series_id'],
		),
		fixedTable(
			'top_webview_gacha_rate',
			rateRows,
			[
				['gacha_series_id', 'INTEGER', false],
				['rate_index', 'INTEGER', false],
				['min_draw_count', 'INTEGER', false],
				['max_draw_count', 'INTEGER', false],
			],
			['gacha_series_id', 'rate_index'],
		),
		fixedTable(
			'top_webview_gacha_rate_rarity',
			rarityRows,
			[
				['gacha_series_id', 'INTEGER', false],
				['rate_index', 'INTEGER', false],
				['rarity_index', 'INTEGER', false],
				['rarity_name', 'TEXT', false],
				['odds', 'INTEGER', false],
			],
			['gacha_series_id', 'rate_index', 'rarity_index'],
		),
		fixedTable(
			'top_webview_gacha_rate_card',
			cardRows,
			[
				['gacha_series_id', 'INTEGER', false],
				['rate_index', 'INTEGER', false],
				['card_index', 'INTEGER', false],
				['rarity_name', 'TEXT', false],
				['card_name', 'TEXT', false],
				['description', 'TEXT', false],
				['is_pickup', 'INTEGER', false],
				['limited', 'TEXT', true],
				['odds', 'INTEGER', false],
				['is_parallel', 'INTEGER', false],
				['resolved_card_datas_id', 'INTEGER', false],
				['resolved_card_series_id', 'INTEGER', false],
			],
			['gacha_series_id', 'rate_index', 'card_index'],
		),
		fixedTable(
			'top_webview_gacha_rate_item',
			itemRows,
			[
				['gacha_series_id', 'INTEGER', false],
				['rate_index', 'INTEGER', false],
				['item_index', 'INTEGER', false],
				['rank', 'INTEGER', false],
				['item_name', 'TEXT', false],
				['quantity', 'INTEGER', false],
				['odds', 'INTEGER', false],
			],
			['gacha_series_id', 'rate_index', 'item_index'],
		),
	];
}

function appendRarityRows(
	rows: Array<Record<string, ActiveDatabaseValue>>,
	seriesId: number,
	rateIndex: number,
	rate: Readonly<Record<string, unknown>>,
): void {
	for (const [rarityIndex, rarityValue] of requireList(
		rate.rarities,
		'rarities',
	).entries()) {
		const rarity = requireRecord(rarityValue, 'rarity');
		rows.push({
			gacha_series_id: seriesId,
			rate_index: rateIndex,
			rarity_index: rarityIndex,
			rarity_name: requireString(rarity.name, 'rarity.name'),
			odds: requireNumber(rarity.odds, 'rarity.odds'),
		});
	}
}

function appendCardRows(
	rows: Array<Record<string, ActiveDatabaseValue>>,
	seriesId: number,
	rateIndex: number,
	rate: Readonly<Record<string, unknown>>,
	resolutions: readonly WebViewCardResolution[],
): void {
	for (const [cardIndex, cardValue] of requireList(
		rate.cards,
		'cards',
	).entries()) {
		const card = requireRecord(cardValue, 'card');
		const resolution = resolutions.find(
			(item) =>
				item.gachaSeriesId === seriesId &&
				item.rateIndex === rateIndex &&
				item.cardIndex === cardIndex,
		);
		if (resolution === undefined) {
			throw new Error(
				`WebView gacha card resolution is missing: ${seriesId}:${rateIndex}:${cardIndex}`,
			);
		}
		rows.push({
			gacha_series_id: seriesId,
			rate_index: rateIndex,
			card_index: cardIndex,
			rarity_name: requireString(card.rarity, 'card.rarity'),
			card_name: requireString(card.name, 'card.name'),
			description: requireString(card.description, 'card.description'),
			is_pickup: requireBoolean(card.pickup, 'card.pickup') ? 1 : 0,
			limited:
				card.limited === null
					? null
					: requireString(card.limited, 'card.limited'),
			odds: requireNumber(card.odds, 'card.odds'),
			is_parallel: requireBoolean(card.IsParallel, 'card.IsParallel') ? 1 : 0,
			resolved_card_datas_id: resolution.cardDatasId,
			resolved_card_series_id: resolution.cardSeriesId,
		});
	}
}

function appendItemRows(
	rows: Array<Record<string, ActiveDatabaseValue>>,
	seriesId: number,
	rateIndex: number,
	rate: Readonly<Record<string, unknown>>,
): void {
	for (const [itemIndex, itemValue] of requireList(
		rate.items,
		'items',
	).entries()) {
		const item = requireRecord(itemValue, 'item');
		rows.push({
			gacha_series_id: seriesId,
			rate_index: rateIndex,
			item_index: itemIndex,
			rank: requireNumber(item.rank, 'item.rank'),
			item_name: requireString(item.name, 'item.name'),
			quantity: requireNumber(item.quantity, 'item.quantity'),
			odds: requireNumber(item.odds, 'item.odds'),
		});
	}
}

function fixedTable(
	name: string,
	rows: readonly Readonly<Record<string, ActiveDatabaseValue>>[],
	columns: readonly (readonly [string, 'INTEGER' | 'TEXT', boolean])[],
	primaryKey: readonly string[],
): ActiveDatabaseTable {
	return {
		name,
		rows,
		columns: columns.map(([columnName, type, nullable]) => ({
			name: columnName,
			type,
			nullable,
		})),
		primaryKey,
		indexes: [],
	};
}
