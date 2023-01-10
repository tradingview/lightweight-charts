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

interface Window {
	chrome: unknown;
}
