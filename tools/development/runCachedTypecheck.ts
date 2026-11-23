import {
	parseValidationMode,
	runCachedValidation,
} from './runCachedValidation.ts';

process.exit(
	await runCachedValidation({
		mode: parseValidationMode(process.argv[2]),
		validationKey: 'typecheck',
		command: ['bun', 'run', 'typecheck'],
	}),
);
