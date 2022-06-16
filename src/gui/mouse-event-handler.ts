import { ensureNotNull } from '../helpers/assertions';
import { isFF, isIOS } from '../helpers/browsers';
import { preventScrollByWheelClick } from '../helpers/events';
import { IDestroyable } from '../helpers/idestroyable';

import { Coordinate } from '../model/coordinate';

export type HandlerMouseEventCallback = (event: MouseEventHandlerMouseEvent) => void;
export type HandlerTouchEventCallback = (event: MouseEventHandlerTouchEvent) => void;
export type EmptyCallback = () => void;
export type PinchEventCallback = (middlePoint: Position, scale: number) => void;

export interface MouseEventHandlers {
	pinchStartEvent?: EmptyCallback;
	pinchEvent?: PinchEventCallback;
	pinchEndEvent?: EmptyCallback;

	mouseClickEvent?: HandlerMouseEventCallback;
	tapEvent?: HandlerTouchEventCallback;

	mouseDoubleClickEvent?: HandlerMouseEventCallback;
	doubleTapEvent?: HandlerTouchEventCallback;

	mouseDownEvent?: HandlerMouseEventCallback;
	touchStartEvent?: HandlerTouchEventCallback;

	mouseUpEvent?: HandlerMouseEventCallback;
	touchEndEvent?: HandlerTouchEventCallback;

	mouseDownOutsideEvent?: EmptyCallback;

	mouseEnterEvent?: HandlerMouseEventCallback;
	mouseLeaveEvent?: HandlerMouseEventCallback;

	mouseMoveEvent?: HandlerMouseEventCallback;

	pressedMouseMoveEvent?: HandlerMouseEventCallback;
	touchMoveEvent?: HandlerTouchEventCallback;

	longTapEvent?: HandlerTouchEventCallback;
}

export interface MouseEventHandlerEventBase {
	readonly clientX: Coordinate;
	readonly clientY: Coordinate;
	readonly pageX: Coordinate;
	readonly pageY: Coordinate;
	readonly screenX: Coordinate;
	readonly screenY: Coordinate;
	readonly localX: Coordinate;
	readonly localY: Coordinate;

	readonly ctrlKey: boolean;
	readonly altKey: boolean;
	readonly shiftKey: boolean;
	readonly metaKey: boolean;
	readonly srcType: string;

	target: MouseEvent['target'];
	view: MouseEvent['view'];

	preventDefault(): void;
}

export interface MouseEventHandlerMouseEvent extends MouseEventHandlerEventBase {
	isTouch: false;
}

export interface MouseEventHandlerTouchEvent extends MouseEventHandlerEventBase {
	isTouch: true;
}

export type TouchMouseEvent = MouseEventHandlerMouseEvent | MouseEventHandlerTouchEvent;

export interface Position {
	x: number;
	y: number;
}

// we can use `const name = 500;` but with `const enum` this values will be inlined into code
// so we do not need to have it as variables
const enum Delay {
	ResetClick = 500,
	LongTap = 240,
	PreventFiresTouchEvents= 500,
}

const enum Constants {
	CancelClickManhattanDistance = 5,
	CancelTapManhattanDistance = 5,
	DoubleClickManhattanDistance = 5,
	DoubleTapManhattanDistance = 30,
}

export interface MouseEventHandlerOptions {
	treatVertTouchDragAsPageScroll: () => boolean;
	treatHorzTouchDragAsPageScroll: () => boolean;
}

interface TouchMouseMoveWithDownInfo {
	xOffset: number;
	yOffset: number;
	manhattanDistance: number;
}

// TODO: get rid of a lot of boolean flags, probably we should replace it with some enum
export class MouseEventHandler implements IDestroyable {
	private readonly _target: HTMLElement;
	private readonly _handler: MouseEventHandlers;

	private readonly _options: MouseEventHandlerOptions;

	private _clickCount: number = 0;
	private _clickTimeoutId: TimerId | null = null;
	private _clickPosition: Position = { x: Number.NEGATIVE_INFINITY, y: Number.POSITIVE_INFINITY };

