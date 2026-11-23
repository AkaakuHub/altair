import { FormControlLabel, Grid, Switch } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import {
	MissionEditorCard,
	type MissionEditorProps,
} from './MissionEditorCard.tsx';
import type { ChapterMissionForm } from './mission-model.ts';

export function ChapterMissionEditor({
	form,
	disabled,
	isSaveDisabled,
	isSubmitting,
	onChange,
	onSave,
}: MissionEditorProps<ChapterMissionForm>): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<MissionEditorCard onSave={onSave} title={messages.missions.chapter}>
			<Grid size={{ xs: 12, md: 3 }}>
				<NumericInput
					label={messages.missions.missionId}
					value={form.missionId}
					disabled={disabled}
					min={1}
					max={9_999_999_999}
					step={1}
					onValueChange={(missionId) => onChange({ ...form, missionId })}
				/>
			</Grid>
			<Grid size={{ xs: 12, md: 3 }}>
				<NumericInput
					label={messages.missions.achievedCount}
					value={form.achievedNum}
					disabled={disabled}
					min={0}
					max={999_999_999}
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
			<Grid size={{ xs: 12, md: 2 }}>
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
