import { ChartModel, HoveredObject } from "../model/chart-model";
import { Coordinate } from "../model/coordinate";
import { TimeScale } from "../model/time-scale";
import { IPaneRenderer } from "../renderers/ipane-renderer";
import { TimeAxisViewRenderer } from "../renderers/time-axis-view-renderer";
import { IPaneView } from "../views/pane/ipane-view";
import { ITimeAxisView } from "../views/time-axis/itime-axis-view";
import { IExternalAxisView, IExternalDataSource, IExternalPaneRenderer, IExternalPaneView } from "./iexternal-data-source";

class ExternalRendererWrapper implements IPaneRenderer {
    private readonly _baseRenderer: IExternalPaneRenderer;

    public constructor(baseRenderer: IExternalPaneRenderer) {
        this._baseRenderer = baseRenderer;
    }

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean): void {
        this._baseRenderer.draw(ctx, pixelRatio, isHovered);
    }

	public drawBackground(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean): void {
        this._baseRenderer.drawBackground?.(ctx, pixelRatio, isHovered);
    }

	public hitTest(x: Coordinate, y: Coordinate): HoveredObject | null {
        const baseHittest = this._baseRenderer.hitTest?.(x, y);
        return baseHittest ? {} : null;
    }
}

class ExternalPaneViewWrapper implements IPaneView {
    private readonly _paneView: IExternalPaneView;

    public constructor(paneView: IExternalPaneView) {
        this._paneView = paneView;
    }

	public renderer(height: number, width: number, addAnchors?: boolean): IPaneRenderer | null {
        const baseRenderer = this._paneView.renderer(height, width);
        return baseRenderer ? new ExternalRendererWrapper(baseRenderer) : null;
    }
}

class ExternalTimeAxisViewWrapper implements ITimeAxisView {
    private readonly _baseView: IExternalAxisView;
    private readonly _timeScale: TimeScale;
    private readonly _renderer: TimeAxisViewRenderer = new TimeAxisViewRenderer();

    public constructor(baseView: IExternalAxisView, timeScale: TimeScale) {
        this._baseView = baseView;
        this._timeScale = timeScale;
    }

    public renderer(): TimeAxisViewRenderer {
        this._renderer.setData({
            width: this._timeScale.width(),
            text: this._baseView.text(),
            coordinate: this._baseView.coordinate(),
            color: this._baseView.textColor(),
            background: this._baseView.backColor(),
            visible: true,
            tickVisible: true,
        });
        return this._renderer;
    }
}

export class ExternalSourceWrapper {
    private readonly _source: IExternalDataSource;
    private readonly _chartModel: ChartModel;

    public constructor(source: IExternalDataSource, chartModel: ChartModel) {
        this._source = source;
        this._chartModel = chartModel;
    }

    public updateAllViews(): void {
        this._source.updateAllViews();
    }

    public paneViews(): readonly IPaneView[] {
        return this._source.paneViews().map((pw: IExternalPaneView) => new ExternalPaneViewWrapper(pw));
    }

    public timeAxisViews(): readonly ITimeAxisView[] {
        return this._source.timeAxisViews().map((pw: IExternalAxisView) => new ExternalTimeAxisViewWrapper(pw, this._chartModel.timeScale()));
    }
}
