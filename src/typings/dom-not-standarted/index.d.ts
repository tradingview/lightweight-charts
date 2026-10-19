/** https://developer.mozilla.org/en-US/docs/Web/API/InputDeviceCapabilities */
interface InputDeviceCapabilities {
	firesTouchEvents?: boolean;
}
interface UIEvent {
	/** https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/sourceCapabilities */
	sourceCapabilities?: InputDeviceCapabilities;
}

/**
 * Navigator userAgentData
 * https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData
 * More reliable way of determining chromium browsers.
 * Note: This is a partial type definition for the low entropy properties.
 */
interface UADataBrand {
	brand: string; version: string;
}
interface Navigator {
	userAgentData?: {
		brands: UADataBrand[];
		platform: string;
		mobile: boolean;
	};
}

/**
 * Prioritized Task Scheduling API
 * https://developer.mozilla.org/en-US/docs/Web/API/Scheduler
 * Note: This is a partial type definition. It must stay in this ambient file
 * so the production property-rename transformer leaves the host names alone.
 */
interface SchedulerPostTaskOptions {
	priority?: 'user-blocking' | 'user-visible' | 'background';
}
interface Scheduler {
	postTask<T>(callback: () => T, options?: SchedulerPostTaskOptions): Promise<T>;
}

interface Window {
	chrome: unknown;
	scheduler?: Scheduler;
}
