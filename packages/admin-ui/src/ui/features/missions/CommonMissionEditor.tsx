import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import type { MissionCatalogEntry } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminUserMission } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import {
	FormControlLabel,
	Grid,
	MenuItem,
	Switch,
	TextField,
} from '@mui/material';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import {
	MissionEditorCard,
	type MissionEditorProps,
} from './MissionEditorCard.tsx';
import { createMissionForm, type MissionForm } from './mission-model.ts';

export function CommonMissionEditor({
	activeMission,
	catalog,
	isDerived,
	form,
	disabled,
	isSaveDisabled,
	isSubmitting,
	onChange,
	onSave,
}: MissionEditorProps<MissionForm> & {
	activeMission: AdminUserMission | undefined;
	catalog: MissionCatalogEntry[];
	isDerived: boolean;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	return (
		<MissionEditorCard onSave={onSave} title={messages.missions.common}>
			<Grid size={{ xs: 12 }}>
				<TextField
					select
					fullWidth
					size="small"
					label={messages.missions.mission}
					value={form.missionId}
					disabled={disabled}
					onChange={(event) => {
						const missionId = Number(event.target.value);
						requestAction(() =>
							onChange(createMissionForm(activeMission, missionId)),
						);
					}}
				>
					{catalog.map((mission) => (
						<MenuItem key={mission.missionId} value={mission.missionId}>
							{mission.missionId} {mission.name}
						</MenuItem>
					))}
				</TextField>
			</Grid>
			<Grid size={{ xs: 12, md: 6 }}>
				<NumericInput
					label={messages.missions.achievedCount}
					value={form.achievedNum}
					min={0}
					max={MAX_ADMIN_ITEM_QUANTITY}
					step={1}
					disabled={disabled || isDerived}
					onValueChange={(achievedNum) => onChange({ ...form, achievedNum })}
				/>
			</Grid>
			<Grid size={{ xs: 12, md: 3 }}>
				<FormControlLabel
					control={
						<Switch
							checked={form.isAchieved}
							disabled={disabled || isDerived}
							onChange={(event) =>
								onChange({ ...form, isAchieved: event.target.checked })
							}
						/>
					}
					label={messages.missions.completed}
				/>
			</Grid>
			<Grid size={{ xs: 12, md: 3 }}>
				<SaveButton
					fullWidth
					disabled={isSaveDisabled || form.missionId <= 0 || isDerived}
					type="submit"
					loading={isSubmitting}
				/>
			</Grid>
		</MissionEditorCard>
	);
}
