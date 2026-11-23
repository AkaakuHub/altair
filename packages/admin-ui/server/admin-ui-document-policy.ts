import { adminUiDocumentCacheControl } from './admin-ui-cache-policy.ts';
import { adminUiEmbedderPolicyHeaders } from './admin-ui-cross-origin-policy.ts';

export const adminUiDocumentHeaders = {
	...adminUiEmbedderPolicyHeaders,
	'cache-control': adminUiDocumentCacheControl,
	'content-type': 'text/html; charset=UTF-8',
	'cross-origin-opener-policy': 'same-origin',
} as const;
