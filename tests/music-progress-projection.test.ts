import { describe, expect, test } from 'bun:test';
import {
	findCompatibleMusicProgress,
	projectCompatibleMusicProgresses,
} from '../src/application/music-progress-projection.ts';

const oldIdentity = { domain: 'music', value: '[1,"old",10]' };
const newIdentity = { domain: 'music', value: '[1,"new",20]' };

describe('music progress projection', () => {
	test('同じmusicIdではfingerprintが一致するprogressだけを選ぶ', () => {
		const progresses = [
			{ musicId: 1, score: 100, identityFingerprint: oldIdentity },
			{ musicId: 1, score: 200, identityFingerprint: newIdentity },
		];

		expect(findCompatibleMusicProgress(progresses, 1, oldIdentity)?.score).toBe(
			100,
		);
		expect(findCompatibleMusicProgress(progresses, 1, newIdentity)?.score).toBe(
			200,
		);
	});

	test('legacy progressはfingerprint付きprogressがないidentityで従来値として読める', () => {
		const legacy = { musicId: 1, score: 50 };
		const progresses = [
			legacy,
			{ musicId: 1, score: 100, identityFingerprint: oldIdentity },
		];

		expect(findCompatibleMusicProgress(progresses, 1, newIdentity)).toBe(
			legacy,
		);
	});

	test('現在master releaseに存在するidentityだけを投影しcanonical entriesを変更しない', () => {
		const progresses = [
			{ musicId: 1, score: 100, identityFingerprint: oldIdentity },
			{ musicId: 1, score: 200, identityFingerprint: newIdentity },
			{ musicId: 2, score: 300 },
		];

		expect(
			projectCompatibleMusicProgresses(progresses, new Map([[1, oldIdentity]])),
		).toEqual([{ musicId: 1, score: 100, identityFingerprint: oldIdentity }]);
		expect(progresses).toHaveLength(3);
	});
});
