"use strict";
// https://www.telerik.com/blogs/debouncing-and-throttling-in-javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.Throttle = void 0;
class Throttle {
    constructor(timeout) {
        this.timeout = timeout;
        this.triggerId = null;
    }
    trigger(fct) {
        // Cancel running timeout
        if (this.triggerId === null) {
            fct();
            this.triggerId = setTimeout(() => {
                this.triggerId = null;
            }, this.timeout);
        }
        // Retrigger new timeout
    }
}
exports.Throttle = Throttle;
//# sourceMappingURL=Throttle.js.map