import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPrimitivePaneRenderer } from '@bishopbot/lightweight-charts';
import { IRendererData } from './irenderer-data';

export abstract class PaneRendererBase implements IPrimitivePaneRenderer {
	_data: IRendererData | null = null;
	abstract draw(target: CanvasRenderingTarget2D): void;
	update(data: IRendererData | null) {
		this._data = data;
	}
}
