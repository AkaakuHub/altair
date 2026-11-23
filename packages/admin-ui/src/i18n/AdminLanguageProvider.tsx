import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	type AdminLocale,
	type AdminMessages,
	adminLocales,
	resolveAdminLocale,
} from './messages.ts';

const languageStorageKey = 'kinmokusei-admin-language';
const AdminLanguageContext = createContext<Readonly<{
	locale: AdminLocale;
	messages: AdminMessages;
	setLocale(locale: AdminLocale): void;
}> | null>(null);

export function AdminLanguageProvider({
	children,
}: Readonly<{ children: ReactNode }>): React.ReactElement {
	const [locale, setLocale] = useState(() =>
		resolveAdminLocale(
			localStorage.getItem(languageStorageKey),
			navigator.languages,
		),
	);
	useEffect(() => {
		localStorage.setItem(languageStorageKey, locale);
		document.documentElement.lang = locale;
	}, [locale]);
	const value = useMemo(
		() => ({ locale, setLocale, messages: adminLocales[locale].messages }),
		[locale],
	);
	return <AdminLanguageContext value={value}>{children}</AdminLanguageContext>;
}

export function useAdminLanguage() {
	const value = useContext(AdminLanguageContext);
	if (value === null) throw new Error('Admin language provider is missing');
	return value;
}
