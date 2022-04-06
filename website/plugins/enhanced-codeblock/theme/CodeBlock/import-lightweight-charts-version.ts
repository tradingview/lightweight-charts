import type { Version } from '../../../../versions';

export type LightweightChartsApi = typeof import('lightweight-charts-local') | typeof import('lightweight-charts-3.8');

export function importLightweightChartsVersion(version: string): Promise<LightweightChartsApi> {
	switch (version as Version | 'current') {
		case 'current': {
			return import('lightweight-charts-local');
		}
		case '3.8': {
			return import('lightweight-charts-3.8');
		}
	}
}
