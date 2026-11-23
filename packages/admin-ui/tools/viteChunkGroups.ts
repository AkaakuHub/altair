import type { Rolldown } from 'vite';
export function createUiCodeSplittingGroups(): Rolldown.CodeSplittingGroup[] {
	return [
		{
			name: 'react',
			test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
			priority: 3,
		},
		{
			name: 'mui',
			test: /node_modules[\\/](@mui|@emotion)[\\/]/,
			priority: 2,
		},
		{
			name: 'validation',
			test: /node_modules[\\/]zod[\\/]/,
			priority: 2,
		},
		{
			name: 'routing',
			test: /node_modules[\\/](react-router|react-router-dom)[\\/]/,
			priority: 2,
		},
		{
			name: 'vendor',
			test: /node_modules[\\/]/,
			priority: 1,
		},
	];
}
