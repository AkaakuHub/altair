import { Box, Grid } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import type { DailyTicketDraft } from './quest-drafts.ts';

export function DailyQuestPanel({
	form,
	isMutationDisabled,
	onChange,
	onSave,
}: {
	form: DailyTicketDraft;
	isMutationDisabled: boolean;
	onChange: (patch: Partial<DailyTicketDraft>) => void;
	onSave: () => Promise<void>;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<AdminSectionCard title={messages.quest.dailyTickets}>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					void onSave();
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 3 }}>
						<NumericInput
							label={messages.quantity}
							value={form.num}
							min={0}
							max={999}
							step={1}
							disabled={isMutationDisabled}
							onValueChange={(num) => onChange({ num })}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<NumericInput
							label={messages.quest.maximum}
							value={form.max}
							min={0}
							max={999}
							step={1}
							disabled={isMutationDisabled}
							onValueChange={(max) => onChange({ max })}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<SaveButton fullWidth disabled={isMutationDisabled} type="submit" />
					</Grid>
				</Grid>
			</Box>
		</AdminSectionCard>
	);
}
