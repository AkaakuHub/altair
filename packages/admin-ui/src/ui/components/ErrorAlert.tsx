import { Alert, alertClasses } from '@mui/material';
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
			slotProps={overlay ? { message: { tabIndex: 0 } } : undefined}
			sx={{
				[`& .${alertClasses.message}`]: {
					minWidth: 0,
					overflowWrap: 'anywhere',
					whiteSpace: 'pre-wrap',
					...(overlay
						? { overflowY: 'auto', overscrollBehaviorY: 'contain' }
						: {}),
				},
				...(overlay
					? {
							position: 'absolute',
							boxSizing: 'border-box',
							'--error-bottom':
								'calc(min(120px, 25%) + env(safe-area-inset-bottom, 0px))',
							left: 'calc(16px + env(safe-area-inset-left, 0px))',
							right: 'calc(16px + env(safe-area-inset-right, 0px))',
							bottom: 'var(--error-bottom)',
							maxHeight:
								'min(50%, calc(100% - var(--error-bottom) - env(safe-area-inset-top, 0px) - 16px))',
							[`& .${alertClasses.action}`]: { alignSelf: 'flex-start' },
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
