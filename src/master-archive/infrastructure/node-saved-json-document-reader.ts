import { createHash } from 'node:crypto';
import type { SavedJsonDocument } from './source-adapters/source-input.ts';

type SavedJsonDocumentReference = Readonly<{
	identity: string;
	path: string;
}>;

export class NodeSavedJsonDocumentReader {
	async read(
		reference: SavedJsonDocumentReference,
	): Promise<SavedJsonDocument> {
		const bytes = await Bun.file(reference.path).bytes();
		const actualSha256 = createHash('sha256').update(bytes).digest('hex');
		return {
			identity: reference.identity,
			sha256: actualSha256,
			value: JSON.parse(new TextDecoder().decode(bytes)),
		};
	}
}
