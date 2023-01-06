import { assert } from '../../helpers/assertions';
import { applyAlpha } from '../../helpers/color';

import { Point } from '../../model/point';
import { Series } from '../../model/series';
import { LastPriceAnimationMode } from '../../model/series-options';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { SeriesLastPriceAnimationRenderer } from '../../renderers/series-last-price-animation-renderer';

import { IUpdatablePaneView } from './iupdatable-pane-view';

const enum Constants {
	AnimationPeriod = 2600,

	Stage1Period = 0.25,
	Stage2Period = 0.275,
	Stage3Period = 0.475,

	Stage1StartCircleRadius = 4,
	Stage1EndCircleRadius = 10,
	Stage1StartFillAlpha = 0.25,
	Stage1EndFillAlpha = 0,
	Stage1StartStrokeAlpha = 0.4,
	Stage1EndStrokeAlpha = 0.8,

	Stage2StartCircleRadius = Stage1EndCircleRadius,
	Stage2EndCircleRadius = 14,
	Stage2StartFillAlpha = Stage1EndFillAlpha,
	Stage2EndFillAlpha = 0,
	Stage2StartStrokeAlpha = Stage1EndStrokeAlpha,
	Stage2EndStrokeAlpha = 0,

	Stage3StartCircleRadius = Stage2EndCircleRadius,
	Stage3EndCircleRadius = Stage2EndCircleRadius,
	Stage3StartFillAlpha = Stage2EndFillAlpha,
	Stage3EndFillAlpha = Stage2EndFillAlpha,
	Stage3StartStrokeAlpha = Stage2EndStrokeAlpha,
	Stage3EndStrokeAlpha = Stage2EndStrokeAlpha,
}

interface AnimationStageData {
	start: number;
	end: number;
	startRadius: number;
	endRadius: number;
	startFillAlpha: number;
	endFillAlpha: number;
	startStrokeAlpha: number;
	endStrokeAlpha: number;
}

const animationStagesData: AnimationStageData[] = [
	{
		start: 0,
		end: Constants.Stage1Period,
		startRadius: Constants.Stage1StartCircleRadius,
		endRadius: Constants.Stage1EndCircleRadius,
		startFillAlpha: Constants.Stage1StartFillAlpha,
		endFillAlpha: Constants.Stage1EndFillAlpha,
		startStrokeAlpha: Constants.Stage1StartStrokeAlpha,
		endStrokeAlpha: Constants.Stage1EndStrokeAlpha,
	},
	{
		start: Constants.Stage1Period,
		end: Constants.Stage1Period + Constants.Stage2Period,
		startRadius: Constants.Stage2StartCircleRadius,
		endRadius: Constants.Stage2EndCircleRadius,
		startFillAlpha: Constants.Stage2StartFillAlpha,
		endFillAlpha: Constants.Stage2EndFillAlpha,
		startStrokeAlpha: Constants.Stage2StartStrokeAlpha,
		endStrokeAlpha: Constants.Stage2EndStrokeAlpha,
	},
	{
		start: Constants.Stage1Period + Constants.Stage2Period,
		end: Constants.Stage1Period + Constants.Stage2Period + Constants.Stage3Period,
		startRadius: Constants.Stage3StartCircleRadius,
		endRadius: Constants.Stage3EndCircleRadius,
		startFillAlpha: Constants.Stage3StartFillAlpha,
		endFillAlpha: Constants.Stage3EndFillAlpha,
		startStrokeAlpha: Constants.Stage3StartStrokeAlpha,
		endStrokeAlpha: Constants.Stage3EndStrokeAlpha,
	},
];

interface AnimationData {
	radius: number;
	fillColor: string;
	strokeColor: string;
}

function color(seriesLineColor: string, stage: number, startAlpha: number, endAlpha: number): string {
	const alpha = startAlpha + (endAlpha - startAlpha) * stage;
	return applyAlpha(seriesLineColor, alpha);
}

function radius(stage: number, startRadius: number, endRadius: number): number {
	return startRadius + (endRadius - startRadius) * stage;
}

