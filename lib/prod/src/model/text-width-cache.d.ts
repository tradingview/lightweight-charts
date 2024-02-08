export type CanvasCtxLike = Pick<CanvasRenderingContext2D, 'measureText' | 'save' | 'restore' | 'textBaseline'>;
export declare class TextWidthCache {
    private readonly _maxSize;
    private _actualSize;
    private _usageTick;
    private _oldestTick;
    private _tick2Labels;
    private _cache;
    constructor(size?: number);
    reset(): void;
    measureText(ctx: CanvasCtxLike, text: string, optimizationReplacementRe?: RegExp): number;
    yMidCorrection(ctx: CanvasCtxLike, text: string, optimizationReplacementRe?: RegExp): number;
    private _getMetrics;
}
