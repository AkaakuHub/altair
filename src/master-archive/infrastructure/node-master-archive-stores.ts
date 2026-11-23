import { createHash } from 'node:crypto';
import { mkdir, open, readFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import type {
	ContentAddressedBlob,
	ContentAddressedBlobStore,
} from '../domain/content-addressed-blob-store.ts';
import type {
	MasterBlobReference,
	MasterBlobReferenceStore,
	MasterDecodeReportStore,
	MasterResourceImportReport,
} from '../domain/master-resource-import.ts';

export class NodeContentAddressedBlobStore
	implements ContentAddressedBlobStore
{
	constructor(private readonly root: string) {}

	async contains(sha256: string): Promise<boolean> {
		return Bun.file(this.path(sha256)).exists();
	}

	async read(sha256: string): Promise<Uint8Array | null> {
		const path = this.path(sha256);
		if (!(await Bun.file(path).exists())) return null;
		return new Uint8Array(await readFile(path));
	}

	async write(
		blob: ContentAddressedBlob,
	): Promise<'already-present' | 'stored'> {
		const path = this.path(blob.sha256);
		await mkdir(dirname(path), { recursive: true });
		try {
			const handle = await open(path, 'wx');
			try {
				await handle.writeFile(blob.bytes);
			} finally {
				await handle.close();
			}
			return 'stored';
		} catch (error) {
			if (!isNodeError(error, 'EEXIST')) throw error;
			const existing = await readFile(path);
			const actualSha256 = createHash('sha256').update(existing).digest('hex');
			if (actualSha256 !== blob.sha256) {
				throw new Error(`Stored master blob hash mismatch: ${blob.sha256}`);
			}
			return 'already-present';
		}
	}

	private path(sha256: string): string {
		if (!/^[0-9a-f]{64}$/u.test(sha256)) {
			throw new Error('Master blob SHA-256 is invalid');
		}
		return join(this.root, sha256.slice(0, 2), `${sha256}.bin`);
	}
}

export class NodeMasterDecodeReportStore implements MasterDecodeReportStore {
	constructor(private readonly root: string) {}

	async read(
		entry: import('../domain/master-resource-import.ts').MasterResourceCatalogEntry,
	): Promise<MasterResourceImportReport | null> {
		const path = this.path(entry.platform, entry.catalogResourceIdentity);
		if (!(await Bun.file(path).exists())) return null;
		return JSON.parse(
			await readFile(path, 'utf8'),
		) as MasterResourceImportReport;
	}

	async write(report: MasterResourceImportReport): Promise<void> {
		const path = this.path(report.platform, report.catalogResourceIdentity);
		const bytes = new TextEncoder().encode(
			`${JSON.stringify(report, null, 2)}\n`,
		);
		await mkdir(dirname(path), { recursive: true });
		try {
			const handle = await open(path, 'wx');
			try {
				await handle.writeFile(bytes);
			} finally {
				await handle.close();
			}
		} catch (error) {
			if (!isNodeError(error, 'EEXIST')) throw error;
			const existing = await readFile(path);
			if (existing.equals(bytes)) return;
			const parsed: unknown = JSON.parse(existing.toString('utf8'));
			if (!isResourceUnavailableReport(parsed)) {
				throw new Error(`Master decode report already differs: ${path}`);
			}
			await this.archiveAvailabilityAttempt(
				report.platform,
				report.catalogResourceIdentity,
				existing,
			);
			const replacement = `${path}.new`;
			await Bun.write(replacement, bytes);
			await rename(replacement, path);
		}
	}

	private async archiveAvailabilityAttempt(
		platform: string,
		catalogResourceIdentity: string,
		bytes: Uint8Array,
	): Promise<void> {
		const identity = createHash('sha256').update(bytes).digest('hex');
		const path = join(
			this.root,
			'attempts',
			platform,
			catalogResourceIdentity,
			`${identity}.json`,
		);
		await mkdir(dirname(path), { recursive: true });
		try {
			const handle = await open(path, 'wx');
			try {
				await handle.writeFile(bytes);
			} finally {
				await handle.close();
			}
		} catch (error) {
			if (!isNodeError(error, 'EEXIST')) throw error;
		}
	}

	private path(platform: string, catalogResourceIdentity: string): string {
		const identity = createHash('sha256')
			.update(JSON.stringify({ platform, catalogResourceIdentity }))
			.digest('hex');
		return join(this.root, platform, `${identity}.json`);
	}
}

export class NodeMasterBlobReferenceStore implements MasterBlobReferenceStore {
	constructor(private readonly root: string) {}

	async read(
		entry: import('../domain/master-resource-import.ts').MasterResourceCatalogEntry,
	): Promise<MasterBlobReference | null> {
		const path = this.path(entry.platform, entry.catalogResourceIdentity);
		if (!(await Bun.file(path).exists())) return null;
		const reference = masterBlobReferenceSchema.parse(
			JSON.parse(await readFile(path, 'utf8')),
		);
		if (
			reference.platform !== entry.platform ||
			reference.catalogResourceIdentity !== entry.catalogResourceIdentity
		) {
			throw new Error('Master blob reference identity differs');
		}
		return reference;
	}

	async write(reference: MasterBlobReference): Promise<void> {
		const path = this.path(
			reference.platform,
			reference.catalogResourceIdentity,
		);
		const bytes = new TextEncoder().encode(
			`${JSON.stringify(reference, null, 2)}\n`,
		);
		await mkdir(dirname(path), { recursive: true });
		try {
			const handle = await open(path, 'wx');
			try {
				await handle.writeFile(bytes);
			} finally {
				await handle.close();
			}
		} catch (error) {
			if (!isNodeError(error, 'EEXIST')) throw error;
			const existing = await readFile(path);
			if (!existing.equals(bytes)) {
				throw new Error(`Master blob reference already differs: ${path}`);
			}
		}
	}

	private path(platform: string, catalogResourceIdentity: string): string {
		const identity = createHash('sha256')
			.update(JSON.stringify({ platform, catalogResourceIdentity }))
			.digest('hex');
		return join(this.root, platform, `${identity}.json`);
	}
}

const masterBlobReferenceSchema = z
	.object({
		schemaVersion: z.literal(1),
		platform: z.enum(['android', 'ios']),
		catalogResourceIdentity: z.string().regex(/^[0-9a-f]{64}$/u),
		encryptedSha256: z.string().regex(/^[0-9a-f]{64}$/u),
		blobSha256: z.string().regex(/^[0-9a-f]{64}$/u),
	})
	.strict();

function isResourceUnavailableReport(value: unknown): boolean {
	return (
		typeof value === 'object' &&
		value !== null &&
		'status' in value &&
		value.status === 'resource-unavailable'
	);
}

function isNodeError(
	error: unknown,
	code: string,
): error is Error & { code: string } {
	return error instanceof Error && 'code' in error && error.code === code;
}
