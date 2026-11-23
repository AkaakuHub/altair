import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeSavedJsonDocumentReader } from '../src/master-archive/infrastructure/node-saved-json-document-reader.ts';

describe('Node saved JSON document reader', () => {
	test('入力bytesからsource identityを生成する', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'saved-json-'));
		try {
			const path = join(directory, 'source.json');
			const bytes = new TextEncoder().encode('{"value":1}\n');
			await Bun.write(path, bytes);
			const sha256 = createHash('sha256').update(bytes).digest('hex');
			const reader = new NodeSavedJsonDocumentReader();

			expect(await reader.read({ identity: 'source', path })).toEqual({
				identity: 'source',
				sha256,
				value: { value: 1 },
			});
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	});
});