	private _tapCount: number = 0;
	private _tapTimeoutId: TimerId | null = null;
	private _tapPosition: Position = { x: Number.NEGATIVE_INFINITY, y: Number.POSITIVE_INFINITY };

	private _longTapTimeoutId: TimerId | null = null;
	private _longTapActive: boolean = false;

	private _mouseMoveStartPosition: Position | null = null;

	private _touchMoveStartPosition: Position | null = null;
	private _touchMoveExceededManhattanDistance: boolean = false;

	private _cancelClick: boolean = false;
	private _cancelTap: boolean = false;

	private _unsubscribeOutsideMouseEvents: (() => void) | null = null;
	private _unsubscribeOutsideTouchEvents: (() => void) | null = null;
	private _unsubscribeMobileSafariEvents: (() => void) | null = null;

	private _unsubscribeMousemove: (() => void) | null = null;

	private _unsubscribeRootMouseEvents: (() => void) | null = null;
	private _unsubscribeRootTouchEvents: (() => void) | null = null;

	private _startPinchMiddlePoint: Position | null = null;
	private _startPinchDistance: number = 0;
	private _pinchPrevented: boolean = false;
	private _preventTouchDragProcess: boolean = false;

	private _mousePressed: boolean = false;

	private _lastTouchEventTimeStamp: number = 0;

	// for touchstart/touchmove/touchend events we handle only first touch
	// i.e. we don't support several active touches at the same time (except pinch event)
	private _activeTouchId: number | null = null;

	// accept all mouse leave events if it's not an iOS device
	// see _mouseEnterHandler, _mouseMoveHandler, _mouseLeaveHandler
	private _acceptMouseLeave: boolean = !isIOS();

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
		if (this._unsubscribeOutsideMouseEvents !== null) {
			this._unsubscribeOutsideMouseEvents();
			this._unsubscribeOutsideMouseEvents = null;
		}

		if (this._unsubscribeOutsideTouchEvents !== null) {
			this._unsubscribeOutsideTouchEvents();
			this._unsubscribeOutsideTouchEvents = null;
		}

		if (this._unsubscribeMousemove !== null) {
			this._unsubscribeMousemove();
			this._unsubscribeMousemove = null;
		}

		if (this._unsubscribeRootMouseEvents !== null) {
			this._unsubscribeRootMouseEvents();
			this._unsubscribeRootMouseEvents = null;
		}

		if (this._unsubscribeRootTouchEvents !== null) {
			this._unsubscribeRootTouchEvents();
			this._unsubscribeRootTouchEvents = null;
		}

		if (this._unsubscribeMobileSafariEvents !== null) {
			this._unsubscribeMobileSafariEvents();
			this._unsubscribeMobileSafariEvents = null;
		}

