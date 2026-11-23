import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resourceVersionRevision } from './master-archive/domain/resource-version.ts';

export type ResourceVersionPlatform = 'android' | 'ios';

export type ResourceVersionRegistry = Readonly<{
	android: ResourceVersionData;
	ios: ResourceVersionData;
}>;

type ResourceVersionData = Readonly<Record<string, readonly string[]>>;

export type ResourceVersionOverrides = Partial<
	Record<ResourceVersionPlatform, string>
>;

export type ResourceVersionProfile = Readonly<{
	clientVersion: string;
	androidResourceVersion: string;
	iosResourceVersion: string;
}>;

export function readResourceVersionRegistry(
	resourceVersionRegistryRoot: string,
): ResourceVersionRegistry {
	return {
		android: readResourceVersionData(
			resourceVersionRegistryRoot,
			'client-res.json',
		),
		ios: readResourceVersionData(
			resourceVersionRegistryRoot,
			'client-ios-res.json',
		),
	};
}

export function resolveResponseResourceVersion(
	requestHeaders: Headers,
	platformType: number | undefined,
	registry: ResourceVersionRegistry,
	overrides: ResourceVersionOverrides | undefined = undefined,
): string {
	const platform = detectResourceVersionPlatform(requestHeaders, platformType);
	if (platform !== undefined) {
		return resolveEffectiveResourceVersion(platform, registry, overrides);
	}
	return 'unknown';
}

export function resolveEffectiveResourceVersion(
	platform: ResourceVersionPlatform,
	registry: ResourceVersionRegistry,
	overrides: ResourceVersionOverrides | undefined,
	clientVersion?: string,
): string {
	const override = overrides?.[platform]?.trim();
	if (override) {
		return override;
	}
	return (
		resolveLatestForPlatform(registry[platform], clientVersion) ??
		resolveLatestForPlatform(registry[platform]) ??
		'unknown'
	);
}

export function isResourceVersionOption(
	registry: ResourceVersionRegistry,
	platform: ResourceVersionPlatform,
	resourceVersion: string,
): boolean {
	return Object.values(registry[platform]).some((resourceVersions) =>
		resourceVersions.includes(resourceVersion),
	);
}

export function resolveResourceVersionProfile(
	clientVersion: string,
	registry: ResourceVersionRegistry,
): ResourceVersionProfile {
	const androidResourceVersion = registry.android[clientVersion]?.at(-1);
	if (androidResourceVersion === undefined) {
		throw new Error(
			`Resource version profile is absent for client version: ${clientVersion}`,
		);
	}
	const androidRevision = resourceVersionRevision(androidResourceVersion);
	const iosResourceVersions = registry.ios[clientVersion]?.filter(
		(resourceVersion) =>
			resourceVersionRevision(resourceVersion) === androidRevision,
	);
	const iosResourceVersion = iosResourceVersions?.at(-1);
	if (iosResourceVersions?.length !== 1 || iosResourceVersion === undefined) {
		throw new Error(
			`Matching iOS resource version is absent for Android revision: ${androidRevision}`,
		);
	}
	return { clientVersion, androidResourceVersion, iosResourceVersion };
}

export function resolveResourceVersionProfileForPair(
	androidResourceVersion: string,
	iosResourceVersion: string,
	registry: ResourceVersionRegistry,
): ResourceVersionProfile {
	const clientVersions = Object.keys(registry.android).filter(
		(clientVersion) =>
			registry.android[clientVersion]?.includes(androidResourceVersion) ===
				true &&
			registry.ios[clientVersion]?.includes(iosResourceVersion) === true,
	);
	const clientVersion = clientVersions[0];
	if (clientVersions.length !== 1 || clientVersion === undefined) {
		throw new Error(
			'Resource version pair must resolve to exactly one client version',
		);
	}
	return { clientVersion, androidResourceVersion, iosResourceVersion };
}

function readResourceVersionData(
	resourceVersionRegistryRoot: string,
	fileName: string,
): ResourceVersionData {
	const registry: unknown = JSON.parse(
		readFileSync(join(resourceVersionRegistryRoot, fileName), 'utf8'),
	);
	if (
		typeof registry !== 'object' ||
		registry === null ||
		Array.isArray(registry)
	) {
		throw new Error(`${fileName} must be an object`);
	}
	const data: Record<string, string[]> = {};
	for (const [clientVersion, resourceVersions] of Object.entries(registry)) {
		if (!Array.isArray(resourceVersions)) {
			throw new Error(`${fileName} has invalid resource version list`);
		}
		data[clientVersion] = resourceVersions.map((resourceVersion) => {
			if (typeof resourceVersion !== 'string') {
				throw new Error(`${fileName} has invalid resource version`);
			}
			return resourceVersion;
		});
	}
	return data;
}

export function detectResourceVersionPlatform(
	requestHeaders: Headers,
	platformType: number | undefined,
): ResourceVersionPlatform | undefined {
	const userAgent = requestHeaders.get('user-agent')?.toLowerCase() ?? '';
	if (userAgent.includes('inspix-android')) {
		return 'android';
	}
	if (userAgent.includes('inspix-ios') || userAgent.includes('iphone')) {
		return 'ios';
	}
	switch (platformType) {
		case 1:
			return 'android';
		case 2:
			return 'ios';
		default:
			return undefined;
	}
}

function resolveLatestForPlatform(
	data: ResourceVersionData,
	clientVersion?: string,
): string | undefined {
	if (clientVersion !== undefined) {
		return data[clientVersion]?.at(-1);
	}
	return Object.values(data)
		.flat()
		.reduce<string | undefined>((latest, candidate) => {
			if (latest === undefined) {
				return candidate;
			}
			return resourceVersionSequence(candidate) >=
				resourceVersionSequence(latest)
				? candidate
				: latest;
		}, undefined);
}

function resourceVersionSequence(resourceVersion: string): number {
	const match = /^R(\d+)@/.exec(resourceVersion);
	if (match === null) {
		return Number.NEGATIVE_INFINITY;
	}
	return Number.parseInt(match[1] ?? '', 10);
}
