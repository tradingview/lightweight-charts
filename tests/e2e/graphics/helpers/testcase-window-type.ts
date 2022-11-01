import { IChartApi } from '../../../../src/api/ichart-api';

export interface TestCaseWindow extends Window {
	testCaseReady: void | Promise<void>;
	chart?: IChartApi;
	ignoreMouseMove?: boolean;
}
