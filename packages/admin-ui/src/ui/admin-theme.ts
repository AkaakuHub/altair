import type { PaletteMode } from '@mui/material';
import { createTheme } from '@mui/material';

export function createAdminTheme(mode: PaletteMode) {
	return createTheme({
		components: {
			MuiDialog: { defaultProps: { container: modalContainer } },
			MuiPopover: { defaultProps: { container: modalContainer } },
			MuiPopper: { defaultProps: { container: modalContainer } },
		},
		palette: {
			mode,
			background: {
				default: mode === 'dark' ? '#10141f' : '#f5f7fb',
			},
		},
		shape: {
			borderRadius: 8,
		},
		typography: {
			fontFamily:
				'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		},
	});
}

function modalContainer(): HTMLElement {
	return document.fullscreenElement instanceof HTMLElement
		? document.fullscreenElement
		: document.body;
}
