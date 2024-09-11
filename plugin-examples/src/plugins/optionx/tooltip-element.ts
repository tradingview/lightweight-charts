import { IChartApi } from 'lightweight-charts';

export interface TooltipOptions {
	title: string;
	followMode: 'top' | 'tracking';
	/** fallback horizontal deadzone width */
	horizontalDeadzoneWidth: number;
	verticalDeadzoneHeight: number;
	verticalSpacing: number;
	/** topOffset is the vertical spacing when followMode is 'top' */
	topOffset: number;
}

const defaultOptions: TooltipOptions = {
	title: '',
	followMode: 'tracking',
	horizontalDeadzoneWidth: 45,
	verticalDeadzoneHeight: 100,
	verticalSpacing: 20,
	topOffset: 20,
};

export interface TooltipContentData {
	title?: string;
	price: string;
	date: string;
	time: string;
}

export interface TooltipPosition {
	visible: boolean;
	paneX: number;
	paneY: number;
}

export class TooltipElement {
	private _chart: IChartApi | null;

	private _element: HTMLDivElement | null;
	private _titleElement: HTMLDivElement | null;
	private _priceElement: HTMLDivElement | null;
	private _dateElement: HTMLDivElement | null;
	private _timeElement: HTMLDivElement | null;

	private _options: TooltipOptions;

	private _lastTooltipWidth: number | null = null;

	public constructor(chart: IChartApi, options: Partial<TooltipOptions>) {
		this._options = {
			...defaultOptions,
			...options,
		};
		this._chart = chart;

		const element = document.createElement('div');
		applyStyle(element, {
			display: 'flex',
			'flex-direction': 'column',
			'align-items': 'center',
			position: 'absolute',
			transform: 'translate(calc(0px - 50%), 0px)',
			opacity: '0',
			left: '0%',
			top: '0',
			'z-index': '100',
			'background-color': 'white',
			'border-radius': '4px',
			padding: '5px 10px',
			'font-family':
				"-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
			'font-size': '12px',
			'font-weight': '400',
			'box-shadow': '0px 2px 4px rgba(0, 0, 0, 0.2)',
			'line-height': '16px',
			'pointer-events': 'none',
			color: '#131722',
		});

		const titleElement = document.createElement('div');
		applyStyle(titleElement, {
			'font-size': '16px',
			'line-height': '24px',
			'font-weight': '590',
		});
		setElementText(titleElement, this._options.title);
		element.appendChild(titleElement);

		const priceElement = document.createElement('div');
		applyStyle(priceElement, {
			'font-size': '14px',
			'line-height': '18px',
			'font-weight': '590',
		});
		setElementText(priceElement, '');
		element.appendChild(priceElement);

		const dateElement = document.createElement('div');
		applyStyle(dateElement, {
			color: '#787B86',
		});
		setElementText(dateElement, '');
		element.appendChild(dateElement);

		const timeElement = document.createElement('div');
		applyStyle(timeElement, {
			color: '#787B86',
		});
		setElementText(timeElement, '');
		element.appendChild(timeElement);

		this._element = element;
		this._titleElement = titleElement;
		this._priceElement = priceElement;
		this._dateElement = dateElement;
		this._timeElement = timeElement;

		const chartElement = this._chart.chartElement();
		chartElement.appendChild(this._element);

		const chartElementParent = chartElement.parentElement;
		if (!chartElementParent) {
			console.error('Chart Element is not attached to the page.');
			return;
		}
		const position = getComputedStyle(chartElementParent).position;
		if (position !== 'relative' && position !== 'absolute') {
			console.error('Chart Element position is expected be `relative` or `absolute`.');
		}
	}

	public destroy() {
		if (this._chart && this._element)
			this._chart.chartElement().removeChild(this._element);
	}

	public applyOptions(options: Partial<TooltipOptions>) {
		this._options = {
			...this._options,
			...options,
		};
	}

	public options(): TooltipOptions {
		return this._options;
	}

	public updateTooltipContent(tooltipContentData: TooltipContentData) {
		if (!this._element) return;
		const tooltipMeasurement = this._element.getBoundingClientRect();
		this._lastTooltipWidth = tooltipMeasurement.width;
		if (tooltipContentData.title !== undefined && this._titleElement) {
			setElementText(this._titleElement, tooltipContentData.title);
		}
		setElementText(this._priceElement, tooltipContentData.price);
		setElementText(this._dateElement, tooltipContentData.date);
		setElementText(this._timeElement, tooltipContentData.time);
	}

	public updatePosition(positionData: TooltipPosition) {
		if (!this._chart || !this._element) return;
		this._element.style.opacity = positionData.visible ? '1' : '0';
		if (!positionData.visible) {
			return;
		}
		const x = this._calculateXPosition(positionData, this._chart);
		const y = this._calculateYPosition(positionData);
		this._element.style.transform = `translate(${x}, ${y})`;
	}

	private _calculateXPosition(
		positionData: TooltipPosition,
		chart: IChartApi
	): string {
		const x = positionData.paneX + chart.priceScale('left').width();
		const deadzoneWidth = this._lastTooltipWidth
			? Math.ceil(this._lastTooltipWidth / 2)
			: this._options.horizontalDeadzoneWidth;
		const xAdjusted = Math.min(
			Math.max(deadzoneWidth, x),
			chart.timeScale().width() - deadzoneWidth
		);
		return `calc(${xAdjusted}px - 50%)`;
	}

	private _calculateYPosition(positionData: TooltipPosition): string {
		if (this._options.followMode == 'top') {
			return `${this._options.topOffset}px`;
		}
		const y = positionData.paneY;
		const flip =
			y <= this._options.verticalSpacing + this._options.verticalDeadzoneHeight;
		const yPx = y + (flip ? 1 : -1) * this._options.verticalSpacing;
		const yPct = flip ? '' : ' - 100%';
		return `calc(${yPx}px${yPct})`;
	}
}

function setElementText(element: HTMLDivElement | null, text: string) {
	if (!element || text === element.innerText) return;
	element.innerText = text;
	element.style.display = text ? 'block' : 'none';
}

function applyStyle(element: HTMLElement, styles: Record<string, string>) {
	for (const [key, value] of Object.entries(styles)) {
		element.style.setProperty(key, value);
	}
}
