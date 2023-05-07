import { NodeProperties, Red, Node, Message } from "./node-red-types"
import { EGoChargerCtl, InfluxDBEGoChargerCtl } from "./EGoChargerCtl";
import { PIDController } from "./PIDController";


interface MyNodeProperties extends NodeProperties {

    nrPhases: string;
    minCurrent: string;
    essAccuThreshold: string;
    switchOnCurrent: string;
    Kp: string;
    Ki: string;
    Kd: string;
    sampleTime: string;
}

interface MyNode extends Node {
    log(msg: Message): unknown;
    nrPhases: number;
    minCurrent: number;
    essAccuThreshold: number;
    switchOnCurrent: number;
    eGoChargerCtl: EGoChargerCtl;
    mqqtOld: string;
    piController: PIDController;
}



const func = (RED: Red) => {
    const eGoChargerCtl = function (config: MyNodeProperties) {

        this.nrPhases = parseFloat(config.nrPhases);
        this.minCurrent = parseFloat(config.minCurrent);
        this.essAccuThreshold = parseFloat(config.essAccuThreshold);
        this.switchOnCurrent = parseFloat(config.switchOnCurrent);

        this.Kp = parseFloat(config.Kp);
        this.Ki = parseFloat(config.Ki);
        this.Kd = parseFloat(config.Kd);
        this.sampleTime = parseFloat(config.sampleTime);


        this.piController = new PIDController(this.Kp, this.Ki, this.Kd, this.sampleTime);
        this.eGoChargerCtl = new EGoChargerCtl(this.nrPhases, this.minCurrent, this.essAccuThreshold, this.switchOnCurrent, this.piController);

        this.mqqtOld = "";

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const node: MyNode = this;

        RED.nodes.createNode(node, config);


        /** 
         * Nodes register a listener on the input event 
         * to receive messages from the up-stream nodes in a flow.
        */
        node.on("input", async function (msg, send, done) {
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
                    send = send || function () { node.send.apply(node, arguments) }


                    send([
                        { payload: "" + chargingControl.doCharging },
                        { payload: "" + chargingControl.chargeCurrent },
                        { payload: "" + chargingControl.mode },
                        (chargingControl.influxDb !== null ? { payload: [chargingControl.influxDb] } : null)
                    ]);


                }

            }
            catch (e: unknown) {
                console.error(e);
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
        node.on('close', function (removed: boolean, done: () => void) {
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