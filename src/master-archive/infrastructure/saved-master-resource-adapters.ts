import { createHash } from 'node:crypto';
import { decodeEncryptedLz4Asset } from '../../resources/domain/music/chartOuterPayload.ts';
import type {
	MasterResourceCatalogEntry,
	MasterResourceDecryptor,
	MasterResourceIntegrityVerifier,
} from '../domain/master-resource-import.ts';

export class SavedMasterResourceDecryptor implements MasterResourceDecryptor {
	decrypt(
		entry: MasterResourceCatalogEntry,
		encryptedBytes: Uint8Array,
	): Uint8Array {
		return decodeEncryptedLz4Asset(
			encryptedBytes,
			entry.tableLabel,
			BigInt(entry.encryptionSalt),
		);
	}
}

export class SavedMasterResourceIntegrityVerifier
	implements MasterResourceIntegrityVerifier
{
	verify(entry: MasterResourceCatalogEntry, encryptedBytes: Uint8Array) {
		if (encryptedBytes.length !== entry.encryptedSize) {
			throw new Error(`Master resource size mismatch: ${entry.tableLabel}`);
		}
		const checksum = Bun.hash.xxHash64(
			encryptedBytes,
			BigInt(encryptedBytes.length),
		);
		if (checksum.toString() !== entry.catalogChecksum) {
			throw new Error(`Master resource checksum mismatch: ${entry.tableLabel}`);
		}
		return {
			encryptedSha256: createHash('sha256')
				.update(encryptedBytes)
				.digest('hex'),
		};
	}
}
