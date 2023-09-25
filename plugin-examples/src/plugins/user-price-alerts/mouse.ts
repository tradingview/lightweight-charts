import { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import { Delegate, ISubscription } from '../../helpers/delegate';

export interface MousePosition {
	x: number;
	y: number;
	xPositionRelativeToPriceScale: number;
	overPriceScale: boolean;
	overTimeScale: boolean;
}

type UnSubscriber = () => void;

/**
 * We are using our own mouse listeners on the container because
 * we need to know the mouse position when over the price scale
 * (in addition to the chart pane)
 */

export class MouseHandlers {
	_chart: IChartApi | undefined = undefined;
	_series: ISeriesApi<SeriesType> | undefined = undefined;
	_unSubscribers: UnSubscriber[] = [];

	private _clicked: Delegate<MousePosition | null> = new Delegate();
	private _mouseMoved: Delegate<MousePosition | null> = new Delegate();

	attached(chart: IChartApi, series: ISeriesApi<SeriesType>) {
		this._chart = chart;
		this._series = series;
		const container = this._chart.chartElement();
		this._addMouseEventListener(
			container,
			'mouseleave',
			this._mouseLeave
		);
		this._addMouseEventListener(
			container,
			'mousemove',
			this._mouseMove
		);
		this._addMouseEventListener(
			container,
			'click',
			this._mouseClick
		);
	}

	detached() {
		this._series = undefined;
        this._clicked.destroy();
        this._mouseMoved.destroy();
		this._unSubscribers.forEach(unSub => {
			unSub();
		});
		this._unSubscribers = [];
	}

	public clicked(): ISubscription<MousePosition | null> {
		return this._clicked;
	}

	public mouseMoved(): ISubscription<MousePosition | null> {
		return this._mouseMoved;
	}

	_addMouseEventListener(
		target: HTMLDivElement,
		eventType: 'mouseleave' | 'mousemove' | 'click',
		handler: (event: MouseEvent) => void
	): void {
		const boundMouseMoveHandler = handler.bind(this);
		target.addEventListener(eventType, boundMouseMoveHandler);
		const unSubscriber = () => {
			target.removeEventListener(eventType, boundMouseMoveHandler);
		};
		this._unSubscribers.push(unSubscriber);
	}

	_mouseLeave() {
		this._mouseMoved.fire(null);
	}
	_mouseMove(event: MouseEvent) {
		this._mouseMoved.fire(this._determineMousePosition(event));
	}
	_mouseClick(event: MouseEvent) {
		this._clicked.fire(this._determineMousePosition(event));
	}

	_determineMousePosition(event: MouseEvent): MousePosition | null {
		if (!this._chart || !this._series) return null;
		const element = this._chart.chartElement();
		const chartContainerBox = element.getBoundingClientRect();
		const priceScaleWidth = this._series.priceScale().width();
		const timeScaleHeight = this._chart.timeScale().height();
		const x = event.clientX - chartContainerBox.x;
		const y = event.clientY - chartContainerBox.y;
		const overTimeScale = y > element.clientHeight - timeScaleHeight;
		const xPositionRelativeToPriceScale =
		element.clientWidth - priceScaleWidth - x;
		const overPriceScale = xPositionRelativeToPriceScale < 0;
		return {
			x,
			y,
			xPositionRelativeToPriceScale,
			overPriceScale,
			overTimeScale,
		};
	}
}
