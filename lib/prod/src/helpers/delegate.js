export class Delegate {
    constructor() {
        this._private__listeners = [];
    }
    _internal_subscribe(callback, linkedObject, singleshot) {
        const listener = {
            _internal_callback: callback,
            _internal_linkedObject: linkedObject,
            _internal_singleshot: singleshot === true,
        };
        this._private__listeners.push(listener);
    }
    _internal_unsubscribe(callback) {
        const index = this._private__listeners.findIndex((listener) => callback === listener._internal_callback);
        if (index > -1) {
            this._private__listeners.splice(index, 1);
        }
    }
    _internal_unsubscribeAll(linkedObject) {
        this._private__listeners = this._private__listeners.filter((listener) => listener._internal_linkedObject !== linkedObject);
    }
    _internal_fire(param1, param2, param3) {
        const listenersSnapshot = [...this._private__listeners];
        this._private__listeners = this._private__listeners.filter((listener) => !listener._internal_singleshot);
        listenersSnapshot.forEach((listener) => listener._internal_callback(param1, param2, param3));
    }
    _internal_hasListeners() {
        return this._private__listeners.length > 0;
    }
    _internal_destroy() {
        this._private__listeners = [];
    }
}
