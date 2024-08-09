import {
	IDataSourcePaneViews,
} from '../model/idata-source';
import { Pane } from '../model/pane';
import { IPaneView } from '../views/pane/ipane-view';

export type IPaneViewsGetter = (
	source: IDataSourcePaneViews,
	pane: Pane
) => readonly IPaneView[];
