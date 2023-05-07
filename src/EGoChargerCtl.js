"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EGoChargerCtl = void 0;
const Model_1 = require("./Model");
const AMP_MAX = 16;
const V_GRID = 230;
class EGoChargerCtl {
    constructor(nrPhases, minCurrent, essAccuThreshold, switchOnCurrent, piController) {
        this.nrPhases = nrPhases;
        this.minCurrent = minCurrent;
        this.essAccuThreshold = essAccuThreshold;
        this.switchOnCurrent = switchOnCurrent;
        this.doCharging = false;
        this.model = new Model_1.Model();
        this.piController = piController;
    }
    trigger(message) {
        let chargingControl = {
            chargeCurrent: this.minCurrent,
            doCharging: false,
            mode: "NO MODE",
            isCarConnected: false,
            influxDb: null
        };
        // feeding model with new message
        this.model.trigger(message);
        if (this.model.isModelConsistent()) {
            // All needed values available, do controlling
            chargingControl = this.control();
            if (1 !== this.model.getStatus()) {
                chargingControl.isCarConnected = true;
            }
        }
        return chargingControl;
    }
    calcChargeCurrent(prioEssLoading, availableCurrent) {
        let chargeCurrent = 0;
        if (prioEssLoading) {
            // the ESS-Battery shall be loaded. Limit the charge current to the switchOnCurrent. Rest is going into the ESS-Battery.
            chargeCurrent = Math.min(availableCurrent, this.switchOnCurrent);
        }
        else {
            // No special mode, just use the available current
            chargeCurrent = availableCurrent;
        }
        // Not more then 16 Ampere!
        return Math.min(chargeCurrent, AMP_MAX);
    }
    control() {
        const prioEssLoading = this.model.getSoc() < this.essAccuThreshold;
        //prioEssLoading: Limit chargeCurrent to this.switchOnCurrent
        //!prioEssLoading (Car-Loading): as much as available
        const availablePowerForLoading = this.model.calcAvailablePower();
        const currentCurrent = Math.round((this.model.currentLoadingPower() / this.nrPhases) / V_GRID);
        const availableCurrent = Math.round((availablePowerForLoading / this.nrPhases) / V_GRID);
        const chargeCurrentCalculated = this.calcChargeCurrent(prioEssLoading, availableCurrent);
        let chargeCurrent = 0;
        if (availablePowerForLoading > 0) {
            // We have additional power available. Do charging
            switch (this.doCharging) {
                case true:
                    // we are in charging mode, have to stay above minCurrent
                    if (availableCurrent >= this.minCurrent) {
                        // go on charging with current calculated charging current
                        chargeCurrent = this.piController.updateWithValue(currentCurrent, chargeCurrentCalculated);
                    }
                    else {
                        // Oh no, we are under minCurrent. Usually we shall stop charging
                        if (prioEssLoading) {
                            // ESS loading has higher priority, stop charging of the car
                            this.doCharging = false;
                            this.piController.reset();
                        }
                        else {
                            // Everything for the car
                            // we are over 80%, we can go on loading with this.minCurrent, even minCurrent is not reached
                            // ESS us discharged
                            this.piController.setStartValue(currentCurrent);
                            chargeCurrent = Math.max(this.piController.updateWithValue(currentCurrent, this.minCurrent), this.minCurrent);
                        }
                    }
                    break;
                case false:
                    // we have to reach switchOnCurrent
                    if (availableCurrent >= this.switchOnCurrent) {
                        this.doCharging = true;
                        chargeCurrent = this.piController.updateWithValue(currentCurrent, chargeCurrentCalculated);
                    }
                    else {
                        this.doCharging = false;
                        this.piController.reset();
                    }
                    break;
            }
        }
        else {
            // No charging
            this.doCharging = false;
            this.piController.reset();
        }
        return {
            chargeCurrent: chargeCurrent,
            doCharging: this.doCharging,
            mode: (prioEssLoading ? "BasisLoading" : "HighPowerLoading"),
            isCarConnected: false,
            influxDb: {
                measurement: "EGoChargerStatusCtl",
                fields: {
                    availablePowerForLoading: availablePowerForLoading,
                    availableCurrent: availableCurrent,
                    chargeCurrent: Math.round(Math.min(chargeCurrent, AMP_MAX)),
                    doCharging: (this.doCharging ? 1 : 0),
                    essAccuThreshold: this.essAccuThreshold,
                    basisLoading: (prioEssLoading ? 1 : 0),
                    nrPhases: this.nrPhases,
                    minCurrent: this.minCurrent,
                    switchOnCurrent: this.switchOnCurrent
                }
            }
        };
    }
}
exports.EGoChargerCtl = EGoChargerCtl;
//# sourceMappingURL=EGoChargerCtl.js.map