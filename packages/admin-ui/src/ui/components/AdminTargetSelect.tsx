import UndoIcon from '@mui/icons-material/Undo';
import { Button, IconButton, InputAdornment, TextField } from '@mui/material';
import { useRef } from 'react';
import type { AdminTargetSelectionControl } from '../../hooks/useAdminTargetSelection.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';

export function AdminTargetSelect({
	label,
	selection,
	disabled = false,
	required = false,
}: Readonly<{
	label: string;
	selection: AdminTargetSelectionControl;
	disabled?: boolean;
	required?: boolean;
}>): React.ReactElement {
	const { messages } = useAdminLanguage();
	const composing = useRef(false);
	return (
		<TextField
			fullWidth
			size="small"
			label={label}
			value={selection.candidateId}
			disabled={disabled}
			required={required}
			onChange={(event) => selection.setCandidateId(event.target.value)}
			onCompositionStart={() => {
				composing.current = true;
			}}
			onCompositionEnd={() => {
				composing.current = false;
			}}
			onKeyDown={(event) => {
				if (
					event.key !== 'Enter' ||
					composing.current ||
					event.nativeEvent.isComposing
				)
					return;
				event.preventDefault();
				if (!disabled) selection.select(selection.candidateId);
			}}
			slotProps={{
				input: {
					endAdornment: (
						<InputAdornment position="end">
							{selection.hasPendingSelection ? (
								<IconButton
									type="button"
									size="small"
									disabled={disabled}
									aria-label={messages.resetCandidate(label)}
									onClick={selection.resetCandidate}
								>
									<UndoIcon fontSize="small" />
								</IconButton>
							) : null}
							<Button
								type="button"
								size="small"
								disabled={disabled}
								aria-label={messages.selectTarget(label)}
								onClick={() => selection.select(selection.candidateId)}
							>
								{messages.select}
							</Button>
						</InputAdornment>
					),
				},
			}}
		/>
	);
}
