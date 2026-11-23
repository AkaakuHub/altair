import type { CommentsRepository } from '../comments-read-repository.ts';

type ArchiveCommentResponse = {
	timelines: ReturnType<CommentsRepository['findOfficialBySecond']>;
	has_extra_admission: boolean;
	is_archive_published: boolean;
	polling_interval: 1;
};

export function createArchiveCommentResponse(
	comments?: CommentsRepository,
	liveId?: string,
	playTimeSecond?: number,
	hasExtraAdmission = false,
): ArchiveCommentResponse {
	return {
		has_extra_admission: hasExtraAdmission,
		is_archive_published: true,
		polling_interval: 1,
		timelines:
			comments === undefined ||
			liveId === undefined ||
			playTimeSecond === undefined
				? []
				: comments.findOfficialBySecond(liveId, playTimeSecond),
	};
}

export function readCommentPlayTimeSecond(value: unknown): number | undefined {
	const numberValue =
		typeof value === 'number'
			? value
			: typeof value === 'string'
				? Number(value)
				: Number.NaN;
	return Number.isSafeInteger(numberValue) && numberValue >= 0
		? numberValue
		: undefined;
}
