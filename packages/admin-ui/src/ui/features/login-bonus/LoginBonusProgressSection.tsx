import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import type { LoginBonusSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import { Box, FormControlLabel, Grid, Switch, Typography } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import {
	type LoginBonusProgressForm,
	loginBonusReceivedTodayForm,
} from './login-bonus-model.ts';

export function LoginBonusProgressSection({
	form,
	selectedLoginBonus,
	onChange,
	onSave,
	isSubmitting,
	isSaveDisabled,
}: {
	form: LoginBonusProgressForm;
	selectedLoginBonus: LoginBonusSummary | undefined;
	onChange: (form: LoginBonusProgressForm) => void;
	onSave: () => void;
	isSubmitting: boolean;
	isSaveDisabled: boolean;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<AdminSectionCard title={messages.progress}>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					onSave();
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 5 }}>
						<Typography variant="body1">
							{selectedLoginBonus
								? `${selectedLoginBonus.loginBonusId} ${selectedLoginBonus.name}`
								: messages.loginBonus.noActiveBonus}
						</Typography>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<NumericInput
							label={messages.loginBonus.receivedCount}
							value={form.receivedCount}
							min={0}
							max={Math.min(
								selectedLoginBonus?.dayCount ?? MAX_ADMIN_ITEM_QUANTITY,
								MAX_ADMIN_ITEM_QUANTITY,
							)}
							step={1}
							disabled={isSubmitting}
							onValueChange={(receivedCount) =>
								onChange({ ...form, receivedCount })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<FormControlLabel
							control={
								<Switch
									checked={form.isReceivedToday}
									disabled={isSubmitting}
									onChange={(event) =>
										onChange(
											loginBonusReceivedTodayForm(form, event.target.checked),
										)
									}
								/>
							}
							label={messages.loginBonus.receivedToday}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<SaveButton
							loading={isSubmitting}
							fullWidth
							type="submit"
							disabled={
								isSubmitting || isSaveDisabled || form.loginBonusId <= 0
							}
						/>
					</Grid>
				</Grid>
			</Box>
		</AdminSectionCard>
	);
}
