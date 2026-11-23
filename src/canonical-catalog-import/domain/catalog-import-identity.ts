import { Buffer } from 'node:buffer';
import { posix } from 'node:path';
import { z } from 'zod';
import { completeResourceVersionSchema } from '../../master-archive/domain/resource-version.ts';

export type CatalogPlatform = 'android' | 'ios';

export type CatalogImportIdentity = Readonly<{
	platform: CatalogPlatform;
	clientVersion: string;
	resourceVersion: string;
}>;

const clientVersionSchema = z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/u);
const androidFilenameSchema = z
	.string()
	.regex(/^(.+)__cache__catalog\.json\.gz$/u);
const iosFilenameSchema = z.string().regex(/^(.+)\.sqlite3$/u);

export function parseCatalogSourceFilename(
	platform: CatalogPlatform,
	filename: string,
): CatalogImportIdentity {
	const identityFilename =
		platform === 'android'
			? removeSuffix(
					androidFilenameSchema.parse(filename),
					'__cache__catalog.json.gz',
				)
			: removeSuffix(iosFilenameSchema.parse(filename), '.sqlite3');
	const separatorIndex = identityFilename.indexOf('__');
	if (
		separatorIndex <= 0 ||
		identityFilename.indexOf('__', separatorIndex + 2) >= 0
	) {
		throw new Error('Catalog source filename identity is invalid');
	}
	const clientVersion = clientVersionSchema.parse(
		identityFilename.slice(0, separatorIndex),
	);
	const encodedResourceVersion = identityFilename.slice(separatorIndex + 2);
	const resourceVersion = Buffer.from(
		encodedResourceVersion,
		'base64url',
	).toString('utf8');
	if (
		Buffer.from(resourceVersion).toString('base64url') !==
		encodedResourceVersion
	) {
		throw new Error('Catalog resourceVersion base64url is not canonical');
	}
	return {
		platform,
		clientVersion,
		resourceVersion: completeResourceVersionSchema.parse(resourceVersion),
	};
}

export function canonicalCatalogRelativePath(
	identity: CatalogImportIdentity,
): string {
	const identityFilename = catalogIdentityFilename(identity);
	return identity.platform === 'android'
		? posix.join('android', identityFilename, 'cache', 'catalog.json.gz')
		: posix.join('ios', `${identityFilename}.sqlite3`);
}

export function canonicalCatalogDatabaseRelativePath(
	identity: CatalogImportIdentity,
): string {
	const identityFilename = catalogIdentityFilename(identity);
	return identity.platform === 'android'
		? posix.join('android', identityFilename, 'cache', 'catalog.sqlite3')
		: posix.join('ios', identityFilename, 'catalog.sqlite3');
}

function catalogIdentityFilename(identity: CatalogImportIdentity): string {
	return `${identity.clientVersion}__${Buffer.from(
		identity.resourceVersion,
	).toString('base64url')}`;
}

export function catalogImportIdentityKey(
	identity: CatalogImportIdentity,
): string {
	return `${identity.platform}\u0000${identity.clientVersion}\u0000${identity.resourceVersion}`;
}

function removeSuffix(value: string, suffix: string): string {
	return value.slice(0, -suffix.length);
}
