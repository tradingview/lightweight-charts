import { MouseEventHandler } from "../../api/ichart-api";

export class MouseHandlerDataModel<HorzScaleItem> {
  mouseEnterHandler: MouseEventHandler<HorzScaleItem>;
  mouseLeaveHandler: MouseEventHandler<HorzScaleItem>;
  mouseHoverHandler: MouseEventHandler<HorzScaleItem>;
  mouseDownEventHandler: MouseEventHandler<HorzScaleItem>;
  mouseUpEventHandler: MouseEventHandler<HorzScaleItem>;
  onMouseClickHandler: MouseEventHandler<HorzScaleItem>;
  tapEventHandler: MouseEventHandler<HorzScaleItem>;
  doubleTapEventHandler: MouseEventHandler<HorzScaleItem>;
  longTapEventHandler: MouseEventHandler<HorzScaleItem>;

  constructor(
    mouseEnterHandler: MouseEventHandler<HorzScaleItem>,
    mouseLeaveHandler: MouseEventHandler<HorzScaleItem>,
    mouseHoverHandler: MouseEventHandler<HorzScaleItem>,
    mouseDownEventHandler: MouseEventHandler<HorzScaleItem>,
    mouseUpEventHandler: MouseEventHandler<HorzScaleItem>,
    onMouseClickHandler: MouseEventHandler<HorzScaleItem>,
    tapEventHandler: MouseEventHandler<HorzScaleItem>,
    doubleTapEventHandler: MouseEventHandler<HorzScaleItem>,
    longTapEventHandler: MouseEventHandler<HorzScaleItem>
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

  setMouseEnterHandler(mouseEnterHandler: MouseEventHandler<HorzScaleItem>) {
    this.mouseEnterHandler = mouseEnterHandler;
  }

  setMouseLeaveHandler(mouseLeaveHandler: MouseEventHandler<HorzScaleItem>) {
    this.mouseLeaveHandler = mouseLeaveHandler;
  }

  setMouseHoverHandler(mouseHoverHandler: MouseEventHandler<HorzScaleItem>) {
    this.mouseHoverHandler = mouseHoverHandler;
  }

  setMouseDownEventHandler(mouseDownEventHandler: MouseEventHandler<HorzScaleItem>) {
    this.mouseDownEventHandler = mouseDownEventHandler;
  }

  setMouseUpEventHandler(mouseUpEventHandler: MouseEventHandler<HorzScaleItem>) {
    this.mouseUpEventHandler = mouseUpEventHandler;
  }

  setMouseClickHandler(onMouseClickHandler: MouseEventHandler<HorzScaleItem>) {
    this.onMouseClickHandler = onMouseClickHandler;
  }

  setTapEventHandler(tapEventHandler: MouseEventHandler<HorzScaleItem>) {
    this.tapEventHandler = tapEventHandler;
  }

  setDoubleTapEventHandler(doubleTapEventHandler: MouseEventHandler<HorzScaleItem>) {
    this.doubleTapEventHandler = doubleTapEventHandler;
  }

  setLongTapEventHandler(longTapEventHandler: MouseEventHandler<HorzScaleItem>) {
    this.longTapEventHandler = longTapEventHandler;
  }
}