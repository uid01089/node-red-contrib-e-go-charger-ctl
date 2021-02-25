
const helper = require("node-red-node-test-helper");
const lowerNode = require("../src/e-go-charger.js");



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
            id: "EGoChargerId", type: "e-go-charger", name: "EGoChargerName",
            wires: [["EGoChargerMqqtProvider"]]
        },
        { id: "EGoChargerMqqtProvider", type: "helper" }

    ];



    const testMsg = {
        payload: '{"ZbReceived":{"0x6DBE":{"Device":"0x6DBE","Name":"TmpSens1","BatteryVoltage":3.005,"BatteryPercentage":100,"Voltage":3.005,"Battery":100,"Temperature":27.17,"Humidity":51.87,"Endpoint":1,"LinkQuality":39}}}'
    };

    it('should be loaded', function (done) {
        var flow = [{ id: "EGoChargerId", type: "e-go-charger", name: "EGoChargerName" }];
        helper.load(lowerNode, flow, function () {
            var underTestNode = helper.getNode("EGoChargerId");
            underTestNode.should.have.property('name', 'EGoChargerName');
            done();
        });
    });

    it('should return Device', function (done) {
        helper.load(lowerNode, flow, function () {
            var helperNode = helper.getNode("EGoChargerMqqtProvider");
            var underTestNode = helper.getNode("EGoChargerId");

            helperNode.on("input", function (msg) {

                msg.should.have.property('payload', '{"Device":"0x6DBE","Name":"TmpSens1","BatteryVoltage":3.005,"BatteryPercentage":100,"Voltage":3.005,"Battery":100,"Temperature":27.17,"Humidity":51.87,"Endpoint":1,"LinkQuality":39}');
                done();
            });
            underTestNode.receive(testMsg);
        });
    });

});