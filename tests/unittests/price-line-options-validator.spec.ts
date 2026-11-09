/* eslint-disable @typescript-eslint/no-floating-promises */
import { doesNotThrow, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkPriceLineOptions } from '../../src/model/data-validators';

describe('checkPriceLineOptions', () => {
	it('accepts a valid price with no hitTestTolerance', () => {
		doesNotThrow(() => checkPriceLineOptions({ price: 42 }));
	});

	it('accepts a non-negative hitTestTolerance', () => {
		doesNotThrow(() => checkPriceLineOptions({ price: 42, hitTestTolerance: 0 }));
		doesNotThrow(() => checkPriceLineOptions({ price: 42, hitTestTolerance: 12 }));
	});

	it('rejects a negative hitTestTolerance', () => {
		throws(
			() => checkPriceLineOptions({ price: 42, hitTestTolerance: -1 }),
			/hitTestTolerance.*non-negative/i
		);
	});

	it('rejects a non-number hitTestTolerance', () => {
		throws(
			() => checkPriceLineOptions({ price: 42, hitTestTolerance: 'big' as unknown as number }),
			/hitTestTolerance.*must be a finite number/i
		);
	});

	it('rejects Infinity and NaN', () => {
		throws(
			() => checkPriceLineOptions({ price: 42, hitTestTolerance: Infinity }),
			/hitTestTolerance.*must be a finite number/i
		);
		throws(
			() => checkPriceLineOptions({ price: 42, hitTestTolerance: NaN }),
			/hitTestTolerance.*must be a finite number/i
		);
	});
});
