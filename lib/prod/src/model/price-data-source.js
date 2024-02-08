import { DataSource } from './data-source';
export class PriceDataSource extends DataSource {
    constructor(model) {
        super();
        this._private__model = model;
    }
    _internal_model() {
        return this._private__model;
    }
}
