import { MouseHandlerDataModel } from "../model/mouse-handler-data-model";

export class TrendLineDrawingController<HorzScaleItem> {

  private mouseHandlerDataModel: MouseHandlerDataModel<HorzScaleItem> | undefined;

  chart: any = null;
  domElement: any;
  klines: any = null;
  xspan: any = null;
  candleseries: any = null;
  lineSeries: any = null;

  // handle chart status
  private isUpdatingLine = false;
  private isDragging = false;
  private isHovered = false;

  private startPoint: any = null;
  private selectedPoint: any = null; //null/0/1
  private dragStartPoint: any = null;
  private dragStartLineData: any[] = [{ time: '', value: '' }];
  private lastCrosshairPosition: any = null;
  private hoverThreshold = 0.1;

  constructor(
    chart: any,
    domElement: any,
    klines: any,
    xspan: any,
    candleseries: any,
  ) {
    this.chart = chart;
    this.domElement = domElement;
    this.klines = klines;
    this.xspan = xspan;
    this.candleseries = candleseries;
    this.lineSeries = this.chart.addLineSeries();
  }

  mouseHandler() {
    this.mouseHandlerDataModel = new MouseHandlerDataModel(
      this.mouseEnterHandler,
      this.mouseLeaveHandler,
      this.mouseHoverHandler,
      this.mouseDownEventHandler,
      this.mouseUpEventHandler,
      this.onMouseClickHandler,
      this.tapEventHandler,
      this.doubleTapEventHandler,
      this.longTapEventHandler
    );

    this.chart?.subscribeMouseEnterEvent(this.mouseHandlerDataModel.mouseEnterHandler);
    this.chart?.subscribeMouseLeaveEvent(this.mouseHandlerDataModel.mouseLeaveHandler);
    this.chart?.subscribeCrosshairMove(this.mouseHandlerDataModel.mouseHoverHandler);
    this.chart?.subscribeMouseDownEvent(this.mouseHandlerDataModel.mouseDownEventHandler);
    this.chart?.subscribeMouseUpEvent(this.mouseHandlerDataModel.mouseUpEventHandler);
    this.chart?.subscribeClick(this.mouseHandlerDataModel.onMouseClickHandler);
    this.chart?.subscribeTapEvent(this.mouseHandlerDataModel.tapEventHandler);
    this.chart?.subscribeDoubleTapEvent(this.mouseHandlerDataModel.doubleTapEventHandler);
    this.chart?.subscribeLongTapEvent(this.mouseHandlerDataModel.longTapEventHandler);
  }

  mouseEnterHandler = (param: any): void => {
    console.log('mouse enter: ', param);
  }

  mouseLeaveHandler = (param: any): void => {
    console.log('mouse leave: ', param);
  }

  mouseHoverHandler = (param: any): void => {
    // console.log('mouse hover: ', param);
    if (this.isUpdatingLine || !param.point) return;
    const xTs = param.time
      ? param.time
      : (this.klines[0].time + param.logical * this.xspan);
    const yPrice = this.candleseries.coordinateToPrice(param.point.y);
    this.lastCrosshairPosition = { x: xTs, y: yPrice };

    this.startPoint
      ? this.updateLine(xTs, yPrice)
      : this.handleHoverEffect(xTs, yPrice);

    if (this.isDragging) {
      const deltaX = xTs - this.dragStartPoint.x;
      const deltaY = yPrice - this.dragStartPoint.y;

      let newLineData;
      newLineData = this.dragStartLineData.map((point, i) =>
        this.selectedPoint !== null
          ? i === this.selectedPoint
            ? {
              time: (point.time + deltaX),
              value: point.value + deltaY,
            }
            : point
          : {
            time: (point.time + deltaX),
            value: point.value + deltaY,
          }
      );
      if (newLineData[0].time === newLineData[1].time) return;
      
      // newLineData.sort((a, b) => a.time - b.time);
      this.dragLine(newLineData);
    }
  }

  mouseDownEventHandler = (param: any): void => {
    console.log('mouse down: ', param);
    if (!this.lastCrosshairPosition) return;
    if (this.isHovered) {
      this.startDrag(
        this.lastCrosshairPosition.x,
        this.lastCrosshairPosition.y
      );
    }
  }

  mouseUpEventHandler = (param: any): void => {
    console.log('mouse up: ', param);
    this.endDrag();
  }

  onMouseClickHandler = (param: any): void => {
    console.log('mouse click: ', param);
    console.log("handleChartClick triggered");
    if (this.isUpdatingLine) return;
    if (this.isDragging) return;
    const xTs = param.time
      ? param.time
      : this.klines[0].time + param.logical * this.xspan;
    const yPrice = this.candleseries.coordinateToPrice(param.point.y);
    this.isHovered
      ? this.startDrag(xTs, yPrice)
      : this.handleLineDrawing(xTs, yPrice);
  }

  tapEventHandler = (param: any): void => {
    console.log('tag: ', param);
  }

