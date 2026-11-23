import { Stack } from '@mui/material';
import type { ReactNode } from 'react';

type RowActionsProps = {
	children: ReactNode;
	wrap?: boolean;
};

export function RowActions({
	children,
	wrap = false,
}: RowActionsProps): React.ReactElement {
	return (
		<Stack
			direction="row"
			spacing={1}
			useFlexGap
			sx={wrap ? { flexWrap: 'wrap' } : undefined}
		>
			{children}
		</Stack>
	);
}
