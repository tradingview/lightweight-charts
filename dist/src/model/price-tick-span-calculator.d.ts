export declare class PriceTickSpanCalculator {
    private readonly _base;
    private readonly _integralDividers;
    private readonly _fractionalDividers;
    constructor(base: number, integralDividers: number[]);
    tickSpan(high: number, low: number, maxTickSpan: number): number;
}
