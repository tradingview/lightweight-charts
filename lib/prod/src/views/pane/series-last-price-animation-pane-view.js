import { assert } from '../../helpers/assertions';
import { applyAlpha } from '../../helpers/color';
import { SeriesLastPriceAnimationRenderer } from '../../renderers/series-last-price-animation-renderer';
;
const animationStagesData = [
    {
        _internal_start: 0,
        _internal_end: 0.25 /* Constants.Stage1Period */,
        _internal_startRadius: 4 /* Constants.Stage1StartCircleRadius */,
        _internal_endRadius: 10 /* Constants.Stage1EndCircleRadius */,
        _internal_startFillAlpha: 0.25 /* Constants.Stage1StartFillAlpha */,
        _internal_endFillAlpha: 0 /* Constants.Stage1EndFillAlpha */,
        _internal_startStrokeAlpha: 0.4 /* Constants.Stage1StartStrokeAlpha */,
        _internal_endStrokeAlpha: 0.8 /* Constants.Stage1EndStrokeAlpha */,
    },
    {
        _internal_start: 0.25 /* Constants.Stage1Period */,
        _internal_end: 0.25 /* Constants.Stage1Period */ + 0.275 /* Constants.Stage2Period */,
        _internal_startRadius: 10 /* Constants.Stage2StartCircleRadius */,
        _internal_endRadius: 14 /* Constants.Stage2EndCircleRadius */,
        _internal_startFillAlpha: 0 /* Constants.Stage2StartFillAlpha */,
        _internal_endFillAlpha: 0 /* Constants.Stage2EndFillAlpha */,
        _internal_startStrokeAlpha: 0.8 /* Constants.Stage2StartStrokeAlpha */,
        _internal_endStrokeAlpha: 0 /* Constants.Stage2EndStrokeAlpha */,
    },
    {
        _internal_start: 0.25 /* Constants.Stage1Period */ + 0.275 /* Constants.Stage2Period */,
        _internal_end: 0.25 /* Constants.Stage1Period */ + 0.275 /* Constants.Stage2Period */ + 0.475 /* Constants.Stage3Period */,
        _internal_startRadius: 14 /* Constants.Stage3StartCircleRadius */,
        _internal_endRadius: 14 /* Constants.Stage3EndCircleRadius */,
        _internal_startFillAlpha: 0 /* Constants.Stage3StartFillAlpha */,
        _internal_endFillAlpha: 0 /* Constants.Stage3EndFillAlpha */,
        _internal_startStrokeAlpha: 0 /* Constants.Stage3StartStrokeAlpha */,
        _internal_endStrokeAlpha: 0 /* Constants.Stage3EndStrokeAlpha */,
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
        if (globalStage >= stageData._internal_start && globalStage <= stageData._internal_end) {
            currentStageData = stageData;
            break;
        }
    }
    assert(currentStageData !== undefined, 'Last price animation internal logic error');
    const subStage = (globalStage - currentStageData._internal_start) / (currentStageData._internal_end - currentStageData._internal_start);
    return {
        _internal_fillColor: color(lineColor, subStage, currentStageData._internal_startFillAlpha, currentStageData._internal_endFillAlpha),
        _internal_strokeColor: color(lineColor, subStage, currentStageData._internal_startStrokeAlpha, currentStageData._internal_endStrokeAlpha),
        _internal_radius: radius(subStage, currentStageData._internal_startRadius, currentStageData._internal_endRadius),
    };
}
export class SeriesLastPriceAnimationPaneView {
    constructor(series) {
        this._private__renderer = new SeriesLastPriceAnimationRenderer();
        this._private__invalidated = true;
        this._private__stageInvalidated = true;
        this._private__startTime = performance.now();
        this._private__endTime = this._private__startTime - 1;
        this._private__series = series;
    }
    _internal_onDataCleared() {
        this._private__endTime = this._private__startTime - 1;
        this._internal_update();
    }
    _internal_onNewRealtimeDataReceived() {
        this._internal_update();
        if (this._private__series._internal_options().lastPriceAnimation === 2 /* LastPriceAnimationMode.OnDataUpdate */) {
            const now = performance.now();
            const timeToAnimationEnd = this._private__endTime - now;
            if (timeToAnimationEnd > 0) {
                if (timeToAnimationEnd < 2600 /* Constants.AnimationPeriod */ / 4) {
                    this._private__endTime += 2600 /* Constants.AnimationPeriod */;
                }
                return;
            }
            this._private__startTime = now;
            this._private__endTime = now + 2600 /* Constants.AnimationPeriod */;
        }
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_invalidateStage() {
        this._private__stageInvalidated = true;
    }
    _internal_visible() {
        // center point is always visible if lastPriceAnimation is not LastPriceAnimationMode.Disabled
        return this._private__series._internal_options().lastPriceAnimation !== 0 /* LastPriceAnimationMode.Disabled */;
    }
    _internal_animationActive() {
        switch (this._private__series._internal_options().lastPriceAnimation) {
            case 0 /* LastPriceAnimationMode.Disabled */:
                return false;
            case 1 /* LastPriceAnimationMode.Continuous */:
                return true;
            case 2 /* LastPriceAnimationMode.OnDataUpdate */:
                return performance.now() <= this._private__endTime;
        }
    }
    _internal_renderer() {
        if (this._private__invalidated) {
            this._private__updateImpl();
            this._private__invalidated = false;
            this._private__stageInvalidated = false;
        }
        else if (this._private__stageInvalidated) {
            this._private__updateRendererDataStage();
            this._private__stageInvalidated = false;
        }
        return this._private__renderer;
    }
    _private__updateImpl() {
        this._private__renderer._internal_setData(null);
        const timeScale = this._private__series._internal_model()._internal_timeScale();
        const visibleRange = timeScale._internal_visibleStrictRange();
        const firstValue = this._private__series._internal_firstValue();
        if (visibleRange === null || firstValue === null) {
            return;
        }
        const lastValue = this._private__series._internal_lastValueData(true);
        if (lastValue._internal_noData || !visibleRange._internal_contains(lastValue._internal_index)) {
            return;
        }
        const lastValuePoint = {
            x: timeScale._internal_indexToCoordinate(lastValue._internal_index),
            y: this._private__series._internal_priceScale()._internal_priceToCoordinate(lastValue._internal_price, firstValue._internal_value),
        };
        const seriesLineColor = lastValue._internal_color;
        const seriesLineWidth = this._private__series._internal_options().lineWidth;
        const data = animationData(this._private__duration(), seriesLineColor);
        this._private__renderer._internal_setData({
            _internal_seriesLineColor: seriesLineColor,
            _internal_seriesLineWidth: seriesLineWidth,
            _internal_fillColor: data._internal_fillColor,
            _internal_strokeColor: data._internal_strokeColor,
            _internal_radius: data._internal_radius,
            _internal_center: lastValuePoint,
        });
    }
    _private__updateRendererDataStage() {
        const rendererData = this._private__renderer._internal_data();
        if (rendererData !== null) {
            const data = animationData(this._private__duration(), rendererData._internal_seriesLineColor);
            rendererData._internal_fillColor = data._internal_fillColor;
            rendererData._internal_strokeColor = data._internal_strokeColor;
            rendererData._internal_radius = data._internal_radius;
        }
    }
    _private__duration() {
        return this._internal_animationActive() ? performance.now() - this._private__startTime : 2600 /* Constants.AnimationPeriod */ - 1;
    }
}
