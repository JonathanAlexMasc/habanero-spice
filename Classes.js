// Base class for all entities
class Entities {
    constructor() {
        this.name = "entity";            // Name of the entity
        this.numInCons = 0;               // Number of input connections
        this.numOutCons = 0;              // Number of output connections
        //this.imgSrc = "PathToImage";     // Path to the image of the entity
        this.x = '300px';                // X coordinate
        this.y = '500px';                // Y coordinate
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.info = "null";
        this.connectors = [];
        this.blockedNodes = [];
        this.blockNodes();
        this.buildComponent();
    }

    buildComponent() {
        const componentID = this.name;
        componentMap.set(componentID, { instance: this, connectors: [] });
        const grid = document.getElementById("grid");
        const holder = document.createElement("div");
        holder.className = 'ButtonDiv';
        holder.style.position = 'absolute';
        holder.style.top = this.y
        holder.style.left = this.x;

        const button = document.createElement("button");
        button.id = 'component-button-' + componentID;
        button.className = "b1 position";
        button.draggable = true;
        button.dataset.componentId = componentID;
        button.style.position = "relative";
        console.log(this.imgSrc);
        if (this.imgSrc) {  // Only set the background image if imgSrc is defined
            button.style.backgroundImage = `url(${this.imgSrc})`;
        }
        button.style.border = "none";
        button.style.width = "60px";
        button.style.height = "60px";
        button.style.transform = 'rotate(0deg)'
        button.style.backgroundSize = "cover";
        button.style.backgroundPosition = "center";
        button.style.backgroundColor = "transparent";
        button.style.border = "none";
        this.attachConnectors(this.numInCons, this.numOutCons, holder); //this function creates the cons, then pushed them in this.connectors
        componentMap.get(componentID).connectors = this.connectors;

        holder.appendChild(button);
        grid.appendChild(holder);

        dragElement(holder);
        //create fab buttons for the component
        createFABForComponent(button);


        // Grab the existing fab buttons
        const rotateButton = document.getElementById(`rotate-${componentID}`);
        const deleteButton = document.getElementById(`delete-${componentID}`);
        const clearWiresButton = document.getElementById(`clear-${componentID}`);
        const editButton = document.getElementById(`edit-${componentID}`);

        //add listeners to them
        fabListener(button, rotateButton, deleteButton, clearWiresButton, editButton, connectors, componentID);
    
        this.updateCoordinates(this.x, this.y);
    }

    updateCoordinates(x, y) {
        this.x = typeof x === 'string' && x.includes('px') ? x : `${x}px`;
        this.y = typeof y === 'string' && y.includes('px') ? y : `${y}px`;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.blockNodes();
    }

    blockNodes() {
        this.blockedNodes = [];
        for(let i = this.intX; i <= this.intX + 60; i+= 10) {
            for(let j = this.intY; j <= this.intY + 60; j+= 10) {
                this.blockedNodes.push([i, j]);
            }
        }
    }

    attachConnectors(numInCons, numOutCons, holderBtn) {
    }

    attachListener(con, conID) {
        if (typeof conID !== 'string') {
            console.error('Invalid connectionId type in attachClickListener:', conID);
            return;
        }
        con.addEventListener('click', function() {
            console.log(`Connection point ${conID} clicked`);
            console.log(isDrawingWire);
            if (!isDrawingWire) {
                startDrawingWire(conID);
            } else {
                endDrawingWire(conID);
            }
        });

    }

    Style(connector) { //basic styling for every connector, dont change unless required, if u do change, keep this
        connector.style.backgroundImage = `url("images/CONNECTOR.svg")`;
        connector.style.backgroundSize = 'cover'; 
        connector.style.backgroundPosition = 'center'; 
        connector.style.backgroundColor = "transparent";
        connector.style.border = "none";
        connector.style.position = "absolute";
        connector.style.width = "10px"; // Set width
        connector.style.height = "10px"; // Set height
    }
    //positional attachers, can change for each class, empty in parent (volt needs a left/right)
    //ground would need just a top etc.
    attachLeft(con) {
        
    }
    attachRight(con) {
        
    }
    attachTop(con) {
        
    }
    attachBot(con) {
        
    }

    displayModifiableValues() {
        
    }

}

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
        this.info = " AC 1";
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
            con.id = "Volt-connector-" + conIDCounter++;
            holderBtn.appendChild(con);
            this.attachListener(con, con.id);
            this.attachTop(con);
            this.Style(con); //makes a connector on the left
            this.connectors.push(con);
        }
        for (let i = 0; i < numOutCons; i++) {
            const con = document.createElement("button");
            con.id = "Volt-connector-" + conIDCounter++;
            con.className = "out-connector";
            con.classList.add("out-connector-" + i);
            holderBtn.appendChild(con);
            this.attachListener(con, con.id);
            this.attachBot(con); //attaches on the bot
            this.Style(con); //styles the connector (adds img, size, etc)
            this.connectors.push(con);
        }
    }

    attachBot(con) {
        con.style.bottom = "-7px"; // Adjust as needed to move it below the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-45%)";
    }
    attachTop(con) {
        con.style.top = "-9px"; // Adjust as needed to move it above the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-50%)";
    }
}

