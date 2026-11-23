import type { MasterResourceCatalogEntry } from '../../../src/master-archive/domain/master-resource-import.ts';
import { savedMasterFixturePath } from '../../masterArchive/fixtures/savedMasterFixtures.ts';

export const entry: MasterResourceCatalogEntry = {
	platform: 'android',
	resourceVersion: 'R2604100@BFrkfPQkJ9JM6RLSZCpOYoDTYA==',
	tableLabel: 'carddatas.tsv',
	catalogResourceIdentity: 'c'.repeat(64),
	assetPath: 'raw/z2/z2tmc7bah3vbpl4ykudkzxabnu',
	encryptedSize: 55_728,
	catalogChecksum: '11684984095081922144',
	encryptionSalt: '9789364451268764212',
};

export const encryptedResource = savedMasterFixturePath(
	'carddatas-r2604100.encrypted',
);
