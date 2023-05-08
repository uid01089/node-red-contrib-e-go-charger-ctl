import { EGoChargerCtl } from "./EGoChargerCtl";
import { PIDController } from "./PIDController";

const nrPhases = 1;
const minCurrent = 6;
const essAccuThreshold = 40;
const switchOnCurrent = 7;


const pidController = new PIDController(0.0, 0.8, 0.0, 1);
const charger = new EGoChargerCtl(nrPhases, minCurrent, essAccuThreshold, switchOnCurrent, pidController);

const essInfoStatistics = {
    measurement: "EssInfoStatistics",
    fields: {
        batconv_power: 800,
        grid_power: 100,
        load_power: -100,
        pcs_pv_total_power: 2400,
    }
};

const essCommonInfoBATT = {
    measurement: "EssCommonInfoBATT",
    fields: {
        soc: 80
    }
};

const eGoChargerStatus = {
    measurement: "EGoChargerStatus",
    fields: {
        soc: 80,
        powerL1: 0,
        powerL2: 0,
        powerL3: 0,
        status: 0
    }
};

function execute(power: number): number {
    eGoChargerStatus.fields.powerL1 = power;
    essInfoStatistics.fields.load_power = -100 - power;


    const result = charger.trigger([essInfoStatistics, eGoChargerStatus, essCommonInfoBATT]);

    console.log(`Charging ${eGoChargerStatus.fields.powerL1} - LoadPower ${essInfoStatistics.fields.load_power} : ${result.chargeCurrent}`)

    return result.chargeCurrent;

}

console.log("Starting with 0");
let currentCurrency = 0;
for (let i = 0; i < 10; i++) {
    currentCurrency = execute(currentCurrency * 230);

}
console.log("Decreasing value to 1200");
essInfoStatistics.fields.pcs_pv_total_power = 1200;
for (let i = 0; i < 10; i++) {
    currentCurrency = execute(currentCurrency * 230);

}

console.log("Increasing value to 5000");
essInfoStatistics.fields.pcs_pv_total_power = 5000;
for (let i = 0; i < 10; i++) {
    currentCurrency = execute(currentCurrency * 230);

}

console.log("Decreasing value to 0");
essInfoStatistics.fields.pcs_pv_total_power = 0;
for (let i = 0; i < 10; i++) {
    currentCurrency = execute(currentCurrency * 230);

}

console.log("Increasing value to 1700");
essInfoStatistics.fields.pcs_pv_total_power = 1700;
for (let i = 0; i < 10; i++) {
    currentCurrency = execute(currentCurrency * 230);

}

console.log("Increasing value to 1500");
essInfoStatistics.fields.pcs_pv_total_power = 1500;
for (let i = 0; i < 10; i++) {
    currentCurrency = execute(currentCurrency * 230);

}