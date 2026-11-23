import { MenuItem, Select } from '@mui/material';
import { useAdminLanguage } from './AdminLanguageProvider.tsx';
import { adminLanguages, isAdminLocale } from './messages.ts';

export function AdminLanguageSelect(): React.ReactElement {
	const { locale, setLocale, messages } = useAdminLanguage();
	return (
		<Select
			value={locale}
			size="small"
			inputProps={{ 'aria-label': messages.language }}
			sx={{
				color: 'inherit',
				mr: 1,
				'& .MuiSelect-icon': { color: 'inherit' },
			}}
			onChange={(event) => {
				if (isAdminLocale(event.target.value)) setLocale(event.target.value);
			}}
		>
			{adminLanguages.map((language) => (
				<MenuItem
					key={language.locale}
					value={language.locale}
					lang={language.locale}
				>
					{language.label}
				</MenuItem>
			))}
		</Select>
	);
}
