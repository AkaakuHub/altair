import { getNumberField } from './request-fields.ts';

export const readChapterCategoryRequest = (body: unknown) => ({
	categoryId: getNumberField(body, 'category_id'),
});
export const readChapterClaimRequest = (body: unknown) => ({
	currentPoint: getNumberField(body, 'current_point') ?? 0,
});
