import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { GradeChallengeRuntimePanel } from '../features/grade-live/GradeChallengeRuntimePanel.tsx';
import { GradeLiveRuntimePanel } from '../features/grade-live/GradeLiveRuntimePanel.tsx';
import type { AdminPageProps } from '../page-props.ts';

export function GradeLivePage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { isSubmitting, error, submitForm } = useAdminFormMutation(onReload);
	return (
		<>
			<PageHeader title={messages.pages['grade-live']} onReload={onReload} />
			<AdminFormStatus error={error} />
			<GradeLiveRuntimePanel
				data={data}
				isSubmitting={isSubmitting}
				submitForm={submitForm}
			/>
			<GradeChallengeRuntimePanel
				data={data}
				isSubmitting={isSubmitting}
				submitForm={submitForm}
			/>
		</>
	);
}
