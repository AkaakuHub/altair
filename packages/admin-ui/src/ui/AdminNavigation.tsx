import CloseIcon from '@mui/icons-material/Close';
import DnsIcon from '@mui/icons-material/Dns';
import {
	Divider,
	Drawer,
	IconButton,
	List,
	Toolbar,
	Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useAdminLanguage } from '../i18n/AdminLanguageProvider.tsx';
import type { PageId } from './app-pages.tsx';
import { NavigationGroup } from './navigation/NavigationGroup.tsx';
import { ServerNavigation } from './navigation/ServerNavigation.tsx';

type AdminNavigationProps = Readonly<{
	activePageId: PageId | null;
	isExtensionRoute: boolean;
	isOpen: boolean;
	onClose(): void;
	onSelectPage(pageId: PageId): void;
	extensionNavigation?: ReactNode;
}>;

export function AdminNavigation({
	activePageId,
	isExtensionRoute,
	isOpen,
	onClose,
	onSelectPage,
	extensionNavigation,
}: AdminNavigationProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Drawer
			variant="temporary"
			open={isOpen}
			onClose={onClose}
			ModalProps={{ keepMounted: true }}
			slotProps={{
				paper: { component: 'nav', 'aria-label': messages.mainMenu },
			}}
			sx={{
				'& .MuiDrawer-paper': {
					width: 300,
					maxWidth: '90vw',
					boxSizing: 'border-box',
				},
			}}
		>
			<Toolbar>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
					LinkLike
				</Typography>
				<IconButton aria-label={messages.closeNavigation} onClick={onClose}>
					<CloseIcon />
				</IconButton>
			</Toolbar>
			<Divider />
			<List dense sx={{ px: 1 }}>
				{extensionNavigation}
				<NavigationGroup
					label={messages.management}
					icon={<DnsIcon />}
					active={!isExtensionRoute}
				>
					<ServerNavigation
						activePageId={activePageId}
						onSelectPage={onSelectPage}
						onClose={onClose}
					/>
				</NavigationGroup>
			</List>
		</Drawer>
	);
}
