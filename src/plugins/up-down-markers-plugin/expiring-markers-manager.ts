import { InternalHorzScaleItemKey } from '../../model/ihorz-scale-behavior';

import { SeriesUpDownMarker } from './types';

type MarkerWithTimeout<HorzScaleItem> = SeriesUpDownMarker<HorzScaleItem> & {
	timeoutId?: number;
	expiresAt?: number;
};

export class ExpiringMarkerManager<HorzScaleItem> {
	private _markers: Map<InternalHorzScaleItemKey, MarkerWithTimeout<HorzScaleItem>> = new Map();
	private _updateCallback: (() => void);

	public constructor(updateCallback: () => void) {
		this._updateCallback = updateCallback;
	}

	public setMarker(marker: SeriesUpDownMarker<HorzScaleItem>, key: InternalHorzScaleItemKey, timeout?: number): void {
		this.clearMarker(key);

		if (timeout !== undefined) {
			const timeoutId = window.setTimeout(
				() => {
					this._markers.delete(key);
					this._triggerUpdate();
				},
				timeout
			);

			const markerWithTimeout: MarkerWithTimeout<HorzScaleItem> = {
				...marker,
				timeoutId,
				expiresAt: Date.now() + timeout,
			};

			this._markers.set(key, markerWithTimeout);
		} else {
			// For markers without timeout, we set timeoutId and expiresAt to undefined
			this._markers.set(key, {
				...marker,
				timeoutId: undefined,
				expiresAt: undefined,
			});
		}

		this._triggerUpdate();
	}

	public clearMarker(key: InternalHorzScaleItemKey): void {
		const marker = this._markers.get(key);
		if (marker && marker.timeoutId !== undefined) {
			window.clearTimeout(marker.timeoutId);
		}
		this._markers.delete(key);
		this._triggerUpdate();
	}

	public clearAllMarkers(): void {
		for (const [point] of this._markers) {
			this.clearMarker(point);
		}
	}

	public getMarkers(): SeriesUpDownMarker<HorzScaleItem>[] {
		const now = Date.now();
		const activeMarkers: SeriesUpDownMarker<HorzScaleItem>[] = [];

		for (const [time, marker] of this._markers) {
			if (!marker.expiresAt || marker.expiresAt > now) {
				activeMarkers.push({ time: marker.time, sign: marker.sign, value: marker.value });
			} else {
				this.clearMarker(time);
			}
		}

		return activeMarkers;
	}

	public setUpdateCallback(callback: () => void): void {
		this._updateCallback = callback;
	}

	private _triggerUpdate(): void {
		if (this._updateCallback) {
			this._updateCallback();
		}
	}
}
