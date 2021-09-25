export class Util {

    public static payLoadPrinter(object: unknown): Record<string, unknown> {
        let returnValue = null;
        if (object !== undefined && object !== null) {
            returnValue = { payload: object };
        }

        return returnValue;

    }

}