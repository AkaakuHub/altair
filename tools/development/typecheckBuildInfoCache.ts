import { randomUUID } from 'node:crypto';
import {
	constants,
	copyFileSync,
	existsSync,
	mkdirSync,
	renameSync,
	rmSync,
} from 'node:fs';
import { dirname } from 'node:path';

export function restoreTypecheckBuildInfo(input: {
	localPath: string;
	sharedPath: string;
}): boolean {
	if (existsSync(input.localPath) || !existsSync(input.sharedPath))
		return false;
	mkdirSync(dirname(input.localPath), { recursive: true });
	copyFileSync(input.sharedPath, input.localPath, constants.COPYFILE_FICLONE);
	return true;
}

export function publishTypecheckBuildInfo(input: {
	localPath: string;
	sharedPath: string;
}): void {
	if (!existsSync(input.localPath)) {
		throw new Error(`TypeScript build info is absent: ${input.localPath}`);
	}
	mkdirSync(dirname(input.sharedPath), { recursive: true });
	const temporaryPath = `${input.sharedPath}.${process.pid}-${randomUUID()}`;
	try {
		copyFileSync(input.localPath, temporaryPath, constants.COPYFILE_FICLONE);
		renameSync(temporaryPath, input.sharedPath);
	} finally {
		rmSync(temporaryPath, { force: true });
	}
}
