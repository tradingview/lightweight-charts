import { IPaneRenderer } from './ipane-renderer';
import { CanvasRenderingTarget2D } from 'fancy-canvas';

/**
 * 2本のラインを time/value 形式で受け取り、間を塗りつぶすためのデータ
 */
export interface BetweenLinesData {
  // `time` と `value` を持つ配列
  points1: Array<{ time: number; value: number }>;
  points2: Array<{ time: number; value: number }>;

  // 塗りつぶしや線の色
  lineColor: string;
  fillColor: string;

  // time -> x座標, value -> y座標 変換用コールバック
  timeToX: (t: number) => number;
  valueToY: (v: number) => number;
}

/**
 * 2本のライン間を塗りつぶすカスタムレンダラ (time/value 形式対応)
 */
export class PaneRendererBetweenLines implements IPaneRenderer {
  private _data: BetweenLinesData | null = null;

  public setData(data: BetweenLinesData): void {
    this._data = data;
  }

  public draw(
    target: CanvasRenderingTarget2D,
    _isHovered: boolean,
    _hitTestData?: unknown
  ): void {
    if (!this._data || this._data.points1.length === 0 || this._data.points2.length === 0) {
      return;
    }

    const { points1, points2, lineColor, fillColor, timeToX, valueToY } = this._data;

    target.useBitmapCoordinateSpace(scope => {
      const ctx = scope.context;
      const hr = scope.horizontalPixelRatio;
      const vr = scope.verticalPixelRatio;

      ctx.save();
      ctx.scale(hr, vr);

      ctx.beginPath();

      // --- 1) 上側ラインを順番にトレース ---
      for (let i = 0; i < points1.length; i++) {
        const { time, value } = points1[i];
        const x = timeToX(time);
        const y = valueToY(value);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // --- 2) 下側ラインを"逆順"にトレース ---
      for (let i = points2.length - 1; i >= 0; i--) {
        const { time, value } = points2[i];
        const x = timeToX(time);
        const y = valueToY(value);
        ctx.lineTo(x, y);
      }

      ctx.closePath();

      // 塗りつぶし
      ctx.fillStyle = fillColor;
      ctx.fill();

      // 輪郭線 (オプション)
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    });
  }
}
