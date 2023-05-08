
import { InfluxDBBatchElement } from "./InfluxDBBatchElement";
import { Model } from "./Model";
import { PIDController } from "./PIDController";



const AMP_MAX = 16;
const V_GRID = 230;

interface ChargingControl {
    chargeCurrent: number;
    doCharging: boolean;
    mode: string;
    isCarConnected: boolean;
    influxDb: InfluxDBEGoChargerCtl;
}
interface InfluxDBEGoChargerCtl extends InfluxDBBatchElement {
    fields: {
        availablePowerForLoading: number;
        availableCurrent: number;
        chargeCurrent: number;
        doCharging: number;
        essAccuThreshold: number;
        basisLoading: number,
        nrPhases: number,
        minCurrent: number,
        switchOnCurrent: number,
    }
}

class EGoChargerCtl {


    nrPhases: number;
    minCurrent: number;
    essAccuThreshold: number;
    switchOnCurrent: number;
    doCharging: boolean;
    model: Model;
    piController: PIDController;


    constructor(nrPhases: number, minCurrent: number, essAccuThreshold: number, switchOnCurrent: number, piController: PIDController) {
        this.nrPhases = nrPhases;
        this.minCurrent = minCurrent;
        this.essAccuThreshold = essAccuThreshold;
        this.switchOnCurrent = switchOnCurrent;
        this.doCharging = false;
        this.model = new Model();
        this.piController = piController;
    }


    trigger(message: InfluxDBBatchElement[]): ChargingControl {

        let chargingControl: ChargingControl = {
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



    private calcChargeCurrent(prioEssLoading: boolean, availableCurrent: number): number {

        let chargeCurrent = 0;

        if (prioEssLoading) {

            // the ESS-Battery shall be loaded. Limit the charge current to the switchOnCurrent. Rest is going into the ESS-Battery.
            chargeCurrent = Math.min(availableCurrent, this.switchOnCurrent);
        } else {
            // No special mode, just use the available current
            chargeCurrent = availableCurrent;
        }

        // Not more then 16 Ampere!
        return Math.min(chargeCurrent, AMP_MAX);
    }


    private control(): ChargingControl {

        const prioEssLoading = this.model.getSoc() < this.essAccuThreshold;

        //prioEssLoading: Limit chargeCurrent to this.switchOnCurrent
        //!prioEssLoading (Car-Loading): as much as available


        const availablePowerForCharging = this.model.calcAvailablePower();
        const currentEGOChargingPower = Math.round((this.model.currentEGOChargingPower() / this.nrPhases) / V_GRID);
        const availableCurrentForCharging = Math.round((availablePowerForCharging / this.nrPhases) / V_GRID);
        const finalCalculatedCurrentForCharging = this.calcChargeCurrent(prioEssLoading, availableCurrentForCharging);
        let chargeCurrent = 0;

        if (availablePowerForCharging > 0) {

            // We have additional power available. Do charging

            switch (this.doCharging) {
                case true:

                    // we are in charging mode, have to stay above minCurrent
                    if (availableCurrentForCharging >= this.minCurrent) {

                        // go on charging with current calculated charging current
                        chargeCurrent = this.piController.updateWithValue(currentEGOChargingPower, finalCalculatedCurrentForCharging);

                    } else {

                        // Oh no, we are under minCurrent. Usually we shall stop charging

                        if (prioEssLoading) {

                            // ESS loading has higher priority, stop charging of the car
                            this.doCharging = false;
                            this.piController.reset();

                        } else {

                            // Everything for the car
                            // we are over 80%, we can go on loading with this.minCurrent, even minCurrent is not reached
                            // ESS us discharged
                            chargeCurrent = Math.max(this.piController.updateWithValue(currentEGOChargingPower, this.minCurrent), this.minCurrent);


                        }
                    }
                    break;
                case false:

                    // we have to reach switchOnCurrent
                    if (availableCurrentForCharging >= this.switchOnCurrent) {
                        this.doCharging = true;

                        // chargeCurrent = this.piController.updateWithValue(currentEGOChargingPower, finalCalculatedCurrentForCharging);

                        this.piController.setStartValue(finalCalculatedCurrentForCharging);
                        chargeCurrent = finalCalculatedCurrentForCharging;

                    } else {
                        this.doCharging = false;
                        this.piController.reset();
                    }
                    break;
            }

        } else {
            // No charging
            this.doCharging = false;
            this.piController.reset();
        }

        // Rounding and converting to integer values
        chargeCurrent = Math.round(Math.min(chargeCurrent, AMP_MAX));

        return {
            chargeCurrent: chargeCurrent,
            doCharging: this.doCharging,
            mode: (prioEssLoading ? "BasisLoading" : "HighPowerLoading"),
            isCarConnected: false,
            influxDb: {
                measurement: "EGoChargerStatusCtl",
                fields: {
                    availablePowerForLoading: availablePowerForCharging,
                    availableCurrent: availableCurrentForCharging,
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




}

export { EGoChargerCtl, ChargingControl, InfluxDBEGoChargerCtl };