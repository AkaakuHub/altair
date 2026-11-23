import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
	Collapse,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
} from '@mui/material';
import { type ReactNode, useEffect, useId, useState } from 'react';

export function NavigationGroup({
	label,
	icon,
	active,
	depth = 0,
	children,
}: Readonly<{
	label: string;
	icon?: ReactNode;
	active: boolean;
	depth?: number;
	children: ReactNode;
}>): React.ReactElement {
	const [open, setOpen] = useState(active);
	const id = useId();
	useEffect(() => {
		if (active) setOpen(true);
	}, [active]);
	return (
		<>
			<ListItemButton
				onClick={() => setOpen((current) => !current)}
				aria-expanded={open}
				aria-controls={id}
				sx={{ pl: 2 + depth * 2, borderRadius: 1 }}
			>
				{icon ? (
					<ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
				) : null}
				<ListItemText
					primary={label}
					slotProps={{
						primary: { sx: { fontWeight: depth === 0 ? 700 : 600 } },
					}}
				/>
				{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
			</ListItemButton>
			<Collapse in={open} id={id}>
				<List disablePadding>{children}</List>
			</Collapse>
		</>
	);
}
