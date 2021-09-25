"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EGoChargerCtl = void 0;
const AMP_MAX = 16;
const V_GRID = 230;
class EGoChargerCtl {
    constructor(nrPhases, minCurrent, essAccuThreshold, switchOnCurrent) {
        this.nrPhases = nrPhases;
        this.minCurrent = minCurrent;
        this.essAccuThreshold = essAccuThreshold;
        this.switchOnCurrent = switchOnCurrent;
        this.doCharging = false;
    }
    trigger(message) {
        let chargingControl = {
            chargeCurrent: this.minCurrent, doCharging: false, mode: "NO MODE", isCarConnected: false, influxDb: null
        };
        this.batConvPower = this.updateIfDefined(this.batConvPower, this.getData(message, "EssInfoStatistics", "batconv_power"));
        this.gridPower = this.updateIfDefined(this.gridPower, this.getData(message, "EssInfoStatistics", "grid_power"));
        this.loadPower = this.updateIfDefined(this.loadPower, this.getData(message, "EssInfoStatistics", "load_power"));
        this.pcs_pv_total_power = this.updateIfDefined(this.pcs_pv_total_power, this.getData(message, "EssInfoStatistics", "pcs_pv_total_power"));
        this.soc = this.updateIfDefined(this.soc, this.getData(message, "EssCommonInfoBATT", "soc"));
        this.loadingPower1 = this.updateIfDefined(this.loadingPower1, this.getData(message, "EGoChargerStatus", "powerL1"));
        this.loadingPower2 = this.updateIfDefined(this.loadingPower2, this.getData(message, "EGoChargerStatus", "powerL2"));
        this.loadingPower3 = this.updateIfDefined(this.loadingPower3, this.getData(message, "EGoChargerStatus", "powerL3"));
        this.status = this.updateIfDefined(this.loadingPower3, this.getData(message, "EGoChargerStatus", "status"));
        if (true //
            && (undefined !== this.batConvPower) //
            && (undefined !== this.gridPower) //
            && (undefined !== this.loadPower) //
            && (undefined !== this.pcs_pv_total_power) //
            && (undefined !== this.soc) //
            && (undefined !== this.loadingPower1) //
            && (undefined !== this.loadingPower2) //
            && (undefined !== this.loadingPower3) //
            && (undefined !== this.status) //
        ) {
            // All needed values available, do controlling
            if (this.soc < this.essAccuThreshold) {
                chargingControl = this.control(true);
            }
            else {
                chargingControl = this.control(false);
            }
            if (1 !== this.status) {
                chargingControl.isCarConnected = true;
            }
        }
        return chargingControl;
    }
    calcAvailablePower() {
        const loadingPower = this.loadingPower1 + this.loadingPower2 + this.loadingPower3;
        const neededPowerForHome = -1 * (this.loadPower + loadingPower); //loadPower is negative
        const availablePowerForLoading = this.pcs_pv_total_power - neededPowerForHome;
        return availablePowerForLoading;
    }
    control(prioEssLoading) {
        //prioEssLoading: Limit chargeCurrent to this.switchOnCurrent
        //!prioEssLoading (Car-Loading): as much as available
        const availablePowerForLoading = this.calcAvailablePower();
        const availableCurrent = Math.floor((availablePowerForLoading / this.nrPhases) / V_GRID);
        const chargeCurrentCalc = Math.min((prioEssLoading ? Math.min(availableCurrent, this.switchOnCurrent) : availableCurrent), AMP_MAX);
        let chargeCurrent = 0;
        if (availablePowerForLoading > 0) {
            // We have additional power available. Do charging
            if (!this.doCharging) {
                // we have to reach switchOnCurrent
                if (availableCurrent >= this.switchOnCurrent) {
                    this.doCharging = true;
                    chargeCurrent = chargeCurrentCalc;
                }
                else {
                    this.doCharging = false;
                }
            }
            else {
                if (availableCurrent >= this.minCurrent) {
                    // we are in charging mode, have to stay above minCurrent
                    chargeCurrent = chargeCurrentCalc;
                }
                else {
                    if (!prioEssLoading) {
                        // we are over 80%, we can go on loading with this.minCurrent, even minCurrent is not reached
                        // ESS us discharged
                        chargeCurrent = this.minCurrent;
                    }
                    else {
                        // Nothing. Stop charging of the car.
                        this.doCharging = false;
                    }
                }
            }
        }
        else {
            // No charging
            this.doCharging = false;
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
                    chargeCurrent: chargeCurrent,
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
    updateIfDefined(oldValue, newValue) {
        let value = oldValue;
        if (undefined !== newValue) {
            value = newValue;
        }
        return value;
    }
    getData(batch, measurement, parameter) {
        let returnValue = undefined;
        for (const element of batch) {
            if (element.measurement === measurement) {
                const fields = element.fields;
                returnValue = fields[parameter];
                break;
            }
        }
        return returnValue;
    }
}
exports.EGoChargerCtl = EGoChargerCtl;
//# sourceMappingURL=EGoChargerCtl.js.map