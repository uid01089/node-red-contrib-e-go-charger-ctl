"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Throttle = void 0;
// Define a TypeScript class called "Throttle"
class Throttle {
    // Constructor function, which is called when a new instance of the class is created
    constructor(timeout) {
        // Initialize instance variables with constructor argument
        this.timeout = timeout;
        // Set the initial value of triggerId to null
        this.triggerId = null;
    }
    // Method to trigger a function with a throttle
    trigger(fct) {
        // If no timeout is currently running
        if (this.triggerId === null) {
            // Execute the function
            fct();
            // Set a new timeout to prevent the function from being called again for the given time period
            this.triggerId = setTimeout(() => {
                this.triggerId = null;
            }, this.timeout);
        }
        // If a timeout is currently running, do nothing
    }
}
exports.Throttle = Throttle;
//# sourceMappingURL=Throttle.js.map