import DnsIcon from '@mui/icons-material/Dns';
import PeopleIcon from '@mui/icons-material/People';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { adminPages, type PageId, type PageScope } from '../app-pages.tsx';
import { NavigationGroup } from './NavigationGroup.tsx';

export function ServerNavigation({
	activePageId,
	onSelectPage,
	onClose,
}: Readonly<{
	activePageId: PageId | null;
	onSelectPage(pageId: PageId): void;
	onClose(): void;
}>): React.ReactElement {
	const { messages } = useAdminLanguage();
	function pages(scope: PageScope): React.ReactNode {
		return adminPages
			.filter((page) => page.scope === scope)
			.map((page) => (
				<ListItemButton
					key={page.id}
					selected={page.id === activePageId}
					aria-current={page.id === activePageId ? 'page' : undefined}
					sx={{ pl: 6, borderRadius: 1 }}
					onClick={() => {
						onSelectPage(page.id);
						onClose();
					}}
				>
					<ListItemIcon sx={{ minWidth: 36 }}>{page.icon}</ListItemIcon>
					<ListItemText primary={messages.pages[page.id]} />
				</ListItemButton>
			));
	}
	return (
		<>
			<NavigationGroup
				label={messages.server}
				icon={<DnsIcon />}
				depth={1}
				active={adminPages.some(
					(page) => page.scope === 'server' && page.id === activePageId,
				)}
			>
				{pages('server')}
			</NavigationGroup>
			<NavigationGroup
				label={messages.user}
				icon={<PeopleIcon />}
				depth={1}
				active={adminPages.some(
					(page) => page.scope === 'user' && page.id === activePageId,
				)}
			>
				{pages('user')}
			</NavigationGroup>
		</>
	);
}
