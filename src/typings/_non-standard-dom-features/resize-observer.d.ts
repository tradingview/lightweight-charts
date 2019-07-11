// https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
// https://drafts.csswg.org/resize-observer/#resize-observer-interface

// tslint:disable:callable-types

/**
 * This callback delivers ResizeObserver's notifications. It is invoked by a
 * broadcast active observations algorithm.
 */
interface ResizeObserverCallback {
	(entries: ReadonlyArray<ResizeObserverEntry>, observer: ResizeObserver): void;
}

interface ResizeObserverEntry {
	/**
	 * A reference to an Element that was resized.
	 */
	readonly target: Element;

	/**
	 * A DOMRectReadOnly indicating the new size of the element indicated by target.
	 */
	readonly contentRect: DOMRectReadOnly;
}

interface ResizeObserverConstructor {
	/**
	 * Creates and returns new ResizeObserver object.
	 */
	new(callback: ResizeObserverCallback): ResizeObserver;
}

/**
 * The ResizeObserver interface reports changes to the content rectangle of an Element or the bounding box of an SVGElement.
 * The content rectangle is the box in which content can be placed, meaning the border box minus the padding.
 *
 * ResizeObserver avoids infinite callback loops and cyclic dependencies that would be created by resizing in its own callback function.
 * It does this by only processing elements deeper in the DOM in subsequent frames.
 * Implementations should, if they follow the specification, invoke resize events before paint and after layout.
 */
interface ResizeObserver {
	/**
	 * Starts observing the specified Element or SVGElement.
	 */
	observe(target: Element): void;

	/**
	 * Ends the observing of a specified Element or SVGElement.
	 */
	unobserve(target: Element): void;

	/**
	 * Unobserves all observed Element or SVGElement targets.
	 */
	disconnect(): void;
}

interface Window {
	ResizeObserver: ResizeObserverConstructor;
}
