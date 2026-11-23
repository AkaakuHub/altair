import { Box, Grid } from '@mui/material';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';

export type MissionEditorProps<Form> = {
	form: Form;
	disabled: boolean;
	isSaveDisabled: boolean;
	isSubmitting: boolean;
	onChange: (form: Form) => void;
	onSave: () => void;
};

export function MissionEditorCard({
	title,
	children,
	onSave,
}: {
	title: string;
	children: React.ReactNode;
	onSave(): void;
}): React.ReactElement {
	return (
		<AdminSectionCard title={title} sx={{ mb: 0 }}>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					onSave();
				}}
			>
				<Grid container spacing={2}>
					{children}
				</Grid>
			</Box>
		</AdminSectionCard>
	);
}
