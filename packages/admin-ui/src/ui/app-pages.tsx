import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import ArchiveIcon from '@mui/icons-material/Archive';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CasinoIcon from '@mui/icons-material/Casino';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GroupsIcon from '@mui/icons-material/Groups';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PeopleIcon from '@mui/icons-material/People';
import ReportIcon from '@mui/icons-material/Report';
import SettingsIcon from '@mui/icons-material/Settings';
import StyleIcon from '@mui/icons-material/Style';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { ReactNode } from 'react';
import { useAdminLanguage } from '../i18n/AdminLanguageProvider.tsx';
import { PageHeader } from './components/PageHeader.tsx';
import { ServerGachaPage } from './features/gacha/ServerGachaPage.tsx';
import { ActivityRecordPage } from './pages/ActivityRecordPage.tsx';
import { ArchivePage } from './pages/ArchivePage.tsx';
import { CardsPage } from './pages/CardsPage.tsx';
import { CirclePage } from './pages/CirclePage.tsx';
import { UserGachaPage } from './pages/GachaPage.tsx';
import { GradeLivePage } from './pages/GradeLivePage.tsx';
import { ItemsPage } from './pages/ItemsPage.tsx';
import { LiveGrandPrixPage } from './pages/LiveGrandPrixPage.tsx';
import {
	ServerLoginBonusPage,
	UserLoginBonusPage,
} from './pages/LoginBonusPage.tsx';
import { MissionsPage } from './pages/MissionsPage.tsx';
import { OfficialMigrationPage } from './pages/OfficialMigrationPage.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { PresentBoxPage } from './pages/PresentBoxPage.tsx';
import { QuestPage } from './pages/QuestPage.tsx';
import { SocialPage } from './pages/SocialPage.tsx';
import { StickersPage } from './pages/StickersPage.tsx';
import { UserStatusPage } from './pages/UserStatusPage.tsx';
import { UsersPage } from './pages/UsersPage.tsx';

export type PageId =
	| 'overview'
	| 'official-migration'
	| 'users'
	| 'user-status'
	| 'grade-live'
	| 'grand-prix'
	| 'circle'
	| 'social'
	| 'items'
	| 'present-box'
	| 'archive'
	| 'cards'
	| 'stickers'
	| 'gacha'
	| 'gacha-server'
	| 'login-bonus'
	| 'login-bonus-server'
	| 'missions'
	| 'activity-record'
	| 'quest';

export type PageScope = 'server' | 'user';

type AdminPage = {
	id: PageId;
	icon: ReactNode;
	scope: PageScope;
};

export const adminPages: AdminPage[] = [
	{
		id: 'overview',
		icon: <DashboardIcon />,
		scope: 'server',
	},
	{
		id: 'official-migration',
		icon: <UploadFileIcon />,
		scope: 'server',
	},
	{ id: 'users', icon: <PeopleIcon />, scope: 'server' },
	{
		id: 'grand-prix',
		icon: <LeaderboardIcon />,
		scope: 'server',
	},
	{
		id: 'grade-live',
		icon: <EmojiEventsIcon />,
		scope: 'server',
	},
	{ id: 'circle', icon: <GroupsIcon />, scope: 'server' },
	{ id: 'social', icon: <ReportIcon />, scope: 'server' },
	{
		id: 'login-bonus-server',
		icon: <EventAvailableIcon />,
		scope: 'server',
	},
	{
		id: 'gacha-server',
		icon: <CasinoIcon />,
		scope: 'server',
	},
	{
		id: 'user-status',
		icon: <SettingsIcon />,
		scope: 'user',
	},
	{ id: 'items', icon: <Inventory2Icon />, scope: 'user' },
	{
		id: 'present-box',
		icon: <CardGiftcardIcon />,
		scope: 'user',
	},
	{
		id: 'archive',
		icon: <ArchiveIcon />,
		scope: 'user',
	},
	{ id: 'cards', icon: <StyleIcon />, scope: 'user' },
	{
		id: 'stickers',
		icon: <EmojiEmotionsIcon />,
		scope: 'user',
	},
	{ id: 'gacha', icon: <CasinoIcon />, scope: 'user' },
	{
		id: 'login-bonus',
		icon: <EventAvailableIcon />,
		scope: 'user',
	},
	{
		id: 'missions',
		icon: <AssignmentTurnedInIcon />,
		scope: 'user',
	},
	{
		id: 'activity-record',
		icon: <MenuBookIcon />,
		scope: 'user',
	},
	{
		id: 'quest',
		icon: <MusicNoteIcon />,
		scope: 'user',
	},
];

export function isPageId(value: string | null): value is PageId {
	return adminPages.some((page) => page.id === value);
}

export function isUserScopedPage(pageId: PageId): boolean {
	return adminPages.some((page) => page.id === pageId && page.scope === 'user');
}

export function renderAdminPage(
	pageId: PageId,
	data: AdminStateResponse | null,
	reload: () => Promise<void>,
): React.ReactElement {
	if (data === null) {
		const page = adminPages.find((candidate) => candidate.id === pageId);
		if (page === undefined) throw new Error(`Unknown Admin page: ${pageId}`);
		return <AdminPagePlaceholder pageId={page.id} reload={reload} />;
	}
	switch (pageId) {
		case 'overview':
			return <OverviewPage data={data} onReload={reload} />;
		case 'official-migration':
			return <OfficialMigrationPage data={data} onReload={reload} />;
		case 'users':
			return <UsersPage data={data} onReload={reload} />;
		case 'user-status':
			return <UserStatusPage data={data} onReload={reload} />;
		case 'grand-prix':
			return <LiveGrandPrixPage data={data} onReload={reload} />;
		case 'grade-live':
			return <GradeLivePage data={data} onReload={reload} />;
		case 'circle':
			return <CirclePage data={data} onReload={reload} />;
		case 'social':
			return <SocialPage data={data} onReload={reload} />;
		case 'items':
			return <ItemsPage data={data} onReload={reload} />;
		case 'present-box':
			return <PresentBoxPage data={data} onReload={reload} />;
		case 'archive':
			return <ArchivePage data={data} onReload={reload} />;
		case 'cards':
			return <CardsPage data={data} onReload={reload} />;
		case 'stickers':
			return <StickersPage data={data} onReload={reload} />;
		case 'gacha-server':
			return <ServerGachaPage data={data} onReload={reload} />;
		case 'gacha':
			return <UserGachaPage data={data} onReload={reload} />;
		case 'login-bonus-server':
			return <ServerLoginBonusPage data={data} onReload={reload} />;
		case 'login-bonus':
			return <UserLoginBonusPage data={data} onReload={reload} />;
		case 'missions':
			return <MissionsPage data={data} onReload={reload} />;
		case 'activity-record':
			return <ActivityRecordPage data={data} onReload={reload} />;
		case 'quest':
			return <QuestPage data={data} onReload={reload} />;
	}
}

function AdminPagePlaceholder({
	pageId,
	reload,
}: Readonly<{
	pageId: PageId;
	reload: () => Promise<void>;
}>): React.ReactElement {
	const { messages } = useAdminLanguage();
	return <PageHeader title={messages.pages[pageId]} onReload={reload} />;
}
