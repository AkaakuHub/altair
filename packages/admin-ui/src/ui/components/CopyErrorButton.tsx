import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';

export function CopyTextButton({
	text,
	ariaLabel,
	tooltip,
	color = 'inherit',
}: Readonly<{
	text: string;
	ariaLabel: string;
	tooltip: string;
	color?: 'inherit' | 'default' | 'primary';
}>): React.ReactElement {
	const { messages } = useAdminLanguage();
	const [copiedText, setCopiedText] = useState<string | null>(null);
	const copied = copiedText === text;
	const copy = (): void => {
		void navigator.clipboard.writeText(text).then(
			() => setCopiedText(text),
			() => setCopiedText(null),
		);
	};
	return (
		<Tooltip title={copied ? messages.copied : tooltip}>
			<IconButton
				aria-label={ariaLabel}
				color={color}
				size="small"
				onClick={copy}
			>
				{copied ? (
					<CheckRoundedIcon fontSize="small" />
				) : (
					<ContentCopyRoundedIcon fontSize="small" />
				)}
			</IconButton>
		</Tooltip>
	);
}

export function CopyErrorButton({
	message,
}: Readonly<{ message: string }>): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<CopyTextButton
			text={message}
			ariaLabel={messages.copyError}
			tooltip={messages.copyError}
		/>
	);
}
