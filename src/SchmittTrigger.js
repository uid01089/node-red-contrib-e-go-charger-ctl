"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchmittTrigger = void 0;
/**
 * Represents a Schmitt trigger circuit.
 */
class SchmittTrigger {
    /**
     * Constructs a SchmittTrigger object.
     * @param delta - The hysteresis range.
     */
    constructor(delta) {
        this.delta = delta;
        this.lastValidValue = 0;
    }
    /**
     * Filters the input value based on the hysteresis range.
     * @param currentValue - The input value to filter.
     * @returns The filtered output value.
     */
    getFilteredValue(currentValue) {
        const upperLimit = this.lastValidValue + this.delta;
        const lowerLimit = this.lastValidValue - this.delta;
        // If the current value is outside the hysteresis range, update the last valid value.
        if (currentValue >= upperLimit || currentValue <= lowerLimit) {
            this.lastValidValue = currentValue;
        }
        return this.lastValidValue;
    }
}
exports.SchmittTrigger = SchmittTrigger;
//# sourceMappingURL=SchmittTrigger.js.map