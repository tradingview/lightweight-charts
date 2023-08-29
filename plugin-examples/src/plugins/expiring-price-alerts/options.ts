export interface ExpiringPriceAlertsOptions {
	/** Interval between bars (in seconds) */
	interval: number;
	/** Delay when removing an alert */
	clearTimeout: number;
}

export const defaultOptions: ExpiringPriceAlertsOptions = {
	interval: 60 * 60 * 24,
	clearTimeout: 3000,
};

export interface ExpiringPriceAlertParameters {
	// color: string;
	title: string;
	crossingDirection: 'up' | 'down';
}
