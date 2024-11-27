//Controller.js

const componentMap = new Map();
const connectors = new Map();
let componentIdCounter = 0;
let componentPositions = {};
let internalGrid = [];
//const connectors = [];

const circuitData = {
    components: [],
    connections: []
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loadButton').addEventListener('click', async () => {
        const { filePath, fileContent } = await window.electron.openFileDialog();
        if (filePath) {
            const fileName = filePath.split('\\').pop().split('/').pop();
            document.getElementById('fileHolder').textContent = fileName;
            clearCircuit();
            loadCircuit(fileContent);
        }
    });
    document.getElementById('saveButton').addEventListener('click', saveCircuit);
    generateGrid();
});

function fabListener(button, rotateButton, deleteButton, clearWiresButton, editButton, connectors, componentId) {
    let currentRotation = 0; // Variable to store the current rotation angle

    const componentData = componentMap.get(componentId);

    if (rotateButton) {
        rotateButton.addEventListener('click', () => {
            // Update the rotation angle
            currentRotation = (currentRotation + 90) % 360;
    
            // Rotate the button
            button.style.transform = `rotate(${currentRotation}deg)`;
            updateConnectors(connectors);
            //updateComponentCoordinates(componentId);
    
            // Find all connections related to this componentId
            const ComponentConnections = Array.from(connections.keys()).filter(key => key.includes(componentId));
            
            console.log("Found Connections:", ComponentConnections);
            // Iterate over each found connection
            ComponentConnections.forEach(connectionKey => {
                //console.log("Found connection:", connectionKey);
            
                // Access the associated value in the map
                // Access the associated value in the map (assuming it's an array)
                const connectionArray = connections.get(connectionKey);

            // Extract the first element if it's an array with one element
                const connectionValue = connectionArray[0]; // Access the first element
                //console.log("Associated Value:", connectionValue);
    
                // Update the connectors based on the new rotation angle
                

                clearWiresFromComponent(componentId);
    
                // Create a wire for this specific connection
                createWire(connectionKey, connectionValue);
                storeConnection(connectionKey, connectionValue);
            });
    
            // Update wires (commented out due to known issues as per your note)
            updateWires(componentId);
        });
    }
    
    if(deleteButton) {
        deleteButton.addEventListener('click', () => {
            deleteComponent(componentId);
        });
    }

    if(clearWiresButton) {
        clearWiresButton.addEventListener('click', () => {
            clearWiresFromComponent(componentId);
        });
    }

    if (editButton) {
        editButton.addEventListener('click', () => {
            if (componentData) {
                const { instance, connectors } = componentData;
                instance.displayModifiableValues()
            } else {
                alert('Unable to edit component!');
                console.log(componentData)
            }
        })
    }
}


function deleteComponent(componentId) {
    // Retrieve the component and its connectors
    const componentData = componentMap.get(componentId);
    if (!componentData) return;

    const { Button, connectors } = componentData;

    

    // Remove connectors from the DOM
    connectors.forEach(connector => {
        if (connector && connector.parentNode) {
            connector.parentNode.removeChild(connector);
        }
    });

    // Remove the component button from the DOM
    const button = document.getElementById('component-button-' + componentId);
    removeFABForComponent(button);
    if (button && button.parentNode) {
        button.parentNode.removeChild(button);
    }

    // Remove the component holder (if any)
    const holder = button ? button.parentNode : null;
    if (holder && holder.parentNode) {
        holder.parentNode.removeChild(holder);
    }

    componentMap.delete(componentId);
}

