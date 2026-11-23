import { type SxProps, TextField, type Theme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

type AdminSearchFieldProps = {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	onValueCommit?: ((value: string) => void) | undefined;
	fullWidth?: boolean | undefined;
	sx?: SxProps<Theme> | undefined;
};

export function AdminSearchField({
	label,
	value,
	onValueChange,
	onValueCommit,
	fullWidth,
	sx,
}: Readonly<AdminSearchFieldProps>): React.ReactElement {
	const [draft, setDraft] = useState(value);
	const composing = useRef(false);

	useEffect(() => {
		setDraft(value);
	}, [value]);

	const applyValue = (nextValue: string): void => {
		onValueChange(nextValue);
		onValueCommit?.(nextValue);
	};

	return (
		<TextField
			fullWidth={fullWidth}
			size="small"
			label={label}
			value={draft}
			onCompositionStart={() => {
				composing.current = true;
			}}
			onCompositionEnd={(event) => {
				if (!(event.target instanceof HTMLInputElement))
					throw new Error('Admin search input target is invalid');
				const nextValue = event.target.value;
				composing.current = false;
				setDraft(nextValue);
				applyValue(nextValue);
			}}
			onChange={(event) => {
				const nextValue = event.target.value;
				setDraft(nextValue);
				if (!composing.current) applyValue(nextValue);
			}}
			onBlur={(event) => onValueCommit?.(event.currentTarget.value)}
			sx={sx}
		/>
	);
}
