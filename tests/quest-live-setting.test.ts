import { describe, expect, test } from 'bun:test';
import { resolveQuestLiveMusicId } from '../src/v1/active-master-database/quest-live-setting-responses.ts';

describe('quest live music selection', () => {
	test('固定曲stageでは同じ曲または未指定だけを受理する', () => {
		const stage = { musicId: 1001, questMusicsType: 2 };

		expect(resolveQuestLiveMusicId(stage, null)).toBe(1001);
		expect(resolveQuestLiveMusicId(stage, 1001)).toBe(1001);
		expect(resolveQuestLiveMusicId(stage, 2002)).toBe(0);
	});

	test('選択可能stageではrequest曲を優先し未指定時はstage曲を使う', () => {
		const stage = { musicId: 1001, questMusicsType: 0 };

		expect(resolveQuestLiveMusicId(stage, null)).toBe(1001);
		expect(resolveQuestLiveMusicId(stage, 2002)).toBe(2002);
	});
});
