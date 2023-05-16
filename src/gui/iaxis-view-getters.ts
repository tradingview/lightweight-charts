import { IDataSource } from '../model/idata-source';
import { IAxisView } from '../views/pane/iaxis-view';

type IAxisViewsGetter = (
	source: IDataSource
) => readonly IAxisView[];

export type IPriceAxisViewsGetter = IAxisViewsGetter;
export type ITimeAxisViewsGetter = IAxisViewsGetter;
