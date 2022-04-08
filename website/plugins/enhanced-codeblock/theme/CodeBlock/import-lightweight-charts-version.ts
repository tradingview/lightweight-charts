import type { Version } from '../../../../versions';

export type LightweightChartsApi = typeof import('lightweight-charts-local') | typeof import('lightweight-charts-3.8');

export type LightweightChartsVersion = Version | 'current';

export function importLightweightChartsVersion(version: LightweightChartsVersion): Promise<LightweightChartsApi> {
	switch (version) {
		case 'current': {
			return import('lightweight-charts-local');
		}
		case '3.8': {
			return import('lightweight-charts-3.8');
		}
	}
}
