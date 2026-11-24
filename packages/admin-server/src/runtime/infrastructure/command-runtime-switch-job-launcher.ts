import { dirname } from 'node:path';
import { resolveRuntimeResourceSelection } from '../../../../../src/application/runtime-switch/runtime-resource-selection.ts';
import type { RuntimeResourceSelection } from '../../../../../src/application/runtime-switch/runtime-resource-selection-schema.ts';
import type { RuntimeSwitchJobLauncherPort } from '../application/runtime-switch-job-launcher-port.ts';

export class CommandRuntimeSwitchJobLauncher
	implements RuntimeSwitchJobLauncherPort
{
	constructor(
		private readonly config: Readonly<{
			activeMasterDatabasePath: string;
			command: readonly [string, ...string[]];
		}>,
	) {}

	async launch(selection: RuntimeResourceSelection): Promise<void> {
		await resolveRuntimeResourceSelection(
			dirname(this.config.activeMasterDatabasePath),
			selection,
		);
		const child = Bun.spawn(
			[...this.config.command, '--selection', JSON.stringify(selection)],
			{
				stdin: 'ignore',
				stdout: 'ignore',
				stderr: 'inherit',
			},
		);
		if ((await child.exited) !== 0)
			throw new Error('runtime switch job could not be started');
	}
}
