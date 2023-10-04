import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	CrosshairMode,
	IChartApi,
	ISeriesApi,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	MouseEventParams,
	SeriesType,
	SeriesPrimitivePaneViewZOrder,
	LineStyle
} from 'lightweight-charts';
import { PluginBase } from '../plugin-base';
import { positionsBox, positionsLine } from '../../helpers/dimensions/positions';

const LABEL_HEIGHT = 21;
const plusIcon = `M7.5,7.5 m -7,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0 M4 7.5H11 M7.5 4V11`;
const plusIconPath = new Path2D(plusIcon);
const plusIconSize = 15; // Icon is 15x15

class UserPriceLineDataBase {
	_y: number = 0;
	_data: UserPriceLinesData;
	constructor(data: UserPriceLinesData) {
		this._data = data;
	}

	update(data: UserPriceLinesData, series: ISeriesApi<SeriesType>): void {
		this._data = data;
		if (!this._data.price) {
			this._y = -10000;
			return;
		}
		this._y = series.priceToCoordinate(this._data.price) ?? -10000;
	}
}

interface UserPriceLinesRendererData {
	visible: boolean;
	textColor: string;
	color: string;
	y: number;
	rightX: number;
	hoverColor: string;
	hovered: boolean;
}

class UserPriceLinesPaneRenderer implements ISeriesPrimitivePaneRenderer {
	_data: UserPriceLinesRendererData;

	constructor(data: UserPriceLinesRendererData) {
		this._data = data;
	}

	draw(target: CanvasRenderingTarget2D) {
		if (!this._data.visible) return;
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;

			const height = LABEL_HEIGHT;
			const width = height + 1;

			const xPos = positionsBox(this._data.rightX - width, this._data.rightX - 1, scope.horizontalPixelRatio);
			const yPos = positionsLine(this._data.y, scope.verticalPixelRatio, height);

			ctx.fillStyle = this._data.color;
			const roundedArray = [5, 0, 0, 5].map(i => i * scope.horizontalPixelRatio);
			ctx.beginPath();
			ctx.roundRect(xPos.position, yPos.position, xPos.length, yPos.length, roundedArray);
			ctx.fill();

			if (this._data.hovered) {
				ctx.fillStyle = this._data.hoverColor;
				ctx.beginPath();
				ctx.roundRect(xPos.position, yPos.position, xPos.length, yPos.length, roundedArray);
				ctx.fill();
			}

			ctx.translate(xPos.position + 3 * scope.horizontalPixelRatio, yPos.position + 3 * scope.verticalPixelRatio);
			ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);
			const iconScaling = 15 / plusIconSize;
			ctx.scale(iconScaling, iconScaling);
			ctx.strokeStyle = this._data.textColor;
			ctx.lineWidth = 1;
			ctx.stroke(plusIconPath);
		});
	}
}

class UserPriceLinesPaneView
	extends UserPriceLineDataBase
	implements ISeriesPrimitivePaneView
{
	renderer(): ISeriesPrimitivePaneRenderer | null {
		const color = this._data.crosshairColor;
		return new UserPriceLinesPaneRenderer({
			visible: this._data.visible,
			y: this._y,
			color,
			textColor: this._data.crosshairLabelColor,
			rightX: this._data.timeScaleWidth,
			hoverColor: this._data.hoverColor,
			hovered: this._data.hovered ?? false,
		});
	}

    zOrder(): SeriesPrimitivePaneViewZOrder {
        return 'top';
    }
}

interface UserPriceLinesData {
	visible: boolean;
	hovered?: boolean;
	price?: number;
	timeScaleWidth: number;
	crosshairLabelColor: string;
	crosshairColor: string;
	lineColor: string;
	hoverColor: string;
}

class UserPriceLinesLabelButton extends PluginBase {
	_paneViews: UserPriceLinesPaneView[];
	_data: UserPriceLinesData = {
		visible: false,
		hovered: false,
		timeScaleWidth: 0,
		crosshairLabelColor: '#000000',
		crosshairColor: '#ffffff',
		lineColor: '#000000',
		hoverColor: '#777777',
	};
	_source: UserPriceLines;

