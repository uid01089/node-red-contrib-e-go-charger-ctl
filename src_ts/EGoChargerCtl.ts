
import { InfluxDBBatchElement } from "./InfluxDBBatchElement";


const NUMBER_LINES = 1;
const AMP_MIN = 6;
const AMP_MAX = 13;
const V_GRID = 230;

interface ChargingControl {
    chargeCurrent: number;
    doCharging: boolean
}


class EGoChargerCtl {
    private batConvPower: number;
    private gridPower: number;
    private loadPower: number;
    private pcs_pv_total_power: number;
    private soc: number;
    loadingPower1: number;
    loadingPower2: number;
    loadingPower3: number;

    constructor() {
        //
    }


    trigger(message: InfluxDBBatchElement[]): ChargingControl {

        let chargingControl: ChargingControl = {
            chargeCurrent: AMP_MIN, doCharging: false
        };

        this.batConvPower = this.updateIfDefined(this.batConvPower, this.getData(message, "EssInfoStatistics", "batconv_power"));
        this.gridPower = this.updateIfDefined(this.gridPower, this.getData(message, "EssInfoStatistics", "grid_power"));
        this.loadPower = this.updateIfDefined(this.loadPower, this.getData(message, "EssInfoStatistics", "load_power"));
        this.pcs_pv_total_power = this.updateIfDefined(this.pcs_pv_total_power, this.getData(message, "EssInfoStatistics", "pcs_pv_total_power"));
        this.soc = this.updateIfDefined(this.soc, this.getData(message, "EssCommonInfoBATT", "soc"));
        this.loadingPower1 = this.updateIfDefined(this.soc, this.getData(message, "EGoChargerStatus", "powerL1"));
        this.loadingPower2 = this.updateIfDefined(this.soc, this.getData(message, "EGoChargerStatus", "powerL2"));
        this.loadingPower3 = this.updateIfDefined(this.soc, this.getData(message, "EGoChargerStatus", "powerL3"));

        if (true//
            && (undefined !== this.batConvPower) //
            && (undefined !== this.gridPower) //
            && (undefined !== this.loadPower) //
            && (undefined !== this.pcs_pv_total_power) //
            && (undefined !== this.soc) //
            && (undefined !== this.loadingPower1) //
            && (undefined !== this.loadingPower2) //
            && (undefined !== this.loadingPower3) //
        ) {
            // All needed values available, do controlling
            chargingControl = this.control();
        }

        return chargingControl;


    }
    private control(): ChargingControl {
        let doCharging = false;
        let chargeCurrent = AMP_MIN;

        const loadingPower = this.loadingPower1 + this.loadingPower2 + this.loadingPower3;
        const neededPowerForHome = this.loadPower - loadingPower;
        const availablePowerForLoading = this.pcs_pv_total_power - neededPowerForHome;
        const availableCurrent = Math.floor((availablePowerForLoading / NUMBER_LINES) / V_GRID);

        if (availableCurrent > AMP_MIN) {
            chargeCurrent = Math.min(availableCurrent, AMP_MAX);
            doCharging = true;
        }

        return { chargeCurrent: chargeCurrent, doCharging: doCharging };
    }

    private updateIfDefined(oldValue: number, newValue: number): number {

        let value = oldValue;

        if (undefined !== newValue) {
            value = newValue;
        }
        return value;
    }

    private getData(batch: InfluxDBBatchElement[], measurement: string, parameter: string): number {

        let returnValue: number = undefined;

        for (const element of batch) {
            if (element.measurement === measurement) {
                const fields = element.fields;
                returnValue = <number>fields[parameter];

                break;
            }
        }

        return returnValue;
    }


}

export { EGoChargerCtl, ChargingControl };