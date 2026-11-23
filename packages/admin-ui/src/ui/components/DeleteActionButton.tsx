import DeleteIcon from '@mui/icons-material/Delete';
import { Button, type ButtonProps } from '@mui/material';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';

type DeleteActionButtonProps = Omit<
	ButtonProps,
	'children' | 'color' | 'startIcon' | 'variant'
> & {
	label?: string;
};

export function DeleteActionButton({
	label,
	size = 'small',
	...props
}: DeleteActionButtonProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Button
			{...props}
			size={size}
			color="error"
			variant="outlined"
			startIcon={<DeleteIcon />}
		>
			{label ?? messages.remove}
		</Button>
	);
}
