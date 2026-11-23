import { createHash } from 'node:crypto';
import { catalogAssetRealName } from '../../resources/domain/assets/catalogAssetIdentity.ts';
import { catalogAssetPath } from '../../resources/domain/assets/catalogAssetPath.ts';
import type { BinaryCatalogEntry } from '../../resources/domain/assets/catalogBinary.ts';
import type {
	MasterArchivePlatform,
	MasterResourceCatalogEntry,
} from '../domain/master-resource-import.ts';

export function isMasterResource(entry: BinaryCatalogEntry): boolean {
	return entry.resourceType === 192 && entry.categories.includes('masterdata');
}

export function mapMasterCatalogEntry(
	platform: MasterArchivePlatform,
	resourceVersion: string,
	entry: BinaryCatalogEntry,
): MasterResourceCatalogEntry {
	const realName = catalogAssetRealName(
		entry.label,
		entry.checksum,
		entry.size,
	);
	const catalogResourceIdentity = createHash('sha256')
		.update(
			JSON.stringify({
				platform,
				resourceVersion,
				label: entry.label,
				resourceType: entry.resourceType,
				size: entry.size,
				checksum: entry.checksum.toString(),
				encryptionSalt: entry.encryptionSalt.toString(),
				realName,
			}),
		)
		.digest('hex');
	return {
		platform,
		resourceVersion,
		tableLabel: entry.label,
		catalogResourceIdentity,
		assetPath: catalogAssetPath(entry.resourceType, platform, realName),
		encryptedSize: entry.size,
		catalogChecksum: entry.checksum.toString(),
		encryptionSalt: entry.encryptionSalt.toString(),
	};
}
