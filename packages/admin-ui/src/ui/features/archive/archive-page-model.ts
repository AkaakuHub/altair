import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import {
	type ArchiveGiftPoint,
	type ArchiveListItem,
	type ArchivePrizeCandidate,
	type ArchivePrizePresent,
	type ArchivePrizeStarForm,
	createArchivePrizeCandidates,
	findArchiveById,
	isArchivePrizePresent,
} from '../archive-prize-state.ts';
import { findPlayerState } from '../player-state.ts';

type ArchivePageModel = {
	archiveGiftPoints: ArchiveGiftPoint[];
	archiveList: ArchiveListItem[];
	pendingArchivePrizePresents: ArchivePrizePresent[];
	selectedPrizePresent: ArchivePrizePresent | undefined;
	prizeCandidates: ArchivePrizeCandidate[];
};

export function createArchivePageModel(
	data: AdminStateResponse,
	playerId: string,
	starForm: ArchivePrizeStarForm,
): ArchivePageModel {
	const collection = findPlayerState(
		data.state.userArchiveCollections,
		playerId,
	);
	const presentBox = data.state.userPresentBoxes.find(
		(entry) => entry.playerId === playerId,
	);
	const userStatus = data.state.userStatuses.find(
		(entry) => entry.playerId === playerId,
	);
	const pendingArchivePrizePresents = (presentBox?.presentList ?? []).filter(
		isArchivePrizePresent,
	);
	const selectedPrizePresent = pendingArchivePrizePresents.find(
		(present) => present.d_present_boxes_id === starForm.presentBoxId,
	);
	const selectedPrizeArchive = selectedPrizePresent
		? findArchiveById(
				collection?.archiveList ?? [],
				selectedPrizePresent.live_id,
			)
		: undefined;
	return {
		archiveGiftPoints: selectPlayerArchiveValues(
			data.state.archiveGiftPoints,
			playerId,
		),
		archiveList: collection?.archiveList ?? [],
		pendingArchivePrizePresents,
		selectedPrizePresent,
		prizeCandidates: selectedPrizeArchive
			? createArchivePrizeCandidates(
					selectedPrizeArchive,
					userStatus?.memberFanLevels,
				)
			: [],
	};
}

export function selectPlayerArchiveValues<TValue extends { playerId: string }>(
	values: readonly TValue[],
	playerId: string,
): TValue[] {
	return values.filter((value) => value.playerId === playerId);
}
