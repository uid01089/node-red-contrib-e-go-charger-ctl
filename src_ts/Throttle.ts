// https://www.telerik.com/blogs/debouncing-and-throttling-in-javascript

class Throttle {

    private timeout: number;
    private triggerId: NodeJS.Timeout;

    constructor(timeout: number) {

        this.timeout = timeout;
        this.triggerId = null;
    }

    public trigger(fct: () => void): void {

        // Cancel running timeout
        if (this.triggerId === null) {
            fct();
            this.triggerId = setTimeout(() => {
                this.triggerId = null;
            }, this.timeout);


        }

        // Retrigger new timeout

    }
}

export { Throttle }