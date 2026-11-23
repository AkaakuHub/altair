import { describe, expect, test } from 'bun:test';
import { createQuestStageIdentityFingerprint } from '../src/master-data/quest-stage-identity.ts';

const stage = {
	id: 1001,
	parent_id: 101,
	stage_type: 1,
	live_stages_id: 5001,
	quest_musics_type: 2,
	quest_musics_detail: 2001,
};

describe('quest stage identity', () => {
	test('is stable when balance-only values change outside identity columns', () => {
		const first = createQuestStageIdentityFingerprint(
			'standard-quest-stage',
			stage,
		);
		const second = createQuestStageIdentityFingerprint('standard-quest-stage', {
			...stage,
		});

		expect(second).toEqual(first);
	});

	test('changes when the stage belongs to a different master entity', () => {
		const first = createQuestStageIdentityFingerprint(
			'standard-quest-stage',
			stage,
		);
		const moved = createQuestStageIdentityFingerprint('standard-quest-stage', {
			...stage,
			parent_id: 102,
		});
		const changedMusic = createQuestStageIdentityFingerprint(
			'standard-quest-stage',
			{ ...stage, quest_musics_detail: 2002 },
		);

		expect(moved).not.toEqual(first);
		expect(changedMusic).not.toEqual(first);
	});

	test('separates standard and dream stage domains', () => {
		expect(
			createQuestStageIdentityFingerprint('dream-quest-stage', stage),
		).not.toEqual(
			createQuestStageIdentityFingerprint('standard-quest-stage', stage),
		);
	});
});
