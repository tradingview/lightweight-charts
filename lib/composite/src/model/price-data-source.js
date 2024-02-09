"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceDataSource = void 0;
const data_source_1 = require("./data-source");
class PriceDataSource extends data_source_1.DataSource {
    constructor(model) {
        super();
        this._model = model;
    }
    model() {
        return this._model;
    }
}
exports.PriceDataSource = PriceDataSource;
