import type { AdminRegisteredUser } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { MenuItem, TextField } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';

export function UserSelect({
	label,
	users,
	disabled = false,
	value,
	onChange,
}: {
	label: string;
	users: AdminRegisteredUser[];
	disabled?: boolean;
	value: string;
	onChange: (value: string) => void;
}): React.ReactElement {
	return (
		<TextField
			select
			fullWidth
			size="small"
			label={label}
			value={value}
			disabled={disabled}
			onChange={(event) => onChange(event.target.value)}
		>
			{users.map((user) => (
				<MenuItem key={user.playerId} value={user.playerId}>
					{user.playerName} {user.playerId}
				</MenuItem>
			))}
		</TextField>
	);
}

export function PositionSelect({
	disabled = false,
	value,
	onChange,
}: {
	disabled?: boolean;
	value: number;
	onChange: (value: number) => void;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<TextField
			select
			fullWidth
			size="small"
			label={messages.circle.position}
			disabled={disabled}
			value={value}
			onChange={(event) => onChange(Number(event.target.value))}
		>
			<MenuItem value={0}>{messages.circle.member}</MenuItem>
			<MenuItem value={1}>{messages.circle.leader}</MenuItem>
			<MenuItem value={2}>{messages.circle.subleader}</MenuItem>
		</TextField>
	);
}
