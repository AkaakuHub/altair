import { z } from 'zod';

export const storyBackgroundLabelSchema = z
	.string()
	.regex(/^story_bg_image_\d{3}$/u);
export const storyObjectLabelSchema = z
	.string()
	.regex(/^ppadv\d{3}_[a-z0-9_]+$/u);

export function isStoryBackgroundAssetLabel(label: string): boolean {
	return storyBackgroundLabelSchema.safeParse(label).success;
}

export function isStoryObjectAssetLabel(label: string): boolean {
	return storyObjectLabelSchema.safeParse(label).success;
}
