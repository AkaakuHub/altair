import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { FormControlLabel, Switch } from '@mui/material';
import type { AdminFormValues } from '../../../form-value.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';

type MaintenanceModePanelProps = {
	data: AdminStateResponse;
	isSubmitting: boolean;
	submitForm: (path: string, values: AdminFormValues) => Promise<void>;
};

export function MaintenanceModePanel({
	data,
	isSubmitting,
	submitForm,
}: MaintenanceModePanelProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const isEnabled = data.state.maintenanceMode.isEnabled;
	return (
		<AdminSectionCard title={messages.serverSettings.maintenance}>
			<FormControlLabel
				control={
					<Switch
						checked={isEnabled}
						disabled={isSubmitting}
						onChange={(event) => {
							void submitForm('/admin/maintenance-mode', {
								isEnabled: event.target.checked,
							});
						}}
					/>
				}
				label={
					isEnabled ? messages.serverSettings.on : messages.serverSettings.off
				}
			/>
		</AdminSectionCard>
	);
}