function clearWiresFromComponent(componentId) {
    const componentData = componentMap.get(componentId);
    if (!componentData) return;

    //console.log(connections);

    const { Button, connectors } = componentData;
    //console.log(connectors);

    // Update the background image of each connector
    connectors.forEach(connector => {
        const connectorElement = document.getElementById(connector.id);
        if (connectorElement) {
            connectorElement.style.backgroundImage = `url('images/CONNECTOR.svg')`; // Replace with the desired default image
        }
    });

    // Create an array to store indices to delete
    const indicesToDelete = [];

    // Iterate through the wires array
    for (let i = 0; i < wires.length; i++) {
        const wire = wires[i];
        if (wire.startConnectionId.includes(componentId) || wire.endConnectionId.includes(componentId)) {
            indicesToDelete.push(i);

            // Remove the associated SVG element
            const svgElementId = `wire-${wire.startConnectionId}-${wire.endConnectionId}`;
            const svgElement = document.getElementById(svgElementId);
            if (svgElement) {
                svgElement.remove();
            }
        }
    }

    // Remove the wires from the wires array
    for (let i = indicesToDelete.length - 1; i >= 0; i--) {
        wires.splice(indicesToDelete[i], 1);
    }

    // Remove connections from the connections map
    for (const [key, value] of connections.entries()) {
        if (key.includes(componentId)) {
            // Remove forward entries
            value.forEach(endConnectionId => {
                if (connections.has(endConnectionId)) {
                    connections.set(endConnectionId, connections.get(endConnectionId).filter(id => id !== key));
                    if (connections.get(endConnectionId).length === 0) {
                        connections.delete(endConnectionId);

                        // Change the button's image after deleting the key
                        const endConnectionElement = document.getElementById(endConnectionId);
                        if (endConnectionElement) {
                            endConnectionElement.style.backgroundImage = `url('images/CONNECTOR.svg')`; // Replace with the desired default image
                        }
                    }
                }
            });
            // Remove the entry itself
            connections.delete(key);

            // Change the button's image after deleting the key
            const keyElement = document.getElementById(key);
            if (keyElement) {
                keyElement.style.backgroundImage = `url('images/CONNECTOR.svg')`; // Replace with the desired default image
            }
        }
    }

    //console.log('Updated wires:', wires);
    //console.log('Updated connections:', connections);
}

function updateConnectors(connectors) {
    connectors.forEach(connector => {
        // Store the current class and corresponding transformation
        let newClass = '';
        let transformFunction = null;

        // Determine the new position and transformation based on the current class
        if (connector.classList.contains('top-connector')) {
            newClass = 'right-connector';
            transformFunction = attachRight;
        } else if (connector.classList.contains('bot-connector')) {
            newClass = 'left-connector';
            transformFunction = attachLeft;
        } else if (connector.classList.contains('left-connector')) {
            newClass = 'top-connector';
            transformFunction = attachTop;
        } else if (connector.classList.contains('right-connector')) {
            newClass = 'bot-connector';
            transformFunction = attachBot;
        }

        // Remove previous positions and transformations
        connector.style.top = '';
        connector.style.bottom = '';
        connector.style.left = '';
        connector.style.right = '';
        connector.style.transform = '';

        // Apply the transformation and update the class
        if (transformFunction) {
            transformFunction(connector);
        
            // Define a regex pattern to match classes of the form 'dir-connector'
            const pattern = /^.*-connector$/;
        
            // Remove the class matching the pattern
            connector.classList.forEach(cls => {
                if (pattern.test(cls)) {
                    connector.classList.remove(cls);
                }
            });
        
            // Add the new class
            connector.classList.add(newClass);
        }

        //console.log(`Updated connector to ${newClass}`);
    });
}


function attachClickListener(button, connectionId) {
    if (typeof connectionId !== 'string') {
        console.error('Invalid connectionId type in attachClickListener:', connectionId);
        return;
    }
    button.addEventListener('click', function() {
        console.log(`Connection point ${connectionId} clicked`);
        if (!isDrawingWire) {
            startDrawingWire(connectionId);
        } else {
            endDrawingWire(connectionId);
        }
    });
    // Add click listener to the document or grid container
    document.addEventListener('click', (event) => {
        // Get the clicked position
        const rect = document.body.getBoundingClientRect();
        const x = Math.round((event.clientX - rect.left) / GRID_SIZE) * GRID_SIZE;
        const y = Math.round((event.clientY - rect.top) / GRID_SIZE) * GRID_SIZE;

        // Check if the point is occupied
        if (isDrawingWire && wire.isOccupied(x, y)) {
            endDrawingWire(connectionId, x, y);
        } 
    });
}

