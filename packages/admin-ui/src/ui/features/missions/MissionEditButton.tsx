import { Button } from '@mui/material';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';

type MissionEditButtonProps = {
	selected: boolean;
	disabled?: boolean;
	onClick: () => void;
};

export function MissionEditButton({
	selected,
	disabled = false,
	onClick,
}: MissionEditButtonProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	return (
		<Button
			size="small"
			variant={selected ? 'contained' : 'outlined'}
			disabled={disabled}
			onClick={() => requestAction(onClick)}
		>
			{messages.edit}
		</Button>
	);
}
