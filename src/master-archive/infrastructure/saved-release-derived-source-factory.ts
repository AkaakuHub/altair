import type { ActiveMasterSourceResult } from '../domain/active-database-build.ts';
import { ReleaseCandidateCompatibilityError } from '../domain/release-candidate-compatibility.ts';
import { resolveArchiveFilterableCharacters } from './source-adapters/archive-character-resolver.ts';
import { ArchiveSourceAdapter } from './source-adapters/archive-source-adapter.ts';
import type {
	ArchiveSourceExtension,
	OfficialDecodedTable,
	SavedJsonDocument,
} from './source-adapters/source-input.ts';
import { resolveWebViewCards } from './source-adapters/webview-card-resolver.ts';
import { WebViewGachaSourceAdapter } from './source-adapters/webview-gacha-source-adapter.ts';

export interface SavedReleaseDerivedSourceFactory {
	load(
		officialTables: readonly OfficialDecodedTable[],
	): Promise<readonly ActiveMasterSourceResult[]>;
}

export class SavedReleaseDerivedSources
	implements SavedReleaseDerivedSourceFactory
{
	constructor(
		private readonly documents: Readonly<{
			archiveList: SavedJsonDocument;
			archiveDetails: SavedJsonDocument;
			withStationList: SavedJsonDocument;
			withStationDetails: SavedJsonDocument;
			archiveExtension?: ArchiveSourceExtension;
			webViewGacha: readonly SavedJsonDocument[];
		}>,
	) {}

	async load(
		officialTables: readonly OfficialDecodedTable[],
	): Promise<readonly ActiveMasterSourceResult[]> {
		const characters = officialTables.find(
			(table) => table.tableLabel === 'characters.tsv',
		);
		if (characters === undefined) {
			throw new ReleaseCandidateCompatibilityError({
				kind: 'derived-master-table-unavailable',
				source: 'archive',
				tableLabel: 'characters.tsv',
			});
		}
		const archiveCharacters = resolveArchiveFilterableCharacters({
			archiveDetails: this.documents.archiveDetails,
			withStationDetails: this.documents.withStationDetails,
			characters,
		});
		const webViewResolutions = resolveWebViewCards({
			documents: this.documents.webViewGacha,
			officialTables,
		});
		return Promise.all([
			new ArchiveSourceAdapter({
				archiveList: this.documents.archiveList,
				archiveDetails: this.documents.archiveDetails,
				withStationList: this.documents.withStationList,
				withStationDetails: this.documents.withStationDetails,
				...(this.documents.archiveExtension === undefined
					? {}
					: { extension: this.documents.archiveExtension }),
				filterableCharacters: archiveCharacters.characters,
				filterableCharacterIdentity: archiveCharacters.identity,
				filterableCharacterSha256: archiveCharacters.sha256,
			}).load(),
			new WebViewGachaSourceAdapter({
				documents: this.documents.webViewGacha,
				resolutions: webViewResolutions.resolutions,
				resolutionIdentity: webViewResolutions.identity,
				resolutionSha256: webViewResolutions.sha256,
			}).load(),
		]);
	}
}
