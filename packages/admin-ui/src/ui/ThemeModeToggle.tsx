import DarkModeIcon from '@mui/icons-material/DarkMode';
import DevicesIcon from '@mui/icons-material/Devices';
import LightModeIcon from '@mui/icons-material/LightMode';
import { IconButton, Tooltip } from '@mui/material';
import { useAdminLanguage } from '../i18n/AdminLanguageProvider.tsx';
import type { AdminThemeMode } from './AdminApp.tsx';

type ThemeModeToggleProps = {
	mode: AdminThemeMode;
	onChange: (mode: AdminThemeMode) => void;
};

const nextThemeModeByCurrentMode: Record<AdminThemeMode, AdminThemeMode> = {
	device: 'light',
	light: 'dark',
	dark: 'device',
};

export function ThemeModeToggle({
	mode,
	onChange,
}: ThemeModeToggleProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const nextMode = nextThemeModeByCurrentMode[mode];

	const title = {
		device: messages.themeDevice,
		light: messages.themeLight,
		dark: messages.themeDark,
	}[nextMode];
	return (
		<Tooltip title={title}>
			<IconButton
				color="inherit"
				aria-label={title}
				onClick={() => onChange(nextMode)}
			>
				{mode === 'device' ? <DevicesIcon /> : null}
				{mode === 'light' ? <LightModeIcon /> : null}
				{mode === 'dark' ? <DarkModeIcon /> : null}
			</IconButton>
		</Tooltip>
	);
}
