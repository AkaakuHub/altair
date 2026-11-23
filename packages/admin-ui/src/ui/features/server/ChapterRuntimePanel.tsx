import type { ChapterSummary } from '@altair/runtime/admin/dto/admin-chapter-schema.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type { AdminChapterRuntime } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { Box, Grid, MenuItem, TextField } from '@mui/material';
import { useCallback } from 'react';
import type { AdminFormValues } from '../../../form-value.ts';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';

type ChapterRuntimePanelProps = {
	data: AdminStateResponse;
	isSubmitting: boolean;
	submitForm: (
		path: string,
		values: AdminFormValues,
		afterSubmit?: () => void,
	) => Promise<void>;
};

function chapterDraftKey(): string {
	return 'chapter';
}

export function ChapterRuntimePanel({
	data,
	isSubmitting,
	submitForm,
}: ChapterRuntimePanelProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	const resolveSource = useCallback(
		() => data.state.chapter,
		[data.state.chapter],
	);
	const draft = useAdminFormDraft<AdminChapterRuntime>(
		data.state.chapter,
		resolveSource,
		chapterDraftKey,
	);
	const form = draft.value;
	const setForm = draft.setValue;

	function selectChapter(chapter: ChapterSummary): void {
		requestAction(() =>
			setForm({
				activeChapterId: chapter.chapterId,
				startDate: chapter.startDate,
				endDate: chapter.endDate,
			}),
		);
	}

	return (
		<AdminSectionCard title={messages.serverSettings.chapter}>
			<AdminFormStatus
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					void submitForm(
						'/admin/state',
						{
							'chapter.activeChapterId': form.activeChapterId,
							'chapter.startDate': form.startDate,
							'chapter.endDate': form.endDate,
						},
						() => draft.acceptSaved(form),
					);
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							select
							fullWidth
							size="small"
							disabled={isSubmitting}
							label={messages.serverSettings.activeChapterId}
							value={form.activeChapterId}
							onChange={(event) => {
								const selectedChapter = data.chapterList.find(
									(chapter) => chapter.chapterId === Number(event.target.value),
								);
								if (selectedChapter !== undefined) {
									selectChapter(selectedChapter);
								}
							}}
						>
							{data.chapterList.map((chapter) => (
								<MenuItem key={chapter.chapterId} value={chapter.chapterId}>
									{chapter.chapterId} {chapter.chapterName} {chapter.startDate}{' '}
									- {chapter.endDate}
								</MenuItem>
							))}
						</TextField>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							fullWidth
							size="small"
							disabled={isSubmitting}
							label={messages.serverSettings.startDate}
							value={form.startDate}
							onChange={(event) =>
								setForm({ ...form, startDate: event.target.value })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							fullWidth
							size="small"
							disabled={isSubmitting}
							label={messages.serverSettings.endDate}
							value={form.endDate}
							onChange={(event) =>
								setForm({ ...form, endDate: event.target.value })
							}
						/>
					</Grid>
				</Grid>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
					<SaveButton
						type="submit"
						label={messages.serverSettings.saveChapter}
						loading={isSubmitting}
						disabled={isSubmitting}
					/>
				</Box>
			</Box>
		</AdminSectionCard>
	);
}
