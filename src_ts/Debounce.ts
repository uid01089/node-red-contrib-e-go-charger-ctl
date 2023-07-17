// debouncing behaves like grouping multiple events into one single event.

// https://www.telerik.com/blogs/debouncing-and-throttling-in-javascript

class Debounce {

    private timeout: number;
    private triggerId: number;

    constructor(timeout: number) {

        this.timeout = timeout;
        this.triggerId = null;
    }

    public trigger(fct: () => void): void {

        // Cancel running timeout
        if (this.triggerId != null) {
            window.clearTimeout(this.triggerId);
        }

        // Retrigger new timeout
        this.triggerId = window.setTimeout(() => {
            fct();
        }, this.timeout);
    }
}

export { Debounce }