// Functions to add different component

function AddVoltage(posx, posy) {
    return new Volt(posx, posy);
}

function AddResistor(posx, posy) {
    return new Resistor(posx, posy);
}
function AddInductor(posx, posy) {
    return new Inductor(posx, posy);
}

function AddCapacitor(posx, posy) {
    return new Capacitor(posx, posy);
}

function AddGround(posx, posy) {    
    return new Gnd(posx, posy);
}


// Function to get the component instance associated with a button
function getComponentFromButton(button) {
    const componentId = button.dataset.componentId;
    const componentData = componentMap.get(componentId);
    return componentData ? componentData.instance : null;
}

// Function to update the coordinates of a component
function updateComponentCoordinates(button, newX, newY) {
    const componentInstance = getComponentFromButton(button);
    if (componentInstance) {
        //console.log(componentInstance); // Check if this is the right instance
        instance = componentInstance.instance;
        instance.updateCoordinates(newX, newY);
    }
}

function dragElement(elmt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    elmt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;

        pos3 = e.clientX;
        pos4 = e.clientY;

        // Move the element with the mouse
        elmt.style.top = (elmt.offsetTop - pos2) + "px";
        elmt.style.left = (elmt.offsetLeft - pos1) + "px";

        // Update wire positions while dragging
        const button = elmt.querySelector('button[data-component-id]');
        const componentId = button.dataset.componentId;

        // Update coordinates of the component if necessary
        const rect = button.getBoundingClientRect();
        updateComponentCoordinates(button, rect.left, rect.top);

        updateWires(componentId); 
    }

    function closeDragElement(e) {
        document.onmouseup = null;
        document.onmousemove = null;

        // Snap to nearest grid position on mouse up
        const currentLeft = parseFloat(elmt.style.left);
        const currentTop = parseFloat(elmt.style.top);
        const snappedPosition = snapToGrid(currentLeft, currentTop);

        elmt.style.left = snappedPosition.left + "px";
        elmt.style.top = snappedPosition.top + "px";

        const button = elmt.querySelector('button[data-component-id]');
        
        const rect = button.getBoundingClientRect();
        updateComponentCoordinates(button, rect.left, rect.top);

        
    }

    function snapToGrid(left, top) {
        let nearestLeft = findNearest(left, internalGrid.map(pair => pair[0]));
        let nearestTop = findNearest(top, internalGrid.map(pair => pair[1]));

        return { left: nearestLeft, top: nearestTop };
    }

    function findNearest(value, array) {
        return array.reduce((prev, curr) => {
            return (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
        });
    }
}

