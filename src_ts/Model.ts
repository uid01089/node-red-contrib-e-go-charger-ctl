import { InfluxDBBatchElement } from "./InfluxDBBatchElement";

export class Model {

    private batConvPower: number;
    private gridPower: number;
    private loadPower: number;
    private pcs_pv_total_power: number;
    private soc: number;
    private loadingPower1: number;
    private loadingPower2: number;
    private loadingPower3: number;
    private status: number;



    public trigger(message: InfluxDBBatchElement[]): void {
        this.batConvPower = this.updateIfDefined(this.batConvPower, this.getData(message, "EssInfoStatistics", "batconv_power"));
        this.gridPower = this.updateIfDefined(this.gridPower, this.getData(message, "EssInfoStatistics", "grid_power"));
        this.loadPower = this.updateIfDefined(this.loadPower, this.getData(message, "EssInfoStatistics", "load_power"));
        this.pcs_pv_total_power = this.updateIfDefined(this.pcs_pv_total_power, this.getData(message, "EssInfoStatistics", "pcs_pv_total_power"));
        this.soc = this.updateIfDefined(this.soc, this.getData(message, "EssCommonInfoBATT", "soc"));
        this.loadingPower1 = this.updateIfDefined(this.loadingPower1, this.getData(message, "EGoChargerStatus", "powerL1"));
        this.loadingPower2 = this.updateIfDefined(this.loadingPower2, this.getData(message, "EGoChargerStatus", "powerL2"));
        this.loadingPower3 = this.updateIfDefined(this.loadingPower3, this.getData(message, "EGoChargerStatus", "powerL3"));
        this.status = this.updateIfDefined(this.loadingPower3, this.getData(message, "EGoChargerStatus", "status"));
    }

    public isModelConsistent(): boolean {
        return (true//
            && (undefined !== this.batConvPower) //
            && (undefined !== this.gridPower) //
            && (undefined !== this.loadPower) //
            && (undefined !== this.pcs_pv_total_power) //
            && (undefined !== this.soc) //
            && (undefined !== this.loadingPower1) //
            && (undefined !== this.loadingPower2) //
            && (undefined !== this.loadingPower3) //
            && (undefined !== this.status) //
        )
    }

    public calcAvailablePower(): number {

        let availablePowerForLoading = 0;

        if (this.isModelConsistent()) {
            const loadingPower = this.loadingPower1 + this.loadingPower2 + this.loadingPower3;
            const neededPowerForHome = -1 * (this.loadPower + loadingPower); //loadPower is negative
            availablePowerForLoading = this.pcs_pv_total_power - neededPowerForHome;
        }
        return availablePowerForLoading;
    }

    public getSoc(): number {
        return this.soc;
    }

    public getStatus(): number {
        return this.status;
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