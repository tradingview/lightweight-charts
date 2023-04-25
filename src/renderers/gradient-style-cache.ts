import { BitmapCoordinatesRenderingScope } from "fancy-canvas";
import { Coordinate } from "../model/coordinate";
import { clamp } from "../helpers/mathex";

export interface GradientCacheParams {
	topColor1: string
	topColor2: string;
	bottomColor1: string;
	bottomColor2: string;
	baseLevelCoordinate?: Coordinate | null;
	bottom: Coordinate;
}

export class GradientStyleCache {
	private _params?: GradientCacheParams;
	private _cachedValue?: CanvasGradient;

	public get(scope: BitmapCoordinatesRenderingScope, params:GradientCacheParams ): CanvasGradient {
		const cachedParams = this._params;
		if (
			this._cachedValue === undefined ||
			cachedParams === undefined ||
			cachedParams.topColor1 !== params.topColor1 ||
			cachedParams.topColor2 !== params.topColor2 ||
			cachedParams.bottomColor1 !== params.bottomColor1 ||
			cachedParams.bottomColor2 !== params.bottomColor2 ||
			cachedParams.baseLevelCoordinate !== params.baseLevelCoordinate ||
			cachedParams.bottom !== params.bottom
		) {
			const gradient = scope.context.createLinearGradient(0, 0, 0, params.bottom);

			gradient.addColorStop(0, params.topColor1);

			if (params.baseLevelCoordinate != null) {
				const baselinePercent = clamp(params.baseLevelCoordinate * scope.verticalPixelRatio / params.bottom, 0, 1);
				gradient.addColorStop(baselinePercent, params.topColor2);
				gradient.addColorStop(baselinePercent, params.bottomColor1);
			}

			gradient.addColorStop(1, params.bottomColor2);

			this._cachedValue = gradient;
			this._params = params;
		}

		return this._cachedValue;
	}
}
