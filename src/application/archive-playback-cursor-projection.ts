type ArchivePlaybackCursor = {
	liveId: string;
	playTimeSecond: number;
};

export function projectArchivePlaybackCursor(
	cursor: ArchivePlaybackCursor | undefined,
	isSupported: (liveId: string) => boolean,
): ArchivePlaybackCursor | undefined {
	return cursor !== undefined && isSupported(cursor.liveId)
		? cursor
		: undefined;
}
