/** https://developer.mozilla.org/en-US/docs/Web/API/InputDeviceCapabilities */
interface InputDeviceCapabilities {
	firesTouchEvents?: boolean;
}
interface UIEvent {
	/** https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/sourceCapabilities */
	sourceCapabilities?: InputDeviceCapabilities;
}

interface Window {
	chrome: unknown;
}
