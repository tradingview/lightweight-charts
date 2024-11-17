import { DataSource } from './data-source';
export class PriceDataSource extends DataSource {
    constructor(model) {
        super();
        this._model = model;
    }
    model() {
        return this._model;
    }
}
