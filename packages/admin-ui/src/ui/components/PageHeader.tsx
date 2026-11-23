import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, Box, Button, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';

type PageHeaderProps = {
	title: string;
	onReload?: () => Promise<void>;
};

export function PageHeader({
	title,
	onReload,
}: PageHeaderProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const pending = useRef(false);
	const [isReloading, setReloading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	async function reload(): Promise<void> {
		if (pending.current || onReload === undefined) return;
		pending.current = true;
		setReloading(true);
		setError(null);
		try {
			await onReload();
		} catch (cause: unknown) {
			setError(cause instanceof Error ? cause.message : String(cause));
		} finally {
			pending.current = false;
			setReloading(false);
		}
	}
	return (
		<Box sx={{ mb: 3 }}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					gap: 2,
					alignItems: 'flex-start',
					flexWrap: 'wrap',
				}}
			>
				<Box>
					<Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
						{title}
					</Typography>
				</Box>
				{onReload ? (
					<Button
						variant="outlined"
						startIcon={<RefreshIcon />}
						loading={isReloading}
						onClick={() => void reload()}
					>
						{messages.reload}
					</Button>
				) : null}
			</Box>
			{error === null ? null : <Alert severity="error">{error}</Alert>}
		</Box>
	);
}
