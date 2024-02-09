"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesLastPriceAnimationPaneView = void 0;
const assertions_1 = require("../../helpers/assertions");
const color_1 = require("../../helpers/color");
const series_last_price_animation_renderer_1 = require("../../renderers/series-last-price-animation-renderer");
var Constants;
(function (Constants) {
    Constants[Constants["AnimationPeriod"] = 2600] = "AnimationPeriod";
    Constants[Constants["Stage1Period"] = 0.25] = "Stage1Period";
    Constants[Constants["Stage2Period"] = 0.275] = "Stage2Period";
    Constants[Constants["Stage3Period"] = 0.475] = "Stage3Period";
    Constants[Constants["Stage1StartCircleRadius"] = 4] = "Stage1StartCircleRadius";
    Constants[Constants["Stage1EndCircleRadius"] = 10] = "Stage1EndCircleRadius";
    Constants[Constants["Stage1StartFillAlpha"] = 0.25] = "Stage1StartFillAlpha";
    Constants[Constants["Stage1EndFillAlpha"] = 0] = "Stage1EndFillAlpha";
    Constants[Constants["Stage1StartStrokeAlpha"] = 0.4] = "Stage1StartStrokeAlpha";
    Constants[Constants["Stage1EndStrokeAlpha"] = 0.8] = "Stage1EndStrokeAlpha";
    Constants[Constants["Stage2StartCircleRadius"] = 10] = "Stage2StartCircleRadius";
    Constants[Constants["Stage2EndCircleRadius"] = 14] = "Stage2EndCircleRadius";
    Constants[Constants["Stage2StartFillAlpha"] = 0] = "Stage2StartFillAlpha";
    Constants[Constants["Stage2EndFillAlpha"] = 0] = "Stage2EndFillAlpha";
    Constants[Constants["Stage2StartStrokeAlpha"] = 0.8] = "Stage2StartStrokeAlpha";
    Constants[Constants["Stage2EndStrokeAlpha"] = 0] = "Stage2EndStrokeAlpha";
    Constants[Constants["Stage3StartCircleRadius"] = 14] = "Stage3StartCircleRadius";
    Constants[Constants["Stage3EndCircleRadius"] = 14] = "Stage3EndCircleRadius";
    Constants[Constants["Stage3StartFillAlpha"] = 0] = "Stage3StartFillAlpha";
    Constants[Constants["Stage3EndFillAlpha"] = 0] = "Stage3EndFillAlpha";
    Constants[Constants["Stage3StartStrokeAlpha"] = 0] = "Stage3StartStrokeAlpha";
    Constants[Constants["Stage3EndStrokeAlpha"] = 0] = "Stage3EndStrokeAlpha";
})(Constants || (Constants = {}));
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
    return (0, color_1.applyAlpha)(seriesLineColor, alpha);
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
    (0, assertions_1.assert)(currentStageData !== undefined, 'Last price animation internal logic error');
    const subStage = (globalStage - currentStageData.start) / (currentStageData.end - currentStageData.start);
    return {
        fillColor: color(lineColor, subStage, currentStageData.startFillAlpha, currentStageData.endFillAlpha),
        strokeColor: color(lineColor, subStage, currentStageData.startStrokeAlpha, currentStageData.endStrokeAlpha),
        radius: radius(subStage, currentStageData.startRadius, currentStageData.endRadius),
    };
}
class SeriesLastPriceAnimationPaneView {
    constructor(series) {
        this._renderer = new series_last_price_animation_renderer_1.SeriesLastPriceAnimationRenderer();
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
exports.SeriesLastPriceAnimationPaneView = SeriesLastPriceAnimationPaneView;
