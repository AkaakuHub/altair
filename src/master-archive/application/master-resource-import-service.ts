import { contentAddressedBlob } from '../domain/content-addressed-blob-store.ts';
import {
	decodeGenericMasterBinary,
	MasterBinaryDecodeError,
} from '../domain/generic-master-binary.ts';
import type {
	MasterResourceCatalogEntry,
	MasterResourceImportPorts,
	MasterResourceImportReport,
	MasterResourceImportResult,
} from '../domain/master-resource-import.ts';
import { schemaFingerprint } from '../domain/schema-registry.ts';

const importBatchSize = 32;

export class MasterResourceImportService {
	constructor(private readonly ports: MasterResourceImportPorts) {}

	async importAll(): Promise<readonly MasterResourceImportResult[]> {
		const entries = await this.ports.catalog.readMasterEntries();
		return this.importEntries(entries);
	}

	async importEntries(
		entries: readonly MasterResourceCatalogEntry[],
	): Promise<readonly MasterResourceImportResult[]> {
		const results: MasterResourceImportResult[] = [];
		for (let offset = 0; offset < entries.length; offset += importBatchSize) {
			const batch = entries.slice(offset, offset + importBatchSize);
			results.push(
				...(await Promise.all(batch.map((entry) => this.importEntry(entry)))),
			);
		}
		return results;
	}

	async importEntry(
		entry: MasterResourceCatalogEntry,
	): Promise<MasterResourceImportResult> {
		const existing = await this.ports.reportStore.read(entry);
		if (existing !== null && existing.status !== 'resource-unavailable') {
			return this.existingResult(entry, existing);
		}
		const blobReference = await this.ports.blobReferenceStore.read(entry);
		if (blobReference !== null) {
			const rawBytes = await this.ports.blobStore.read(
				blobReference.blobSha256,
			);
			if (rawBytes === null) {
				throw new Error('Saved master blob reference target is missing');
			}
			return this.decodeAndWrite(
				entry,
				rawBytes,
				blobReference.encryptedSha256,
				'already-present',
			);
		}
		let encryptedBytes: Uint8Array;
		try {
			encryptedBytes = await this.ports.payloadReader.read(entry.assetPath);
		} catch (error) {
			return this.writeInputFailure(entry, 'resource-unavailable', error);
		}
		let integrity: { encryptedSha256: string };
		try {
			integrity = this.ports.integrityVerifier.verify(entry, encryptedBytes);
		} catch (error) {
			return this.writeInputFailure(entry, 'integrity-failed', error);
		}
		const rawBytes = this.ports.decryptor.decrypt(entry, encryptedBytes);
		const blob = contentAddressedBlob(rawBytes);
		const blobWriteResult = await this.ports.blobStore.write(blob);
		await this.ports.blobReferenceStore.write({
			schemaVersion: 1,
			platform: entry.platform,
			catalogResourceIdentity: entry.catalogResourceIdentity,
			encryptedSha256: integrity.encryptedSha256,
			blobSha256: blob.sha256,
		});
		return this.decodeAndWrite(
			entry,
			rawBytes,
			integrity.encryptedSha256,
			blobWriteResult,
		);
	}

	private async decodeAndWrite(
		entry: MasterResourceCatalogEntry,
		rawBytes: Uint8Array,
		encryptedSha256: string,
		blobWriteResult: 'already-present' | 'stored',
	): Promise<MasterResourceImportResult> {
		const blob = contentAddressedBlob(rawBytes);
		try {
			const decoded = decodeGenericMasterBinary(
				entry.tableLabel,
				rawBytes,
				(input) => this.ports.fieldNameRegistry.resolve(input),
			);
			const fingerprint = schemaFingerprint(
				entry.tableLabel,
				decoded.table.fields,
			);
			const status =
				decoded.report.unknownFieldCrcs.length === 0
					? ('decoded' as const)
					: ('schema-unresolved' as const);
			await this.writeReport({
				entry,
				encryptedSha256,
				blobSha256: blob.sha256,
				status,
				schemaFingerprint: fingerprint,
				decode: decoded.report,
			});
			return {
				entry,
				status,
				encryptedSha256,
				blobSha256: blob.sha256,
				blobWriteResult,
				schemaFingerprint: fingerprint,
				rowCount: decoded.table.rowCount,
			};
		} catch (error) {
			if (!(error instanceof MasterBinaryDecodeError)) throw error;
			await this.writeReport({
				entry,
				encryptedSha256,
				blobSha256: blob.sha256,
				status: 'decode-failed',
				schemaFingerprint: null,
				decode: error.report,
			});
			return {
				entry,
				status: 'decode-failed',
				encryptedSha256,
				blobSha256: blob.sha256,
				blobWriteResult,
				schemaFingerprint: null,
				rowCount: null,
			};
		}
	}

	private async existingResult(
		entry: MasterResourceCatalogEntry,
		report: MasterResourceImportReport,
	): Promise<MasterResourceImportResult> {
		if (
			report.platform !== entry.platform ||
			report.tableLabel !== entry.tableLabel ||
			report.catalogResourceIdentity !== entry.catalogResourceIdentity
		) {
			throw new Error('Saved master decode report identity differs');
		}
		if (report.blobSha256 !== null) {
			const blob = await this.ports.blobStore.read(report.blobSha256);
			if (blob === null) throw new Error('Saved master report blob is missing');
		}
		return {
			entry,
			status: report.status,
			encryptedSha256: report.encryptedSha256,
			blobSha256: report.blobSha256,
			blobWriteResult:
				report.blobSha256 === null ? null : ('already-present' as const),
			schemaFingerprint: report.schemaFingerprint,
			rowCount:
				report.decode?.status === 'decoded' ? report.decode.rowCount : null,
		};
	}

	private async writeReport(input: {
		entry: MasterResourceCatalogEntry;
		encryptedSha256: string;
		blobSha256: string;
		status: MasterResourceImportReport['status'];
		schemaFingerprint: string | null;
		decode: MasterResourceImportReport['decode'];
	}): Promise<void> {
		await this.ports.reportStore.write({
			platform: input.entry.platform,
			tableLabel: input.entry.tableLabel,
			catalogResourceIdentity: input.entry.catalogResourceIdentity,
			encryptedSha256: input.encryptedSha256,
			blobSha256: input.blobSha256,
			status: input.status,
			schemaFingerprint: input.schemaFingerprint,
			decode: input.decode,
		});
	}

	private async writeInputFailure(
		entry: MasterResourceCatalogEntry,
		status: 'integrity-failed' | 'resource-unavailable',
		error: unknown,
	): Promise<MasterResourceImportResult> {
		const errorMessage = error instanceof Error ? error.message : String(error);
		await this.ports.reportStore.write({
			platform: entry.platform,
			tableLabel: entry.tableLabel,
			catalogResourceIdentity: entry.catalogResourceIdentity,
			encryptedSha256: null,
			blobSha256: null,
			status,
			schemaFingerprint: null,
			decode: null,
			errorMessage,
		});
		return {
			entry,
			status,
			encryptedSha256: null,
			blobSha256: null,
			blobWriteResult: null,
			schemaFingerprint: null,
			rowCount: null,
		};
	}
}
