import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { Box, Grid, MenuItem, TextField } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { DateTimeInput } from '../../components/DateTimeInput.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { UserStatusSectionHeading } from './UserStatusSectionHeading.tsx';
import {
	type UserStatusForm,
	userStatusNumberKeys,
} from './user-status-form.ts';

export function UserStatusFieldsSection({
	form,
	presentBoxCount,
	disabled,
	seasonOptions,
	onChange,
	onSeasonChange,
}: {
	form: UserStatusForm;
	presentBoxCount: number;
	disabled: boolean;
	seasonOptions: AdminStateResponse['seasonList'];
	onChange: (form: UserStatusForm) => void;
	onSeasonChange: (seasonId: number) => void;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Box>
			<UserStatusSectionHeading title={messages.users.status} />
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
					<TextField
						fullWidth
						select
						size="small"
						label={messages.users.seasonFanId}
						disabled={disabled}
						value={form.seasonFanLevelSeasonId}
						onChange={(event) => onSeasonChange(Number(event.target.value))}
					>
						{seasonOptions.map((season) => (
							<MenuItem
								key={season.seasonId}
								value={season.seasonId}
								disabled={!season.isSeasonFanLv}
							>
								{season.seasonId} {season.name}
								{season.isSeasonFanLv ? '' : messages.users.notSeasonFanLevel}
							</MenuItem>
						))}
					</TextField>
				</Grid>
				{userStatusNumberKeys.map((key) => (
					<Grid key={key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
						<NumericInput
							label={messages.users.numberFields[key]}
							value={form[key]}
							min={0}
							disabled={disabled}
							step={1}
							onValueChange={(value) => onChange({ ...form, [key]: value })}
						/>
					</Grid>
				))}
				<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
					<TextField
						fullWidth
						disabled
						size="small"
						label={messages.users.fanLevel}
						value={form.fanLevel}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 8, lg: 6 }}>
					<DateTimeInput
						label={messages.users.staminaRecovery}
						value={form.staminaRecoveryTime}
						disabled={disabled}
						required={false}
						onChange={(staminaRecoveryTime) =>
							onChange({ ...form, staminaRecoveryTime })
						}
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
					<TextField
						fullWidth
						disabled
						size="small"
						label={messages.users.presentBoxCount}
						value={presentBoxCount}
					/>
				</Grid>
			</Grid>
		</Box>
	);
}
