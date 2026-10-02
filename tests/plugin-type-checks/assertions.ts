// Unlike assignment alone, this also catches accidental widening to any.
export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
	(<T>() => T extends B ? 1 : 2) ? true : false;
export declare function expectTrue<T extends true>(): void;
