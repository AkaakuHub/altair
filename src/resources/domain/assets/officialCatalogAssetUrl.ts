import { assertCatalogAssetPath } from './catalogAssetPath.ts';

export function officialCatalogAssetUrl(
	assetPath: string,
	officialAssetBaseUrl: string,
): string {
	assertCatalogAssetPath(assetPath);
	const baseUrl = officialAssetBaseUrl.endsWith('/')
		? officialAssetBaseUrl
		: `${officialAssetBaseUrl}/`;
	return new URL(assetPath, baseUrl).toString();
}