		this._clearLongTapTimeout();
		this._resetClickTimeout();
	}

	private _mouseEnterHandler(enterEvent: MouseEvent): void {
		if (this._unsubscribeMousemove) {
			this._unsubscribeMousemove();
		}

		const boundMouseMoveHandler = this._mouseMoveHandler.bind(this);
		this._unsubscribeMousemove = () => {
			this._target.removeEventListener('mousemove', boundMouseMoveHandler);
		};
		this._target.addEventListener('mousemove', boundMouseMoveHandler);

		if (this._firesTouchEvents(enterEvent)) {
			return;
		}

		const compatEvent = this._makeCompatEvent(enterEvent);
		this._processMouseEvent(compatEvent, this._handler.mouseEnterEvent);
		this._acceptMouseLeave = true;
	}

	private _resetClickTimeout(): void {
		if (this._clickTimeoutId !== null) {
			clearTimeout(this._clickTimeoutId);
		}

		this._clickCount = 0;
		this._clickTimeoutId = null;
		this._clickPosition = { x: Number.NEGATIVE_INFINITY, y: Number.POSITIVE_INFINITY };
	}

	private _resetTapTimeout(): void {
		if (this._tapTimeoutId !== null) {
			clearTimeout(this._tapTimeoutId);
		}

		this._tapCount = 0;
		this._tapTimeoutId = null;
		this._tapPosition = { x: Number.NEGATIVE_INFINITY, y: Number.POSITIVE_INFINITY };
	}

	private _mouseMoveHandler(moveEvent: MouseEvent): void {
		if (this._mousePressed || this._touchMoveStartPosition !== null) {
			return;
		}

		if (this._firesTouchEvents(moveEvent)) {
			return;
		}

		const compatEvent = this._makeCompatEvent(moveEvent);
		this._processMouseEvent(compatEvent, this._handler.mouseMoveEvent);
		this._acceptMouseLeave = true;
	}

	private _touchMoveHandler(moveEvent: TouchEvent): void {
		const touch = touchWithId(moveEvent.changedTouches, ensureNotNull(this._activeTouchId));
		if (touch === null) {
			return;
		}

		this._lastTouchEventTimeStamp = eventTimeStamp(moveEvent);

		if (this._startPinchMiddlePoint !== null) {
			return;
		}

		if (this._preventTouchDragProcess) {
			return;
		}

		// prevent pinch if move event comes faster than the second touch
		this._pinchPrevented = true;

		const moveInfo = this._touchMouseMoveWithDownInfo(getPosition(touch), ensureNotNull(this._touchMoveStartPosition));
		const { xOffset, yOffset, manhattanDistance } = moveInfo;

		if (!this._touchMoveExceededManhattanDistance && manhattanDistance < Constants.CancelTapManhattanDistance) {
			return;
		}

		if (!this._touchMoveExceededManhattanDistance) {
			// first time when current position exceeded manhattan distance

			// vertical drag is more important than horizontal drag
			// because we scroll the page vertically often than horizontally
			const correctedXOffset = xOffset * 0.5;

			// a drag can be only if touch page scroll isn't allowed
			const isVertDrag = yOffset >= correctedXOffset && !this._options.treatVertTouchDragAsPageScroll();
			const isHorzDrag = correctedXOffset > yOffset && !this._options.treatHorzTouchDragAsPageScroll();

			// if drag event happened then we should revert preventDefault state to original one
			// and try to process the drag event
			// else we shouldn't prevent default of the event and ignore processing the drag event
			if (!isVertDrag && !isHorzDrag) {
				this._preventTouchDragProcess = true;
			}

			this._touchMoveExceededManhattanDistance = true;
			// if manhattan distance is more that 5 - we should cancel tap event
			this._cancelTap = true;
			this._clearLongTapTimeout();
			this._resetTapTimeout();
		}

		if (!this._preventTouchDragProcess) {
			const compatEvent = this._makeCompatEvent(moveEvent, touch);
			this._processTouchEvent(compatEvent, this._handler.touchMoveEvent);

			// we should prevent default in case of touch only
			// to prevent scroll of the page
			preventDefault(moveEvent);
		}
	}

	private _mouseMoveWithDownHandler(moveEvent: MouseEvent): void {
		if (moveEvent.button !== MouseEventButton.Left) {
			return;
		}

		const moveInfo = this._touchMouseMoveWithDownInfo(getPosition(moveEvent), ensureNotNull(this._mouseMoveStartPosition));
		const { manhattanDistance } = moveInfo;

		if (manhattanDistance >= Constants.CancelClickManhattanDistance) {
			// if manhattan distance is more that 5 - we should cancel click event
			this._cancelClick = true;
			this._resetClickTimeout();
		}

		if (this._cancelClick) {
			// if this._cancelClick is true, that means that minimum manhattan distance is already exceeded
			const compatEvent = this._makeCompatEvent(moveEvent);
			this._processMouseEvent(compatEvent, this._handler.pressedMouseMoveEvent);
		}
	}

	private _touchMouseMoveWithDownInfo(currentPosition: Position, startPosition: Position): TouchMouseMoveWithDownInfo {
		const xOffset = Math.abs(startPosition.x - currentPosition.x);
		const yOffset = Math.abs(startPosition.y - currentPosition.y);

		const manhattanDistance = xOffset + yOffset;

		return {
			xOffset: xOffset,
			yOffset: yOffset,
			manhattanDistance: manhattanDistance,
		};
	}

	/**
	 * In Firefox mouse events dont't fire if the mouse position is outside of the browser's border.
	 * To prevent the mouse from hanging while pressed we're subscribing on the mouseleave event of the document element.
	 * We're subscribing on mouseleave, but this event is actually fired on mouseup outside of the browser's border.
	 */
	private _onFirefoxOutsideMouseUp = (mouseUpEvent: MouseEvent) => {
		this._mouseUpHandler(mouseUpEvent);
	};

	/**
	 * Safari doesn't fire touchstart/mousedown events on double tap since iOS 13.
	 * There are two possible solutions:
	 * 1) Call preventDefault in touchEnd handler. But it also prevents click event from firing.
	 * 2) Add listener on dblclick event that fires with the preceding mousedown/mouseup.
	 * https://developer.apple.com/forums/thread/125073
	 */
	private _onMobileSafariDoubleClick = (dblClickEvent: MouseEvent) => {
		if (this._firesTouchEvents(dblClickEvent)) {
			const compatEvent = this._makeCompatEvent(dblClickEvent);
			++this._tapCount;

			if (this._tapTimeoutId && this._tapCount > 1) {
				const { manhattanDistance } = this._touchMouseMoveWithDownInfo(getPosition(dblClickEvent), this._tapPosition);
				if (manhattanDistance < Constants.DoubleTapManhattanDistance && !this._cancelTap) {
					this._processTouchEvent(compatEvent as unknown as MouseEventHandlerTouchEvent, this._handler.doubleTapEvent);
				}
				this._resetTapTimeout();
			}
		} else {
			const compatEvent = this._makeCompatEvent(dblClickEvent);
			++this._clickCount;

			if (this._clickTimeoutId && this._clickCount > 1) {
				const { manhattanDistance } = this._touchMouseMoveWithDownInfo(getPosition(dblClickEvent), this._clickPosition);
				if (manhattanDistance < Constants.DoubleClickManhattanDistance && !this._cancelClick) {
					this._processMouseEvent(compatEvent, this._handler.mouseDoubleClickEvent);
				}
				this._resetClickTimeout();
			}
		}
	};

	// eslint-disable-next-line complexity
	private _touchEndHandler(touchEndEvent: TouchEvent): void {
		let touch = touchWithId(touchEndEvent.changedTouches, ensureNotNull(this._activeTouchId));
		if (touch === null && touchEndEvent.touches.length === 0) {
			// something went wrong, somehow we missed the required touchend event
			// probably the browser has not sent this event
			touch = touchEndEvent.changedTouches[0];
		}

		if (touch === null) {
			return;
		}

		this._activeTouchId = null;
		this._lastTouchEventTimeStamp = eventTimeStamp(touchEndEvent);
		this._clearLongTapTimeout();
		this._touchMoveStartPosition = null;

		if (this._unsubscribeRootTouchEvents) {
			this._unsubscribeRootTouchEvents();
			this._unsubscribeRootTouchEvents = null;
		}

		const compatEvent = this._makeCompatEvent(touchEndEvent, touch);
		this._processTouchEvent(compatEvent, this._handler.touchEndEvent);
		++this._tapCount;

		if (this._tapTimeoutId && this._tapCount > 1) {
			// check that both clicks are near enough
			const { manhattanDistance } = this._touchMouseMoveWithDownInfo(getPosition(touch), this._tapPosition);
			if (manhattanDistance < Constants.DoubleTapManhattanDistance && !this._cancelTap) {
				this._processTouchEvent(compatEvent, this._handler.doubleTapEvent);
			}
			this._resetTapTimeout();
		} else {
			if (!this._cancelTap) {
				this._processTouchEvent(compatEvent, this._handler.tapEvent);

				// do not fire mouse events if tap handler was executed
				// prevent click event on new dom element (who appeared after tap)
				if (this._handler.tapEvent) {
					preventDefault(touchEndEvent);
				}
			}
		}

		// prevent, for example, safari's dblclick-to-zoom or fast-click after long-tap
		// we handle mouseDoubleClickEvent here ourselves
		if (this._tapCount === 0) {
			preventDefault(touchEndEvent);
		}

		if (touchEndEvent.touches.length === 0) {
			if (this._longTapActive) {
				this._longTapActive = false;
				// prevent native click event
				preventDefault(touchEndEvent);
			}
		}
	}

	private _mouseUpHandler(mouseUpEvent: MouseEvent): void {
		if (mouseUpEvent.button !== MouseEventButton.Left) {
			return;
		}

		const compatEvent = this._makeCompatEvent(mouseUpEvent);

		this._mouseMoveStartPosition = null;
		this._mousePressed = false;

		if (this._unsubscribeRootMouseEvents) {
			this._unsubscribeRootMouseEvents();
			this._unsubscribeRootMouseEvents = null;
		}

		if (isFF()) {
			const rootElement = this._target.ownerDocument.documentElement;
			rootElement.removeEventListener('mouseleave', this._onFirefoxOutsideMouseUp);
		}

		if (this._firesTouchEvents(mouseUpEvent)) {
			return;
		}

		this._processMouseEvent(compatEvent, this._handler.mouseUpEvent);
		++this._clickCount;

		if (this._clickTimeoutId && this._clickCount > 1) {
			// check that both clicks are near enough
			const { manhattanDistance } = this._touchMouseMoveWithDownInfo(getPosition(mouseUpEvent), this._clickPosition);
			if (manhattanDistance < Constants.DoubleClickManhattanDistance && !this._cancelClick) {
				this._processMouseEvent(compatEvent, this._handler.mouseDoubleClickEvent);
			}
			this._resetClickTimeout();
		} else {
			if (!this._cancelClick) {
				this._processMouseEvent(compatEvent, this._handler.mouseClickEvent);
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

	private _touchStartHandler(downEvent: TouchEvent): void {
		if (this._activeTouchId !== null) {
			return;
		}
		const touch = downEvent.changedTouches[0];
		this._activeTouchId = touch.identifier;

		this._lastTouchEventTimeStamp = eventTimeStamp(downEvent);

		const rootElement = this._target.ownerDocument.documentElement;

		this._cancelTap = false;
		this._touchMoveExceededManhattanDistance = false;
		this._preventTouchDragProcess = false;

		this._touchMoveStartPosition = getPosition(touch);

		if (this._unsubscribeRootTouchEvents) {
			this._unsubscribeRootTouchEvents();
			this._unsubscribeRootTouchEvents = null;
		}

		{
			const boundTouchMoveWithDownHandler = this._touchMoveHandler.bind(this);
			const boundTouchEndHandler = this._touchEndHandler.bind(this);

			this._unsubscribeRootTouchEvents = () => {
				rootElement.removeEventListener('touchmove', boundTouchMoveWithDownHandler);
				rootElement.removeEventListener('touchend', boundTouchEndHandler);
			};

			rootElement.addEventListener('touchmove', boundTouchMoveWithDownHandler, { passive: false });
			rootElement.addEventListener('touchend', boundTouchEndHandler, { passive: false });

			this._clearLongTapTimeout();
			this._longTapTimeoutId = setTimeout(this._longTapHandler.bind(this, downEvent), Delay.LongTap);
		}

		const compatEvent = this._makeCompatEvent(downEvent, touch);
		this._processTouchEvent(compatEvent, this._handler.touchStartEvent);

		if (!this._tapTimeoutId) {
			this._tapCount = 0;
			this._tapTimeoutId = setTimeout(this._resetTapTimeout.bind(this), Delay.ResetClick);
			this._tapPosition = getPosition(touch);
		}
	}

	private _mouseDownHandler(downEvent: MouseEvent): void {
		if (downEvent.button !== MouseEventButton.Left) {
			return;
		}

		const rootElement = this._target.ownerDocument.documentElement;
		if (isFF()) {
			rootElement.addEventListener('mouseleave', this._onFirefoxOutsideMouseUp);
		}

		this._cancelClick = false;

		this._mouseMoveStartPosition = getPosition(downEvent);

		if (this._unsubscribeRootMouseEvents) {
			this._unsubscribeRootMouseEvents();
			this._unsubscribeRootMouseEvents = null;
		}

		{
			const boundMouseMoveWithDownHandler = this._mouseMoveWithDownHandler.bind(this);
			const boundMouseUpHandler = this._mouseUpHandler.bind(this);

			this._unsubscribeRootMouseEvents = () => {
				rootElement.removeEventListener('mousemove', boundMouseMoveWithDownHandler);
				rootElement.removeEventListener('mouseup', boundMouseUpHandler);
			};

			rootElement.addEventListener('mousemove', boundMouseMoveWithDownHandler);
			rootElement.addEventListener('mouseup', boundMouseUpHandler);
		}

		this._mousePressed = true;

		if (this._firesTouchEvents(downEvent)) {
			return;
		}

		const compatEvent = this._makeCompatEvent(downEvent);
		this._processMouseEvent(compatEvent, this._handler.mouseDownEvent);

		if (!this._clickTimeoutId) {
			this._clickCount = 0;
			this._clickTimeoutId = setTimeout(this._resetClickTimeout.bind(this), Delay.ResetClick);
			this._clickPosition = getPosition(downEvent);
		}
	}

	private _init(): void {
		this._target.addEventListener('mouseenter', this._mouseEnterHandler.bind(this));

		// Do not show context menu when something went wrong
		this._target.addEventListener('touchcancel', this._clearLongTapTimeout.bind(this));

		{
			const doc = this._target.ownerDocument;

			const outsideHandler = (event: MouseEvent | TouchEvent) => {
				if (!this._handler.mouseDownOutsideEvent) {
					return;
				}

				if (event.composed && this._target.contains(event.composedPath()[0] as Element)) {
					return;
				}

				if (event.target && this._target.contains(event.target as Element)) {
					return;
				}

				this._handler.mouseDownOutsideEvent();
			};

			this._unsubscribeOutsideTouchEvents = () => {
				doc.removeEventListener('touchstart', outsideHandler);
			};

			this._unsubscribeOutsideMouseEvents = () => {
				doc.removeEventListener('mousedown', outsideHandler);
			};

			doc.addEventListener('mousedown', outsideHandler);
			doc.addEventListener('touchstart', outsideHandler, { passive: true });
		}

		if (isIOS()) {
			this._unsubscribeMobileSafariEvents = () => {
				this._target.removeEventListener('dblclick', this._onMobileSafariDoubleClick);
			};
			this._target.addEventListener('dblclick', this._onMobileSafariDoubleClick);
		}

		this._target.addEventListener('mouseleave', this._mouseLeaveHandler.bind(this));

		this._target.addEventListener('touchstart', this._touchStartHandler.bind(this), { passive: true });
		preventScrollByWheelClick(this._target);
		this._target.addEventListener('mousedown', this._mouseDownHandler.bind(this));

		this._initPinch();

		// Hey mobile Safari, what's up?
		// If mobile Safari doesn't have any touchmove handler with passive=false
		// it treats a touchstart and the following touchmove events as cancelable=false,
		// so we can't prevent them (as soon we subscribe on touchmove inside touchstart's handler).
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

	private _mouseLeaveHandler(event: MouseEvent): void {
		if (this._unsubscribeMousemove) {
			this._unsubscribeMousemove();
		}

		if (this._firesTouchEvents(event)) {
			return;
		}

		if (!this._acceptMouseLeave) {
			// mobile Safari sometimes emits mouse leave event for no reason, there is no way to handle it in other way
			// just ignore this event if there was no mouse move or mouse enter events
			return;
		}

		const compatEvent = this._makeCompatEvent(event);
		this._processMouseEvent(compatEvent, this._handler.mouseLeaveEvent);

		// accept all mouse leave events if it's not an iOS device
		this._acceptMouseLeave = !isIOS();
	}

	private _longTapHandler(event: TouchEvent): void {
		const touch = touchWithId(event.touches, ensureNotNull(this._activeTouchId));
		if (touch === null) {
			return;
		}

		const compatEvent = this._makeCompatEvent(event, touch);
		this._processTouchEvent(compatEvent, this._handler.longTapEvent);
		this._cancelTap = true;

		// long tap is active until touchend event with 0 touches occurred
		this._longTapActive = true;
	}

	private _firesTouchEvents(e: MouseEvent): boolean {
		if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents !== undefined) {
			return e.sourceCapabilities.firesTouchEvents;
		}

		return eventTimeStamp(e) < this._lastTouchEventTimeStamp + Delay.PreventFiresTouchEvents;
	}

	private _processTouchEvent(event: MouseEventHandlerTouchEvent, callback?: HandlerTouchEventCallback): void {
		if (callback) {
			callback.call(this._handler, event);
		}
	}

	private _processMouseEvent(event: MouseEventHandlerMouseEvent, callback?: HandlerMouseEventCallback): void {
		if (!callback) {
			return;
		}

		callback.call(this._handler, event);
	}

	private _makeCompatEvent(event: MouseEvent): MouseEventHandlerMouseEvent;
	private _makeCompatEvent(event: TouchEvent, touch: Touch): MouseEventHandlerTouchEvent;
	private _makeCompatEvent(event: MouseEvent | TouchEvent, touch?: Touch): TouchMouseEvent {
		// TouchEvent has no clientX/Y coordinates:
		// We have to use the last Touch instead
		const eventLike = touch || (event as MouseEvent);
		const box = this._target.getBoundingClientRect() || { left: 0, top: 0 };

		return {
			clientX: eventLike.clientX as Coordinate,
			clientY: eventLike.clientY as Coordinate,
			pageX: eventLike.pageX as Coordinate,
			pageY: eventLike.pageY as Coordinate,
			screenX: eventLike.screenX as Coordinate,
			screenY: eventLike.screenY as Coordinate,
			localX: (eventLike.clientX - box.left) as Coordinate,
			localY: (eventLike.clientY - box.top) as Coordinate,

			ctrlKey: event.ctrlKey,
			altKey: event.altKey,
			shiftKey: event.shiftKey,
			metaKey: event.metaKey,

			isTouch: !event.type.startsWith('mouse') && event.type !== 'contextmenu' && event.type !== 'click',
			srcType: event.type,

			target: eventLike.target,
			view: event.view,

			preventDefault: () => {
				if (event.type !== 'touchstart') {
					// touchstart is passive and cannot be prevented
					preventDefault(event);
				}
			},
		};
	}
}

function getBoundingClientRect(element: HTMLElement): DOMRect {
	return element.getBoundingClientRect() || { left: 0, top: 0 };
}

function getDistance(p1: Touch, p2: Touch): number {
	const xDiff = p1.clientX - p2.clientX;
	const yDiff = p1.clientY - p2.clientY;
	return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

function preventDefault(event: Event): void {
	if (event.cancelable) {
		event.preventDefault();
	}
}

function getPosition(eventLike: Touch | MouseEvent): Position {
	return {
		x: eventLike.pageX,
		y: eventLike.pageY,
	};
}

function eventTimeStamp(e: TouchEvent | MouseEvent): number {
	// for some reason e.timestamp is always 0 on iPad with magic mouse, so we use performance.now() as a fallback
	return e.timeStamp || performance.now();
}

function touchWithId(touches: TouchList, id: number): Touch | null {
	for (let i = 0; i < touches.length; ++i) {
		if (touches[i].identifier === id) {
			return touches[i];
		}
	}

	return null;
}
