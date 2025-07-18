import {
	Coordinate,
	IChartApi,
	IPrimitivePaneView,
	ISeriesApi,
	Logical,
	MismatchDirection,
	PrimitivePaneViewZOrder,
	SeriesType,
	TimePointIndex,
} from "lightweight-charts";
import { PaneRenderer } from "./pane-renderer";
import {
	IMinMaxPriceMarkersOptions,
	ISeriesMarkerRendererData,
	UpdateType,
} from "./types";

export class PaneView implements IPrimitivePaneView {
	private readonly _chart: IChartApi;
	private readonly _series: ISeriesApi<SeriesType>;

	private _data: ISeriesMarkerRendererData[] = [];

	private _options: IMinMaxPriceMarkersOptions;

	private _invalidated: boolean = true;
	private _dataInvalidated: boolean = true;
	private _markers: {
		time: TimePointIndex;
		price: number;
		variant: "left" | "right";
	}[] = [];

	private _renderer: PaneRenderer = new PaneRenderer();

	// --------------------------------------------------
	public constructor(opts: {
		chart: IChartApi;
		series: ISeriesApi<SeriesType>;
		options: IMinMaxPriceMarkersOptions;
	}) {
		this._chart = opts.chart;
		this._series = opts.series;
		this._options = opts.options;
		this._data = [];
	}

	// --------------------------------------------------
	public renderer(): PaneRenderer | null {
		if (!this._series.options().visible) {
			return null;
		}

		if (this._invalidated) {
			this._makeValid();
		}

		const layout = this._chart.options()["layout"];

		this._renderer.setParams({
			fontSize: layout.fontSize,
			fontFamily: layout.fontFamily,
			zOrder: this._options.zOrder,
		});
		this._renderer.setData(this._data);

		return this._renderer;
	}

	// --------------------------------------------------
	public setMarkers(opts: {
		markers: {
			time: TimePointIndex;
			price: number;
			variant: "left" | "right";
		}[];
	}): void {
		this._markers = opts.markers;

		this.update("data");
	}

	// --------------------------------------------------
	public update(updateType?: UpdateType): void {
		this._invalidated = true;
		if (updateType === "data") {
			this._dataInvalidated = true;
		}
	}

	// --------------------------------------------------
	public updateOptions(options: IMinMaxPriceMarkersOptions): void {
		this._invalidated = true;
		this._options = options;
	}

	// --------------------------------------------------
	public zOrder(): PrimitivePaneViewZOrder {
		return this._options.zOrder === "aboveSeries"
			? "top"
			: this._options.zOrder;
	}

	// --------------------------------------------------
	protected _makeValid(): void {
		const timeScale = this._chart.timeScale();

		const markers = this._markers;
		if (!markers?.length) {
			return;
		}

		if (this._dataInvalidated) {
			this._data = markers.map((marker) => {
				return {
					time: marker.time,
					x: 0 as Coordinate,
					y: 0 as Coordinate,
					color: this._options.textColor,
					text: undefined,
					variant: marker.variant,
				};
			});

			this._dataInvalidated = false;
		}

		if (!this._data.length) {
			return;
		}

		for (let i = 0; i < this._data.length; i++) {
			const rendererItem = this._data[i];
			const marker = this._markers[i];
			const price = marker.price;

			const dataAt = this._series.dataByIndex(
				rendererItem.time,
				MismatchDirection.None
			);
			const y = this._series.priceToCoordinate(price) as Coordinate | null;
			if (!dataAt || !y) {
				continue;
			}

			rendererItem.x = timeScale.logicalToCoordinate(
				rendererItem.time as unknown as Logical
			)!;
			rendererItem.y = y;

			rendererItem.text = {
				content: `${this._series.priceFormatter().format(price)}`,
				x: 0 as Coordinate,
				y,
				width: 0,
				height: 0,
			};
		}

		this._invalidated = false;
	}
}
