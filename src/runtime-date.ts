import type { ServerRuntimeConfig } from './config.ts';
import {
	jstGameDate,
	nextJstGameDateBoundaryIsoDateTime,
} from './master-data/master-time.ts';

export type RuntimeDateService = {
	currentDate: () => Date;
	currentGameDate: () => string;
	nextGameDateBoundaryIsoDateTime: () => string;
};

export function createRuntimeDateService(
	config: Pick<ServerRuntimeConfig, 'currentDate'>,
): RuntimeDateService {
	return {
		currentDate: () => config.currentDate(),
		currentGameDate: () => jstGameDate(config.currentDate()),
		nextGameDateBoundaryIsoDateTime: () =>
			nextJstGameDateBoundaryIsoDateTime(config.currentDate()),
	};
}
