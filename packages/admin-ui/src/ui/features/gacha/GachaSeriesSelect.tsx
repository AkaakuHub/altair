import type { GachaSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import { MenuItem, TextField } from '@mui/material';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';

type GachaSeriesSelectProps = {
	seriesList: GachaSeriesSummary[];
	value: number;
	disabled?: boolean;
	onChange: (value: number) => void;
};

export function GachaSeriesSelect({
	seriesList,
	value,
	disabled = false,
	onChange,
}: GachaSeriesSelectProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	return (
		<TextField
			select
			fullWidth
			size="small"
			label={messages.gacha.series}
			value={value}
			disabled={disabled}
			onChange={(event) => {
				const nextValue = Number(event.target.value);
				requestAction(() => onChange(nextValue));
			}}
		>
			{seriesList.map((series) => (
				<MenuItem key={series.gachaSeriesId} value={series.gachaSeriesId}>
					{series.gachaSeriesId} {series.title} {series.timeLimitGachaEndTime}
				</MenuItem>
			))}
		</TextField>
	);
}
