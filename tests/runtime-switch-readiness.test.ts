import { describe, expect, test } from 'bun:test';
import { waitForApiReadiness } from '../src/application/runtime-switch/runtime-switch-node-ports.ts';

describe('API runtime readiness', () => {
	test('接続拒否と非okを期限内だけ再試行してreadyを待つ', async () => {
		let now = 0;
		const outcomes: Array<Response | Error> = [
			new Error('ConnectionRefused'),
			new Response(null, { status: 503 }),
			new Response(null, { status: 200 }),
		];
		let attempts = 0;

		await waitForApiReadiness(
			new URL('https://api.example.test/health'),
			{ timeoutMs: 60_000, pollIntervalMs: 500 },
			{
				fetch: async () => {
					const outcome = outcomes[attempts++];
					if (outcome instanceof Error) throw outcome;
					if (outcome === undefined) throw new Error('unexpected attempt');
					return outcome;
				},
				now: () => now,
				sleep: async (milliseconds) => {
					now += milliseconds;
				},
			},
		);

		expect(attempts).toBe(3);
		expect(now).toBe(1_000);
	});

	test('期限超過時に最後の接続失敗をcauseとして失敗する', async () => {
		let now = 0;
		let attempts = 0;
		const verification = waitForApiReadiness(
			new URL('https://api.example.test/health'),
			{ timeoutMs: 1_000, pollIntervalMs: 400 },
			{
				fetch: async () => {
					attempts += 1;
					throw new Error('ConnectionRefused');
				},
				now: () => now,
				sleep: async (milliseconds) => {
					now += milliseconds;
				},
			},
		);

		await expect(verification).rejects.toThrow(
			'API readiness timed out after 1000ms',
		);
		expect(attempts).toBe(4);
		expect(now).toBe(1_000);
	});
});
