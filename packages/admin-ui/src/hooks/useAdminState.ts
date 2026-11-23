import {
	type AdminStateResponse,
	parseAdminStateResponse,
} from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { fetchAdminState, subscribeAdminMutation } from '../api.ts';
import type { PageId } from '../ui/app-pages.tsx';

type AdminStateView<Response extends AdminStateResponse> = {
	data: Response | null;
	error: string | null;
	isLoading: boolean;
	isMutating: boolean;
	reload: () => Promise<void>;
};

export function useAdminState(
	pageId: PageId | null,
): AdminStateView<AdminStateResponse> {
	return useParsedAdminState(pageId, parseAdminStateResponse);
}

export function useParsedAdminState<Response extends AdminStateResponse>(
	pageId: string | null,
	parseResponse: (value: unknown) => Response,
): AdminStateView<Response> {
	const [loaded, setLoaded] = useState<Readonly<{
		pageId: string;
		data: Response;
	}> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isMutating, setIsMutating] = useState(false);
	const request = useRef<AbortController | null>(null);
	const currentPage = useRef(pageId);
	useLayoutEffect(() => {
		currentPage.current = pageId;
	}, [pageId]);

	const loadPage = useCallback(
		async (requestedPage: string) => {
			request.current?.abort();
			const controller = new AbortController();
			request.current = controller;
			setIsLoading(true);
			setError(null);
			try {
				const next = parseResponse(
					await fetchAdminState(requestedPage, controller.signal),
				);
				if (!controller.signal.aborted && currentPage.current === requestedPage)
					setLoaded({ pageId: requestedPage, data: next });
			} catch (caught) {
				if (!controller.signal.aborted && currentPage.current === requestedPage)
					setError(caught instanceof Error ? caught.message : String(caught));
			} finally {
				if (!controller.signal.aborted && currentPage.current === requestedPage)
					setIsLoading(false);
			}
		},
		[parseResponse],
	);
	const reload = useCallback(() => {
		const selectedPage = currentPage.current;
		return selectedPage === null ? Promise.resolve() : loadPage(selectedPage);
	}, [loadPage]);

	useEffect(() => {
		if (pageId === null) {
			setIsLoading(false);
			setError(null);
			return;
		}
		void loadPage(pageId);
		return () => request.current?.abort();
	}, [pageId, loadPage]);

	useEffect(() => subscribeAdminMutation(setIsMutating), []);

	return {
		data: loaded?.pageId === pageId ? loaded.data : null,
		error: pageId === null ? null : error,
		isLoading: pageId !== null && isLoading,
		isMutating: pageId !== null && isMutating,
		reload,
	};
}
