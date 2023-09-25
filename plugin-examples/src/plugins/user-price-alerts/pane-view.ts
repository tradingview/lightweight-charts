import {
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	SeriesPrimitivePaneViewZOrder,
} from 'lightweight-charts';
import { IRendererData } from './irenderer-data';
import { PaneRenderer } from './pane-renderer';
import { PriceScalePaneRenderer } from './price-scale-pane-renderer';

export class UserAlertPricePaneView implements ISeriesPrimitivePaneView {
	_renderer: PaneRenderer | PriceScalePaneRenderer;
	constructor(isPriceScale: boolean) {
		this._renderer = isPriceScale
			? new PriceScalePaneRenderer()
			: new PaneRenderer();
	}

	zOrder(): SeriesPrimitivePaneViewZOrder {
		return 'top';
	}

	renderer(): ISeriesPrimitivePaneRenderer {
		return this._renderer;
	}

	update(data: IRendererData | null) {
		this._renderer.update(data);
	}
}
