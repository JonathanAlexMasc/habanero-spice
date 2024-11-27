class wire {
    static wireID = 0;

    constructor() {
        this.wireInstance = "Wire" + ++wire.wireID;
        this.connectionA = "Name of Box";
        this.connectionB = "Name of other box";
        this.voltage = "0"
    }
}
