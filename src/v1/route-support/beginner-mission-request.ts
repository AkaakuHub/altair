import { getNumberField } from './request-fields.ts';

export function readBeginnerMissionId(body: unknown): number | undefined {
	return getNumberField(body, 'mission_id');
}

export function readBeginnerMissionType(body: unknown): number | undefined {
	return getNumberField(body, 'mission_type');
}
