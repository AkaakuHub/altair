import { createHash } from 'node:crypto';
import type { ContentAddressedBlobStore } from '../domain/content-addressed-blob-store.ts';
import type { MasterFieldNameRegistry } from '../domain/master-resource-import.ts';
import type {
	SavedDerivedSources,
	SavedJsonReference,
} from './saved-master-source-locator.ts';
import { SavedReleaseCandidateValidator } from './saved-release-candidate-validator.ts';
import { SavedReleaseDerivedSources } from './saved-release-derived-source-factory.ts';
import type {
	ArchiveSourceExtension,
	OfficialReadModelDefinition,
	SavedJsonDocument,
} from './source-adapters/source-input.ts';

export async function composeSavedReleaseCandidateValidator(
	input: Readonly<{
		archiveRoot: string;
		blobStore: ContentAddressedBlobStore;
		fieldNameRegistry: MasterFieldNameRegistry;
		readModels: readonly OfficialReadModelDefinition[];
		derivedSources: SavedDerivedSources;
		archiveExtension?: ArchiveSourceExtension;
		documentReader: {
			read(reference: SavedJsonReference): Promise<SavedJsonDocument>;
		};
	}>,
): Promise<SavedReleaseCandidateValidator> {
	const read = (
		reference: SavedJsonReference | undefined,
		identity: string,
		value: unknown,
	): Promise<SavedJsonDocument> =>
		reference === undefined
			? Promise.resolve({
					identity,
					value,
					sha256: createHash('sha256')
						.update(JSON.stringify(value))
						.digest('hex'),
				})
			: input.documentReader.read(reference);
	const [
		archiveList,
		archiveDetails,
		withStationList,
		withStationDetails,
		webViewGacha,
	] = await Promise.all([
		read(input.derivedSources.archiveList, 'archive.json', []),
		read(input.derivedSources.archiveDetails, 'archive-details.json', {}),
		read(input.derivedSources.withStationList, 'with-station.json', []),
		read(
			input.derivedSources.withStationDetails,
			'with-station-details.json',
			{},
		),
		Promise.all(
			input.derivedSources.webViewGacha.map((reference) =>
				input.documentReader.read(reference),
			),
		),
	]);
	return new SavedReleaseCandidateValidator({
		archiveRoot: input.archiveRoot,
		blobStore: input.blobStore,
		fieldNameRegistry: input.fieldNameRegistry,
		readModels: input.readModels,
		derivedSourceFactory: new SavedReleaseDerivedSources({
			archiveList,
			archiveDetails,
			withStationList,
			withStationDetails,
			webViewGacha,
			...(input.archiveExtension === undefined
				? {}
				: { archiveExtension: input.archiveExtension }),
		}),
	});
}
