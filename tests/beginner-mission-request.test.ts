import { describe, expect, test } from 'bun:test';
import {
	readBeginnerMissionId,
	readBeginnerMissionType,
} from '../src/v1/route-support/beginner-mission-request.ts';

describe('beginner mission request', () => {
	test('reads only finite numeric official fields', () => {
		expect(readBeginnerMissionId({ mission_id: 10 })).toBe(10);
		expect(readBeginnerMissionType({ mission_type: 91 })).toBe(91);
		expect(readBeginnerMissionId({ mission_id: '10' })).toBeUndefined();
		expect(readBeginnerMissionType(null)).toBeUndefined();
	});
});