	constructor(source: UserPriceLines) {
		super();
		this._paneViews = [new UserPriceLinesPaneView(this._data)];
		this._source = source;
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update(this._data, this.series));
	}

	priceAxisViews() {
		return [];
	}

	paneViews() {
		return this._paneViews;
	}

	showAddLabel(price: number, hovered: boolean) {
		const crosshairColor =
			this.chart.options().crosshair.horzLine.labelBackgroundColor;
		this._data = {
			visible: true,
			price,
			hovered,
			timeScaleWidth: this.chart.timeScale().width(),
			crosshairColor,
			crosshairLabelColor: '#FFFFFF',
			lineColor: this._source.currentLineColor(),
			hoverColor: this._source.currentHoverColor(),
		};
		this.updateAllViews();
		this.requestUpdate();
	}

	hideAddLabel() {
		this._data.visible = false;
		this.updateAllViews();
		this.requestUpdate();
	}
}

const defaultOptions: UserPriceLinesOptions = {
	color: '#000000',
	hoverColor: '#777777',
	limitToOne: true,
};

export interface UserPriceLinesOptions {
	color: string;
	hoverColor: string
	limitToOne: boolean;
}

export class UserPriceLines {
	private _chart: IChartApi | undefined;
	private _series: ISeriesApi<SeriesType> | undefined;
	private _options: UserPriceLinesOptions;
	private _labelButtonPrimitive: UserPriceLinesLabelButton;

	constructor(
		chart: IChartApi,
		series: ISeriesApi<SeriesType>,
		options: Partial<UserPriceLinesOptions>
	) {
		this._chart = chart;
		this._series = series;
		this._options = {
			...defaultOptions,
			...options,
		};
		this._chart.subscribeClick(this._clickHandler);
		this._chart.subscribeCrosshairMove(this._moveHandler);
		this._labelButtonPrimitive = new UserPriceLinesLabelButton(this);
		series.attachPrimitive(this._labelButtonPrimitive);
		this._setCrosshairMode();
	}

	currentLineColor() {
		return this._options.color;
	}

	currentHoverColor() {
		return this._options.hoverColor;
	}

	// We need to disable magnet mode for this to work nicely
	_setCrosshairMode() {
		if (!this._chart) {
			throw new Error(
				'Unable to change crosshair mode because the chart instance is undefined'
			);
		}
		this._chart.applyOptions({
			crosshair: {
				mode: CrosshairMode.Normal,
			},
		});
	}

	private _clickHandler = (param: MouseEventParams) => this._onClick(param);
	private _moveHandler = (param: MouseEventParams) => this._onMouseMove(param);

	remove() {
		if (this._chart) {
			this._chart.unsubscribeClick(this._clickHandler);
			this._chart.unsubscribeCrosshairMove(this._moveHandler);
		}
		if (this._series && this._labelButtonPrimitive) {
			this._series.detachPrimitive(this._labelButtonPrimitive);
		}
		this._chart = undefined;
		this._series = undefined;
	}

	private _onClick(param: MouseEventParams) {
		const price = this._getMousePrice(param);
		const xDistance = this._distanceFromRightScale(param);
		if (
			price === null ||
			xDistance === null ||
			xDistance > LABEL_HEIGHT ||
			!this._series
		)
			return;
		this._series.createPriceLine({
			price,
			color: this._options.color,
			lineStyle: LineStyle.Dashed,
		});
	}

	private _onMouseMove(param: MouseEventParams) {
		const price = this._getMousePrice(param);
		const xDistance = this._distanceFromRightScale(param);
		if (price === null || xDistance === null || xDistance > LABEL_HEIGHT * 2) {
			this._labelButtonPrimitive.hideAddLabel();
			return;
		}
		this._labelButtonPrimitive.showAddLabel(price, xDistance < LABEL_HEIGHT);
	}

	private _getMousePrice(param: MouseEventParams) {
		if (!param.point || !this._series) return null;
		const price = this._series.coordinateToPrice(param.point.y);
		return price;
	}

	private _distanceFromRightScale(param: MouseEventParams) {
		if (!param.point || !this._chart) return null;
		const timeScaleWidth = this._chart.timeScale().width();
		return Math.abs(timeScaleWidth - param.point.x);
	}
}
