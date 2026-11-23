import { createHash } from 'node:crypto';

export type ContentAddressedBlob = Readonly<{
	sha256: string;
	bytes: Uint8Array;
}>;

type BlobStorageDecision = 'reuse' | 'store';

export interface ContentAddressedBlobStore {
	contains(sha256: string): Promise<boolean>;
	read(sha256: string): Promise<Uint8Array | null>;
	write(blob: ContentAddressedBlob): Promise<'already-present' | 'stored'>;
}

export function contentAddressedBlob(bytes: Uint8Array): ContentAddressedBlob {
	const copiedBytes = Uint8Array.from(bytes);
	return {
		sha256: createHash('sha256').update(copiedBytes).digest('hex'),
		bytes: copiedBytes,
	};
}

export function decideBlobStorage(
	blobSha256: string,
	storedBlobSha256s: ReadonlySet<string>,
): BlobStorageDecision {
	return storedBlobSha256s.has(blobSha256) ? 'reuse' : 'store';
}
