
const helper = require("node-red-node-test-helper");
const lowerNode = require("../src/e-go-charger-ctl.js");



describe('lower-case Node', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    const flow = [
        {
            id: "EGoChargerId", type: "e-go-charger-ctl", name: "EGoChargerName", output: 2,
            wires: [["doCharging"], ["chargingCurrent"]]
        },
        { id: "doCharging", type: "helper" },
        { id: "chargingCurrent", type: "helper" }

    ];





    it('should be loaded', function (done) {
        var flow = [{ id: "EGoChargerId", type: "e-go-charger-ctl", name: "EGoChargerName" }];
        helper.load(lowerNode, flow, function () {
            var underTestNode = helper.getNode("EGoChargerId");
            underTestNode.should.have.property('name', 'EGoChargerName');
            done();
        });
    });

    it('should return Device', function (done) {


        const testMsgWallbox = {

            payload: [
                {
                    measurement: "EGoChargerStatus",
                    fields: {
                        chargedEnergy: 0,
                        totalChargedEnergy: 203,
                        temperature: 0,
                        powerL1: 0,
                        powerL2: 0,
                        powerL3: 0
                    }
                }]

        };


        const testMsgSolar =
        {
            payload: [
                {
                    measurement: "EssInfoDirection",
                    fields: {
                        is_direct_consuming_: 0,
                        is_battery_charging_: 0,
                        is_battery_discharging_: 1,
                        is_grid_selling_: 0,
                        is_grid_buying_: 0,
                        is_charging_from_grid_: 0,
                        is_discharging_to_grid_: 0
                    }
                }, {
                    measurement: "EssInfoStatistics",
                    fields: {
                        pcs_pv_total_power: 0,
                        batconv_power: 415,
                        load_power: -416,
                        grid_power: -1
                    }
                }, {
                    measurement: "EssCommonInfoPV",
                    fields: {
                        pv1_voltage: 346.600006,
                        pv2_voltage: 323.799988,
                        pv1_power: 1,
                        pv2_power: 1,
                        pv1_current: 0.04,
                        pv2_current: 0.05
                    }
                }, {
                    measurement: "EssCommonInfoBATT",
                    fields: { soc: 80.1 }
                }]
        };





        helper.load(lowerNode, flow, function () {
            var doCharging = helper.getNode("doCharging");
            var chargingCurrent = helper.getNode("chargingCurrent");

            var underTestNode = helper.getNode("EGoChargerId");

            doCharging.on("input", function (msg) {

                console.log(msg);

                //msg.should.have.property('payload', '{"Device":"0x6DBE","Name":"TmpSens1","BatteryVoltage":3.005,"BatteryPercentage":100,"Voltage":3.005,"Battery":100,"Temperature":27.17,"Humidity":51.87,"Endpoint":1,"LinkQuality":39}');
                done();
            });

            chargingCurrent.on("input", function (msg) {

                console.log(msg);
                //msg.should.have.property('payload', '{"Device":"0x6DBE","Name":"TmpSens1","BatteryVoltage":3.005,"BatteryPercentage":100,"Voltage":3.005,"Battery":100,"Temperature":27.17,"Humidity":51.87,"Endpoint":1,"LinkQuality":39}');
                done();
            });


            underTestNode.receive({ payload: JSON.stringify(testMsgSolar.payload) });
            underTestNode.receive({ payload: JSON.stringify(testMsgWallbox.payload) });
        });
    });

});