function generateNetlist(circuitData) {
    // Initialize the netlist string with '--partial' followed by a newline
    let netlist = '--partial\n';

    // Map to store connection pairs and their IDs
    const connectionIdMap = new Map();
    let connectionId = 1;

    // Function to get or create a connection ID for a pair
    function getConnectionId(connection1, connection2) {
        const key1 = `${connection1}-${connection2}`;
        const key2 = `${connection2}-${connection1}`;
        if (connectionIdMap.has(key1)) {
            return connectionIdMap.get(key1);
        } else if (connectionIdMap.has(key2)) {
            return connectionIdMap.get(key2);
        } else {
            connectionIdMap.set(key1, connectionId);
            return connectionId++;
        }
    }

    // Build the connection ID map
    circuitData.connections.forEach(([start, ends]) => {
        ends.forEach(end => {
            if (end.includes('Ground') || start.includes('Ground')) {
                const key1 = `${start}-${end}`;
                const key2 = `${end}-${start}`;
                if (!connectionIdMap.has(key1) && !connectionIdMap.has(key2)) {
                    // Add connection with Ground as value 0 if not already present
                    connectionIdMap.set(key1, 0);
                }
            } else {
                getConnectionId(start, end);
            }
        });
    });
    

    // Build the netlist string
    circuitData.components.forEach(component => {
        if (component.Button && component.Button.name && !component.Button.name.includes('Ground')) {
            // Add the component name
            netlist += component.Button.name;

            const componentNameWithoutNumber = component.Button.name.replace(/\d+$/, '');

            // Find connections for this component
            let connections = [];
            connectionIdMap.forEach((id, key) => {
                console.log(key, id);
                console.log(componentNameWithoutNumber);
                if (key.includes(componentNameWithoutNumber)) {
                    connections.push(id);
                }
            });

            // Add connections to the netlist line
            if (connections.length > 0) {
                netlist += ' ' + connections.join(' ') + ' ' + component.Button.info ;
            }
            netlist += '\n';
        }
    });

    netlist = netlist.replace(/AC 1/g, '[fill] AC 1');

    return netlist;
}


// Function to save the circuit
async function saveCircuit() {
    try {
        // Update the component mapping to match the new structure
        circuitData.components = Array.from(componentMap.entries()).map(([id, { Button, connectors }]) => ({
            id,
            Button: { ...Button }, // Ensure Button object is correctly spread
            connectors: connectors.map(connector => ({ ...connector })) // Map each connector to a new object
        }));
        
        // Convert connections map to an array
        circuitData.connections = Array.from(connections.entries()).map(([key, value]) => [key, [...value]]);

        // Generate netlist and assign wire numbers to components
        let netlist = generateNetlist(circuitData);

        console.log(netlist);

        const dataToSave = JSON.stringify(circuitData, null, 2);
        //console.log('Saving circuit data:', dataToSave);

        // Save circuit data via Electron's saveCircuit function
        const response = await window.electron.saveCircuit(circuitData);
        if (response && response.message) {
            alert(response.message);
        }
    } catch (error) {
        console.error('Error saving circuit:', error);
        alert('An error occurred while saving the circuit.');
    }
}

function loadCircuit(savedData) {
    clearCircuit();
}


// Function to clear the current circuit
function clearCircuit() {
    // Remove all wires using clearWiresFromComponent for each component
    componentMap.forEach((_, componentId) => {
        clearWiresFromComponent(componentId);
        deleteComponent(componentId);
    });

    // Remove all remaining wire elements from the DOM
    wires.forEach(wire => {
        if (wire.path) {
            wire.path.remove();
        }
    });
    wires.length = 0; // Clear the wires array

    // Remove all components from the DOM
    componentMap.forEach((component, componentId) => {
        // Remove component element
        const componentElement = document.getElementById('component-button-' + componentId);
        if (componentElement) {
            componentElement.remove();
        }
    });
    componentMap.clear(); // Clear the component map

    // Clear the connections map
    connections.clear();

    // Reset component positions
    componentPositions = {};

    console.log('Circuit cleared successfully.');
}



function SimulateCircuit() {
    const netlistString = generateNetlist(circuitData); // Generate netlist string
    const netlistPath = './Files/netlist.txt'; // Relative path from the root directory
    
    window.electron.saveNetlistToFile(netlistPath, netlistString)
      .then((saved) => {
        if (saved) {
          window.location.href = 'WaveForm.html'; // Navigate to WaveForm.html
        } else {
          console.log('Failed to save netlist file.');
        }
      })
      .catch((err) => {
        console.error('Error saving netlist file:', err);
      });
}


function generateGrid() {
    //const grid = document.getElementById('grid');
    for (let i = 220; i < 1500; i += 10) {
        for (let j = 90; j < 1500; j += 10) {
            // Store the point (i, j) in internalGrid
            internalGrid.push([i, j]);
        }
    }
}