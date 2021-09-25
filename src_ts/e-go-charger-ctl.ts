import { Node, Red, NodeProperties } from "node-red";
import { EGoChargerCtl, InfluxDBEGoChargerCtl } from "./EGoChargerCtl";
import { Throttle } from "./Throttle";

interface PayLoadMsg {
    payload: string;
}


const func = (RED: Red) => {
    const eGoChargerCtl = function (config: NodeProperties) {

        this.nrPhases = parseFloat((config as any).nrPhases);
        this.minCurrent = parseFloat((config as any).minCurrent);
        this.essAccuThreshold = parseFloat((config as any).essAccuThreshold);
        this.switchOnCurrent = parseFloat((config as any).switchOnCurrent);

        this.eGoChargerCtl = new EGoChargerCtl(this.nrPhases, this.minCurrent, this.essAccuThreshold, this.switchOnCurrent);
        this.throttle = new Throttle(60000);
        this.mqqtOld = "";

        const node: Node = this;

        RED.nodes.createNode(node, config);


        /** 
         * Nodes register a listener on the input event 
         * to receive messages from the up-stream nodes in a flow.
        */
        node.on("input", async function (msg, send, done) {

            const throttle = ((node as any).throttle) as Throttle;
            const eGoChargerCtl = ((node as any).eGoChargerCtl) as EGoChargerCtl;


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
                    send = send || function () { node.send.apply(node, arguments) }










                    let mqqt: PayLoadMsg[] = null;
                    if (chargingControl.isCarConnected) {
                        mqqt = [
                            { payload: "alw=" + (chargingControl.doCharging ? 1 : 0) },
                            { payload: "amx=" + chargingControl.chargeCurrent },
                        ];
                    }

                    // Check if different compared with predecessor
                    if (JSON.stringify(mqqt) !== ((node as any).mqqtOld)) {
                        ((node as any).mqqtOld) = JSON.stringify(mqqt);
                    } else {
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


        /** 
         * Whenever a new flow is deployed, the existing nodes are deleted. 
         * If any of them need to tidy up state when this happens, such as 
         * disconnecting from a remote system, they should register a listener 
         * on the close event.
        */
        node.on('close', function (removed, done) {
            if (removed) {
                // This node has been disabled/deleted
            } else {
                // This node is being restarted
            }
            done();
        });

    }
    RED.nodes.registerType("e-go-charger-ctl", eGoChargerCtl);
}

module.exports = func;