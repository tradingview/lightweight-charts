import { ensure } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';

import { mobileTouch } from './support-touch';

export type HandlerEventCallback = (event: TouchMouseEvent) => void;
export type EmptyCallback = () => void;
export type PinchEventCallback = (middlePoint: Position, scale: number) => void;

export interface MouseEventHandlers {
	pinchStartEvent?: EmptyCallback;
	pinchEvent?: PinchEventCallback;
	pinchEndEvent?: EmptyCallback;
	mouseClickEvent?: HandlerEventCallback;
	mouseDoubleClickEvent?: HandlerEventCallback;
	mouseDownEvent?: HandlerEventCallback;
	mouseDownOutsideEvent?: EmptyCallback;
	mouseEnterEvent?: HandlerEventCallback;
	mouseLeaveEvent?: HandlerEventCallback;
	mouseMoveEvent?: HandlerEventCallback;
	mouseUpEvent?: HandlerEventCallback;
	pressedMouseMoveEvent?: HandlerEventCallback;
	longTapEvent?: HandlerEventCallback;
}

export interface TouchMouseEvent {
	readonly clientX: number;
	readonly clientY: number;
	readonly pageX: number;
	readonly pageY: number;
	readonly screenX: number;
	readonly screenY: number;
	readonly localX: number;
	readonly localY: number;

	readonly ctrlKey: boolean;
	readonly altKey: boolean;
	readonly shiftKey: boolean;
	readonly metaKey: boolean;

	// TODO: remove this after rewriting MouseEventHandler to handle touch and mouse event separately
	readonly type: 'touch' | 'mouse';

	target: MouseEvent['target'];
	view: MouseEvent['view'];
}

export interface Position {
	x: number;
	y: number;
}

// we can use `const name = 500;` but with `const enum` this values will be inlined into code
// so we do not need to have it as variables
const enum Delay {
	ResetClick = 500,
	LongTap = 240,
}

export interface MouseEventHandlerOptions {
	treatVertTouchDragAsPageScroll: boolean;
	treatHorzTouchDragAsPageScroll: boolean;
}

// TODO: get rid of a lot of boolean flags, probably we should replace it with some enum
export class MouseEventHandler implements IDestroyable {
	private readonly _target: HTMLElement;
	private _handler: MouseEventHandlers;

	private readonly _options: MouseEventHandlerOptions;

	private _clickCount: number = 0;
	private _clickTimeoutId: TimerId | null = null;
	private _longTapTimeoutId: TimerId | null = null;
	private _longTapActive: boolean = false;
	private _mouseMoveStartPosition: Position | null = null;
	private _moveExceededManhattanDistance: boolean = false;
	private _cancelClick: boolean = false;
	private _unsubscribeOutsideEvents: (() => void) | null = null;
	private _unsubscribeMousemove: (() => void) | null = null;
	private _unsubscribeRoot: (() => void) | null = null;

	private _startPinchMiddlePoint: Position | null = null;
	private _startPinchDistance: number = 0;
	private _pinchPrevented: boolean = false;
	private _preventDragProcess: boolean = false;

	private _mousePressed: boolean = false;

	public constructor(
		target: HTMLElement,
		handler: MouseEventHandlers,
		options: MouseEventHandlerOptions
	) {
		this._target = target;
		this._handler = handler;
		this._options = options;

		this._init();
	}

	public destroy(): void {
		if (this._unsubscribeOutsideEvents !== null) {
			this._unsubscribeOutsideEvents();
			this._unsubscribeOutsideEvents = null;
		}

		if (this._unsubscribeMousemove !== null) {
			this._unsubscribeMousemove();
			this._unsubscribeMousemove = null;
		}

		if (this._unsubscribeRoot !== null) {
			this._unsubscribeRoot();
			this._unsubscribeRoot = null;
		}

		this._clearLongTapTimeout();
		this._resetClickTimeout();
	}

	private _mouseEnterHandler(enterEvent: MouseEvent | TouchEvent): void {
		if (this._unsubscribeMousemove) {
			this._unsubscribeMousemove();
		}

		{
			const boundMouseMoveHandler = this._mouseMoveHandler.bind(this);
			this._unsubscribeMousemove = () => {
				this._target.removeEventListener('mousemove', boundMouseMoveHandler);
			};
			this._target.addEventListener('mousemove', boundMouseMoveHandler);
		}

		if (isTouchEvent(enterEvent)) {
			this._mouseMoveHandler(enterEvent);
		}

		const compatEvent = this._makeCompatEvent(enterEvent);
		this._processEvent(compatEvent, this._handler.mouseEnterEvent);
	}

