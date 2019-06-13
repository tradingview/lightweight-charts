import { TimePointsRange } from '../model/time-data';

export const enum InvalidationLevel {
	None = 0,
	Cursor = 1,
	Light = 2,
	Full = 3,
}

export interface PaneInvalidation {
	level: InvalidationLevel;
	autoScale?: boolean;
}

function mergePaneInvalidation(beforeValue: PaneInvalidation | undefined, newValue: PaneInvalidation): PaneInvalidation {
	if (beforeValue === undefined) {
		return newValue;
	}
	const level = Math.max(beforeValue.level, newValue.level);
	const autoScale = beforeValue.autoScale || newValue.autoScale;
	return { level, autoScale };
}

export class InvalidateMask {
	private _invalidatedPanes: Map<number, PaneInvalidation> = new Map();
	private _globalLevel: InvalidationLevel;
	private _force: boolean = false;
	private _fitContent: boolean = false;
	private _targetTimeRange: TimePointsRange | null = null;

	public constructor(globalLevel: InvalidationLevel) {
		this._globalLevel = globalLevel;
	}

	public invalidatePane(paneIndex: number, invalidation: PaneInvalidation): void {
		const prevValue = this._invalidatedPanes.get(paneIndex);
		const newValue = mergePaneInvalidation(prevValue, invalidation);
		this._invalidatedPanes.set(paneIndex, newValue);
	}

	public invalidateAll(level: InvalidationLevel): void {
		this._globalLevel = Math.max(this._globalLevel, level);
	}

	public fullInvalidation(): InvalidationLevel {
		return this._globalLevel;
	}

	public invalidateForPane(paneIndex: number): PaneInvalidation {
		const paneInvalidation = this._invalidatedPanes.get(paneIndex);
		if (paneInvalidation === undefined) {
			return {
				level: this._globalLevel,
			};
		}
		return {
			level: Math.max(this._globalLevel, paneInvalidation.level),
			autoScale: paneInvalidation.autoScale,
		};
	}

	public setFitContent(): void {
		this._fitContent = true;
		this._targetTimeRange = null;
	}

	public getFitContent(): boolean {
		return this._fitContent;
	}

	public setTargetTimeRange(range: TimePointsRange): void {
		this._targetTimeRange = range;
		this._fitContent = false;
	}

	public getTargetTimeRange(): TimePointsRange | null {
		return this._targetTimeRange;
	}

	public merge(other: InvalidateMask): void {
		this._force = this._force || other._force;
		if (other._fitContent) {
			this.setFitContent();
		}
		if (other._targetTimeRange) {
			this.setTargetTimeRange(other._targetTimeRange);
		}
		this._globalLevel = Math.max(this._globalLevel, other._globalLevel);
		other._invalidatedPanes.forEach((invalidation: PaneInvalidation, index: number) => {
			this.invalidatePane(index, invalidation);
		});
	}
}
