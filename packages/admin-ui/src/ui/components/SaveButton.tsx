import SaveIcon from '@mui/icons-material/Save';
import { Button } from '@mui/material';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';

type SaveButtonProps = {
	label?: string;
	disabled?: boolean;
	loading?: boolean;
	fullWidth?: boolean;
	size?: 'small' | 'medium' | 'large';
	onClick?: () => void;
	type?: 'button' | 'submit';
};

export function SaveButton({
	label,
	disabled = false,
	loading = false,
	fullWidth = false,
	size = 'medium',
	onClick,
	type = 'button',
}: SaveButtonProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Button
			type={type}
			size={size}
			fullWidth={fullWidth}
			variant="contained"
			startIcon={<SaveIcon />}
			disabled={disabled}
			loading={loading}
			onClick={onClick}
		>
			{label ?? messages.save}
		</Button>
	);
}
