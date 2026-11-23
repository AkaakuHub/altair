import { z } from 'zod';

export const unityPlatformSchema = z.enum(['android', 'ios']);
export type UnityPlatform = z.infer<typeof unityPlatformSchema>;
