import { describe, expect, test } from 'bun:test';
import { resolveGachaPurchaseSourceMasterReleaseId } from '../src/application/gacha-purchase-provenance.ts';

describe('gacha purchase provenance', () => {
	test('uses the purchase plan master release instead of the current request release', () => {
		let requestMasterReleaseResolved = false;
		expect(
			resolveGachaPurchaseSourceMasterReleaseId(
				{ masterReleaseId: 'release-plan' },
				() => {
					requestMasterReleaseResolved = true;
					return 'release-request';
				},
			),
		).toBe('release-plan');
		expect(requestMasterReleaseResolved).toBe(false);
	});

	test('uses the request master release for an automatic purchase plan', () => {
		expect(
			resolveGachaPurchaseSourceMasterReleaseId(
				undefined,
				() => 'release-request',
			),
		).toBe('release-request');
	});
});
