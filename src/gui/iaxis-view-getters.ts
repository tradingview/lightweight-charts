import { IDataSource } from '../model/idata-source';
import { Pane } from '../model/pane';
import { IAxisView } from '../views/pane/iaxis-view';

export type IAxisViewsGetter = (
	source: IDataSource,
	pane?: Pane,
) => readonly IAxisView[];

export type IPriceAxisViewsGetter = IAxisViewsGetter;
export type ITimeAxisViewsGetter = IAxisViewsGetter;
