export interface GpuInferenceRuntimeController {
	isRunning(): Promise<boolean>;
	isHealthy(): Promise<boolean>;
	start(): Promise<void>;
	stop(): Promise<void>;
}

export type GpuInferenceRuntimeStatus<ServiceName extends string> = Readonly<{
	service: ServiceName;
	running: boolean;
	healthy: boolean;
}>;

export class GpuInferenceRuntimeService<ServiceName extends string> {
	constructor(
		private readonly serviceName: ServiceName,
		private readonly controller: GpuInferenceRuntimeController,
		private readonly notReadyMessage: string,
	) {
		if (serviceName.length === 0) {
			throw new Error('GPU inference service name is required');
		}
	}

	async status(): Promise<GpuInferenceRuntimeStatus<ServiceName>> {
		const running = await this.controller.isRunning();
		return {
			service: this.serviceName,
			running,
			healthy: running ? await this.controller.isHealthy() : false,
		};
	}

	async start(): Promise<GpuInferenceRuntimeStatus<ServiceName>> {
		if (!(await this.controller.isRunning())) await this.controller.start();
		return this.status();
	}

	async stop(): Promise<GpuInferenceRuntimeStatus<ServiceName>> {
		if (await this.controller.isRunning()) await this.controller.stop();
		return this.status();
	}

	async ensureReady(): Promise<void> {
		const status = await this.status();
		if (status.healthy) return;
		if (!status.running) {
			await this.controller.start();
			if (await this.controller.isHealthy()) return;
		}
		throw new Error(this.notReadyMessage);
	}
}
