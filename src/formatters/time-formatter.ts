import { fractionalDigitsForNanos } from '../helpers/nanos';

import { numberToStringWithLeadingZero } from './price-formatter';

export class TimeFormatter {
	private _formatStr: string;

	public constructor(format?: string) {
		this._formatStr = format || '%h:%m:%s';
	}

	public format(date: Date, nanos?: number): string {
		return this._formatStr.replace('%h', numberToStringWithLeadingZero(date.getUTCHours(), 2)).
			replace('%m', numberToStringWithLeadingZero(date.getUTCMinutes(), 2)).
			replace('%s', numberToStringWithLeadingZero(date.getUTCSeconds(), 2)).
			replace('%S', nanos === undefined || nanos === 0 ? '' : `.${numberToStringWithLeadingZero(nanos, 9)}`).
			// `%f` keeps the precision the value actually has: 3, 6 or 9 digits, and nothing for whole seconds
			replace('%f', nanos === undefined || nanos === 0
				? ''
				: `.${numberToStringWithLeadingZero(nanos, 9).slice(0, fractionalDigitsForNanos(nanos))}`);
	}
}
