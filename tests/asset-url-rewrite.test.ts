import { describe, expect, test } from 'bun:test';
import {
	resolveOfficialAssetUrl,
	rewriteOfficialAssetUrls,
} from '../src/asset-url-rewrite.ts';

describe('rewriteOfficialAssetUrls', () => {
	test('rewrites official asset URLs to the configured asset base URL', () => {
		const result = rewriteOfficialAssetUrls(
			JSON.stringify({
				thumbnail_image_url:
					'https://assets.link-like-lovelive.app/with_meets/thumbnail_image/sample.jpg',
				video_url:
					'https://assets.link-like-lovelive.app/archive/hls/20260328/index.m3u8',
			}),
			'https://assets.example.test/',
		);

		expect(result).toContain(
			'https://assets.example.test/with_meets/thumbnail_image/sample.jpg',
		);
		expect(result).toContain(
			'https://assets.example.test/archive/hls/20260328/index.m3u8',
		);
		expect(result).not.toContain('assets.link-like-lovelive.app');
	});
});

describe('resolveOfficialAssetUrl', () => {
	test('公式相対pathを共通asset URLへ正規化する', () => {
		expect(resolveOfficialAssetUrl('/archive/mrs/recording/index.iarc')).toBe(
			'https://assets.link-like-lovelive.app/archive/mrs/recording/index.iarc',
		);
		expect(
			resolveOfficialAssetUrl(
				'https://assets.chocoie.com/archive/alst/recording/index.md',
			),
		).toBe(
			'https://assets.link-like-lovelive.app/archive/alst/recording/index.md',
		);
	});
});