// Class for Resistor, extends Entities
class Resistor extends Entities {
    static resID = 0;

    constructor( posx = '500px', posy = '500px') {
        super();
        this.name = "Resistor" + ++Resistor.resID; // Unique name for each Resistor instance
        this.imgSrc = "images/Resistor/resistor.svg";               // Image path for Resistor
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.numInCons = 1;
        this.numOutCons = 1;
        this.info = "1k";
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
            con.id = "Res-connector-" + conIDCounter++;
            holderBtn.appendChild(con);
            this.attachListener(con, con.id);
            this.attachLeft(con);
            this.Style(con); //makes a connector on the left
            this.connectors.push(con);
        }
        for (let i = 0; i < numOutCons; i++) {
            const con = document.createElement("button");
            con.id = "Res-connector-" + conIDCounter++;
            con.className = "out-connector";
            con.classList.add("out-connector-" + i);
            holderBtn.appendChild(con);
            this.attachListener(con, con.id);
            this.attachRight(con); //attaches on the bot
            this.Style(con); //styles the connector (adds img, size, etc)
            this.connectors.push(con);
        }
    }

    attachRight( button2) {
        button2.style.right = "-10px"; // Adjust as needed to move it to the right of the main button
        button2.style.top = "50%";
        button2.style.transform = "translateY(-50%)";
    }
    
    attachLeft(button) {
        button.style.left = "-10px"; // Adjust as needed to move it to the left of the main button
        button.style.top = "50%";
        button.style.transform = "translateY(-50%)";
    }

    displayModifiableValues() {
        // Create a container div for the modal
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade'); // Use Bootstrap modal and fade animation
        modal.id = "resistorModal"; // Unique ID for the modal
        modal.tabIndex = -1; // Required for Bootstrap modals

        modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modify Resistor Value</h5>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <input type="text" class="form-control" id="resistanceInput" value="${this.info}" aria-label="Resistor Value">
                        <span class="input-group-text">Ω</span>
                    </div>
                </div>
            </div>
        </div>
    `;

        // Append modal to body
        document.body.appendChild(modal);

        // Show the modal using Bootstrap's modal methods
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Add autosave functionality
        const resistanceInput = modal.querySelector('#resistanceInput');
        resistanceInput.addEventListener('input', () => {
            this.info = resistanceInput.value;
        });

        // Remove the modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }


}

// Class for Inductor, extends Entities
class Inductor extends Entities {
    static inductorID = 0;

    constructor( posx = '500px', posy = '500px') {
        super();
        this.name = "Inductor" + ++Inductor.inductorID; // Unique name for each Inductor instance
        this.imgSrc = "images/Inductor/inductor.svg";                    // Image path for Inductor
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.numInCons = 1;
        this.numOutCons = 1;
        this.info = "1u";
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
            con.id = "Ind-connector-" + conIDCounter++;
            holderBtn.appendChild(con);
            this.attachListener(con, con.id);
            this.attachLeft(con);
            this.Style(con); //makes a connector on the left
            this.connectors.push(con);
        }
        for (let i = 0; i < numOutCons; i++) {
            const con = document.createElement("button");
            con.id = "Ind-connector-" + conIDCounter++;
            con.className = "out-connector";
            con.classList.add("out-connector-" + i);
            holderBtn.appendChild(con);
            this.attachListener(con, con.id);
            this.attachRight(con); //attaches on the bot
            this.Style(con); //styles the connector (adds img, size, etc)
            this.connectors.push(con);
        }
    }

    attachRight( button2) {
        button2.style.right = "-10px"; // Adjust as needed to move it to the right of the main button
        button2.style.top = "50%";
        button2.style.transform = "translateY(-50%)";
    }
    
    attachLeft(button) {
        button.style.left = "-10px"; // Adjust as needed to move it to the left of the main button
        button.style.top = "50%";
        button.style.transform = "translateY(-50%)";
    }

    displayModifiableValues() {
        // Create a container div for the modal
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade'); // Use Bootstrap modal and fade animation
        modal.id = "inductorModal"; // Unique ID for the modal
        modal.tabIndex = -1; // Required for Bootstrap modals

        modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modify Inductance</h5>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <input type="text" class="form-control" id="inductanceInput" value="${this.info}" aria-label="Inductor Value">
                        <span class="input-group-text">L</span>
                    </div>
                </div>
            </div>
        </div>
    `;

        // Append modal to body
        document.body.appendChild(modal);

        // Show the modal using Bootstrap's modal methods
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Add autosave functionality
        const inductanceInput = modal.querySelector('#inductanceInput');
        inductanceInput.addEventListener('input', () => {
            this.info = inductanceInput.value;
        });

        // Remove the modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
}

// Class for Ground (GND), extends Entities
class Gnd extends Entities {
    static gndID = 0;

