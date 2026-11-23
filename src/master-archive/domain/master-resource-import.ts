import type { ContentAddressedBlobStore } from './content-addressed-blob-store.ts';
import type { MasterBinaryDecodeReport } from './generic-master-binary.ts';

export type MasterArchivePlatform = 'android' | 'ios';

export type MasterResourceCatalogEntry = Readonly<{
	platform: MasterArchivePlatform;
	resourceVersion: string;
	tableLabel: string;
	catalogResourceIdentity: string;
	assetPath: string;
	encryptedSize: number;
	catalogChecksum: string;
	encryptionSalt: string;
}>;

export type MasterResourceCatalog = {
	readMasterEntries(): Promise<readonly MasterResourceCatalogEntry[]>;
};

export type MasterResourcePayloadReader = {
	read(assetPath: string): Promise<Uint8Array>;
};

export type MasterResourceIntegrity = Readonly<{
	encryptedSha256: string;
}>;

export type MasterResourceIntegrityVerifier = {
	verify(
		entry: MasterResourceCatalogEntry,
		encryptedBytes: Uint8Array,
	): MasterResourceIntegrity;
};

export type MasterResourceDecryptor = {
	decrypt(
		entry: MasterResourceCatalogEntry,
		encryptedBytes: Uint8Array,
	): Uint8Array;
};

export type MasterFieldNameRegistry = {
	resolve(input: {
		tableLabel: string;
		fieldIndex: number;
		fieldCrc: number;
		typeCode: number;
	}): string | null;
};

export type MasterResourceImportReport = Readonly<{
	platform: MasterArchivePlatform;
	tableLabel: string;
	catalogResourceIdentity: string;
	encryptedSha256: string | null;
	blobSha256: string | null;
	status:
		| 'decoded'
		| 'decode-failed'
		| 'integrity-failed'
		| 'resource-unavailable'
		| 'schema-unresolved';
	schemaFingerprint: string | null;
	decode: MasterBinaryDecodeReport | null;
	errorMessage?: string;
}>;

export type MasterDecodeReportStore = {
	read(
		entry: MasterResourceCatalogEntry,
	): Promise<MasterResourceImportReport | null>;
	write(report: MasterResourceImportReport): Promise<void>;
};

export type MasterBlobReference = Readonly<{
	schemaVersion: 1;
	platform: MasterArchivePlatform;
	catalogResourceIdentity: string;
	encryptedSha256: string;
	blobSha256: string;
}>;

export type MasterBlobReferenceStore = {
	read(entry: MasterResourceCatalogEntry): Promise<MasterBlobReference | null>;
	write(reference: MasterBlobReference): Promise<void>;
};

export type MasterResourceImportPorts = Readonly<{
	catalog: MasterResourceCatalog;
	payloadReader: MasterResourcePayloadReader;
	integrityVerifier: MasterResourceIntegrityVerifier;
	decryptor: MasterResourceDecryptor;
	fieldNameRegistry: MasterFieldNameRegistry;
	blobStore: ContentAddressedBlobStore;
	blobReferenceStore: MasterBlobReferenceStore;
	reportStore: MasterDecodeReportStore;
}>;

export type MasterResourceImportResult = Readonly<{
	entry: MasterResourceCatalogEntry;
	status: MasterResourceImportReport['status'];
	encryptedSha256: string | null;
	blobSha256: string | null;
	blobWriteResult: 'already-present' | 'stored' | null;
	schemaFingerprint: string | null;
	rowCount: number | null;
}>;
