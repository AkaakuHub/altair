import { TextField } from '@mui/material';
import type { DateTimeDraft } from '../../domain/forms/dateTimeDraft.ts';

export function DateTimeInput({
	label,
	value,
	disabled,
	required = true,
	onChange,
}: Readonly<{
	label: string;
	value: DateTimeDraft;
	disabled: boolean;
	required?: boolean;
	onChange(value: DateTimeDraft): void;
}>): React.ReactElement {
	return (
		<TextField
			required={required}
			fullWidth
			type="datetime-local"
			label={label}
			value={value.value}
			disabled={disabled}
			slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 0.001 } }}
			onChange={(event) => onChange({ ...value, value: event.target.value })}
		/>
	);
}
