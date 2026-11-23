import { Box, Grid, TextField } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { UserStatusSectionHeading } from './UserStatusSectionHeading.tsx';
import type { UserStatusForm } from './user-status-form.ts';

export function MemberFanLevelsSection({
	memberFanLevels,
	disabled,
	onChange,
}: {
	disabled: boolean;
	memberFanLevels: UserStatusForm['memberFanLevels'];
	onChange: (
		index: number,
		values: Partial<UserStatusForm['memberFanLevels'][number]>,
	) => void;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Box>
			<UserStatusSectionHeading title={messages.users.memberFanLevels} />
			<Box
				sx={{
					display: 'grid',
					gap: 2,
					gridTemplateColumns:
						'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
				}}
			>
				{memberFanLevels.map((member, index) => (
					<Box
						key={member.characterId}
						sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}
					>
						<Grid container spacing={1.5}>
							<Grid size={{ xs: 12, sm: 4 }}>
								<TextField
									fullWidth
									disabled
									size="small"
									label={messages.character}
									value={member.characterId}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 4 }}>
								<NumericInput
									label={messages.users.memberFan}
									value={member.memberFanLevel}
									min={0}
									disabled={disabled}
									step={1}
									onValueChange={(value) =>
										onChange(index, { memberFanLevel: value })
									}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 4 }}>
								<NumericInput
									label={messages.users.memberExp}
									value={member.memberFanExperience}
									min={0}
									disabled={disabled}
									step={1}
									onValueChange={(value) =>
										onChange(index, { memberFanExperience: value })
									}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<NumericInput
									label={messages.users.seasonFan}
									value={member.dSeasonFanLevel}
									min={0}
									disabled={disabled}
									step={1}
									onValueChange={(value) =>
										onChange(index, { dSeasonFanLevel: value })
									}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<NumericInput
									label={messages.users.seasonExp}
									value={member.dSeasonFanExperience}
									min={0}
									disabled={disabled}
									step={1}
									onValueChange={(value) =>
										onChange(index, { dSeasonFanExperience: value })
									}
								/>
							</Grid>
						</Grid>
					</Box>
				))}
			</Box>
		</Box>
	);
}
