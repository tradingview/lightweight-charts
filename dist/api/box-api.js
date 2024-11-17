export class Box {
    constructor(box) {
        this._box = box;
    }
    applyOptions(options) {
        this._box.applyOptions(options);
    }
    options() {
        return this._box.options();
    }
    box() {
        return this._box;
    }
}
