import type { Version } from '../../../../versions';

interface VersionAgnosticIChartApi {
	resize: (width: number, height: number) => void;
}

interface VersionAgnosticLightweightChartsModule {
	createChart: (container: HTMLElement, options: unknown) => VersionAgnosticIChartApi;
}

export function importLightweightChartsVersion(version: string): Promise<VersionAgnosticLightweightChartsModule> {
	switch (version as Version | 'current') {
		case 'current': {
			return import('lightweight-charts-local') as Promise<VersionAgnosticLightweightChartsModule>;
		}
		case '3.8': {
			return import('lightweight-charts-3.8') as Promise<VersionAgnosticLightweightChartsModule>;
		}
	}
}
