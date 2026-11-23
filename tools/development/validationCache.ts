import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export type ValidationIdentityInput = Readonly<{
	tree: string;
	bunVersion: string;
	validationKey: string;
	command: readonly string[];
}>;

export function createValidationIdentity(
	input: ValidationIdentityInput,
): string {
	return JSON.stringify([
		input.tree,
		input.bunVersion,
		input.validationKey,
		...input.command,
	]);
}

export function createValidationMarkerPath(input: {
	cacheDirectory: string;
	validationKey: string;
	identity: string;
}): string {
	if (!/^[a-z0-9-]+$/u.test(input.validationKey)) {
		throw new Error(
			'validation key must contain lowercase letters, numbers or hyphens',
		);
	}
	const identityHash = createHash('sha256')
		.update(input.identity)
		.digest('hex');
	return resolve(input.cacheDirectory, input.validationKey, identityHash);
}

export function canReuseValidation(input: {
	markerExists: boolean;
	worktreeClean: boolean;
}): boolean {
	return input.worktreeClean && input.markerExists;
}
