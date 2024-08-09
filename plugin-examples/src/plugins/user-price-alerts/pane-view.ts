import {
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from 'lightweight-charts';
import { IRendererData } from './irenderer-data';
import { PaneRenderer } from './pane-renderer';
import { PriceScalePaneRenderer } from './price-scale-pane-renderer';

export class UserAlertPricePaneView implements IPrimitivePaneView {
	_renderer: PaneRenderer | PriceScalePaneRenderer;
	constructor(isPriceScale: boolean) {
		this._renderer = isPriceScale
			? new PriceScalePaneRenderer()
			: new PaneRenderer();
	}

	zOrder(): PrimitivePaneViewZOrder {
		return 'top';
	}

	renderer(): IPrimitivePaneRenderer {
		return this._renderer;
	}

	update(data: IRendererData | null) {
		this._renderer.update(data);
	}
}
