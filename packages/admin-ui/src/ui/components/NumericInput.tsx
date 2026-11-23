import { TextField, type TextFieldProps } from '@mui/material';

export function NumericInput({
	label,
	value,
	onValueChange,
	disabled = false,
	min,
	max,
	step = 'any',
	form,
	onBlur,
	onKeyDown,
}: Readonly<{
	label: string;
	value: string;
	onValueChange(value: string): void;
	disabled?: boolean;
	min?: number;
	max?: number;
	step?: number | 'any';
	form?: string;
}> &
	Pick<TextFieldProps, 'onBlur' | 'onKeyDown'>): React.ReactElement {
	return (
		<TextField
			fullWidth
			size="small"
			type="number"
			label={label}
			value={value}
			disabled={disabled}
			required
			slotProps={{ htmlInput: { min, max, step, form } }}
			onChange={(event) => onValueChange(event.target.value)}
			onBlur={onBlur}
			onKeyDown={onKeyDown}
		/>
	);
}
