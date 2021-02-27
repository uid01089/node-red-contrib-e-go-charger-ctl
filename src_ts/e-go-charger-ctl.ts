import { Node, Red, NodeProperties } from "node-red";
import { EGoChargerCtl } from "./EGoChargerCtl";

const func = (RED: Red) => {
    const eGoChargerCtl = function (config: NodeProperties) {

        this.nrPhases = (config as any).nrPhases;
        this.minCurrent = (config as any).minCurrent;

        this.eGoChargerCtl = new EGoChargerCtl(this.nrPhases, this.minCurrent);
        const node: Node = this;

        RED.nodes.createNode(node, config);


        /** 
         * Nodes register a listener on the input event 
         * to receive messages from the up-stream nodes in a flow.
        */
        node.on("input", async function (msg, send, done) {


            node.log(msg);

            // For maximum backwards compatibility, check that send exists.
            // If this node is installed in Node-RED 0.x, it will need to
            // fallback to using `node.send`
            send = send || function () { node.send.apply(node, arguments) }

            const eGoChargerCtl = ((node as any).eGoChargerCtl) as EGoChargerCtl;


            const message = msg.payload;
            if (message !== undefined && message !== null) {

                const chargingControl = eGoChargerCtl.trigger(message);

                send([{ payload: "" + chargingControl.doCharging }, { payload: "" + chargingControl.chargeCurrent }]);


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