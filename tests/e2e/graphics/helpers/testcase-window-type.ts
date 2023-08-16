import { IChartApi } from '../../../../src/api/create-chart';

export interface TestCaseWindow extends Window {
	testCaseReady: void | Promise<void>;
	chart?: IChartApi;
	ignoreMouseMove?: boolean;
	checkChartScreenshot?: boolean;
}
