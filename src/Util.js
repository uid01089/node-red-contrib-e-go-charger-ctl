"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
class Util {
    static payLoadPrinter(object) {
        let returnValue = null;
        if (object !== undefined && object !== null) {
            returnValue = { payload: object };
        }
        return returnValue;
    }
}
exports.Util = Util;
//# sourceMappingURL=Util.js.map