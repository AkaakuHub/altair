import {
	Card,
	CardContent,
	type SxProps,
	type Theme,
	Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

type AdminSectionCardProps = {
	children: ReactNode;
	title?: string | undefined;
	sx?: SxProps<Theme> | undefined;
	contentSx?: SxProps<Theme> | undefined;
};

export function AdminSectionCard({
	children,
	title,
	sx,
	contentSx,
}: AdminSectionCardProps): React.ReactElement {
	return (
		<Card variant="outlined" sx={sx ?? { mb: 3 }}>
			<CardContent sx={contentSx}>
				{title ? (
					<Typography variant="h6" component="h2" sx={{ mb: 2 }}>
						{title}
					</Typography>
				) : null}
				{children}
			</CardContent>
		</Card>
	);
}
