/**
 * Represents a Schmitt trigger circuit.
 */
class SchmittTrigger {
    delta: number;
    lastValidValue: number;

    /**
     * Constructs a SchmittTrigger object.
     * @param delta - The hysteresis range.
     */
    constructor(delta: number) {
        this.delta = delta;
        this.lastValidValue = 0;
    }

    /**
     * Filters the input value based on the hysteresis range.
     * @param currentValue - The input value to filter.
     * @returns The filtered output value.
     */
    public getFilteredValue(currentValue: number): number {
        const upperLimit = this.lastValidValue + this.delta;
        const lowerLimit = this.lastValidValue - this.delta;

        // If the current value is outside the hysteresis range, update the last valid value.
        if (currentValue >= upperLimit || currentValue <= lowerLimit) {
            this.lastValidValue = currentValue;
        }

        return this.lastValidValue;
    }
}

export { SchmittTrigger };
