export function catalogAssetPath(
	resourceType: number,
	platform: 'android' | 'ios',
	realName: string,
): string {
	if (!/^[a-z2-7]{26}$/.test(realName)) {
		throw new Error('Asset realName is invalid');
	}
	const bucket = catalogAssetBucket(resourceType, platform);
	return `${bucket}/${realName.slice(0, 2)}/${realName}`;
}

export function assertCatalogAssetPath(assetPath: string): void {
	const match = /^(android|ios|raw)\/([a-z2-7]{2})\/([a-z2-7]{26})$/.exec(
		assetPath,
	);
	if (match === null || match[2] !== match[3]?.slice(0, 2)) {
		throw new Error(`Catalog asset path is invalid: ${assetPath}`);
	}
}

export function catalogAssetBucket(
	resourceType: number,
	platform: 'android' | 'ios',
): 'android' | 'ios' | 'raw' {
	return resourceType >= 128 ? 'raw' : platform;
}
