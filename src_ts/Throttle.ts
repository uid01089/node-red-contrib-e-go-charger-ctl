// Throttling ensures that the function executes at a regular interval.

// Define a TypeScript class called "Throttle"
class Throttle {
    // Declare instance variables
    private timeoutMs: number;       // The amount of time to wait before executing the function
    private triggerId: NodeJS.Timeout;  // The ID of the current timeout

    // Constructor function, which is called when a new instance of the class is created
    constructor(timeoutMs: number) {
        // Initialize instance variables with constructor argument
        this.timeoutMs = timeoutMs;
        // Set the initial value of triggerId to null
        this.triggerId = null;
    }

    // Method to trigger a function with a throttle
    public trigger(fct: () => void): void {
        // If no timeout is currently running
        if (this.triggerId === null) {
            // Execute the function
            fct();
            // Set a new timeout to prevent the function from being called again for the given time period
            this.triggerId = setTimeout(() => {
                this.triggerId = null;
            }, this.timeoutMs);
        }
        // If a timeout is currently running, do nothing
    }
}

// Export the "Throttle" class so it can be used in other modules
export { Throttle };
