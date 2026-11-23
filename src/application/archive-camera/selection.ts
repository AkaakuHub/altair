import { isRecord } from '../../state/json-state-utils.ts';

type ArchiveCameraDefinition = Readonly<{
	liveId: string;
	cameraTypes: readonly number[];
	characterIds: readonly number[];
}>;

export function createArchiveCameraSelectionResponse(
	body: unknown,
	definition: ArchiveCameraDefinition,
): { camera_type: number; focus_character_id: number } | undefined {
	if (!isRecord(body) || body.live_id !== definition.liveId) return undefined;
	const cameraType = body.camera_type;
	const focusCharacterId =
		body.focus_character_id === undefined ? 0 : body.focus_character_id;
	if (
		typeof cameraType !== 'number' ||
		!Number.isSafeInteger(cameraType) ||
		!definition.cameraTypes.includes(cameraType) ||
		typeof focusCharacterId !== 'number' ||
		!Number.isSafeInteger(focusCharacterId) ||
		(focusCharacterId !== 0 &&
			!definition.characterIds.includes(focusCharacterId))
	) {
		return undefined;
	}
	return { camera_type: cameraType, focus_character_id: focusCharacterId };
}
