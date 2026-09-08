import { SeriesDataItemTypeMap, SingleValueData } from 'lightweight-charts';

export type PrettyHistogramData<HorzScaleItem> = SeriesDataItemTypeMap<HorzScaleItem>['Histogram'] & SingleValueData<HorzScaleItem>;