function animationData(durationSinceStart: number, lineColor: string): AnimationData {
	const globalStage = (durationSinceStart % Constants.AnimationPeriod) / Constants.AnimationPeriod;

	let currentStageData: AnimationStageData | undefined;

	for (const stageData of animationStagesData) {
		if (globalStage >= stageData.start && globalStage <= stageData.end) {
			currentStageData = stageData;
			break;
		}
	}

	assert(currentStageData !== undefined, 'Last price animation internal logic error');

	const subStage = (globalStage - currentStageData.start) / (currentStageData.end - currentStageData.start);
	return {
		fillColor: color(lineColor, subStage, currentStageData.startFillAlpha, currentStageData.endFillAlpha),
		strokeColor: color(lineColor, subStage, currentStageData.startStrokeAlpha, currentStageData.endStrokeAlpha),
		radius: radius(subStage, currentStageData.startRadius, currentStageData.endRadius),
	};
}

export class SeriesLastPriceAnimationPaneView implements IUpdatablePaneView {
	private readonly _series: Series<'Area'> | Series<'Line'> | Series<'Baseline'>;
	private readonly _renderer: SeriesLastPriceAnimationRenderer = new SeriesLastPriceAnimationRenderer();
	private _invalidated: boolean = true;
	private _stageInvalidated: boolean = true;

	private _startTime: number = performance.now();
	private _endTime: number = this._startTime - 1;

	public constructor(series: Series<'Area'> | Series<'Line'> | Series<'Baseline'>) {
		this._series = series;
	}

	public onDataCleared(): void {
		this._endTime = this._startTime - 1;
		this.update();
	}

	public onNewRealtimeDataReceived(): void {
		this.update();
		if (this._series.options().lastPriceAnimation === LastPriceAnimationMode.OnDataUpdate) {
			const now = performance.now();
			const timeToAnimationEnd = this._endTime - now;
			if (timeToAnimationEnd > 0) {
				if (timeToAnimationEnd < Constants.AnimationPeriod / 4) {
					this._endTime += Constants.AnimationPeriod;
				}
				return;
			}
			this._startTime = now;
			this._endTime = now + Constants.AnimationPeriod;
		}
	}

	public update(): void {
		this._invalidated = true;
	}

	public invalidateStage(): void {
		this._stageInvalidated = true;
	}

	public visible(): boolean {
		// center point is always visible if lastPriceAnimation is not LastPriceAnimationMode.Disabled
		return this._series.options().lastPriceAnimation !== LastPriceAnimationMode.Disabled;
	}

	public animationActive(): boolean {
		switch (this._series.options().lastPriceAnimation) {
			case LastPriceAnimationMode.Disabled:
				return false;
			case LastPriceAnimationMode.Continuous:
				return true;
			case LastPriceAnimationMode.OnDataUpdate:
				return performance.now() <= this._endTime;
		}
	}

	public renderer(): IPaneRenderer | null {
		if (this._invalidated) {
			this._updateImpl();
			this._invalidated = false;
			this._stageInvalidated = false;
		} else if (this._stageInvalidated) {
			this._updateRendererDataStage();
			this._stageInvalidated = false;
		}

		return this._renderer;
	}

	private _updateImpl(): void {
		this._renderer.setData(null);

		const timeScale = this._series.model().timeScale();
		const visibleRange = timeScale.visibleStrictRange();
		const firstValue = this._series.firstValue();
		if (visibleRange === null || firstValue === null) {
			return;
		}

		const lastValue = this._series.lastValueData(true);
		if (lastValue.noData || !visibleRange.contains(lastValue.index)) {
			return;
		}

		const lastValuePoint: Point = {
			x: timeScale.indexToCoordinate(lastValue.index),
			y: this._series.priceScale().priceToCoordinate(lastValue.price, firstValue.value),
		};

		const seriesLineColor = lastValue.color;
		const seriesLineWidth = this._series.options().lineWidth;

		const data = animationData(this._duration(), seriesLineColor);

		this._renderer.setData({
			seriesLineColor,
			seriesLineWidth,
			fillColor: data.fillColor,
			strokeColor: data.strokeColor,
			radius: data.radius,
			center: lastValuePoint,
		});
	}

	private _updateRendererDataStage(): void {
		const rendererData = this._renderer.data();
		if (rendererData !== null) {
			const data = animationData(this._duration(), rendererData.seriesLineColor);
			rendererData.fillColor = data.fillColor;
			rendererData.strokeColor = data.strokeColor;
			rendererData.radius = data.radius;
		}
	}

	private _duration(): number {
		return this.animationActive() ? performance.now() - this._startTime : Constants.AnimationPeriod - 1;
	}
}
