import { describe, expect, test } from 'bun:test';
import {
	createBeginnerMissionIdentityFingerprint,
	createMissionIdentityFingerprint,
} from '../src/master-data/mission-identity.ts';

describe('mission identity', () => {
	test('common mission identity uses type and transition only', () => {
		expect(
			createMissionIdentityFingerprint({
				missionId: 10,
				missionType: 1,
				transitionContentsId: 100,
			}),
		).toEqual({ domain: 'mission', value: '[10,1,100]' });
	});

	test('beginner identity excludes text, condition amount, reward and display order', () => {
		const structural = {
			missionId: 20,
			missionType: 91,
			conditionType: 51,
			conditionDetail: 7,
			transitionContentsId: 200,
		};
		const first = createBeginnerMissionIdentityFingerprint(structural);
		const balanceChanged = createBeginnerMissionIdentityFingerprint({
			...structural,
		});
		expect(balanceChanged).toEqual(first);
		expect(
			createBeginnerMissionIdentityFingerprint({
				...structural,
				conditionDetail: 8,
			}),
		).not.toEqual(first);
	});
});