	private _resetClickTimeout(): void {
		if (this._clickTimeoutId !== null) {
			clearTimeout(this._clickTimeoutId);
		}

		this._clickCount = 0;
		this._clickTimeoutId = null;
	}

	private _mouseMoveHandler(moveEvent: MouseEvent | TouchEvent): void {
		if (this._mousePressed && !isTouchEvent(moveEvent)) {
			return;
		}

		const compatEvent = this._makeCompatEvent(moveEvent);
		this._processEvent(compatEvent, this._handler.mouseMoveEvent);
	}

	// tslint:disable-next-line:cyclomatic-complexity
	private _mouseMoveWithDownHandler(moveEvent: MouseEvent | TouchEvent): void {
		if ('button' in moveEvent && moveEvent.button !== MouseEventButton.Left) {
			return;
		}

		if (this._startPinchMiddlePoint !== null) {
			return;
		}

		const isTouch = isTouchEvent(moveEvent);
		if (this._preventDragProcess && isTouch) {
			return;
		}

		// prevent pinch if move event comes faster than the second touch
		this._pinchPrevented = true;

		const compatEvent = this._makeCompatEvent(moveEvent);

		const startMouseMovePos = ensure(this._mouseMoveStartPosition);
		const xOffset = Math.abs(startMouseMovePos.x - compatEvent.pageX);
		const yOffset = Math.abs(startMouseMovePos.y - compatEvent.pageY);

		const moveExceededManhattanDistance = xOffset + yOffset > 5;

		if (!moveExceededManhattanDistance && isTouch) {
			return;
		}

		if (moveExceededManhattanDistance && !this._moveExceededManhattanDistance && isTouch) {
			// vertical drag is more important than horizontal drag
			// because we scroll the page vertically often than horizontally
			const correctedXOffset = xOffset * 0.5;

			// a drag can be only if touch page scroll isn't allowed
			const isVertDrag = yOffset >= correctedXOffset && !this._options.treatVertTouchDragAsPageScroll;
			const isHorzDrag = correctedXOffset > yOffset && !this._options.treatHorzTouchDragAsPageScroll;

			// if drag event happened then we should revert preventDefault state to original one
			// and try to process the drag event
			// else we shouldn't prevent default of the event and ignore processing the drag event
			if (!isVertDrag && !isHorzDrag) {
				this._preventDragProcess = true;
			}
		}

		if (moveExceededManhattanDistance) {
			this._moveExceededManhattanDistance = true;

			// if manhattan distance is more that 5 - we should cancel click event
			this._cancelClick = true;

			if (isTouch) {
				this._clearLongTapTimeout();
			}
		}

		if (!this._preventDragProcess) {
			this._processEvent(compatEvent, this._handler.pressedMouseMoveEvent);

			// we should prevent default in case of touch only
			// to prevent scroll of the page
			if (isTouch) {
				preventDefault(moveEvent);
			}
		}
	}

	private _mouseUpHandler(mouseUpEvent: MouseEvent | TouchEvent): void {
		if ('button' in mouseUpEvent && mouseUpEvent.button !== MouseEventButton.Left) {
			return;
		}

		const compatEvent = this._makeCompatEvent(mouseUpEvent);

		this._clearLongTapTimeout();

		this._mouseMoveStartPosition = null;

		this._mousePressed = false;

		if (this._unsubscribeRoot) {
			this._unsubscribeRoot();
			this._unsubscribeRoot = null;
		}

		if (isTouchEvent(mouseUpEvent)) {
			this._mouseLeaveHandler(mouseUpEvent);
		}

		this._processEvent(compatEvent, this._handler.mouseUpEvent);
		++this._clickCount;
		if (this._clickTimeoutId && this._clickCount > 1) {
			this._processEvent(compatEvent, this._handler.mouseDoubleClickEvent);
			this._resetClickTimeout();
		} else {
			if (!this._cancelClick) {
				this._processEvent(compatEvent, this._handler.mouseClickEvent);
			}
		}

		// prevent safari's dblclick-to-zoom
		// we handle mouseDoubleClickEvent here ourself
		if (isTouchEvent(mouseUpEvent)) {
			preventDefault(mouseUpEvent);

			this._mouseLeaveHandler(mouseUpEvent);

			if (mouseUpEvent.touches.length === 0) {
				this._longTapActive = false;
			}
		}
	}

