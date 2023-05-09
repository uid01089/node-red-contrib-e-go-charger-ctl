"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
class Model {
    trigger(messages) {
        this.loadPower = this.updateIfDefined(this.loadPower, this.getData(messages, "EssInfoStatistics", "load_power"));
        this.pcs_pv_total_power = this.updateIfDefined(this.pcs_pv_total_power, this.getData(messages, "EssInfoStatistics", "pcs_pv_total_power"));
        this.soc = this.updateIfDefined(this.soc, this.getData(messages, "EssCommonInfoBATT", "soc"));
        this.loadingPower1 = this.updateIfDefined(this.loadingPower1, this.getData(messages, "EGoChargerStatus", "powerL1"));
        this.loadingPower2 = this.updateIfDefined(this.loadingPower2, this.getData(messages, "EGoChargerStatus", "powerL2"));
        this.loadingPower3 = this.updateIfDefined(this.loadingPower3, this.getData(messages, "EGoChargerStatus", "powerL3"));
        this.status = this.updateIfDefined(this.loadingPower3, this.getData(messages, "EGoChargerStatus", "status"));
    }
    isModelConsistent() {
        return (true //
            && (undefined !== this.loadPower) //
            && (undefined !== this.pcs_pv_total_power) //
            && (undefined !== this.soc) //
            && (undefined !== this.loadingPower1) //
            && (undefined !== this.loadingPower2) //
            && (undefined !== this.loadingPower3) //
            && (undefined !== this.status) //
        );
    }
    calcAvailablePower() {
        let availablePowerForLoading = 0;
        if (this.isModelConsistent()) {
            const currentEGOChargingPower = this.currentEGOChargingPower();
            // Load power contains the power for home including the E-Go charging power.
            // Charging power has to subtracted 
            const neededPowerForHome = (-1 * this.loadPower) - currentEGOChargingPower; //loadPower is negative, consumption of home power
            availablePowerForLoading = this.pcs_pv_total_power - neededPowerForHome;
        }
        return availablePowerForLoading;
    }
    getSoc() {
        return this.soc;
    }
    /**
     * Returns the status of the Charger
     * @returns unknown/Error=0, Idle=1, Charging=2, WaitCar=3, Complete=4, Error=5
     */
    getStatus() {
        return this.status;
    }
    currentEGOChargingPower() {
        return this.loadingPower1 + this.loadingPower2 + this.loadingPower3;
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
exports.Model = Model;
//# sourceMappingURL=Model.js.map