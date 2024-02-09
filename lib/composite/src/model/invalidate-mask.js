"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidateMask = exports.TimeScaleInvalidationType = exports.InvalidationLevel = void 0;
var InvalidationLevel;
(function (InvalidationLevel) {
    InvalidationLevel[InvalidationLevel["None"] = 0] = "None";
    InvalidationLevel[InvalidationLevel["Cursor"] = 1] = "Cursor";
    InvalidationLevel[InvalidationLevel["Light"] = 2] = "Light";
    InvalidationLevel[InvalidationLevel["Full"] = 3] = "Full";
})(InvalidationLevel = exports.InvalidationLevel || (exports.InvalidationLevel = {}));
function mergePaneInvalidation(beforeValue, newValue) {
    if (beforeValue === undefined) {
        return newValue;
    }
    const level = Math.max(beforeValue.level, newValue.level);
    const autoScale = beforeValue.autoScale || newValue.autoScale;
    return { level, autoScale };
}
var TimeScaleInvalidationType;
(function (TimeScaleInvalidationType) {
    TimeScaleInvalidationType[TimeScaleInvalidationType["FitContent"] = 0] = "FitContent";
    TimeScaleInvalidationType[TimeScaleInvalidationType["ApplyRange"] = 1] = "ApplyRange";
    TimeScaleInvalidationType[TimeScaleInvalidationType["ApplyBarSpacing"] = 2] = "ApplyBarSpacing";
    TimeScaleInvalidationType[TimeScaleInvalidationType["ApplyRightOffset"] = 3] = "ApplyRightOffset";
    TimeScaleInvalidationType[TimeScaleInvalidationType["Reset"] = 4] = "Reset";
    TimeScaleInvalidationType[TimeScaleInvalidationType["Animation"] = 5] = "Animation";
    TimeScaleInvalidationType[TimeScaleInvalidationType["StopAnimation"] = 6] = "StopAnimation";
})(TimeScaleInvalidationType = exports.TimeScaleInvalidationType || (exports.TimeScaleInvalidationType = {}));
class InvalidateMask {
    constructor(globalLevel) {
        this._invalidatedPanes = new Map();
        this._timeScaleInvalidations = [];
        this._globalLevel = globalLevel;
    }
    invalidatePane(paneIndex, invalidation) {
        const prevValue = this._invalidatedPanes.get(paneIndex);
        const newValue = mergePaneInvalidation(prevValue, invalidation);
        this._invalidatedPanes.set(paneIndex, newValue);
    }
    fullInvalidation() {
        return this._globalLevel;
    }
    invalidateForPane(paneIndex) {
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
    setFitContent() {
        this.stopTimeScaleAnimation();
        // modifies both bar spacing and right offset
        this._timeScaleInvalidations = [{ type: 0 /* TimeScaleInvalidationType.FitContent */ }];
    }
    applyRange(range) {
        this.stopTimeScaleAnimation();
        // modifies both bar spacing and right offset
        this._timeScaleInvalidations = [{ type: 1 /* TimeScaleInvalidationType.ApplyRange */, value: range }];
    }
    setTimeScaleAnimation(animation) {
        this._removeTimeScaleAnimation();
        this._timeScaleInvalidations.push({ type: 5 /* TimeScaleInvalidationType.Animation */, value: animation });
    }
    stopTimeScaleAnimation() {
        this._removeTimeScaleAnimation();
        this._timeScaleInvalidations.push({ type: 6 /* TimeScaleInvalidationType.StopAnimation */ });
    }
    resetTimeScale() {
        this.stopTimeScaleAnimation();
        // modifies both bar spacing and right offset
        this._timeScaleInvalidations = [{ type: 4 /* TimeScaleInvalidationType.Reset */ }];
    }
    setBarSpacing(barSpacing) {
        this.stopTimeScaleAnimation();
        this._timeScaleInvalidations.push({ type: 2 /* TimeScaleInvalidationType.ApplyBarSpacing */, value: barSpacing });
    }
    setRightOffset(offset) {
        this.stopTimeScaleAnimation();
        this._timeScaleInvalidations.push({ type: 3 /* TimeScaleInvalidationType.ApplyRightOffset */, value: offset });
    }
    timeScaleInvalidations() {
        return this._timeScaleInvalidations;
    }
    merge(other) {
        for (const tsInvalidation of other._timeScaleInvalidations) {
            this._applyTimeScaleInvalidation(tsInvalidation);
        }
        this._globalLevel = Math.max(this._globalLevel, other._globalLevel);
        other._invalidatedPanes.forEach((invalidation, index) => {
            this.invalidatePane(index, invalidation);
        });
    }
    static light() {
        return new InvalidateMask(2 /* InvalidationLevel.Light */);
    }
    static full() {
        return new InvalidateMask(3 /* InvalidationLevel.Full */);
    }
    _applyTimeScaleInvalidation(invalidation) {
        switch (invalidation.type) {
            case 0 /* TimeScaleInvalidationType.FitContent */:
                this.setFitContent();
                break;
            case 1 /* TimeScaleInvalidationType.ApplyRange */:
                this.applyRange(invalidation.value);
                break;
            case 2 /* TimeScaleInvalidationType.ApplyBarSpacing */:
                this.setBarSpacing(invalidation.value);
                break;
            case 3 /* TimeScaleInvalidationType.ApplyRightOffset */:
                this.setRightOffset(invalidation.value);
                break;
            case 4 /* TimeScaleInvalidationType.Reset */:
                this.resetTimeScale();
                break;
            case 5 /* TimeScaleInvalidationType.Animation */:
                this.setTimeScaleAnimation(invalidation.value);
                break;
            case 6 /* TimeScaleInvalidationType.StopAnimation */:
                this._removeTimeScaleAnimation();
        }
    }
    _removeTimeScaleAnimation() {
        const index = this._timeScaleInvalidations.findIndex((inv) => inv.type === 5 /* TimeScaleInvalidationType.Animation */);
        if (index !== -1) {
            this._timeScaleInvalidations.splice(index, 1);
        }
    }
}
exports.InvalidateMask = InvalidateMask;
