import { adminUiEmbedderPolicyHeaders } from './admin-ui-cross-origin-policy.ts';

export const adminUiDocumentCacheControl = 'no-store';

export function adminUiAssetCacheControl(assetPath: string): string {
	if (assetPath.endsWith('.html')) return adminUiDocumentCacheControl;
	return assetPath.startsWith('assets/')
		? 'public, max-age=31536000, immutable'
		: 'no-cache';
}

export function adminUiAssetHeaders(
	assetPath: string,
): Readonly<Record<string, string>> {
	return {
		...adminUiEmbedderPolicyHeaders,
		'cache-control': adminUiAssetCacheControl(assetPath),
		'cross-origin-resource-policy': 'same-origin',
	};
}
