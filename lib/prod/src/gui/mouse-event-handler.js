import { ensureNotNull } from '../helpers/assertions';
import { isFF, isIOS } from '../helpers/browsers';
import { preventScrollByWheelClick } from '../helpers/events';
;
;
// TODO: get rid of a lot of boolean flags, probably we should replace it with some enum
export class MouseEventHandler {
    constructor(target, handler, options) {
        this._private__clickCount = 0;
        this._private__clickTimeoutId = null;
        this._private__clickPosition = { _internal_x: Number.NEGATIVE_INFINITY, _internal_y: Number.POSITIVE_INFINITY };
        this._private__tapCount = 0;
        this._private__tapTimeoutId = null;
        this._private__tapPosition = { _internal_x: Number.NEGATIVE_INFINITY, _internal_y: Number.POSITIVE_INFINITY };
        this._private__longTapTimeoutId = null;
        this._private__longTapActive = false;
        this._private__mouseMoveStartPosition = null;
        this._private__touchMoveStartPosition = null;
        this._private__touchMoveExceededManhattanDistance = false;
        this._private__cancelClick = false;
        this._private__cancelTap = false;
        this._private__unsubscribeOutsideMouseEvents = null;
        this._private__unsubscribeOutsideTouchEvents = null;
        this._private__unsubscribeMobileSafariEvents = null;
        this._private__unsubscribeMousemove = null;
        this._private__unsubscribeRootMouseEvents = null;
        this._private__unsubscribeRootTouchEvents = null;
        this._private__startPinchMiddlePoint = null;
        this._private__startPinchDistance = 0;
        this._private__pinchPrevented = false;
        this._private__preventTouchDragProcess = false;
        this._private__mousePressed = false;
        this._private__lastTouchEventTimeStamp = 0;
        // for touchstart/touchmove/touchend events we handle only first touch
        // i.e. we don't support several active touches at the same time (except pinch event)
        this._private__activeTouchId = null;
        // accept all mouse leave events if it's not an iOS device
        // see _mouseEnterHandler, _mouseMoveHandler, _mouseLeaveHandler
        this._private__acceptMouseLeave = !isIOS();
        /**
         * In Firefox mouse events dont't fire if the mouse position is outside of the browser's border.
         * To prevent the mouse from hanging while pressed we're subscribing on the mouseleave event of the document element.
         * We're subscribing on mouseleave, but this event is actually fired on mouseup outside of the browser's border.
         */
        this._private__onFirefoxOutsideMouseUp = (mouseUpEvent) => {
            this._private__mouseUpHandler(mouseUpEvent);
        };
        /**
         * Safari doesn't fire touchstart/mousedown events on double tap since iOS 13.
         * There are two possible solutions:
         * 1) Call preventDefault in touchEnd handler. But it also prevents click event from firing.
         * 2) Add listener on dblclick event that fires with the preceding mousedown/mouseup.
         * https://developer.apple.com/forums/thread/125073
         */
        this._private__onMobileSafariDoubleClick = (dblClickEvent) => {
            if (this._private__firesTouchEvents(dblClickEvent)) {
                const compatEvent = this._private__makeCompatEvent(dblClickEvent);
                ++this._private__tapCount;
                if (this._private__tapTimeoutId && this._private__tapCount > 1) {
                    const { _internal_manhattanDistance: manhattanDistance } = this._private__touchMouseMoveWithDownInfo(getPosition(dblClickEvent), this._private__tapPosition);
                    if (manhattanDistance < 30 /* Constants.DoubleTapManhattanDistance */ && !this._private__cancelTap) {
                        this._private__processTouchEvent(compatEvent, this._private__handler._internal_doubleTapEvent);
                    }
                    this._private__resetTapTimeout();
                }
            }
            else {
                const compatEvent = this._private__makeCompatEvent(dblClickEvent);
                ++this._private__clickCount;
                if (this._private__clickTimeoutId && this._private__clickCount > 1) {
                    const { _internal_manhattanDistance: manhattanDistance } = this._private__touchMouseMoveWithDownInfo(getPosition(dblClickEvent), this._private__clickPosition);
                    if (manhattanDistance < 5 /* Constants.DoubleClickManhattanDistance */ && !this._private__cancelClick) {
                        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseDoubleClickEvent);
                    }
                    this._private__resetClickTimeout();
                }
            }
        };
        this._private__target = target;
        this._private__handler = handler;
        this._private__options = options;
        this._private__init();
    }
    _internal_destroy() {
        if (this._private__unsubscribeOutsideMouseEvents !== null) {
            this._private__unsubscribeOutsideMouseEvents();
            this._private__unsubscribeOutsideMouseEvents = null;
        }
        if (this._private__unsubscribeOutsideTouchEvents !== null) {
            this._private__unsubscribeOutsideTouchEvents();
            this._private__unsubscribeOutsideTouchEvents = null;
        }
        if (this._private__unsubscribeMousemove !== null) {
            this._private__unsubscribeMousemove();
            this._private__unsubscribeMousemove = null;
        }
        if (this._private__unsubscribeRootMouseEvents !== null) {
            this._private__unsubscribeRootMouseEvents();
            this._private__unsubscribeRootMouseEvents = null;
        }
        if (this._private__unsubscribeRootTouchEvents !== null) {
            this._private__unsubscribeRootTouchEvents();
            this._private__unsubscribeRootTouchEvents = null;
        }
        if (this._private__unsubscribeMobileSafariEvents !== null) {
            this._private__unsubscribeMobileSafariEvents();
            this._private__unsubscribeMobileSafariEvents = null;
        }
        this._private__clearLongTapTimeout();
        this._private__resetClickTimeout();
    }
    _private__mouseEnterHandler(enterEvent) {
        if (this._private__unsubscribeMousemove) {
            this._private__unsubscribeMousemove();
        }
        const boundMouseMoveHandler = this._private__mouseMoveHandler.bind(this);
        this._private__unsubscribeMousemove = () => {
            this._private__target.removeEventListener('mousemove', boundMouseMoveHandler);
        };
        this._private__target.addEventListener('mousemove', boundMouseMoveHandler);
        if (this._private__firesTouchEvents(enterEvent)) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(enterEvent);
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseEnterEvent);
        this._private__acceptMouseLeave = true;
    }
    _private__resetClickTimeout() {
        if (this._private__clickTimeoutId !== null) {
            clearTimeout(this._private__clickTimeoutId);
        }
        this._private__clickCount = 0;
        this._private__clickTimeoutId = null;
        this._private__clickPosition = { _internal_x: Number.NEGATIVE_INFINITY, _internal_y: Number.POSITIVE_INFINITY };
    }
    _private__resetTapTimeout() {
        if (this._private__tapTimeoutId !== null) {
            clearTimeout(this._private__tapTimeoutId);
        }
        this._private__tapCount = 0;
        this._private__tapTimeoutId = null;
        this._private__tapPosition = { _internal_x: Number.NEGATIVE_INFINITY, _internal_y: Number.POSITIVE_INFINITY };
    }
    _private__mouseMoveHandler(moveEvent) {
        if (this._private__mousePressed || this._private__touchMoveStartPosition !== null) {
            return;
        }
        if (this._private__firesTouchEvents(moveEvent)) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(moveEvent);
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseMoveEvent);
        this._private__acceptMouseLeave = true;
    }
    _private__touchMoveHandler(moveEvent) {
        const touch = touchWithId(moveEvent.changedTouches, ensureNotNull(this._private__activeTouchId));
        if (touch === null) {
            return;
        }
        this._private__lastTouchEventTimeStamp = eventTimeStamp(moveEvent);
        if (this._private__startPinchMiddlePoint !== null) {
            return;
        }
        if (this._private__preventTouchDragProcess) {
            return;
        }
        // prevent pinch if move event comes faster than the second touch
        this._private__pinchPrevented = true;
        const moveInfo = this._private__touchMouseMoveWithDownInfo(getPosition(touch), ensureNotNull(this._private__touchMoveStartPosition));
        const { _internal_xOffset: xOffset, _internal_yOffset: yOffset, _internal_manhattanDistance: manhattanDistance } = moveInfo;
        if (!this._private__touchMoveExceededManhattanDistance && manhattanDistance < 5 /* Constants.CancelTapManhattanDistance */) {
            return;
        }
        if (!this._private__touchMoveExceededManhattanDistance) {
            // first time when current position exceeded manhattan distance
            // vertical drag is more important than horizontal drag
            // because we scroll the page vertically often than horizontally
            const correctedXOffset = xOffset * 0.5;
            // a drag can be only if touch page scroll isn't allowed
            const isVertDrag = yOffset >= correctedXOffset && !this._private__options._internal_treatVertTouchDragAsPageScroll();
            const isHorzDrag = correctedXOffset > yOffset && !this._private__options._internal_treatHorzTouchDragAsPageScroll();
            // if drag event happened then we should revert preventDefault state to original one
            // and try to process the drag event
            // else we shouldn't prevent default of the event and ignore processing the drag event
            if (!isVertDrag && !isHorzDrag) {
                this._private__preventTouchDragProcess = true;
            }
            this._private__touchMoveExceededManhattanDistance = true;
            // if manhattan distance is more that 5 - we should cancel tap event
            this._private__cancelTap = true;
            this._private__clearLongTapTimeout();
            this._private__resetTapTimeout();
        }
        if (!this._private__preventTouchDragProcess) {
            const compatEvent = this._private__makeCompatEvent(moveEvent, touch);
            this._private__processTouchEvent(compatEvent, this._private__handler._internal_touchMoveEvent);
            // we should prevent default in case of touch only
            // to prevent scroll of the page
            preventDefault(moveEvent);
        }
    }
    _private__mouseMoveWithDownHandler(moveEvent) {
        if (moveEvent.button !== 0 /* MouseEventButton.Left */) {
            return;
        }
        const moveInfo = this._private__touchMouseMoveWithDownInfo(getPosition(moveEvent), ensureNotNull(this._private__mouseMoveStartPosition));
        const { _internal_manhattanDistance: manhattanDistance } = moveInfo;
        if (manhattanDistance >= 5 /* Constants.CancelClickManhattanDistance */) {
            // if manhattan distance is more that 5 - we should cancel click event
            this._private__cancelClick = true;
            this._private__resetClickTimeout();
        }
        if (this._private__cancelClick) {
            // if this._cancelClick is true, that means that minimum manhattan distance is already exceeded
            const compatEvent = this._private__makeCompatEvent(moveEvent);
            this._private__processMouseEvent(compatEvent, this._private__handler._internal_pressedMouseMoveEvent);
        }
    }
    _private__touchMouseMoveWithDownInfo(currentPosition, startPosition) {
        const xOffset = Math.abs(startPosition._internal_x - currentPosition._internal_x);
        const yOffset = Math.abs(startPosition._internal_y - currentPosition._internal_y);
        const manhattanDistance = xOffset + yOffset;
        return {
            _internal_xOffset: xOffset,
            _internal_yOffset: yOffset,
            _internal_manhattanDistance: manhattanDistance,
        };
    }
    // eslint-disable-next-line complexity
    _private__touchEndHandler(touchEndEvent) {
        let touch = touchWithId(touchEndEvent.changedTouches, ensureNotNull(this._private__activeTouchId));
        if (touch === null && touchEndEvent.touches.length === 0) {
            // something went wrong, somehow we missed the required touchend event
            // probably the browser has not sent this event
            touch = touchEndEvent.changedTouches[0];
        }
        if (touch === null) {
            return;
        }
        this._private__activeTouchId = null;
        this._private__lastTouchEventTimeStamp = eventTimeStamp(touchEndEvent);
        this._private__clearLongTapTimeout();
        this._private__touchMoveStartPosition = null;
        if (this._private__unsubscribeRootTouchEvents) {
            this._private__unsubscribeRootTouchEvents();
            this._private__unsubscribeRootTouchEvents = null;
        }
        const compatEvent = this._private__makeCompatEvent(touchEndEvent, touch);
        this._private__processTouchEvent(compatEvent, this._private__handler._internal_touchEndEvent);
        ++this._private__tapCount;
        if (this._private__tapTimeoutId && this._private__tapCount > 1) {
            // check that both clicks are near enough
            const { _internal_manhattanDistance: manhattanDistance } = this._private__touchMouseMoveWithDownInfo(getPosition(touch), this._private__tapPosition);
            if (manhattanDistance < 30 /* Constants.DoubleTapManhattanDistance */ && !this._private__cancelTap) {
                this._private__processTouchEvent(compatEvent, this._private__handler._internal_doubleTapEvent);
            }
            this._private__resetTapTimeout();
        }
        else {
            if (!this._private__cancelTap) {
                this._private__processTouchEvent(compatEvent, this._private__handler._internal_tapEvent);
                // do not fire mouse events if tap handler was executed
                // prevent click event on new dom element (who appeared after tap)
                if (this._private__handler._internal_tapEvent) {
                    preventDefault(touchEndEvent);
                }
            }
        }
        // prevent, for example, safari's dblclick-to-zoom or fast-click after long-tap
        // we handle mouseDoubleClickEvent here ourselves
        if (this._private__tapCount === 0) {
            preventDefault(touchEndEvent);
        }
        if (touchEndEvent.touches.length === 0) {
            if (this._private__longTapActive) {
                this._private__longTapActive = false;
                // prevent native click event
                preventDefault(touchEndEvent);
            }
        }
    }
    _private__mouseUpHandler(mouseUpEvent) {
        if (mouseUpEvent.button !== 0 /* MouseEventButton.Left */) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(mouseUpEvent);
        this._private__mouseMoveStartPosition = null;
        this._private__mousePressed = false;
        if (this._private__unsubscribeRootMouseEvents) {
            this._private__unsubscribeRootMouseEvents();
            this._private__unsubscribeRootMouseEvents = null;
        }
        if (isFF()) {
            const rootElement = this._private__target.ownerDocument.documentElement;
            rootElement.removeEventListener('mouseleave', this._private__onFirefoxOutsideMouseUp);
        }
        if (this._private__firesTouchEvents(mouseUpEvent)) {
            return;
        }
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseUpEvent);
        ++this._private__clickCount;
        if (this._private__clickTimeoutId && this._private__clickCount > 1) {
            // check that both clicks are near enough
            const { _internal_manhattanDistance: manhattanDistance } = this._private__touchMouseMoveWithDownInfo(getPosition(mouseUpEvent), this._private__clickPosition);
            if (manhattanDistance < 5 /* Constants.DoubleClickManhattanDistance */ && !this._private__cancelClick) {
                this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseDoubleClickEvent);
            }
            this._private__resetClickTimeout();
        }
        else {
            if (!this._private__cancelClick) {
                this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseClickEvent);
            }
        }
    }
    _private__clearLongTapTimeout() {
        if (this._private__longTapTimeoutId === null) {
            return;
        }
        clearTimeout(this._private__longTapTimeoutId);
        this._private__longTapTimeoutId = null;
    }
    _private__touchStartHandler(downEvent) {
        if (this._private__activeTouchId !== null) {
            return;
        }
        const touch = downEvent.changedTouches[0];
        this._private__activeTouchId = touch.identifier;
        this._private__lastTouchEventTimeStamp = eventTimeStamp(downEvent);
        const rootElement = this._private__target.ownerDocument.documentElement;
        this._private__cancelTap = false;
        this._private__touchMoveExceededManhattanDistance = false;
        this._private__preventTouchDragProcess = false;
        this._private__touchMoveStartPosition = getPosition(touch);
        if (this._private__unsubscribeRootTouchEvents) {
            this._private__unsubscribeRootTouchEvents();
            this._private__unsubscribeRootTouchEvents = null;
        }
        {
            const boundTouchMoveWithDownHandler = this._private__touchMoveHandler.bind(this);
            const boundTouchEndHandler = this._private__touchEndHandler.bind(this);
            this._private__unsubscribeRootTouchEvents = () => {
                rootElement.removeEventListener('touchmove', boundTouchMoveWithDownHandler);
                rootElement.removeEventListener('touchend', boundTouchEndHandler);
            };
            rootElement.addEventListener('touchmove', boundTouchMoveWithDownHandler, { passive: false });
            rootElement.addEventListener('touchend', boundTouchEndHandler, { passive: false });
            this._private__clearLongTapTimeout();
            this._private__longTapTimeoutId = setTimeout(this._private__longTapHandler.bind(this, downEvent), 240 /* Delay.LongTap */);
        }
        const compatEvent = this._private__makeCompatEvent(downEvent, touch);
        this._private__processTouchEvent(compatEvent, this._private__handler._internal_touchStartEvent);
        if (!this._private__tapTimeoutId) {
            this._private__tapCount = 0;
            this._private__tapTimeoutId = setTimeout(this._private__resetTapTimeout.bind(this), 500 /* Delay.ResetClick */);
            this._private__tapPosition = getPosition(touch);
        }
    }
    _private__mouseDownHandler(downEvent) {
        if (downEvent.button !== 0 /* MouseEventButton.Left */) {
            return;
        }
        const rootElement = this._private__target.ownerDocument.documentElement;
        if (isFF()) {
            rootElement.addEventListener('mouseleave', this._private__onFirefoxOutsideMouseUp);
        }
        this._private__cancelClick = false;
        this._private__mouseMoveStartPosition = getPosition(downEvent);
        if (this._private__unsubscribeRootMouseEvents) {
            this._private__unsubscribeRootMouseEvents();
            this._private__unsubscribeRootMouseEvents = null;
        }
        {
            const boundMouseMoveWithDownHandler = this._private__mouseMoveWithDownHandler.bind(this);
            const boundMouseUpHandler = this._private__mouseUpHandler.bind(this);
            this._private__unsubscribeRootMouseEvents = () => {
                rootElement.removeEventListener('mousemove', boundMouseMoveWithDownHandler);
                rootElement.removeEventListener('mouseup', boundMouseUpHandler);
            };
            rootElement.addEventListener('mousemove', boundMouseMoveWithDownHandler);
            rootElement.addEventListener('mouseup', boundMouseUpHandler);
        }
        this._private__mousePressed = true;
        if (this._private__firesTouchEvents(downEvent)) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(downEvent);
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseDownEvent);
        if (!this._private__clickTimeoutId) {
            this._private__clickCount = 0;
            this._private__clickTimeoutId = setTimeout(this._private__resetClickTimeout.bind(this), 500 /* Delay.ResetClick */);
            this._private__clickPosition = getPosition(downEvent);
        }
    }
    _private__init() {
        this._private__target.addEventListener('mouseenter', this._private__mouseEnterHandler.bind(this));
        // Do not show context menu when something went wrong
        this._private__target.addEventListener('touchcancel', this._private__clearLongTapTimeout.bind(this));
        {
            const doc = this._private__target.ownerDocument;
            const outsideHandler = (event) => {
                if (!this._private__handler._internal_mouseDownOutsideEvent) {
                    return;
                }
                if (event.composed && this._private__target.contains(event.composedPath()[0])) {
                    return;
                }
                if (event.target && this._private__target.contains(event.target)) {
                    return;
                }
                this._private__handler._internal_mouseDownOutsideEvent();
            };
            this._private__unsubscribeOutsideTouchEvents = () => {
                doc.removeEventListener('touchstart', outsideHandler);
            };
            this._private__unsubscribeOutsideMouseEvents = () => {
                doc.removeEventListener('mousedown', outsideHandler);
            };
            doc.addEventListener('mousedown', outsideHandler);
            doc.addEventListener('touchstart', outsideHandler, { passive: true });
        }
        if (isIOS()) {
            this._private__unsubscribeMobileSafariEvents = () => {
                this._private__target.removeEventListener('dblclick', this._private__onMobileSafariDoubleClick);
            };
            this._private__target.addEventListener('dblclick', this._private__onMobileSafariDoubleClick);
        }
        this._private__target.addEventListener('mouseleave', this._private__mouseLeaveHandler.bind(this));
        this._private__target.addEventListener('touchstart', this._private__touchStartHandler.bind(this), { passive: true });
        preventScrollByWheelClick(this._private__target);
        this._private__target.addEventListener('mousedown', this._private__mouseDownHandler.bind(this));
        this._private__initPinch();
        // Hey mobile Safari, what's up?
        // If mobile Safari doesn't have any touchmove handler with passive=false
        // it treats a touchstart and the following touchmove events as cancelable=false,
        // so we can't prevent them (as soon we subscribe on touchmove inside touchstart's handler).
        // And we'll get scroll of the page along with chart's one instead of only chart's scroll.
        this._private__target.addEventListener('touchmove', () => { }, { passive: false });
    }
    _private__initPinch() {
        if (this._private__handler._internal_pinchStartEvent === undefined &&
            this._private__handler._internal_pinchEvent === undefined &&
            this._private__handler._internal_pinchEndEvent === undefined) {
            return;
        }
        this._private__target.addEventListener('touchstart', (event) => this._private__checkPinchState(event.touches), { passive: true });
        this._private__target.addEventListener('touchmove', (event) => {
            if (event.touches.length !== 2 || this._private__startPinchMiddlePoint === null) {
                return;
            }
            if (this._private__handler._internal_pinchEvent !== undefined) {
                const currentDistance = getDistance(event.touches[0], event.touches[1]);
                const scale = currentDistance / this._private__startPinchDistance;
                this._private__handler._internal_pinchEvent(this._private__startPinchMiddlePoint, scale);
                preventDefault(event);
            }
        }, { passive: false });
        this._private__target.addEventListener('touchend', (event) => {
            this._private__checkPinchState(event.touches);
        });
    }
    _private__checkPinchState(touches) {
        if (touches.length === 1) {
            this._private__pinchPrevented = false;
        }
        if (touches.length !== 2 || this._private__pinchPrevented || this._private__longTapActive) {
            this._private__stopPinch();
        }
        else {
            this._private__startPinch(touches);
        }
    }
    _private__startPinch(touches) {
        const box = getBoundingClientRect(this._private__target);
        this._private__startPinchMiddlePoint = {
            _internal_x: ((touches[0].clientX - box.left) + (touches[1].clientX - box.left)) / 2,
            _internal_y: ((touches[0].clientY - box.top) + (touches[1].clientY - box.top)) / 2,
        };
        this._private__startPinchDistance = getDistance(touches[0], touches[1]);
        if (this._private__handler._internal_pinchStartEvent !== undefined) {
            this._private__handler._internal_pinchStartEvent();
        }
        this._private__clearLongTapTimeout();
    }
    _private__stopPinch() {
        if (this._private__startPinchMiddlePoint === null) {
            return;
        }
        this._private__startPinchMiddlePoint = null;
        if (this._private__handler._internal_pinchEndEvent !== undefined) {
            this._private__handler._internal_pinchEndEvent();
        }
    }
    _private__mouseLeaveHandler(event) {
        if (this._private__unsubscribeMousemove) {
            this._private__unsubscribeMousemove();
        }
        if (this._private__firesTouchEvents(event)) {
            return;
        }
        if (!this._private__acceptMouseLeave) {
            // mobile Safari sometimes emits mouse leave event for no reason, there is no way to handle it in other way
            // just ignore this event if there was no mouse move or mouse enter events
            return;
        }
        const compatEvent = this._private__makeCompatEvent(event);
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseLeaveEvent);
        // accept all mouse leave events if it's not an iOS device
        this._private__acceptMouseLeave = !isIOS();
    }
    _private__longTapHandler(event) {
        const touch = touchWithId(event.touches, ensureNotNull(this._private__activeTouchId));
        if (touch === null) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(event, touch);
        this._private__processTouchEvent(compatEvent, this._private__handler._internal_longTapEvent);
        this._private__cancelTap = true;
        // long tap is active until touchend event with 0 touches occurred
        this._private__longTapActive = true;
    }
    _private__firesTouchEvents(e) {
        if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents !== undefined) {
            return e.sourceCapabilities.firesTouchEvents;
        }
        return eventTimeStamp(e) < this._private__lastTouchEventTimeStamp + 500 /* Delay.PreventFiresTouchEvents */;
    }
    _private__processTouchEvent(event, callback) {
        if (callback) {
            callback.call(this._private__handler, event);
        }
    }
    _private__processMouseEvent(event, callback) {
        if (!callback) {
            return;
        }
        callback.call(this._private__handler, event);
    }
    _private__makeCompatEvent(event, touch) {
        // TouchEvent has no clientX/Y coordinates:
        // We have to use the last Touch instead
        const eventLike = touch || event;
        const box = this._private__target.getBoundingClientRect() || { left: 0, top: 0 };
        return {
            clientX: eventLike.clientX,
            clientY: eventLike.clientY,
            pageX: eventLike.pageX,
            pageY: eventLike.pageY,
            screenX: eventLike.screenX,
            screenY: eventLike.screenY,
            localX: (eventLike.clientX - box.left),
            localY: (eventLike.clientY - box.top),
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            _internal_isTouch: !event.type.startsWith('mouse') && event.type !== 'contextmenu' && event.type !== 'click',
            _internal_srcType: event.type,
            _internal_target: eventLike.target,
            _internal_view: event.view,
            _internal_preventDefault: () => {
                if (event.type !== 'touchstart') {
                    // touchstart is passive and cannot be prevented
                    preventDefault(event);
                }
            },
        };
    }
}
function getBoundingClientRect(element) {
    return element.getBoundingClientRect() || { left: 0, top: 0 };
}
function getDistance(p1, p2) {
    const xDiff = p1.clientX - p2.clientX;
    const yDiff = p1.clientY - p2.clientY;
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}
function preventDefault(event) {
    if (event.cancelable) {
        event.preventDefault();
    }
}
function getPosition(eventLike) {
    return {
        _internal_x: eventLike.pageX,
        _internal_y: eventLike.pageY,
    };
}
function eventTimeStamp(e) {
    // for some reason e.timestamp is always 0 on iPad with magic mouse, so we use performance.now() as a fallback
    return e.timeStamp || performance.now();
}
function touchWithId(touches, id) {
    for (let i = 0; i < touches.length; ++i) {
        if (touches[i].identifier === id) {
            return touches[i];
        }
    }
    return null;
}
