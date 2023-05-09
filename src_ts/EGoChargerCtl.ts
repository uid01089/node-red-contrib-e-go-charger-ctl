
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
        controllerState: number,
    }
}

enum ControllerState {
    SwitchIntoIdle = 0,
    Idle = 1,
    WaitTillChargingStarts = 2,
    Charging = 3,
    Finished = 4,
}


class EGoChargerCtl {


    nrPhases: number;
    minCurrent: number;
    essAccuThreshold: number;
    switchOnCurrent: number;
    model: Model;
    piController: PIDController;
    controllerState: ControllerState;




    constructor(nrPhases: number, minCurrent: number, essAccuThreshold: number, switchOnCurrent: number, piController: PIDController) {
        this.nrPhases = nrPhases;
        this.minCurrent = minCurrent;
        this.essAccuThreshold = essAccuThreshold;
        this.switchOnCurrent = switchOnCurrent;
        this.model = new Model();
        this.piController = piController;
        this.controllerState = ControllerState.SwitchIntoIdle;
    }


    trigger(message: InfluxDBBatchElement[]): void {

        // feeding model with new message
        this.model.trigger(message);

    }

    doControl(): ChargingControl {

        let chargingControl: ChargingControl = {
            chargeCurrent: this.minCurrent,
            doCharging: false,
            mode: "NO MODE",
            isCarConnected: false,
            influxDb: null
        };

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
        const currentEGOChargingPower = (this.model.currentEGOChargingPower() / this.nrPhases) / V_GRID;
        const availableCurrentForCharging = (availablePowerForCharging / this.nrPhases) / V_GRID;
        const finalCalculatedCurrentForCharging = this.calcChargeCurrent(prioEssLoading, availableCurrentForCharging);
        let chargeCurrent = 0;

        if (availablePowerForCharging > 0) {

            // We have additional power available. Do charging

            switch (this.controllerState) {

                case ControllerState.SwitchIntoIdle:
                    this.piController.reset();
                    this.controllerState = ControllerState.Idle;
                // falls through

                case ControllerState.Idle:

                    if (this.model.getStatus() != 1) {
                        // Stay in this sate
                        break;
                    }

                    // we have to reach switchOnCurrent
                    if (availableCurrentForCharging >= this.switchOnCurrent) {

                        this.controllerState = ControllerState.WaitTillChargingStarts;

                        chargeCurrent = this.piController.updateWithValue(currentEGOChargingPower, finalCalculatedCurrentForCharging);

                        //this.piController.setStartValue(finalCalculatedCurrentForCharging);
                        //chargeCurrent = finalCalculatedCurrentForCharging;

                    }
                    break;

                case ControllerState.WaitTillChargingStarts:
                    if (this.model.getStatus() != 2) {
                        // Stay in this sate

                        break;
                    }

                    this.controllerState = ControllerState.Charging;
                // falls through

                case ControllerState.Charging:

                    // If status of wallbox is not in charging state anymore     
                    if (this.model.getStatus() != 2) {
                        this.controllerState = ControllerState.SwitchIntoIdle;
                        break;
                    }

                    // we are in charging mode, have to stay above minCurrent
                    if (availableCurrentForCharging >= this.minCurrent) {

                        // go on charging with current calculated charging current
                        chargeCurrent = this.piController.updateWithValue(currentEGOChargingPower, finalCalculatedCurrentForCharging);

                    } else {

                        // Oh no, we are under minCurrent. Usually we shall stop charging

                        if (prioEssLoading) {

                            // ESS loading has higher priority, stop charging of the car
                            this.controllerState = ControllerState.SwitchIntoIdle;

                        } else {

                            // Everything for the car
                            // we are over 80%, we can go on loading with this.minCurrent, even minCurrent is not reached
                            // ESS us discharged
                            chargeCurrent = Math.max(this.piController.updateWithValue(currentEGOChargingPower, this.minCurrent), this.minCurrent);


                        }
                    }
                    break;
            }

        } else {
            // No charging
            this.controllerState = ControllerState.SwitchIntoIdle;
        }

        // Rounding and converting to integer values
        chargeCurrent = Math.round(Math.min(chargeCurrent, AMP_MAX));

        return {
            chargeCurrent: chargeCurrent,
            doCharging: this.isCharging(),
            mode: (prioEssLoading ? "BasisLoading" : "HighPowerLoading"),
            isCarConnected: false,
            influxDb: {
                measurement: "EGoChargerStatusCtl",
                fields: {
                    availablePowerForLoading: availablePowerForCharging,
                    availableCurrent: availableCurrentForCharging,
                    chargeCurrent: chargeCurrent,
                    doCharging: (this.isCharging() ? 1 : 0),
                    essAccuThreshold: this.essAccuThreshold,
                    basisLoading: (prioEssLoading ? 1 : 0),
                    nrPhases: this.nrPhases,
                    minCurrent: this.minCurrent,
                    switchOnCurrent: this.switchOnCurrent,
                    controllerState: this.controllerState
                }
            }
        };
    }

    private isCharging(): boolean {
        return (this.controllerState === ControllerState.WaitTillChargingStarts) || (this.controllerState === ControllerState.Charging);
    }




}

export { EGoChargerCtl, ChargingControl, InfluxDBEGoChargerCtl };