const generations = new WeakMap<object, number>();

export function advanceTimeScalePointsGeneration(timeScale: object): void {
	generations.set(timeScale, (generations.get(timeScale) ?? 0) + 1);
}

export function timeScalePointsGeneration(timeScale: object): number | undefined {
	return generations.get(timeScale);
}
