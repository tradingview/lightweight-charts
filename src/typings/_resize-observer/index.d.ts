// taken from https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/948
// generated from https://drafts.csswg.org/resize-observer/
// TODO: remove this file when PR will be merged and released with a new compiler version

interface ResizeObserverOptions {
	box?: ResizeObserverBoxOptions;
}

interface ResizeObserver {
	disconnect(): void;
	observe(target: Element, options?: ResizeObserverOptions): void;
	unobserve(target: Element): void;
}

declare var ResizeObserver: {
	prototype: ResizeObserver;
	new(callback: ResizeObserverCallback): ResizeObserver;
};

interface ResizeObserverEntry {
	readonly borderBoxSize: ReadonlyArray<ResizeObserverSize>;
	readonly contentBoxSize: ReadonlyArray<ResizeObserverSize>;
	readonly contentRect: DOMRectReadOnly;
	readonly target: Element;
}

declare var ResizeObserverEntry: {
	prototype: ResizeObserverEntry;
	new(): ResizeObserverEntry;
};

interface ResizeObserverSize {
	readonly blockSize: number;
	readonly inlineSize: number;
}

declare var ResizeObserverSize: {
	prototype: ResizeObserverSize;
	new(): ResizeObserverSize;
};

interface ResizeObserverCallback {
	(entries: ResizeObserverEntry[], observer: ResizeObserver): void;
}

type ResizeObserverBoxOptions = "border-box" | "content-box" | "device-pixel-content-box";
