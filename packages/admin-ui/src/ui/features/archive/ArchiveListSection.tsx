import { Button } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import {
	type ArchiveGiftPoint,
	type ArchiveListItem,
	filterArchiveList,
	findArchiveGiftPointForArchive,
	hasExtraAdmissionForArchive,
	readArchiveId,
	readArchiveNumber,
	readArchiveTitle,
} from '../archive-prize-state.ts';

type ArchiveListSectionProps = {
	archives: ArchiveListItem[];
	archiveGiftPoints: ArchiveGiftPoint[];
	playerId: string;
	disabled: boolean;
	onEdit: (archive: ArchiveListItem) => void;
};

export function ArchiveListSection({
	archives,
	archiveGiftPoints,
	playerId,
	disabled,
	onEdit,
}: ArchiveListSectionProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<SearchablePaginatedDataTable<ArchiveListItem>
			rows={archives}
			emptyText={messages.archive.noArchiveList}
			getRowKey={readArchiveId}
			searchLabel={messages.archive.searchArchive}
			filterRows={filterArchiveList}
			columns={[
				{
					key: 'use',
					label: '',
					render: (row) => (
						<Button
							size="small"
							disabled={disabled}
							onClick={() => onEdit(row)}
						>
							{messages.edit}
						</Button>
					),
				},
				{
					key: 'liveId',
					label: messages.archive.liveId,
					render: readArchiveId,
				},
				{ key: 'title', label: messages.title, render: readArchiveTitle },
				{
					key: 'point',
					label: messages.archive.point,
					render: (row) =>
						findArchiveGiftPointForArchive(row, archiveGiftPoints, playerId)
							?.totalUserGiftPoint ?? 0,
				},
				{
					key: 'earned',
					label: messages.archive.earnedStars,
					render: (row) =>
						findArchiveGiftPointForArchive(row, archiveGiftPoints, playerId)
							?.awardedArchivePrizeStarCount ?? 0,
				},
				{
					key: 'assigned',
					label: messages.archive.assignedStars,
					render: (row) =>
						findArchiveGiftPointForArchive(row, archiveGiftPoints, playerId)
							?.allocatedArchivePrizeStarCount ?? 0,
				},
				{
					key: 'threshold',
					label: messages.archive.extraRequiredStars,
					render: (row) =>
						readArchiveNumber(row, 'gift_stars_threshold_for_extra_admission'),
				},
				{
					key: 'after',
					label: messages.archive.extraAdmission,
					render: (row) =>
						hasExtraAdmissionForArchive(
							row,
							findArchiveGiftPointForArchive(row, archiveGiftPoints, playerId),
						)
							? messages.yes
							: messages.no,
				},
			]}
		/>
	);
}
