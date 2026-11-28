// ChartApi owns one TimeScaleApi for its lifetime and returns it from timeScale().
// An unregistered identity (for example, a separate library copy) falls back to
// remapping markers on each view update instead of trusting a cached generation.
const generations = new WeakMap<object, number>();

export function advanceTimeScalePointsGeneration(timeScale: object): void {
	generations.set(timeScale, (generations.get(timeScale) ?? 0) + 1);
}

export function timeScalePointsGeneration(timeScale: object): number | undefined {
	return generations.get(timeScale);
}
