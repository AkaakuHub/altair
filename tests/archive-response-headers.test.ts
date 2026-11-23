import { describe, expect, test } from 'bun:test';
import { renderArchiveResponseHeader } from '../src/v1/route-support/archive-response-headers.ts';

describe('archive response headers', () => {
	test('serverで解決したresource versionをheaderへ埋め込む', () => {
		expect(
			renderArchiveResponseHeader(
				'${DATE_GMT}:${RES_VERSION}',
				'Sat, 11 Jul 2026 08:00:00 GMT',
				'R2606002@server',
			),
		).toBe('Sat, 11 Jul 2026 08:00:00 GMT:R2606002@server');
	});
});
