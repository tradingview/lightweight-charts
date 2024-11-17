export type BoundComparatorType<TArrayElementType, TValueType> = (a: TArrayElementType, b: TValueType) => boolean;
type BoundCompareFunctionDefinition = <TArrayElementType, TValueType>(arr: readonly TArrayElementType[], value: TValueType, compare: BoundComparatorType<TArrayElementType, TValueType>, start?: number, to?: number) => number;
export declare const lowerBound: BoundCompareFunctionDefinition;
export declare const upperBound: BoundCompareFunctionDefinition;
export {};