    constructor( posx = '500px', posy = '500px') {
        super();
        this.name = "Ground" + ++Gnd.gndID; // Unique name for each GND instance
        this.imgSrc = "images/Ground/ground.svg";     // Image path for GND
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.info = "null";
        this.numInCons = 1;
        this.numOutCons = 0; //not sure how this will work with ground, only 1 connector up top
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
            con.id = "GND-connector-" + conIDCounter++;
            holderBtn.appendChild(con);
            this.attachListener(con, con.id);
            this.attachTop(con);
            this.Style(con); //makes a connector on the left
            this.connectors.push(con);
        }
    }

    attachTop(con) {
        con.style.top = "-9px"; // Adjust as needed to move it above the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-50%)";
    }
    
}

// Class for Capacitor, extends Entities
class Capacitor extends Entities {
    static capID = 0;

    constructor( posx = '500px', posy = '500px') {
        super();
        this.name = "Capacitor" + ++Capacitor.capID; // Unique name for each Capacitor instance
        this.imgSrc = "images/Capacitor/capacitor.svg";                 // Image path for Capacitor
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.numInCons = 1;
        this.numOutCons = 1;
        this.info = "1u";
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
            con.id = "Cap-connector-" + conIDCounter++;
            holderBtn.appendChild(con);
            this.attachListener(con, con.id);
            this.attachLeft(con);
            this.Style(con); //makes a connector on the left
            this.connectors.push(con);
        }
        for (let i = 0; i < numOutCons; i++) {
            const con = document.createElement("button");
            con.id = "cap-connector-" + conIDCounter++;
            con.className = "out-connector";
            con.classList.add("out-connector-" + i);
            holderBtn.appendChild(con);
            this.attachListener(con, con.id);
            this.attachRight(con); //attaches on the bot
            this.Style(con); //styles the connector (adds img, size, etc)
            this.connectors.push(con);
        }
    }

    attachRight( button2) {
        button2.style.right = "-10px"; // Adjust as needed to move it to the right of the main button
        button2.style.top = "50%";
        button2.style.transform = "translateY(-50%)";
    }
    
    attachLeft(button) {
        button.style.left = "-10px"; // Adjust as needed to move it to the left of the main button
        button.style.top = "50%";
        button.style.transform = "translateY(-50%)";
    }

    displayModifiableValues() {
        // Create a container div for the modal
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade'); // Use Bootstrap modal and fade animation
        modal.id = "resistorModal"; // Unique ID for the modal
        modal.tabIndex = -1; // Required for Bootstrap modals

        modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modify Capacitor Value</h5>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <input type="text" class="form-control" id="capacitanceInput" value="${this.info}" aria-label="Capacitor Value">
                        <span class="input-group-text">F</span>
                    </div>
                </div>
            </div>
        </div>
    `;

        // Append modal to body
        document.body.appendChild(modal);

        // Show the modal using Bootstrap's modal methods
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Add autosave functionality
        const capacitanceInput = modal.querySelector('#capacitanceInput');
        capacitanceInput.addEventListener('input', () => {
            this.info = capacitanceInput.value;
        });

        // Remove the modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
}

// Class for Current Source, extends Entities
class CurrentSrc extends Entities {
    static currentSrcID = 0;

    constructor() {
        super();
        this.name = "CurrentSrc" + ++CurrentSrc.currentSrcID; // Unique name for each Current Source instance
        this.imgSrc = "PathToImage";                           // Image path for Current Source
    }

}

class Connector {
    static connectorID = 0;

    constructor() {
        this.connected = false;
        this.name = "Connector" + ++Connector.connectorID; // Unique name for each Connector instance
    }
}


class Node {
    constructor(x, y, gCost = 0, hCost = 0, parent) {
        this.x = x;
        this.y = y;
        this.gCost = gCost;
        this.hCost = hCost;
        this.fCost = gCost + hCost;
        this.parent = null;
    }
}

 // Helper class for priority queue
 class MinHeap {
    constructor() {
        this.heap = [];
    }
    push(node) {
        this.heap.push(node);
        this._bubbleUp(this.heap.length - 1);
    }
    pop() {
        const root = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this._sinkDown(0);
        }
        return root;
    }
    _bubbleUp(idx) {
        const element = this.heap[idx];
        const score = element.g + element.h;
        while (idx > 0) {
            const parentIdx = Math.floor((idx - 1) / 2);
            const parent = this.heap[parentIdx];
            if (score >= parent.g + parent.h) break;
            this.heap[idx] = parent;
            idx = parentIdx;
        }
        this.heap[idx] = element;
    }
    _sinkDown(idx) {
        const length = this.heap.length;
        const element = this.heap[idx];
        const score = element.g + element.h;
        while (true) {
            const leftIdx = 2 * idx + 1;
            const rightIdx = 2 * idx + 2;
            let swap = null;
            if (leftIdx < length) {
                const left = this.heap[leftIdx];
                if (left.g + left.h < score) swap = leftIdx;
            }
            if (rightIdx < length) {
                const right = this.heap[rightIdx];
                if ((swap === null && right.g + right.h < score) ||
                    (swap !== null && right.g + right.h < this.heap[swap].g + this.heap[swap].h)) {
                    swap = rightIdx;
                }
            }
            if (swap === null) break;
            this.heap[idx] = this.heap[swap];
            idx = swap;
        }
        this.heap[idx] = element;
    }
}
