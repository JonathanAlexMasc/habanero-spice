// Class for Voltage Source, extends Entities
class Volt extends Entities {
    static VoltID = 0;
    constructor(posx = '500px', posy = '500px') {
        super();
        this.name = "Voltage" + ++Volt.VoltID; // Unique name for each Volt instance
        this.imgSrc = "images/Voltage/voltage.svg";        // Image path for Volt
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.numInCons = 1;
        this.numOutCons = 1;
        this.info = "[fill] AC 1";
        this.equation = this.name;
        this.Currconnections = []; //array to hold what other elements are connected to this one
        this.blockNodes();
        this.buildComponent();
        this.updateCoordinates(this.x, this.y);
    }

    attachConnectors(numInCons, numOutCons, holderBtn) {
        let conIDCounter = 0;
        for (let i = 0; i < numInCons; i++) {
            const con = document.createElement("button");
            con.className = "in-connector";
            con.classList.add("in-connector-" + i);
            con.id = this.name + "-connector-" + conIDCounter++;
            con.id = this.name + "-connector-" + conIDCounter++;
            holderBtn.appendChild(con);
            this.attachWireListener(con, con.id);
            this.attachProbeListener(con, con.id);
            this.attachTop(con);
            this.Style(con); //makes a connector on the left
            this.connectors.push(con);
        }
        for (let i = 0; i < numOutCons; i++) {
            const con = document.createElement("button");
            con.id = this.name + "-connector-" + conIDCounter++;
            con.id = this.name + "-connector-" + conIDCounter++;
            con.className = "out-connector";
            con.classList.add("out-connector-" + i);
            holderBtn.appendChild(con);
            this.attachWireListener(con, con.id);
            this.attachProbeListener(con, con.id);
            this.attachBot(con); //attaches on the bot
            this.Style(con); //styles the connector (adds img, size, etc)
            this.connectors.push(con);
        }
    }

    attachBot(con) {
        con.style.bottom = "-7px"; // Adjust as needed to move it below the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-45%)";
        con.classList.add("bot-connector");
    }
    attachTop(con) {
        con.style.top = "-9px"; // Adjust as needed to move it above the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-50%)";
        con.classList.add("top-connector");
    }

    static resetID() {
        Volt.VoltID = 0;
    }
}

window.Volt = Volt;

export function AddVoltage(posx, posy) {
    return new Volt(posx, posy);
}