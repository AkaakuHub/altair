import { describe, expect, test } from 'bun:test';
import { composeSavedReleaseCandidateValidator } from '../src/master-archive/infrastructure/compose-saved-release-candidate-validator.ts';
import { SavedReleaseCandidateValidator } from '../src/master-archive/infrastructure/saved-release-candidate-validator.ts';

describe('saved release candidate validator composition', () => {
	test('全派生sourceを一度ずつ読み込んでvalidatorを構成する', async () => {
		const references = {
			archiveList: reference('archive-list'),
			archiveDetails: reference('archive-details'),
			withStationList: reference('station-list'),
			withStationDetails: reference('station-details'),
			webViewGacha: [reference('1000101')],
		};
		const readIdentities: string[] = [];
		const validator = await composeSavedReleaseCandidateValidator({
			archiveRoot: '/archive',
			blobStore: {
				contains: async () => false,
				read: async () => null,
				write: async () => 'stored',
			},
			fieldNameRegistry: { resolve: () => null },
			readModels: [
				{
					tableLabel: 'fixture.tsv',
					databaseTableName: 'master_fixture',
					columns: [
						{
							source: 'field',
							fieldCrc: 1,
							columnName: 'id',
							type: 'INTEGER',
							binaryTypeCode: 0x20,
						},
					],
					primaryKey: ['id'],
					indexes: [],
				},
			],
			derivedSources: references,
			documentReader: {
				read: async (entry) => {
					readIdentities.push(entry.identity);
					return {
						identity: entry.identity,
						sha256: 'a'.repeat(64),
						value: null,
					};
				},
			},
		});

		expect(validator).toBeInstanceOf(SavedReleaseCandidateValidator);
		expect(readIdentities).toEqual([
			'archive-list',
			'archive-details',
			'station-list',
			'station-details',
			'1000101',
		]);
	});
});

function reference(identity: string) {
	return {
		identity,
		path: `/${identity}.json`,
	};
}
