import type { RuntimeResourceSelection } from '../../../../../src/application/runtime-switch/runtime-resource-selection-schema.ts';
export interface RuntimeSwitchJobLauncherPort {
	launch(selection: RuntimeResourceSelection): Promise<void>;
}
