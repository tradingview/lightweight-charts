;
function mergePaneInvalidation(beforeValue, newValue) {
    if (beforeValue === undefined) {
        return newValue;
    }
    const level = Math.max(beforeValue._internal_level, newValue._internal_level);
    const autoScale = beforeValue._internal_autoScale || newValue._internal_autoScale;
    return { _internal_level: level, _internal_autoScale: autoScale };
}
;
export class InvalidateMask {
    constructor(globalLevel) {
        this._private__invalidatedPanes = new Map();
        this._private__timeScaleInvalidations = [];
        this._private__globalLevel = globalLevel;
    }
    _internal_invalidatePane(paneIndex, invalidation) {
        const prevValue = this._private__invalidatedPanes.get(paneIndex);
        const newValue = mergePaneInvalidation(prevValue, invalidation);
        this._private__invalidatedPanes.set(paneIndex, newValue);
    }
    _internal_fullInvalidation() {
        return this._private__globalLevel;
    }
    _internal_invalidateForPane(paneIndex) {
        const paneInvalidation = this._private__invalidatedPanes.get(paneIndex);
        if (paneInvalidation === undefined) {
            return {
                _internal_level: this._private__globalLevel,
            };
        }
        return {
            _internal_level: Math.max(this._private__globalLevel, paneInvalidation._internal_level),
            _internal_autoScale: paneInvalidation._internal_autoScale,
        };
    }
    _internal_setFitContent() {
        this._internal_stopTimeScaleAnimation();
        // modifies both bar spacing and right offset
        this._private__timeScaleInvalidations = [{ _internal_type: 0 /* TimeScaleInvalidationType.FitContent */ }];
    }
    _internal_applyRange(range) {
        this._internal_stopTimeScaleAnimation();
        // modifies both bar spacing and right offset
        this._private__timeScaleInvalidations = [{ _internal_type: 1 /* TimeScaleInvalidationType.ApplyRange */, _internal_value: range }];
    }
    _internal_setTimeScaleAnimation(animation) {
        this._private__removeTimeScaleAnimation();
        this._private__timeScaleInvalidations.push({ _internal_type: 5 /* TimeScaleInvalidationType.Animation */, _internal_value: animation });
    }
    _internal_stopTimeScaleAnimation() {
        this._private__removeTimeScaleAnimation();
        this._private__timeScaleInvalidations.push({ _internal_type: 6 /* TimeScaleInvalidationType.StopAnimation */ });
    }
    _internal_resetTimeScale() {
        this._internal_stopTimeScaleAnimation();
        // modifies both bar spacing and right offset
        this._private__timeScaleInvalidations = [{ _internal_type: 4 /* TimeScaleInvalidationType.Reset */ }];
    }
    _internal_setBarSpacing(barSpacing) {
        this._internal_stopTimeScaleAnimation();
        this._private__timeScaleInvalidations.push({ _internal_type: 2 /* TimeScaleInvalidationType.ApplyBarSpacing */, _internal_value: barSpacing });
    }
    _internal_setRightOffset(offset) {
        this._internal_stopTimeScaleAnimation();
        this._private__timeScaleInvalidations.push({ _internal_type: 3 /* TimeScaleInvalidationType.ApplyRightOffset */, _internal_value: offset });
    }
    _internal_timeScaleInvalidations() {
        return this._private__timeScaleInvalidations;
    }
    _internal_merge(other) {
        for (const tsInvalidation of other._private__timeScaleInvalidations) {
            this._private__applyTimeScaleInvalidation(tsInvalidation);
        }
        this._private__globalLevel = Math.max(this._private__globalLevel, other._private__globalLevel);
        other._private__invalidatedPanes.forEach((invalidation, index) => {
            this._internal_invalidatePane(index, invalidation);
        });
    }
    static _internal_light() {
        return new InvalidateMask(2 /* InvalidationLevel.Light */);
    }
    static _internal_full() {
        return new InvalidateMask(3 /* InvalidationLevel.Full */);
    }
    _private__applyTimeScaleInvalidation(invalidation) {
        switch (invalidation._internal_type) {
            case 0 /* TimeScaleInvalidationType.FitContent */:
                this._internal_setFitContent();
                break;
            case 1 /* TimeScaleInvalidationType.ApplyRange */:
                this._internal_applyRange(invalidation._internal_value);
                break;
            case 2 /* TimeScaleInvalidationType.ApplyBarSpacing */:
                this._internal_setBarSpacing(invalidation._internal_value);
                break;
            case 3 /* TimeScaleInvalidationType.ApplyRightOffset */:
                this._internal_setRightOffset(invalidation._internal_value);
                break;
            case 4 /* TimeScaleInvalidationType.Reset */:
                this._internal_resetTimeScale();
                break;
            case 5 /* TimeScaleInvalidationType.Animation */:
                this._internal_setTimeScaleAnimation(invalidation._internal_value);
                break;
            case 6 /* TimeScaleInvalidationType.StopAnimation */:
                this._private__removeTimeScaleAnimation();
        }
    }
    _private__removeTimeScaleAnimation() {
        const index = this._private__timeScaleInvalidations.findIndex((inv) => inv._internal_type === 5 /* TimeScaleInvalidationType.Animation */);
        if (index !== -1) {
            this._private__timeScaleInvalidations.splice(index, 1);
        }
    }
}
