import { Typography } from '@mui/material';

export function UserStatusSectionHeading({
	title,
}: {
	title: string;
}): React.ReactElement {
	return (
		<Typography
			component="h2"
			variant="subtitle2"
			sx={{ color: 'text.secondary', mb: 1.5 }}
		>
			{title}
		</Typography>
	);
}
