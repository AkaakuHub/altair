const archiveCommentLeadTimeSec = 60;

export function resolveOfficialArchiveHlsTimeOffsetSec(
	input: Readonly<{
		motionFormat: 'alst' | 'mrs' | null;
		archiveStartTime: string;
		liveStartTime: string;
		recordingStartedUnixSec: number;
		mainStartSec: number | null;
	}>,
): number {
	if (input.motionFormat === 'mrs') {
		const archiveStartTimeMs = Date.parse(input.archiveStartTime);
		if (!Number.isFinite(archiveStartTimeMs))
			throw new Error('Official MRS archive start time is invalid');
		const offsetSec =
			input.recordingStartedUnixSec - Math.floor(archiveStartTimeMs / 1000);
		if (offsetSec < 0)
			throw new Error('Official MRS HLS start precedes its archive start');
		return offsetSec;
	}
	return resolveOfficialArchiveVideoTimeOffsetSec(input);
}

export function resolveOfficialArchiveVideoTimeOffsetSec(
	input: Readonly<{
		liveStartTime: string;
		recordingStartedUnixSec: number;
		mainStartSec: number | null;
	}>,
): number {
	const liveStartTimeMs = Date.parse(input.liveStartTime);
	if (!Number.isFinite(liveStartTimeMs)) return 0;
	const liveStartOffsetSec =
		Math.floor(liveStartTimeMs / 1000) - input.recordingStartedUnixSec;
	const videoTimeOffsetSec = liveStartOffsetSec - archiveCommentLeadTimeSec;
	if (
		videoTimeOffsetSec <= 0 ||
		input.mainStartSec === null ||
		input.mainStartSec < videoTimeOffsetSec
	)
		return 0;
	return videoTimeOffsetSec;
}
