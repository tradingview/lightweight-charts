import { BetweenLinesPaneView } from '../views/pane/between-lines-pane-view';
import { BetweenLinesData } from '../renderers/pane-renderer-between-lines';

export class BetweenLinesSeries {
    // public readonly seriesType = 'BetweenLinesSeries';

    private readonly _paneView: BetweenLinesPaneView;
    private _latestData: BetweenLinesData;

    constructor(private readonly _model: any) {
        this._paneView = new BetweenLinesPaneView(this);

        // 初期データは空やデフォルト値を設定
        this._latestData = {
            points1: [],
            points2: [],
            lineColor: 'rgba(255, 0, 0, 1)',
            fillColor: 'rgba(255, 0, 0, 0.3)',
            timeToX: (t) => t,
            valueToY: (v) => v,
        };
    }

    /**
     * ユーザ or API からデータを受け取るメソッド
     */
    public setData(data: BetweenLinesData): void {
        this._latestData = data;
        // PaneView 側に「データが更新された」と伝える
        this._paneView.update();
        // チャート全体にも再描画を要求
        this._model.updateSeries(this);
    }

    /**
     * PaneView が描画する際に必要なデータを取得
     */
    public getBetweenLinesData(): BetweenLinesData {
        return this._latestData;
    }

    /**
     * 軽量チャートが描画に使う PaneView 一覧を返す
     */
    public paneViews() {
        return [this._paneView];
    }

    /**
     * クリック等のイベントが必要なら実装 (任意)
     */
    public click(): void {}
    public tap(): void {}
}
