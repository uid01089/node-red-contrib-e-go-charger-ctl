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
const Throttle_1 = require("./Throttle");
const func = (RED) => {
    const eGoChargerCtl = function (config) {
        this.nrPhases = parseFloat(config.nrPhases);
        this.minCurrent = parseFloat(config.minCurrent);
        this.essAccuThreshold = parseFloat(config.essAccuThreshold);
        this.switchOnCurrent = parseFloat(config.switchOnCurrent);
        this.eGoChargerCtl = new EGoChargerCtl_1.EGoChargerCtl(this.nrPhases, this.minCurrent, this.essAccuThreshold, this.switchOnCurrent);
        this.throttle = new Throttle_1.Throttle(60000);
        this.mqqtOld = "";
        const node = this;
        RED.nodes.createNode(node, config);
        /**
         * Nodes register a listener on the input event
         * to receive messages from the up-stream nodes in a flow.
        */
        node.on("input", function (msg, send, done) {
            return __awaiter(this, void 0, void 0, function* () {
                const throttle = (node.throttle);
                const eGoChargerCtl = (node.eGoChargerCtl);
                const message = msg.payload;
                if (message !== undefined && message !== null) {
                    // Always handle message
                    const chargingControl = eGoChargerCtl.trigger(message);
                    // Every 1 Minute do needfull things
                    throttle.trigger(() => {
                        node.log(msg);
                        // For maximum backwards compatibility, check that send exists.
                        // If this node is installed in Node-RED 0.x, it will need to
                        // fallback to using `node.send`
                        send = send || function () { node.send.apply(node, arguments); };
                        let mqqt = null;
                        if (chargingControl.isCarConnected) {
                            mqqt = [
                                { payload: "alw=" + (chargingControl.doCharging ? 1 : 0) },
                                { payload: "amx=" + chargingControl.chargeCurrent },
                            ];
                        }
                        // Check if different compared with predecessor
                        if (JSON.stringify(mqqt) !== (node.mqqtOld)) {
                            (node.mqqtOld) = JSON.stringify(mqqt);
                        }
                        else {
                            // Don't trigger mqqt
                            mqqt = null;
                        }
                        send([
                            { payload: "" + chargingControl.doCharging },
                            { payload: "" + chargingControl.chargeCurrent },
                            { payload: "" + chargingControl.mode },
                            mqqt,
                            (chargingControl.influxDb !== null ? { payload: [chargingControl.influxDb] } : null)
                        ]);
                    });
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