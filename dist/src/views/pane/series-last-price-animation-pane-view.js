import { assert } from '../../helpers/assertions';
import { applyAlpha } from '../../helpers/color';
import { SeriesLastPriceAnimationRenderer } from '../../renderers/series-last-price-animation-renderer';
const animationStagesData = [
    {
        start: 0,
        end: 0.25 /* Constants.Stage1Period */,
        startRadius: 4 /* Constants.Stage1StartCircleRadius */,
        endRadius: 10 /* Constants.Stage1EndCircleRadius */,
        startFillAlpha: 0.25 /* Constants.Stage1StartFillAlpha */,
        endFillAlpha: 0 /* Constants.Stage1EndFillAlpha */,
        startStrokeAlpha: 0.4 /* Constants.Stage1StartStrokeAlpha */,
        endStrokeAlpha: 0.8 /* Constants.Stage1EndStrokeAlpha */,
    },
    {
        start: 0.25 /* Constants.Stage1Period */,
        end: 0.25 /* Constants.Stage1Period */ + 0.275 /* Constants.Stage2Period */,
        startRadius: 10 /* Constants.Stage2StartCircleRadius */,
        endRadius: 14 /* Constants.Stage2EndCircleRadius */,
        startFillAlpha: 0 /* Constants.Stage2StartFillAlpha */,
        endFillAlpha: 0 /* Constants.Stage2EndFillAlpha */,
        startStrokeAlpha: 0.8 /* Constants.Stage2StartStrokeAlpha */,
        endStrokeAlpha: 0 /* Constants.Stage2EndStrokeAlpha */,
    },
    {
        start: 0.25 /* Constants.Stage1Period */ + 0.275 /* Constants.Stage2Period */,
        end: 0.25 /* Constants.Stage1Period */ + 0.275 /* Constants.Stage2Period */ + 0.475 /* Constants.Stage3Period */,
        startRadius: 14 /* Constants.Stage3StartCircleRadius */,
        endRadius: 14 /* Constants.Stage3EndCircleRadius */,
        startFillAlpha: 0 /* Constants.Stage3StartFillAlpha */,
        endFillAlpha: 0 /* Constants.Stage3EndFillAlpha */,
        startStrokeAlpha: 0 /* Constants.Stage3StartStrokeAlpha */,
        endStrokeAlpha: 0 /* Constants.Stage3EndStrokeAlpha */,
    },
];
function color(seriesLineColor, stage, startAlpha, endAlpha) {
    const alpha = startAlpha + (endAlpha - startAlpha) * stage;
    return applyAlpha(seriesLineColor, alpha);
}
function radius(stage, startRadius, endRadius) {
    return startRadius + (endRadius - startRadius) * stage;
}
function animationData(durationSinceStart, lineColor) {
    const globalStage = (durationSinceStart % 2600 /* Constants.AnimationPeriod */) / 2600 /* Constants.AnimationPeriod */;
    let currentStageData;
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
export class SeriesLastPriceAnimationPaneView {
    constructor(series) {
        this._renderer = new SeriesLastPriceAnimationRenderer();
        this._invalidated = true;
        this._stageInvalidated = true;
        this._startTime = performance.now();
        this._endTime = this._startTime - 1;
        this._series = series;
    }
    onDataCleared() {
        this._endTime = this._startTime - 1;
        this.update();
    }
    onNewRealtimeDataReceived() {
        this.update();
        if (this._series.options().lastPriceAnimation === 2 /* LastPriceAnimationMode.OnDataUpdate */) {
            const now = performance.now();
            const timeToAnimationEnd = this._endTime - now;
            if (timeToAnimationEnd > 0) {
                if (timeToAnimationEnd < 2600 /* Constants.AnimationPeriod */ / 4) {
                    this._endTime += 2600 /* Constants.AnimationPeriod */;
                }
                return;
            }
            this._startTime = now;
            this._endTime = now + 2600 /* Constants.AnimationPeriod */;
        }
    }
    update() {
        this._invalidated = true;
    }
    invalidateStage() {
        this._stageInvalidated = true;
    }
    visible() {
        // center point is always visible if lastPriceAnimation is not LastPriceAnimationMode.Disabled
        return this._series.options().lastPriceAnimation !== 0 /* LastPriceAnimationMode.Disabled */;
    }
    animationActive() {
        switch (this._series.options().lastPriceAnimation) {
            case 0 /* LastPriceAnimationMode.Disabled */:
                return false;
            case 1 /* LastPriceAnimationMode.Continuous */:
                return true;
            case 2 /* LastPriceAnimationMode.OnDataUpdate */:
                return performance.now() <= this._endTime;
        }
    }
    renderer() {
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
            this._stageInvalidated = false;
        }
        else if (this._stageInvalidated) {
            this._updateRendererDataStage();
            this._stageInvalidated = false;
        }
        return this._renderer;
    }
    _updateImpl() {
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
        const lastValuePoint = {
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
    _updateRendererDataStage() {
        const rendererData = this._renderer.data();
        if (rendererData !== null) {
            const data = animationData(this._duration(), rendererData.seriesLineColor);
            rendererData.fillColor = data.fillColor;
            rendererData.strokeColor = data.strokeColor;
            rendererData.radius = data.radius;
        }
    }
    _duration() {
        return this.animationActive() ? performance.now() - this._startTime : 2600 /* Constants.AnimationPeriod */ - 1;
    }
}
