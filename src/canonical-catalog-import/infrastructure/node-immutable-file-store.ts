import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function storeImmutableFile(
	destinationPath: string,
	bytes: Uint8Array,
	conflictError: () => Error,
): Promise<'copied' | 'existing'> {
	const existing = await readExisting(destinationPath);
	if (existing !== null) {
		verifyExisting(existing, bytes, conflictError);
		return 'existing';
	}
	await mkdir(dirname(destinationPath), { recursive: true });
	let destinationCreated = false;
	try {
		const destination = await open(destinationPath, 'wx');
		destinationCreated = true;
		try {
			await destination.writeFile(bytes);
			await destination.sync();
		} finally {
			await destination.close();
		}
		return 'copied';
	} catch (error) {
		if (isNodeError(error, 'EEXIST')) {
			verifyExisting(await readFile(destinationPath), bytes, conflictError);
			return 'existing';
		}
		if (destinationCreated) {
			await unlink(destinationPath).catch(() => undefined);
		}
		throw error;
	}
}

async function readExisting(path: string): Promise<Uint8Array | null> {
	try {
		return await readFile(path);
	} catch (error) {
		if (isNodeError(error, 'ENOENT')) return null;
		throw error;
	}
}

function verifyExisting(
	existing: Uint8Array,
	source: Uint8Array,
	conflictError: () => Error,
): void {
	if (
		existing.byteLength !== source.byteLength ||
		!Buffer.from(existing).equals(Buffer.from(source))
	) {
		throw conflictError();
	}
}

function isNodeError(error: unknown, code: string): boolean {
	return error instanceof Error && 'code' in error && error.code === code;
}
