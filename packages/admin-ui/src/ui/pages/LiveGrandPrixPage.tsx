import { useCallback, useRef, useState } from 'react';
import { useAdminFormDraft } from '../../hooks/useAdminFormDraft.ts';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { GrandPrixRuntimeEditorForm } from '../features/grand-prix/GrandPrixRuntimeEditorForm.tsx';
import { GrandPrixSummaryTable } from '../features/grand-prix/GrandPrixSummaryTable.tsx';
import {
	buildGrandPrixRuntimeForm,
	createGrandPrixRuntimeDraft,
	type GrandPrixRuntimeDraft,
} from '../features/grand-prix/live-grand-prix-draft.ts';
import type { AdminPageProps } from '../page-props.ts';

function runtimeKey(): string {
	return 'grand-prix';
}

export function LiveGrandPrixPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const source = data.state.grandPrix;
	const resolveSource = useCallback(
		() => createGrandPrixRuntimeDraft(source),
		[source],
	);
	const draft = useAdminFormDraft(
		createGrandPrixRuntimeDraft(source),
		resolveSource,
		runtimeKey,
	);
	const formRef = useRef<HTMLFormElement | null>(null);
	const [conversionError, setConversionError] = useState<string | null>(null);
	const { isSubmitting, error, submitForm } = useAdminFormMutation(onReload);
	async function save(nextRuntime: GrandPrixRuntimeDraft): Promise<void> {
		if (isSubmitting || formRef.current?.reportValidity() !== true) return;
		setConversionError(null);
		try {
			const { runtime, values } = buildGrandPrixRuntimeForm(
				nextRuntime,
				messages,
			);
			await submitForm('/admin/state', values, () =>
				draft.acceptSaved(createGrandPrixRuntimeDraft(runtime)),
			);
		} catch (cause) {
			setConversionError(
				cause instanceof Error ? cause.message : String(cause),
			);
		}
	}
	return (
		<>
			<PageHeader title={messages.pages['grand-prix']} onReload={onReload} />
			<AdminFormStatus
				error={conversionError ?? error}
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<GrandPrixRuntimeEditorForm
				formRef={formRef}
				grandPrixList={data.grandPrixList}
				grandPrixDetail={data.grandPrixDetail}
				runtime={draft.value}
				isSubmitting={isSubmitting}
				onRuntimeChange={draft.setValue}
				onSave={save}
			/>
			<GrandPrixSummaryTable
				grandPrixList={data.grandPrixList}
				activeGrandPrixId={source.activeGrandPrixId}
				runtime={draft.value}
				isSubmitting={isSubmitting}
				onSetActive={save}
			/>
		</>
	);
}
