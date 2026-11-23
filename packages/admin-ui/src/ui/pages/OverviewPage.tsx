import { Alert, Grid, Typography } from '@mui/material';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useRuntimeSwitchMutation } from '../../hooks/useRuntimeSwitchMutation.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../components/AdminSectionCard.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { LauncherInfoPanel } from '../features/launcher/LauncherInfoPanel.tsx';
import { ChapterRuntimePanel } from '../features/server/ChapterRuntimePanel.tsx';
import { MaintenanceModePanel } from '../features/server/MaintenanceModePanel.tsx';
import { ResourceVersionPanel } from '../features/server/ResourceVersionPanel.tsx';
import type { AdminPageProps } from '../page-props.ts';

export function OverviewPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const {
		isSubmitting,
		submitForm,
		error: mutationError,
	} = useAdminFormMutation(onReload);
	const {
		isRestarting,
		error: runtimeError,
		submitRuntimeSwitch,
	} = useRuntimeSwitchMutation();
	const isPending = isSubmitting || isRestarting;
	return (
		<>
			<PageHeader title={messages.pages.overview} onReload={onReload} />
			<AdminFormStatus error={mutationError} />
			{isRestarting ? (
				<Alert severity="info" sx={{ mb: 2 }}>
					{messages.serverSettings.switchingRelease}
				</Alert>
			) : null}
			<Grid container spacing={2}>
				<SummaryCard
					label={messages.pages.users}
					value={data.state.registeredUsers.length}
				/>
				<SummaryCard
					label={messages.pages['grand-prix']}
					value={data.state.grandPrix.activeGrandPrixId}
				/>
				<SummaryCard
					label={messages.serverSettings.itemCategories}
					value={data.seed.itemCategoryCount}
				/>
				<Grid size={{ xs: 12 }}>
					<ResourceVersionPanel
						error={runtimeError}
						data={data}
						isSubmitting={isPending}
						submitRuntimeSwitch={submitRuntimeSwitch}
					/>
					<MaintenanceModePanel
						data={data}
						isSubmitting={isPending}
						submitForm={submitForm}
					/>
					<ChapterRuntimePanel
						data={data}
						isSubmitting={isPending}
						submitForm={submitForm}
					/>
					<LauncherInfoPanel
						data={data}
						isSubmitting={isPending}
						submitForm={submitForm}
					/>
				</Grid>
			</Grid>
		</>
	);
}

function SummaryCard({
	label,
	value,
}: {
	label: string;
	value: string | number;
}): React.ReactElement {
	return (
		<Grid size={{ xs: 12, sm: 6, md: 4 }}>
			<AdminSectionCard title={label} sx={{ height: '100%' }}>
				<Typography variant="h5" component="p" sx={{ fontWeight: 700 }}>
					{value}
				</Typography>
			</AdminSectionCard>
		</Grid>
	);
}
