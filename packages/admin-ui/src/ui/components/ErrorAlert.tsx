import { Alert } from '@mui/material';
import { CopyErrorButton } from './CopyErrorButton.tsx';

export function ErrorAlert({
	message,
	overlay = false,
}: Readonly<{
	message: string;
	overlay?: boolean;
}>): React.ReactElement {
	return (
		<Alert
			severity="error"
			sx={{
				wordBreak: 'break-word',
				...(overlay
					? {
							position: 'absolute',
							left: 16,
							right: 16,
							bottom: 120,
							zIndex: 7,
						}
					: {}),
			}}
			action={<CopyErrorButton message={message} />}
		>
			{message}
		</Alert>
	);
}
