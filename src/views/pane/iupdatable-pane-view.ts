import { IPaneView } from './ipane-view';

export type UpdateType = 'data' | 'other' | 'options';

export interface IUpdatablePaneView<HorzScaleItem> extends IPaneView<HorzScaleItem> {
	update(updateType?: UpdateType): void;
}
