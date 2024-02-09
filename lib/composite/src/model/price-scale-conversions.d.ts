import { PriceRangeImpl } from './price-range-impl';
export interface LogFormula {
    logicalOffset: number;
    coordOffset: number;
}
export declare function fromPercent(value: number, baseValue: number): number;
export declare function toPercent(value: number, baseValue: number): number;
export declare function toPercentRange(priceRange: PriceRangeImpl, baseValue: number): PriceRangeImpl;
export declare function fromIndexedTo100(value: number, baseValue: number): number;
export declare function toIndexedTo100(value: number, baseValue: number): number;
export declare function toIndexedTo100Range(priceRange: PriceRangeImpl, baseValue: number): PriceRangeImpl;
export declare function toLog(price: number, logFormula: LogFormula): number;
export declare function fromLog(logical: number, logFormula: LogFormula): number;
export declare function convertPriceRangeToLog(priceRange: PriceRangeImpl | null, logFormula: LogFormula): PriceRangeImpl | null;
export declare function canConvertPriceRangeFromLog(priceRange: PriceRangeImpl | null, logFormula: LogFormula): boolean;
export declare function convertPriceRangeFromLog(priceRange: PriceRangeImpl, logFormula: LogFormula): PriceRangeImpl;
export declare function convertPriceRangeFromLog(priceRange: null, logFormula: LogFormula): null;
export declare function convertPriceRangeFromLog(priceRange: PriceRangeImpl | null, logFormula: LogFormula): PriceRangeImpl | null;
export declare function logFormulaForPriceRange(range: PriceRangeImpl | null): LogFormula;
export declare function logFormulasAreSame(f1: LogFormula, f2: LogFormula): boolean;
