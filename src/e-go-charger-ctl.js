"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const EGoChargerCtl_1 = require("./EGoChargerCtl");
const PIDController_1 = require("./PIDController");
const func = (RED) => {
    const eGoChargerCtl = function (config) {
        this.nrPhases = parseFloat(config.nrPhases);
        this.minCurrent = parseFloat(config.minCurrent);
        this.essAccuThreshold = parseFloat(config.essAccuThreshold);
        this.switchOnCurrent = parseFloat(config.switchOnCurrent);
        this.Kp = parseFloat(config.Kp);
        this.Ki = parseFloat(config.Ki);
        this.Kd = parseFloat(config.Kd);
        this.sampleTime = parseFloat(config.sampleTime);
        this.piController = new PIDController_1.PIDController(this.Kp, this.Ki, this.Kd, this.sampleTime);
        this.eGoChargerCtl = new EGoChargerCtl_1.EGoChargerCtl(this.nrPhases, this.minCurrent, this.essAccuThreshold, this.switchOnCurrent, this.piController);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const node = this;
        RED.nodes.createNode(node, config);
        /**
         * Nodes register a listener on the input event
         * to receive messages from the up-stream nodes in a flow.
        */
        node.on("input", function (msg, send, done) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const eGoChargerCtl = node.eGoChargerCtl;
                    const message = msg.payload;
                    if (message !== undefined && message !== null) {
                        // Always handle message
                        const chargingControl = eGoChargerCtl.trigger(message);
                        node.log(msg);
                        // For maximum backwards compatibility, check that send exists.
                        // If this node is installed in Node-RED 0.x, it will need to
                        // fallback to using `node.send`
                        // eslint-disable-next-line prefer-spread, prefer-rest-params
                        send = send || function () { node.send.apply(node, arguments); };
                        send([
                            { payload: "" + chargingControl.doCharging },
                            { payload: "" + chargingControl.chargeCurrent },
                            { payload: "" + chargingControl.mode },
                            (chargingControl.influxDb !== null ? { payload: [chargingControl.influxDb] } : null)
                        ]);
                    }
                }
                catch (e) {
                    console.error(e);
                }
                // Once finished, call 'done'.
                // This call is wrapped in a check that 'done' exists
                // so the node will work in earlier versions of Node-RED (<1.0)
                if (done) {
                    done();
                }
            });
        });
        /**
         * Whenever a new flow is deployed, the existing nodes are deleted.
         * If any of them need to tidy up state when this happens, such as
         * disconnecting from a remote system, they should register a listener
         * on the close event.
        */
        node.on('close', function (removed, done) {
            if (removed) {
                // This node has been disabled/deleted
            }
            else {
                // This node is being restarted
            }
            done();
        });
    };
    RED.nodes.registerType("e-go-charger-ctl", eGoChargerCtl);
};
module.exports = func;
//# sourceMappingURL=e-go-charger-ctl.js.map