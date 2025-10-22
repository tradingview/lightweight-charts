import { CustomConflationContext, CustomData } from '../icustom-series';
import { SeriesPlotRow } from '../series-data';

/**
 * Type-safe conflation strategy for custom series.
 * Provides better type checking and validation for custom series conflation.
 */
export interface CustomSeriesConflationStrategy<
	THorzScaleItem,
	TData extends CustomData<THorzScaleItem>
> {
	/**
	 * Name of the conflation strategy for debugging purposes.
	 */
	readonly name: string;

	/**
	 * Function to extract price values from custom data for scaling.
	 */
	readonly priceValueBuilder: (item: TData) => number[];

	/**
	 * Function to validate custom data items.
	 */
	readonly validate?: (items: readonly TData[]) => boolean;

	/**
	 * Function to conflate multiple data items into a single item.
	 */
	readonly reducer: (items: readonly CustomConflationContext<THorzScaleItem, TData>[]) => TData;
}

/**
 * Factory function to create a custom series conflation strategy with type safety.
 */
export function createCustomSeriesConflationStrategy<
	THorzScaleItem,
	TData extends CustomData<THorzScaleItem>
>(config: {
	name: string;
	priceValueBuilder: (item: TData) => number[];
	reducer: (items: readonly CustomConflationContext<THorzScaleItem, TData>[]) => TData;
	validate?: (items: readonly TData[]) => boolean;
}): CustomSeriesConflationStrategy<THorzScaleItem, TData> {
	return {
		name: config.name,
		priceValueBuilder: config.priceValueBuilder,
		reducer: config.reducer,
		validate: config.validate,
	};
}

/**
 * Helper namespace with functions to convert SeriesPlotRow to CustomConflationContext for custom series.
 */
export namespace CustomSeriesDataConverter {
	/**
	 * Convert SeriesPlotRow items to CustomConflationContext for custom series.
	 */
	export function toContextItems<THorzScaleItem, TData extends CustomData<THorzScaleItem>>(
		items: readonly SeriesPlotRow<'Custom'>[],
		priceValueBuilder: (item: TData) => number[]
	): CustomConflationContext<THorzScaleItem, TData>[] {
		return items.map((item: SeriesPlotRow<'Custom'>) => {
			const customPlotRow = item as SeriesPlotRow<'Custom'> & { data?: TData };
			const hasData = customPlotRow.data !== undefined;

			let itemData: TData;
			if (hasData && customPlotRow.data) {
				itemData = customPlotRow.data;
			} else {
				const timeValue = item.time as THorzScaleItem;
				if (timeValue === null || timeValue === undefined) {
					throw new Error('Invalid time value in SeriesPlotRow');
				}

				itemData = { time: timeValue } as unknown as TData;
			}

			if (!itemData || typeof itemData !== 'object') {
				throw new Error('Invalid data extracted from SeriesPlotRow');
			}

			return {
				data: itemData,
				index: item.index,
				originalTime: item.originalTime as THorzScaleItem,
				time: item.time as THorzScaleItem,
				priceValues: priceValueBuilder(itemData),
			};
		});
	}
}

/**
 * Type-safe wrapper for custom series conflation that integrates with the unified data conflater.
 */
export class TypedCustomSeriesConflater<THorzScaleItem, TData extends CustomData<THorzScaleItem>> {
	private readonly _strategy: CustomSeriesConflationStrategy<THorzScaleItem, TData>;

	public constructor(strategy: CustomSeriesConflationStrategy<THorzScaleItem, TData>) {
		this._strategy = strategy;
	}

	/**
	 * Get the conflation strategy.
	 */
	public getStrategy(): CustomSeriesConflationStrategy<THorzScaleItem, TData> {
		return this._strategy;
	}

	/**
	 * Get the price value builder function.
	 */
	public getPriceValueBuilder(): (item: TData) => number[] {
		return this._strategy.priceValueBuilder;
	}

	/**
	 * Get the conflation reducer function.
	 */
	public getReducer(): (items: readonly CustomConflationContext<THorzScaleItem, TData>[]) => TData {
		return this._strategy.reducer;
	}

	/**
	 * Validate data items using the strategy's validation function.
	 */
	public validateItems(items: readonly TData[]): boolean {
		if (!this._strategy.validate) {
			return true; // No validation function means all items are valid
		}
		return this._strategy.validate(items);
	}

	/**
	 * Convert SeriesPlotRow items to CustomConflationContext items.
	 */
	public toContextItems(items: readonly SeriesPlotRow<'Custom'>[]): CustomConflationContext<THorzScaleItem, TData>[] {
		return CustomSeriesDataConverter.toContextItems(items, this._strategy.priceValueBuilder);
	}
}
