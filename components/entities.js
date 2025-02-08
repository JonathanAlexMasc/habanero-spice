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
        //this.blockNodes();
        //this.buildComponent();
    }

    buildComponent() {
        const componentID = this.name;
        componentMap.set(componentID, {
            instance: this,
            connectors: [],  // Stores connector-specific data (like pin numbers, connector types)
            connections: []  // Tracks connected component IDs (the actual connection relationships)
        });
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
        //console.log(this.imgSrc);
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
        for (let i = this.intX; i <= this.intX + 60; i += 10) {
            for (let j = this.intY; j <= this.intY + 60; j += 10) {
                this.blockedNodes.push([i, j]);
            }
        }
    }

    attachConnectors(numInCons, numOutCons, holderBtn) {
    }

    attachWireListener(con, conID) {
        if (typeof conID !== 'string') {
            console.error('Invalid connectionId type in attachClickListener:', conID);
            return;
        }
        con.addEventListener('click', function () {
            if (!wireBlocker) {
                if (!isDrawingWire) {
                    startDrawingWire(conID);
                } else {
                    endDrawingWire(conID);
                }
            }

        });

    }

    attachProbeListener(con, conID) {
        con.addEventListener('click', function () {
            if (ProbeOn) {
                if (currentProbeBool) {
                    placeCurrentProbe(conID, con);
                    currentProbeBool = false;
                    ProbeOn = false;
                    wireBlocker = false;
                    return;
                }
                if (NegativeProbe) {
                    //we placed positive already
                    //now place negative
                    currNegProbe = placeNegProbe(conID, con);
                    //console.log('CurrNegProbe Name:', currNegProbe.name);
                    //console.log('CurrPosProbe Name:', currPosProbe.name);
                    //console.log("CurrNegProbe Equation:", currNegProbe.equation);
                    //console.log("CurrPosProbe Equation:", currPosProbe.equation);
                    updatePosProbe(currPosProbe, currNegProbe);
                    updateNegProbe(currNegProbe, currPosProbe);
                    NegativeProbe = false;
                    ProbeOn = false;
                    wireBlocker = false;
                }
                else {
                    //place positive probe
                    currPosProbe = placePosProbe(conID, con);
                    NegativeProbe = true;
                }
            }
        })
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