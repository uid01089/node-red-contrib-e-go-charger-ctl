"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIDController = void 0;
// Define a TypeScript class called "PIDController"
class PIDController {
    /**
     * Constructor function, which is called when a new instance of the class is created.
     * @param Kp The proportional gain
     * @param Ki The integral gain
     * @param Kd The derivative gain
     * @param sampleTime The time interval between controller updates
     */
    constructor(Kp, Ki, Kd, sampleTime) {
        // Initialize instance variables with constructor arguments
        this.Kp = Kp;
        this.Ki = Ki;
        this.Kd = Kd;
        this.sampleTime = sampleTime;
        // Set the initial value of integral error and last error to zero
        this.accumulationOfErrors = 0;
        this.lastError = 0;
    }
    /**
     * Method to update the control signal based on the current error.
     * @param error The current error, which is the difference between the desired value and the current value
     * @returns The updated control signal
     */
    update(error) {
        // Calculate proportional part of control signal
        const proportionalPart = error * this.Kp;
        // Calculate integral part of control signal
        this.accumulationOfErrors += error * this.sampleTime;
        const integralPart = this.accumulationOfErrors * this.Ki;
        // Calculate derivative part of control signal
        const derivativeOfError = (error - this.lastError) / this.sampleTime;
        this.lastError = error;
        const derivativePart = derivativeOfError * this.Kd;
        // Calculate and return the updated control signal
        return proportionalPart + integralPart + derivativePart;
    }
    /**
     * Method to update the control signal based on a desired value and the current value.
     * @param currentValue The current value of the process being controlled
     * @param desiredValue The desired value for the process being controlled
     * @returns The updated control signal
     */
    updateWithValue(currentValue, desiredValue) {
        // Calculate the error between the current value and the desired value
        const error = desiredValue - currentValue;
        // Call the "update" method to calculate the control signal based on the error
        return this.update(error);
    }
    /**
     * Method to reset the integral error and last error to zero.
     */
    reset() {
        // Set the integral error and last error to zero
        this.accumulationOfErrors = 0;
        this.lastError = 0;
    }
}
exports.PIDController = PIDController;
//# sourceMappingURL=PIDController.js.map