  doubleTapEventHandler = (param: any): void => {
    console.log('double tag: ', param);
  }

  longTapEventHandler = (param: any): void => {
    console.log('long tag: ', param);
  }

  handleLineDrawing(xTs: any, yPrice: any) {
    if (!this.startPoint) {
      this.startPoint = { time: xTs, price: yPrice };
    } else {
      if (this.startPoint.time === xTs) return;

      let newData = [
        { time: this.startPoint.time, value: this.startPoint.price },
        { time: xTs, value: yPrice },
      ];
      newData.sort((a, b) => a.time - b.time);
      this.lineSeries.setData(newData);
      this.startPoint = null;
      this.selectedPoint = null;
    }
  }

  handleHoverEffect(xTs: any, yPrice: any) {
    const linedata = this.lineSeries.data();
    if (!linedata.length) return;

    const hoverStatus = this.isLineHovered(
      xTs,
      yPrice,
      linedata[0],
      linedata[1]
    );
    if (hoverStatus && !this.isHovered) {
      this.startHover();
    }

    if (!hoverStatus && this.isHovered && !this.isDragging) {
      this.endHover();
    }
  }

  startHover() {
    this.isHovered = true;
    this.lineSeries.applyOptions({ color: "orange" });
    this.domElement.style.cursor = "pointer";
    this.chart.applyOptions({ handleScroll: false, handleScale: false });
  }

  endHover() {
    this.isHovered = false;
    this.lineSeries.applyOptions({ color: "dodgerblue" });
    this.domElement.style.cursor = "default";
    this.chart.applyOptions({ handleScroll: true, handleScale: true });
  }

  startDrag(xTs: any, yPrice: any) {
    console.log("startDrag triggered");
    this.isDragging = true;
    this.dragStartPoint = { x: xTs, y: yPrice };
    this.dragStartLineData = [...this.lineSeries.data()];
  }

  endDrag() {
    console.log("endDrag triggered");
    this.isDragging = false;
    this.dragStartPoint = null;
    this.dragStartLineData = [];
    this.selectedPoint = null;
  }

  updateLine(xTs: any, yPrice: any) {
    // try {
    if (this.startPoint.time === xTs) return;
    this.isUpdatingLine = true;
    let newData = [
      { time: this.startPoint.time, value: this.startPoint.price },
      { time: xTs, value: yPrice },
    ];
    newData.sort((a, b) => a.time - b.time);
    this.lineSeries.setData(newData);
    this.selectedPoint = null;
    this.isUpdatingLine = false;
    // } catch (e) {
    //   console.log(e);
    // }
  }

  dragLine(newCords: any) {
    this.isUpdatingLine = true;
    this.lineSeries.setData(newCords);
    this.isUpdatingLine = false;
  }

  isLineHovered(xTs: any, yPrice: any, point1: any, point2: any) {
    // CHECK IF POINT IS SELECTED
    if (this.isDragging) return true;
    const isPoint1 =
      xTs === point1.time &&
      (Math.abs(yPrice - point1.value) * 100) / yPrice < this.hoverThreshold;
    if (isPoint1) {
      this.selectedPoint = 0;
      return true;
    }
    const isPoint2 =
      xTs === point2.time &&
      (Math.abs(yPrice - point2.value) * 100) / yPrice < this.hoverThreshold;
    if (isPoint2) {
      this.selectedPoint = 1;
      return true;
    }

    this.selectedPoint = null;
    const m = (point2.value - point1.value) / (point2.time - point1.time);
    const c = point1.value - m * point1.time;
    const estimatedY = m * xTs + c;
    return (Math.abs(yPrice - estimatedY) * 100) / yPrice < this.hoverThreshold;
  }

  unsubscribeMouseEvent() {
    if (!this.mouseHandlerDataModel) return;
    this.chart?.unsubscribeCrosshairMove(this.mouseHandlerDataModel.mouseHoverHandler);
    this.chart?.unsubscribeMouseDownEvent(this.mouseHandlerDataModel.mouseDownEventHandler);
    this.chart?.unsubscribeMouseUpEvent(this.mouseHandlerDataModel.mouseUpEventHandler);
    this.chart?.unsubscribeClick(this.mouseHandlerDataModel.onMouseClickHandler);
    this.chart?.unsubscribeTapEvent(this.mouseHandlerDataModel.tapEventHandler);
    this.chart?.unsubscribeDoubleTapEvent(this.mouseHandlerDataModel.doubleTapEventHandler);
    this.chart?.unsubscribeLongTapEvent(this.mouseHandlerDataModel.longTapEventHandler);
    this.chart?.unsubscribeMouseEnterEvent(this.mouseHandlerDataModel.mouseEnterHandler);
    this.chart?.unsubscribeMouseLeaveEvent(this.mouseHandlerDataModel.mouseLeaveHandler);
  }

  destory() {
    this.unsubscribeMouseEvent();
    this.mouseHandlerDataModel = undefined;
    this.dragStartLineData = [];
  }


}