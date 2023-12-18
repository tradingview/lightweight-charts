class MouseHandlerDataModel {
	constructor(
    mouseEnterHandler,
    mouseLeaveHandler,
		mouseHoverHandler,
		mouseDownEventHandler,
		mouseUpEventHandler,
		onMouseClickHandler,
		tapEventHandler,
		doubleTapEventHandler,
		longTapEventHandler
	) {
    this.mouseEnterHandler = mouseEnterHandler;
    this.mouseLeaveHandler = mouseLeaveHandler;
    this.mouseHoverHandler = mouseHoverHandler;
    this.mouseDownEventHandler = mouseDownEventHandler;
    this.mouseUpEventHandler = mouseUpEventHandler;
    this.onMouseClickHandler = onMouseClickHandler;
    this.tapEventHandler = tapEventHandler;
    this.doubleTapEventHandler = doubleTapEventHandler;
    this.longTapEventHandler = longTapEventHandler;
  }

  getMouseEnterHandler() {
    return this.mouseEnterHandler;
  }

  getMouseLeaveHandler() {
    return this.mouseLeaveHandler;
  }

  getMouseHoverHandler() {
    return this.mouseHoverHandler;
  }

  getMouseDownEventHandler() {
    return this.mouseDownEventHandler;
  }

  getMouseUpEventHandler() {
    return this.mouseUpEventHandler;
  }

	getMouseClickHandler() {
    return this.onMouseClickHandler;
  }

	getTapEventHandler() {
    return this.tapEventHandler;
  }

	getDoubleTapEventHandler() {
    return this.doubleTapEventHandler;
  }

	getLongTapEventHandler() {
    return this.longTapEventHandler;
  }

  setMouseEnterHandler(mouseEnterHandler) {
    this.mouseEnterHandler = mouseEnterHandler;
  }

  setMouseLeaveHandler(mouseLeaveHandler) {
    this.mouseLeaveHandler = mouseLeaveHandler;
  }

  setMouseHoverHandler(mouseHoverHandler) {
    this.mouseHoverHandler = mouseHoverHandler;
  }

  setMouseDownEventHandler(mouseDownEventHandler) {
    this.mouseDownEventHandler = mouseDownEventHandler;
  }

  setMouseUpEventHandler(mouseUpEventHandler) {
    this.mouseUpEventHandler = mouseUpEventHandler;
  }

	setMouseClickHandler(onMouseClickHandler) {
    this.onMouseClickHandler = onMouseClickHandler;
  }

	setTapEventHandler(tapEventHandler) {
    this.tapEventHandler = tapEventHandler;
  }

	setDoubleTapEventHandler(doubleTapEventHandler) {
    this.doubleTapEventHandler = doubleTapEventHandler;
  }

	setLongTapEventHandler(longTapEventHandler) {
    this.longTapEventHandler = longTapEventHandler;
  }
}