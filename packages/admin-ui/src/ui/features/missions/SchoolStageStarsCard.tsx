import { Grid, TextField } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';

export function SchoolStageStarsCard({
	stars,
}: {
	stars: number;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<AdminSectionCard title={messages.missions.schoolStageStars} sx={{ mb: 0 }}>
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, md: 6 }}>
					<TextField
						fullWidth
						size="small"
						label={messages.missions.stars}
						value={stars}
						slotProps={{ input: { readOnly: true } }}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 6 }}>
					<TextField
						fullWidth
						size="small"
						label={messages.missions.source}
						value={messages.missions.questProgress}
						slotProps={{ input: { readOnly: true } }}
					/>
				</Grid>
			</Grid>
		</AdminSectionCard>
	);
}
