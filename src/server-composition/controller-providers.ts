export function createKeyedControllerProvider<Key, Input, Controller>(
	createController: (key: Key, input: Input) => Controller,
): (key: Key, input: Input) => Controller {
	const controllers = new Map<Key, Controller>();
	return (key, input) => {
		const existing = controllers.get(key);
		if (existing !== undefined) {
			return existing;
		}
		const controller = createController(key, input);
		controllers.set(key, controller);
		return controller;
	};
}

export function createWeakControllerProvider<Key extends WeakKey, Controller>(
	createController: (key: Key) => Controller,
): (key: Key) => Controller {
	const controllers = new WeakMap<Key, Controller>();
	return (key) => {
		const existing = controllers.get(key);
		if (existing !== undefined) {
			return existing;
		}
		const controller = createController(key);
		controllers.set(key, controller);
		return controller;
	};
}
