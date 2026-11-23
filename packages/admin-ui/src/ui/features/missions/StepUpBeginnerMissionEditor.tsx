import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import type { AdminUserStepUpBeginnerMission } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
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
import {
	createStepUpBeginnerMissionForm,
	type StepUpBeginnerMissionForm,
} from './mission-model.ts';

export function StepUpBeginnerMissionEditor({
	activeMission,
	catalog,
	form,
	disabled,
	isSaveDisabled,
	isSubmitting,
	onChange,
	onSave,
}: MissionEditorProps<StepUpBeginnerMissionForm> & {
	activeMission: AdminUserStepUpBeginnerMission | undefined;
	catalog: Array<{ missionId: number }>;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	return (
		<MissionEditorCard onSave={onSave} title={messages.missions.stepUpBeginner}>
			<Grid size={{ xs: 12, md: 4 }}>
				<TextField
					select
					fullWidth
					size="small"
					label={messages.missions.missionId}
					value={form.missionId}
					disabled={disabled}
					onChange={(event) => {
						const missionId = Number(event.target.value);
						requestAction(() =>
							onChange(
								createStepUpBeginnerMissionForm(activeMission, missionId),
							),
						);
					}}
				>
					{catalog.map((mission) => (
						<MenuItem key={mission.missionId} value={mission.missionId}>
							{mission.missionId}
						</MenuItem>
					))}
				</TextField>
			</Grid>
			<Grid size={{ xs: 12, md: 3 }}>
				<NumericInput
					label={messages.missions.achievedCount}
					value={form.achievedNum}
					disabled={disabled}
					min={0}
					max={MAX_ADMIN_ITEM_QUANTITY}
					step={1}
					onValueChange={(achievedNum) => onChange({ ...form, achievedNum })}
				/>
			</Grid>
			<Grid size={{ xs: 12, md: 2 }}>
				<FormControlLabel
					control={
						<Switch
							checked={form.isAchieved}
							disabled={disabled}
							onChange={(event) =>
								onChange({ ...form, isAchieved: event.target.checked })
							}
						/>
					}
					label={messages.missions.completed}
				/>
			</Grid>
			<Grid size={{ xs: 12, md: 2 }}>
				<FormControlLabel
					control={
						<Switch
							checked={form.isReceived}
							disabled={disabled}
							onChange={(event) =>
								onChange({ ...form, isReceived: event.target.checked })
							}
						/>
					}
					label={messages.received}
				/>
			</Grid>
			<Grid size={{ xs: 12, md: 3 }}>
				<SaveButton
					fullWidth
					disabled={isSaveDisabled || Number(form.missionId) <= 0}
					type="submit"
					loading={isSubmitting}
				/>
			</Grid>
		</MissionEditorCard>
	);
}
