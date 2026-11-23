import { type ReactElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

export function mountAdminApp(element: ReactElement): void {
	const root = document.getElementById('root');
	if (root === null) throw new Error('root element not found');
	const router = createBrowserRouter([{ path: '*', element }], {
		basename: '/admin',
	});
	createRoot(root).render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	);
}
