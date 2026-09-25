/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from "chai";
import { describe, it } from "node:test";

import { timeScaleOptionsDefaults } from "../../src/api/options/time-scale-options-defaults";
import { ChartModel } from "../../src/model/chart-model";
import { HorzScaleBehaviorTime } from "../../src/model/horz-scale-behavior-time/horz-scale-behavior-time";
import { Time } from "../../src/model/horz-scale-behavior-time/types";
import { LocalizationOptions } from "../../src/model/localization-options";
import { TimeScale } from "../../src/model/time-scale";

function chartModelMock(): ChartModel<Time> {
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		recalculateAllPanes: () => {},
		lightUpdate: () => {},
	} as ChartModel<Time>;
}

const behavior = new HorzScaleBehaviorTime();

describe("Localization formatter reset", () => {
	it("should reset priceFormatter to undefined via applyLocalizationOptions", () => {
		const localizationOptions: LocalizationOptions<Time> = {
			locale: "en-US",
			dateFormat: "dd MMM 'yy",
			priceFormatter: (price: number) => `$${price.toFixed(2)}`,
		};

		const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, localizationOptions, behavior);

		ts.applyLocalizationOptions({ priceFormatter: undefined });

		expect(localizationOptions.priceFormatter).to.equal(undefined);
		expect(localizationOptions.locale).to.equal("en-US");
	});

	it("should reset percentageFormatter to undefined via applyLocalizationOptions", () => {
		const localizationOptions: LocalizationOptions<Time> = {
			locale: "en-US",
			dateFormat: "dd MMM 'yy",
			percentageFormatter: (percentage: number) => `${percentage.toFixed(2)}%`,
		};

		const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, localizationOptions, behavior);

		ts.applyLocalizationOptions({ percentageFormatter: undefined });

		expect(localizationOptions.percentageFormatter).to.equal(undefined);
	});

	it("should reset tickmarks formatters to undefined via applyLocalizationOptions", () => {
		const localizationOptions: LocalizationOptions<Time> = {
			locale: "en-US",
			dateFormat: "dd MMM 'yy",
			tickmarksPriceFormatter: (prices: readonly number[]) => prices.map((p: number) => `$${p}`),
			tickmarksPercentageFormatter: (percentages: readonly number[]) => percentages.map((p: number) => `${p}%`),
		};

		const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, localizationOptions, behavior);

		ts.applyLocalizationOptions({
			tickmarksPriceFormatter: undefined,
			tickmarksPercentageFormatter: undefined,
		});

		expect(localizationOptions.tickmarksPriceFormatter).to.equal(undefined);
		expect(localizationOptions.tickmarksPercentageFormatter).to.equal(undefined);
	});

	it("should reset timeFormatter to undefined via applyLocalizationOptions", () => {
		const localizationOptions: LocalizationOptions<Time> = {
			locale: "en-US",
			dateFormat: "dd MMM 'yy",
			timeFormatter: () => "custom-time",
		};

		const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, localizationOptions, behavior);

		ts.applyLocalizationOptions({ timeFormatter: undefined });

		expect(localizationOptions.timeFormatter).to.equal(undefined);
	});

	it("should only reset formatters explicitly set to undefined", () => {
		const priceFormatter = (price: number) => `$${price}`;
		const percentageFormatter = (percentage: number) => `${percentage}%`;
		const localizationOptions: LocalizationOptions<Time> = {
			locale: "en-US",
			dateFormat: "dd MMM 'yy",
			priceFormatter,
			percentageFormatter,
		};

		const ts = new TimeScale<Time>(chartModelMock(), timeScaleOptionsDefaults, localizationOptions, behavior);

		ts.applyLocalizationOptions({ priceFormatter: undefined });

		expect(localizationOptions.priceFormatter).to.equal(undefined);
		expect(localizationOptions.percentageFormatter).to.equal(percentageFormatter);
	});
});
