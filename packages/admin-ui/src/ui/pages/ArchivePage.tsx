import { useCallback } from 'react';
import { useAdminFormDraft } from '../../hooks/useAdminFormDraft.ts';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminTargetSelection } from '../../hooks/useAdminTargetSelection.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { ArchiveGiftPointSection } from '../features/archive/ArchiveGiftPointSection.tsx';
import { ArchiveListSection } from '../features/archive/ArchiveListSection.tsx';
import { ArchivePrizeStarsSection } from '../features/archive/ArchivePrizeStarsSection.tsx';
import { createArchivePageModel } from '../features/archive/archive-page-model.ts';
import {
	type ArchiveGiftPointForm,
	type ArchivePrizeStarForm,
	createArchiveGiftPointSelectionForm,
	createArchivePrizeStarPostForm,
	emptyArchiveGiftPointForm,
	emptyArchivePrizeStarForm,
	hasArchivePrizeStarFormChanges,
	isArchivePrizePresent,
	readArchiveId,
} from '../features/archive-prize-state.ts';
import {
	findPlayerState,
	getSelectedAdminPlayerId,
} from '../features/player-state.ts';
import type { AdminPageProps } from '../page-props.ts';

function giftPointDraftKey(form: ArchiveGiftPointForm): string {
	return form.liveId;
}
function prizeDraftKey(form: ArchivePrizeStarForm): string {
	return form.presentBoxId;
}

export function ArchivePage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const playerId = getSelectedAdminPlayerId(data);
	const resolveGiftTarget = useCallback(
		(liveId: string) =>
			createArchiveGiftPointSelectionForm(
				data.state.archiveGiftPoints,
				playerId,
				liveId,
			),
		[data.state.archiveGiftPoints, playerId],
	);
	const resolveGiftSource = useCallback(
		(current: ArchiveGiftPointForm) => resolveGiftTarget(current.liveId),
		[resolveGiftTarget],
	);
	const giftDraft = useAdminFormDraft(
		emptyArchiveGiftPointForm,
		resolveGiftSource,
		giftPointDraftKey,
	);
	const giftPointForm = giftDraft.value;
	const setGiftPointForm = giftDraft.setValue;
	const targetSelection = useAdminTargetSelection(
		giftPointForm.liveId,
		resolveGiftTarget,
		setGiftPointForm,
	);
	const resolvePrizeSource = useCallback(
		(current: ArchivePrizeStarForm) => {
			if (current.presentBoxId.length === 0) return emptyArchivePrizeStarForm;
			const present = findPlayerState(
				data.state.userPresentBoxes,
				playerId,
			)?.presentList.find(
				(entry) => entry.d_present_boxes_id === current.presentBoxId,
			);
			return present && isArchivePrizePresent(present)
				? { ...emptyArchivePrizeStarForm, presentBoxId: current.presentBoxId }
				: null;
		},
		[data.state.userPresentBoxes, playerId],
	);
	const starDraft = useAdminFormDraft(
		emptyArchivePrizeStarForm,
		resolvePrizeSource,
		prizeDraftKey,
		hasArchivePrizeStarFormChanges,
	);
	const starForm = starDraft.value;
	const setStarForm = starDraft.setValue;
	const model = createArchivePageModel(data, playerId, starForm);
	const { error, isSubmitting, submitPlayerForm } =
		useAdminFormMutation(onReload);
	return (
		<>
			<PageHeader title={messages.pages.archive} onReload={onReload} />
			<AdminFormStatus error={error} />
			<AdminFormStatus
				conflicted={giftDraft.conflicted}
				onReset={giftDraft.reset}
				disabled={isSubmitting}
			/>
			<ArchiveGiftPointSection
				form={giftPointForm}
				rows={model.archiveGiftPoints}
				isSubmitting={isSubmitting}
				selection={targetSelection}
				canSubmit={
					playerId.length > 0 &&
					giftPointForm.liveId.length > 0 &&
					!targetSelection.hasPendingSelection
				}
				onFormChange={setGiftPointForm}
				onSubmit={() => {
					if (targetSelection.hasPendingSelection) return;
					void submitPlayerForm(
						'/admin/archive-gift-point',
						playerId,
						giftPointForm,
						() => giftDraft.acceptSaved(giftPointForm),
					);
				}}
			/>
			<AdminFormStatus
				conflicted={starDraft.conflicted}
				onReset={starDraft.reset}
				disabled={isSubmitting}
			/>
			<ArchivePrizeStarsSection
				form={starForm}
				presents={model.pendingArchivePrizePresents}
				selectedPresent={model.selectedPrizePresent}
				candidates={model.prizeCandidates}
				isSubmitting={isSubmitting}
				canSubmit={playerId.length > 0 && starDraft.isAvailable}
				onFormChange={setStarForm}
				onSubmit={() =>
					void submitPlayerForm(
						'/admin/archive-prize-stars',
						playerId,
						createArchivePrizeStarPostForm(starForm, messages.validation),
						() => setStarForm(emptyArchivePrizeStarForm),
					)
				}
			/>
			<ArchiveListSection
				disabled={isSubmitting}
				archives={model.archiveList}
				archiveGiftPoints={model.archiveGiftPoints}
				playerId={playerId}
				onEdit={(archive) => targetSelection.select(readArchiveId(archive))}
			/>
		</>
	);
}
