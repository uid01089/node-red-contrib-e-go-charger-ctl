"use strict";
// https://www.telerik.com/blogs/debouncing-and-throttling-in-javascript
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debounce = void 0;
class Debounce {
    constructor(timeout) {
        this.timeout = timeout;
        this.triggerId = null;
    }
    trigger(fct) {
        // Cancel running timeout
        if (this.triggerId != null) {
            window.clearTimeout(this.triggerId);
        }
        // Retrigger new timeout
        this.triggerId = window.setTimeout(() => {
            fct();
        }, this.timeout);
    }
}
exports.Debounce = Debounce;
//# sourceMappingURL=Debounce.js.map