	private _clearLongTapTimeout(): void {
		if (this._longTapTimeoutId === null) {
			return;
		}

		clearTimeout(this._longTapTimeoutId);
		this._longTapTimeoutId = null;
	}

	private _mouseDownHandler(downEvent: MouseEvent | TouchEvent): void {
		if ('button' in downEvent && downEvent.button !== MouseEventButton.Left) {
			return;
		}

		const compatEvent = this._makeCompatEvent(downEvent);

		this._cancelClick = false;
		this._moveExceededManhattanDistance = false;
		this._preventDragProcess = false;

		if (isTouchEvent(downEvent)) {
			this._mouseEnterHandler(downEvent);
		}

		this._mouseMoveStartPosition = {
			x: compatEvent.pageX,
			y: compatEvent.pageY,
		};

		if (this._unsubscribeRoot) {
			this._unsubscribeRoot();
			this._unsubscribeRoot = null;
		}

		{
			const boundMouseMoveWithDownHandler = this._mouseMoveWithDownHandler.bind(this);
			const boundMouseUpHandler = this._mouseUpHandler.bind(this);
			const rootElement = this._target.ownerDocument.documentElement;

			this._unsubscribeRoot = () => {
				rootElement.removeEventListener('touchmove', boundMouseMoveWithDownHandler);
				rootElement.removeEventListener('touchend', boundMouseUpHandler);

				rootElement.removeEventListener('mousemove', boundMouseMoveWithDownHandler);
				rootElement.removeEventListener('mouseup', boundMouseUpHandler);
			};

			rootElement.addEventListener('touchmove', boundMouseMoveWithDownHandler, { passive: false });
			rootElement.addEventListener('touchend', boundMouseUpHandler, { passive: false });

			this._clearLongTapTimeout();

			if (isTouchEvent(downEvent) && downEvent.touches.length === 1) {
				this._longTapTimeoutId = setTimeout(this._longTapHandler.bind(this, downEvent), Delay.LongTap);
			} else {
				rootElement.addEventListener('mousemove', boundMouseMoveWithDownHandler);
				rootElement.addEventListener('mouseup', boundMouseUpHandler);
			}
		}

		this._mousePressed = true;

		this._processEvent(compatEvent, this._handler.mouseDownEvent);

		if (!this._clickTimeoutId) {
			this._clickCount = 0;
			this._clickTimeoutId = setTimeout(this._resetClickTimeout.bind(this), Delay.ResetClick);
		}
	}

	private _init(): void {
		this._target.addEventListener('mouseenter', this._mouseEnterHandler.bind(this));

		this._target.addEventListener('touchcancel', this._clearLongTapTimeout.bind(this));

		{
			const doc = this._target.ownerDocument;

			const outsideHandler = (event: MouseEvent | TouchEvent) => {
				if (!this._handler.mouseDownOutsideEvent) {
					return;
				}
				if (event.target && this._target.contains(event.target as Element)) {
					return;
				}
				this._handler.mouseDownOutsideEvent();
			};

			this._unsubscribeOutsideEvents = () => {
				doc.removeEventListener('mousedown', outsideHandler);
				doc.removeEventListener('touchstart', outsideHandler);
			};

			doc.addEventListener('mousedown', outsideHandler);
			doc.addEventListener('touchstart', outsideHandler, { passive: true });
		}

		this._target.addEventListener('mouseleave', this._mouseLeaveHandler.bind(this));

		this._target.addEventListener('touchstart', this._mouseDownHandler.bind(this), { passive: true });
		if (!mobileTouch) {
			this._target.addEventListener('mousedown', this._mouseDownHandler.bind(this));
		}

		this._initPinch();

		// Hey mobile Safari, what's up?
		// If mobile Safari doesn't have any touchmove handler with passive=false
		// it treats a touchstart and the following touchmove events as cancelable=false,
		// so we can't prevent them (as soon we subscribe on touchmove inside handler of touchstart).
		// And we'll get scroll of the page along with chart's one instead of only chart's scroll.
		this._target.addEventListener('touchmove', () => {}, { passive: false });
	}

