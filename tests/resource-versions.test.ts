import { describe, expect, test } from 'bun:test';
import {
	detectResourceVersionPlatform,
	type ResourceVersionRegistry,
	resolveEffectiveResourceVersion,
} from '../src/resource-versions.ts';

const registry: ResourceVersionRegistry = {
	android: {
		'5.0.0': ['android-5.0'],
		'5.1.0': ['android-5.1-old', 'android-5.1-latest'],
	},
	ios: {
		'5.1.0': ['ios-5.1-latest'],
	},
};

describe('effective server resource version', () => {
	test('uses the persisted Admin override', () => {
		expect(
			resolveEffectiveResourceVersion('android', registry, {
				android: 'android-admin-selected',
			}),
		).toBe('android-admin-selected');
	});

	test('uses the latest version for the request client when unset', () => {
		expect(
			resolveEffectiveResourceVersion('android', registry, undefined, '5.1.0'),
		).toBe('android-5.1-latest');
	});

	test('uses the platform latest version when the client is unknown', () => {
		expect(
			resolveEffectiveResourceVersion(
				'android',
				registry,
				undefined,
				'unknown-client',
			),
		).toBe('android-5.1-latest');
	});

	test('selects the newest server resource independently of registry order', () => {
		expect(
			resolveEffectiveResourceVersion(
				'android',
				{
					android: {
						'5.1.0': ['R2606002@new'],
						'5.0.0': ['R2604002@old'],
					},
					ios: {},
				},
				undefined,
			),
		).toBe('R2606002@new');
	});
});

describe('resource version platform', () => {
	test('prefers the request user agent over stored user platform', () => {
		expect(
			detectResourceVersionPlatform(
				new Headers({ 'user-agent': 'inspix-ios/5.1.0' }),
				1,
			),
		).toBe('ios');
	});

	test('uses the stored user platform without a recognized user agent', () => {
		expect(detectResourceVersionPlatform(new Headers(), 1)).toBe('android');
		expect(detectResourceVersionPlatform(new Headers(), 2)).toBe('ios');
	});

	test('does not guess a platform', () => {
		expect(
			detectResourceVersionPlatform(new Headers(), undefined),
		).toBeUndefined();
	});
});
