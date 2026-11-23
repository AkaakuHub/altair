import { Button, Dialog, DialogActions, DialogTitle } from '@mui/material';
import { useId } from 'react';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';

export function DiscardChangesDialog({
	open,
	onDiscard,
	onCancel,
}: Readonly<{
	open: boolean;
	onDiscard(): void;
	onCancel(): void;
}>): React.ReactElement {
	const { messages } = useAdminLanguage();
	const titleId = useId();
	return (
		<Dialog
			open={open}
			onClose={onCancel}
			aria-labelledby={titleId}
			role="alertdialog"
			fullWidth
			maxWidth="xs"
		>
			<DialogTitle id={titleId}>{messages.discardTitle}</DialogTitle>
			<DialogActions>
				<Button autoFocus onClick={onCancel}>
					{messages.continueEditing}
				</Button>
				<Button color="error" variant="outlined" onClick={onDiscard}>
					{messages.discardChanges}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