	private _initPinch(): void {
		if (this._handler.pinchStartEvent === undefined &&
			this._handler.pinchEvent === undefined &&
			this._handler.pinchEndEvent === undefined
		) {
			return;
		}

		this._target.addEventListener(
			'touchstart',
			(event: TouchEvent) => this._checkPinchState(event.touches),
			{ passive: true }
		);

		this._target.addEventListener(
			'touchmove',
			(event: TouchEvent) => {
				if (event.touches.length !== 2 || this._startPinchMiddlePoint === null) {
					return;
				}

				if (this._handler.pinchEvent !== undefined) {
					const currentDistance = getDistance(event.touches[0], event.touches[1]);
					const scale = currentDistance / this._startPinchDistance;
					this._handler.pinchEvent(this._startPinchMiddlePoint, scale);
					preventDefault(event);
				}
			},
			{ passive: false }
		);

		this._target.addEventListener('touchend', (event: TouchEvent) => {
			this._checkPinchState(event.touches);
		});
	}

	private _checkPinchState(touches: TouchList): void {
		if (touches.length === 1) {
			this._pinchPrevented = false;
		}

		if (touches.length !== 2 || this._pinchPrevented || this._longTapActive) {
			this._stopPinch();
		} else {
			this._startPinch(touches);
		}
	}

	private _startPinch(touches: TouchList): void {
		const box = getBoundingClientRect(this._target);
		this._startPinchMiddlePoint = {
			x: ((touches[0].clientX - box.left) + (touches[1].clientX - box.left)) / 2,
			y: ((touches[0].clientY - box.top) + (touches[1].clientY - box.top)) / 2,
		};

		this._startPinchDistance = getDistance(touches[0], touches[1]);

		if (this._handler.pinchStartEvent !== undefined) {
			this._handler.pinchStartEvent();
		}

		this._clearLongTapTimeout();
	}

	private _stopPinch(): void {
		if (this._startPinchMiddlePoint === null) {
			return;
		}

		this._startPinchMiddlePoint = null;

		if (this._handler.pinchEndEvent !== undefined) {
			this._handler.pinchEndEvent();
		}
	}

	private _mouseLeaveHandler(event: MouseEvent | TouchEvent): void {
		if (this._unsubscribeMousemove) {
			this._unsubscribeMousemove();
		}
		const compatEvent = this._makeCompatEvent(event);
		this._processEvent(compatEvent, this._handler.mouseLeaveEvent);
	}

	private _longTapHandler(event: TouchEvent): void {
		const compatEvent = this._makeCompatEvent(event);
		this._processEvent(compatEvent, this._handler.longTapEvent);
		this._cancelClick = true;

		// long tap is active untill touchend event with 0 touches occured
		this._longTapActive = true;
	}

	private _processEvent(event: TouchMouseEvent, callback?: HandlerEventCallback): void {
		if (!callback) {
			return;
		}

		callback.call(this._handler, event);
	}

	private _makeCompatEvent(event: MouseEvent | TouchEvent): TouchMouseEvent {
		// TouchEvent has no clientX/Y coordinates:
		// We have to use the last Touch instead
		let eventLike: MouseEvent | Touch;
		if ('touches' in event && event.touches.length) {
			eventLike = event.touches[0];
		} else if ('changedTouches' in event && event.changedTouches.length) {
			eventLike = event.changedTouches[0];
		} else {
			eventLike = event as MouseEvent;
		}

		const box = getBoundingClientRect(this._target);

		return {
			clientX: eventLike.clientX,
			clientY: eventLike.clientY,
			pageX: eventLike.pageX,
			pageY: eventLike.pageY,
			screenX: eventLike.screenX,
			screenY: eventLike.screenY,
			localX: eventLike.clientX - box.left,
			localY: eventLike.clientY - box.top,

			ctrlKey: event.ctrlKey,
			altKey: event.altKey,
			shiftKey: event.shiftKey,
			metaKey: event.metaKey,

			type: event.type.startsWith('mouse') ? 'mouse' : 'touch',

			target: eventLike.target,
			view: event.view,
		};
	}
}

function getBoundingClientRect(element: HTMLElement): ClientRect | DOMRect {
	return element.getBoundingClientRect() || { left: 0, top: 0 };
}

function getDistance(p1: Touch, p2: Touch): number {
	const xDiff = p1.clientX - p2.clientX;
	const yDiff = p1.clientY - p2.clientY;
	return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
	return Boolean((event as TouchEvent).touches);
}

function preventDefault(event: Event): void {
	if (event.cancelable) {
		event.preventDefault();
	}
}
