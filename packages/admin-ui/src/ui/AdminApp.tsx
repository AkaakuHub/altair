import MenuIcon from '@mui/icons-material/Menu';
import type { PaletteMode } from '@mui/material';
import {
	Alert,
	AppBar,
	Box,
	CircularProgress,
	CssBaseline,
	IconButton,
	LinearProgress,
	Modal,
	Toolbar,
	Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { ReactNode } from 'react';
import { Fragment, Suspense, useEffect, useMemo, useState } from 'react';
import { type RouteObject, useLocation, useNavigate } from 'react-router-dom';
import { useAdminState } from '../hooks/useAdminState.ts';
import { useAdminUnsavedChangesContext } from '../hooks/useAdminUnsavedChanges.ts';
import {
	AdminLanguageProvider,
	useAdminLanguage,
} from '../i18n/AdminLanguageProvider.tsx';
import { AdminLanguageSelect } from '../i18n/AdminLanguageSelect.tsx';
import { adminLocales } from '../i18n/messages.ts';
import { AdminNavigation } from './AdminNavigation.tsx';
import { AdminRoutes } from './admin-routes.tsx';
import { createAdminTheme } from './admin-theme.ts';
import {
	isPageId,
	isUserScopedPage,
	type PageId,
	renderAdminPage,
} from './app-pages.tsx';
import { AdminFormStatus } from './components/AdminFormStatus.tsx';
import { getSelectedAdminPlayerId } from './features/player-state.ts';
import { SelectedUserSelect } from './SelectedUserSelect.tsx';
import { ThemeModeToggle } from './ThemeModeToggle.tsx';
import { AdminNavigationGuard } from './unsavedChanges/AdminNavigationGuard.tsx';
import { AdminUnsavedChangesProvider } from './unsavedChanges/AdminUnsavedChangesProvider.tsx';

const pageStorageKey = 'linklike-admin-page-id';
const themeModeStorageKey = 'linklike-admin-theme-mode';
export type AdminThemeMode = 'device' | PaletteMode;

export type AdminExtension = Readonly<{
	routes: readonly RouteObject[];
	activeTitle: ReactNode | null;
	fullscreen?: boolean;
	renderNavigation(onClose: () => void): ReactNode;
}>;

type AdminAppProps = Readonly<{
	extension?: AdminExtension;
	readiness?: Readonly<{
		isReady: boolean;
		isLoading: boolean;
		error: string | null;
	}>;
}>;

export function AdminApp(props: AdminAppProps = {}): React.ReactElement {
	return (
		<AdminLanguageProvider>
			<AdminUnsavedChangesProvider>
				<AdminShell {...props} />
			</AdminUnsavedChangesProvider>
		</AdminLanguageProvider>
	);
}

function AdminShell({
	extension,
	readiness = { isReady: true, isLoading: false, error: null },
}: AdminAppProps): React.ReactElement {
	const { locale, messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	const [pageId, setPageId] = useState<PageId>(readStoredPageId);
	const [themeMode, setThemeMode] =
		useState<AdminThemeMode>(readStoredThemeMode);
	const [isNavigationOpen, setNavigationOpen] = useState(false);
	const [selectedUserError, setSelectedUserError] = useState<string | null>(
		null,
	);
	const _location = useLocation();
	const navigate = useNavigate();
	const isExtensionRoute =
		extension?.activeTitle !== null && extension?.activeTitle !== undefined;
	const isFullscreen = extension?.fullscreen === true;

	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
	const resolvedThemeMode: PaletteMode =
		themeMode === 'device' ? (prefersDarkMode ? 'dark' : 'light') : themeMode;

	const { data, error, isLoading, isMutating, reload } = useAdminState(
		isExtensionRoute ? null : pageId,
	);
	const theme = useMemo(
		() =>
			createTheme(
				createAdminTheme(resolvedThemeMode),
				adminLocales[locale].mui,
			),
		[resolvedThemeMode, locale],
	);

	useEffect(() => {
		localStorage.setItem(pageStorageKey, pageId);
	}, [pageId]);

	useEffect(() => {
		localStorage.setItem(themeModeStorageKey, themeMode);
	}, [themeMode]);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<AdminNavigationGuard />
			<Box sx={{ display: 'flex', minHeight: '100vh' }}>
				{isFullscreen ? null : (
					<AppBar position="fixed" elevation={0}>
						<Toolbar>
							<IconButton
								color="inherit"
								edge="start"
								aria-label={messages.openNavigation}
								aria-expanded={isNavigationOpen}
								onClick={() => setNavigationOpen(true)}
								sx={{ mr: 1 }}
							>
								<MenuIcon />
							</IconButton>
							<Typography
								variant="h6"
								component="div"
								sx={{ display: { xs: 'none', sm: 'block' } }}
							>
								{extension?.activeTitle ?? messages.management}
							</Typography>
							<Box sx={{ flexGrow: 1 }} />
							<AdminLanguageSelect />
							<ThemeModeToggle mode={themeMode} onChange={setThemeMode} />
							{data && !isExtensionRoute && isUserScopedPage(pageId) ? (
								<SelectedUserSelect
									data={data}
									onReload={reload}
									onErrorChange={setSelectedUserError}
								/>
							) : null}
						</Toolbar>
						{isLoading && data !== null ? (
							<LinearProgress aria-label={messages.loading} />
						) : null}
					</AppBar>
				)}
				{isFullscreen ? null : (
					<AdminNavigation
						activePageId={isExtensionRoute ? null : pageId}
						isExtensionRoute={isExtensionRoute}
						isOpen={isNavigationOpen}
						onClose={() => setNavigationOpen(false)}
						onSelectPage={(nextPageId) => {
							if (!isExtensionRoute && pageId === nextPageId) return;
							requestAction(() => {
								setPageId(nextPageId);
								void navigate('/');
							});
						}}
						extensionNavigation={extension?.renderNavigation(() =>
							setNavigationOpen(false),
						)}
					/>
				)}
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						minWidth: 0,
						px: isFullscreen ? 0 : { xs: 2, md: 3 },
						pb: isFullscreen ? 0 : { xs: 2, md: 3 },
						pt: isFullscreen ? 0 : { xs: 9, md: 10 },
					}}
				>
					{readiness.isLoading ? <CircularProgress /> : null}
					{readiness.error ? (
						<Alert severity="error">{readiness.error}</Alert>
					) : null}
					{error ? <Alert severity="error">{error}</Alert> : null}
					<AdminFormStatus error={selectedUserError} />
					{readiness.isReady ? (
						<Suspense fallback={<CircularProgress />}>
							<AdminRoutes
								indexElement={
									isLoading && data === null ? (
										<CircularProgress />
									) : (
										<Fragment
											key={`${pageId}:${data !== null && isUserScopedPage(pageId) ? getSelectedAdminPlayerId(data) : ''}`}
										>
											{renderAdminPage(pageId, data, reload)}
										</Fragment>
									)
								}
								extensionRoutes={extension?.routes ?? []}
							/>
						</Suspense>
					) : null}
				</Box>
			</Box>
			<Modal
				open={isMutating}
				sx={{ zIndex: (currentTheme) => currentTheme.zIndex.modal + 1 }}
			>
				<Box
					tabIndex={-1}
					role="status"
					aria-busy="true"
					sx={{
						position: 'absolute',
						inset: 0,
						display: 'grid',
						placeItems: 'center',
						color: 'common.white',
						outline: 0,
					}}
				>
					<CircularProgress color="inherit" aria-label={messages.processing} />
				</Box>
			</Modal>
		</ThemeProvider>
	);
}

function readStoredPageId(): PageId {
	const storedPageId = localStorage.getItem(pageStorageKey);
	return isPageId(storedPageId) ? storedPageId : 'overview';
}

function readStoredThemeMode(): AdminThemeMode {
	const storedThemeMode = localStorage.getItem(themeModeStorageKey);

	return storedThemeMode === 'light' ||
		storedThemeMode === 'dark' ||
		storedThemeMode === 'device'
		? storedThemeMode
		: 'device';
}
