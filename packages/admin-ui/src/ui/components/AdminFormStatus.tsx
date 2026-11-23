import { Alert, Button, Stack } from '@mui/material';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { ErrorAlert } from './ErrorAlert.tsx';

export function AdminFormStatus({
	error,
	conflicted = false,
	onReset,
	disabled = false,
}: Readonly<{
	error?: string | null;
	conflicted?: boolean;
	onReset?: () => void;
	disabled?: boolean;
}>): React.ReactElement | null {
	const { messages } = useAdminLanguage();
	if (!error && !conflicted) return null;
	return (
		<Stack spacing={2} sx={{ mb: 2 }}>
			{error ? <ErrorAlert message={error} /> : null}
			{conflicted ? (
				<Alert
					severity="warning"
					action={
						onReset ? (
							<Button disabled={disabled} onClick={onReset}>
								{messages.loadSavedValues}
							</Button>
						) : null
					}
				>
					{messages.savedValuesChanged}
				</Alert>
			) : null}
		</Stack>
	);
}
