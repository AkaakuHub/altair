import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { ActivityRecordEditor } from '../features/activity-record/ActivityRecordEditor.tsx';
import type { AdminPageProps } from '../page-props.ts';

export function ActivityRecordPage(props: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<>
			<PageHeader
				title={messages.pages['activity-record']}
				onReload={props.onReload}
			/>
			<ActivityRecordEditor {...props} />
		</>
	);
}
