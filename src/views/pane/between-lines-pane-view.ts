import { IUpdatablePaneView } from './iupdatable-pane-view';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { BetweenLinesSeries } from '../../model/between-lines-series';
import { PaneRendererBetweenLines } from '../../renderers/pane-renderer-between-lines';

export class BetweenLinesPaneView implements IUpdatablePaneView {
    private readonly _series: BetweenLinesSeries; 
    private readonly _renderer: PaneRendererBetweenLines;

    // 再描画が必要かどうか
    private _invalidated: boolean = true;

    constructor(series: BetweenLinesSeries) {
        this._series = series;
        this._renderer = new PaneRendererBetweenLines();
    }

    public update(): void {
        this._invalidated = true;
    }

    /**
     * チャート描画サイクルで呼ばれ、「このPaneViewのレンダラーを返して」と聞かれる。
     */
    public renderer(): IPaneRenderer {
        // 再描画が必要なら新しいデータをレンダラーへセット
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        return this._renderer;
    }

    /**
     * モデルから最新データを取得して、レンダラーに渡す実装
     */
    private _updateImpl(): void {
        const data = this._series.getBetweenLinesData();
        this._renderer.setData(data);
    }
}
