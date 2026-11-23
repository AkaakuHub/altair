import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { MenuItem, TextField } from '@mui/material';
import { useEffect } from 'react';
import { useAdminFormMutation } from '../hooks/useAdminFormMutation.ts';
import { useAdminUnsavedChangesContext } from '../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../i18n/AdminLanguageProvider.tsx';
import { getSelectedAdminPlayerId } from './features/player-state.ts';

type SelectedUserSelectProps = {
	data: AdminStateResponse;
	onReload: () => Promise<void>;
	onErrorChange: (message: string | null) => void;
};

export function SelectedUserSelect({
	data,
	onReload,
	onErrorChange,
}: SelectedUserSelectProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	const selectedAdminPlayerId = getSelectedAdminPlayerId(data);
	const { isSubmitting, submitForm, clearError } = useAdminFormMutation(
		onReload,
		{ onErrorChange },
	);
	useEffect(() => () => clearError(), [clearError]);
	return (
		<TextField
			select
			size="small"
			label={messages.selectedUser}
			value={selectedAdminPlayerId}
			disabled={isSubmitting}
			sx={{
				minWidth: 0,
				width: { xs: 180, sm: 260 },
				'& .MuiInputBase-root': {
					backgroundColor: 'background.paper',
				},
			}}
			onChange={(event) => {
				const playerId = event.target.value;
				if (playerId === selectedAdminPlayerId) return;
				requestAction(
					() => void submitForm('/admin/selected-user', { playerId }),
				);
			}}
		>
			{data.state.registeredUsers.map((user) => (
				<MenuItem key={user.playerId} value={user.playerId}>
					{user.playerName} {user.playerId}
				</MenuItem>
			))}
		</TextField>
	);
}
