//Controller.js

const componentMap = new Map();
const connectors = new Map();
const probeMap = new Map();
let componentIdCounter = 0;
let componentPositions = {};
let internalGrid = [];
//const connectors = [];
let ProbeOn = false;
let NegativeProbe = false;
let wireBlocker = false;
let currentProbeBool = false;
let currPosProbe = null;
let currNegProbe = null;
let groundWire = false;

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
    
            // Rotate the button visually
            button.style.transform = `rotate(${currentRotation}deg)`;
    
            // Update connector positions based on new rotation
            updateConnectors(componentData.connectors);
            updateWiresDuringDrag(componentId);
            console.log("Wires Updated");
        });
    }
    
    
    
    if(deleteButton) {
        deleteButton.addEventListener('click', () => {
            clearWiresFromComponent(componentId);
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

    clearWiresFromComponent(componentId);

    // Remove connectors from the DOM
    connectors.forEach(connector => {
        if (connector && connector.parentNode) {
            connector.parentNode.removeChild(connector);
        }
        document.getElementById(connector.id)?.remove();  // Ensure no duplicates
    });
    connectors.length = 0;

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

    const { Button, connectors } = componentData;

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
}

function attachBot(con) {
    con.style.bottom = "-7px"; // Adjust as needed to move it below the main button
    con.style.left = "50%";
    con.style.transform = "translateX(-45%)";
    con.classList.add("bot-connector");
}
function attachTop(con) {
    con.style.top = "-9px"; // Adjust as needed to move it above the main button
    con.style.left = "50%";
    con.style.transform = "translateX(-50%)";
    con.classList.add("top-connector");
}

function attachRight( button2) {
    button2.style.right = "-10px"; // Adjust as needed to move it to the right of the main button
    button2.style.top = "45%";
    button2.style.transform = "translateY(-50%)";
    button2.classList.add("right-connector");
}

function attachLeft(button) {
    button.style.left = "-10px"; // Adjust as needed to move it to the left of the main button
    button.style.top = "45%";
    button.style.transform = "translateY(-50%)";
    button.classList.add("left-connector");
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

        console.log(`componentMap in updateConnectors: ${componentMap}`);
    });
}



function AddVoltageProbe() {
    ProbeOn = true;
    wireBlocker = true;
}
function AddCurrentProbe() {
    ProbeOn = true;
    wireBlocker = true;
    currentProbeBool = true;
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

    const throttledUpdateWires = throttle(updateWiresDuringDrag, 10); // Adjust limit as needed
    let lastUpdate = Date.now();
    function throttleWireUpdates(callback, interval) {
    const now = Date.now();
    if (now - lastUpdate >= interval) {
        callback();
        lastUpdate = now;
    }
    }

    function elementDrag(e) {
        throttleWireUpdates(() => {
    e = e || window.event;
    e.preventDefault();

    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;

    pos3 = e.clientX;
    pos4 = e.clientY;

    elmt.style.top = (elmt.offsetTop - pos2) + "px";
    elmt.style.left = (elmt.offsetLeft - pos1) + "px";

    const button = elmt.querySelector('button[data-component-id]');
    const componentId = button.dataset.componentId;

    throttledUpdateWires(componentId); // Throttled wire updates
        }, 1);
    }


    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;

        // Snap to nearest grid position
        const currentLeft = parseFloat(elmt.style.left);
        const currentTop = parseFloat(elmt.style.top);
        const snappedPosition = snapToGrid(currentLeft, currentTop);

        elmt.style.left = snappedPosition.left + "px";
        elmt.style.top = snappedPosition.top + "px";

        const button = elmt.querySelector('button[data-component-id]');
        const componentId = button.dataset.componentId;

        const rect = button.getBoundingClientRect();
        updateComponentCoordinates(button, rect.left, rect.top);

        // Final update after snapping
        updateWires(componentId);
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

    function throttle(func, limit) {
        let lastFunc;
        let lastRan;
    
        return function (...args) {
            const context = this;
    
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function () {
                    if (Date.now() - lastRan >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }
    
    }


function generateNetlist() {
    // Initialize the netlist string with '--partial' followed by a newline
    let netlist = '--partial\n';

    // Temporary array to hold all non-Voltage components
    const nonVoltageComponents = [];

    // Diode Models
    const diodeModels = []

    // Loop through each component in the componentMap
    componentMap.forEach((componentData, componentId) => {
        const componentInstance = componentData.instance;

        // Check if the instance has an 'equation' property and is not '0'
        if (componentInstance && componentInstance.equation && componentInstance.equation.trim() !== '0') {
            // If it's a Voltage component, prepend it to the netlist immediately
            if (componentInstance.name.startsWith("Voltage")) {
                netlist += " " + componentInstance.equation + '\n';
            }
            else {
                // Otherwise, add it to the array of non-Voltage components
                nonVoltageComponents.push(componentInstance.equation);
            }

            if (componentInstance instanceof Diode || componentInstance instanceof Zener || componentInstance instanceof LED || componentInstance instanceof Thyristor) {
                diodeModels.push(componentInstance.model)
            }
        }
    });

    // Append the non-Voltage components to the netlist
    nonVoltageComponents.forEach(equation => {
        netlist += " " + equation + '\n';
    });

    diodeModels.forEach(model => {
        netlist += model + '\n';
    })

    // Now cycle through ProbeMap and grab all probe equations
    probeMap.forEach((probeInstance, probeName) => {
        // Check if the probe has an 'equation' property
        if (probeInstance && probeInstance.equation) {
            netlist += " " + probeInstance.equation + '\n';
        }
    });

    // Optionally, log the final netlist (for debugging purposes)
    console.log(netlist);

    // Return the netlist
    return netlist;
}
// Function to save the circuit
async function saveCircuit() {
    try {
        // Initialize a new structure for circuit data
        const circuitData = {
            components: [],
            connections: [],
            probes: {}, // To store probe-related data
        };

        // Iterate through componentMap to save components
        componentMap.forEach((componentData, id) => {
            const { instance, connectors, connections } = componentData;

           // Get rotation from the button
           const button = document.getElementById(`component-button-${id}`);
           const rotationValue = button ? getRotationAngle(button) : 0;

            // Serialize connectors
            const serializedConnectors = connectors.map(connector => ({
                id: connector.id,
                position: {
                    top: connector.style.top,
                    left: connector.style.left,
                    bottom: connector.style.bottom,
                    right: connector.style.right,
                    transform: connector.style.transform
                },
                classList: Array.from(connector.classList) // Serialize classes
            }));

            // Serialize the instance
            const serializedInstance = {
                name: instance.name,
                imgSrc: instance.imgSrc,
                x: instance.x,
                y: instance.y,
                intX: instance.intX,
                intY: instance.intY,
                info: instance.info,
                equation: instance.equation,
                numInCons: instance.numInCons,
                numOutCons: instance.numOutCons,
                blockedNodes: instance.blockedNodes, // Serialize blocked nodes
                rotation: rotationValue
            };

            // Add to components array
            circuitData.components.push({
                id,
                instance: serializedInstance,
                connectors: serializedConnectors,
                connections: connections || [] // Include connection information
            });
        });

        circuitData.connections = wires.map(wire => ({
            startConnectionId: wire.startConnectionId || "MISSING",
            endConnectionId: wire.endConnectionId || "MISSING",
            path: wire.path && typeof wire.path === "string" ? wire.path : "NO_PATH"
        }));
        
        
        // Add probe-related state
        circuitData.probes = {
            ProbeOn,
            NegativeProbe,
            currentProbeBool,
            currPosProbe: currPosProbe
                ? {
                      id: currPosProbe.id,
                      equation: currPosProbe.equation,
                      position: {
                          top: currPosProbe.style.top,
                          left: currPosProbe.style.left
                      }
                  }
                : null,
            currNegProbe: currNegProbe
                ? {
                      id: currNegProbe.id,
                      equation: currNegProbe.equation,
                      position: {
                          top: currNegProbe.style.top,
                          left: currNegProbe.style.left
                      }
                  }
                : null,
            groundWire
        };

        // Save using Electron
        const response = await window.electron.saveCircuit(circuitData);
        if (response && response.message) {
            alert(response.message);
        }
        
        console.log("Circuit saved successfully.");
    } catch (error) {
        console.error("Error saving circuit:", error);
        alert("An error occurred while saving the circuit.");
    }
}

function getRotationAngle(element) {
    const transform = window.getComputedStyle(element).transform;
    if (transform === "none") return 0;
    const matrix = new DOMMatrix(transform);
    const angle = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
    return (angle + 360) % 360; // Convert negative angles to positive
}

function loadCircuit(savedDataString) {
    try {
        // Parse the saved data
        const savedData = JSON.parse(savedDataString);

        // Validate saved data
        if (!savedData || !savedData.components) {
            console.error("Invalid circuit data:", savedData);
            return;
        }

        // Clear the current circuit
        clearCircuit();

        // Ensure grid or circuit canvas exists
        const grid = document.getElementById("grid");
        if (!grid) {
            throw new Error("Grid or circuit canvas element is missing in the DOM.");
        }

        if (savedData.probes) {
            const { ProbeOn, NegativeProbe, currentProbeBool, currPosProbe, currNegProbe, groundWire } = savedData.probes;

            window.ProbeOn = ProbeOn;
            window.NegativeProbe = NegativeProbe;
            window.currentProbeBool = currentProbeBool;
            window.groundWire = groundWire;

            if (currPosProbe) {
                const posProbeElement = document.getElementById(currPosProbe.id);
                if (posProbeElement) {
                    Object.assign(posProbeElement.style, currPosProbe.position);
                    currPosProbe = posProbeElement; // Update global reference
                }
            }

            if (currNegProbe) {
                const negProbeElement = document.getElementById(currNegProbe.id);
                if (negProbeElement) {
                    Object.assign(negProbeElement.style, currNegProbe.position);
                    currNegProbe = negProbeElement; // Update global reference
                }
            }
        }

        // Loop through the components in the saved data
        savedData.components.forEach(componentData => {
            const { id, instance, connectors } = componentData;

            // Validate component structure
            if (!id || !instance || !connectors) {
                console.warn("Invalid component data:", componentData);
                return;
            }

            // Dynamically create the appropriate component instance
            const { name, imgSrc, x, y, numInCons, numOutCons, info, equation, blockedNodes, rotation } = instance;

            const componentClass = getComponentClass(name); // Dynamically resolve the class based on the name
            if (!componentClass) {
                console.warn(`Unknown component type: ${name}`);
                return;
            }

            const componentInstance = new componentClass(x, y);

            // Restore instance properties
            
            componentInstance.info = info;
            componentInstance.equation = equation;
            componentInstance.numInCons = numInCons;
            componentInstance.numOutCons = numOutCons;
            componentInstance.blockedNodes = blockedNodes;
            componentInstance.updateCoordinates(x, y);
            componentInstance.imgSrc = imgSrc;
            componentInstance.rotation = rotation || 0;

            // Build the component
            const componentID = componentInstance.name;
            componentMap.set(componentID, {
                instance: componentInstance,
                connectors: [], // Connectors will be rebuilt below
                connections: [], // Connections will be restored later
            });


            const button = document.getElementById(`component-button-${componentID}`);
            if (button) {
                const rotateButton = document.getElementById(`rotate-${componentID}`);
                for(let i = 0; i < 4; i++) {
                    if(rotation > (i * 90)) {
                            rotateButton.click(); // Simulate a click event to trigger the rotation fix
                        }
                }
            }

            connectors.forEach(connectorData => {
                const connector = document.createElement("button");
                connector.id = connectorData.id;
                const componentID = componentInstance.name;
                connectorData.classList.forEach(cls => connector.classList.add(cls));
                componentMap.get(componentID).connectors.push(connector);
            });
            console.log("componentMap in loadCircuit:", componentMap);
            
        });
       
        
        // Restore connections
        const processedConnections = new Set();

        savedData.connections.forEach((connection) => {
            const source = connection.startConnectionId;
            const target = connection.endConnectionId;

            if (!source || !target) {
                console.warn("Skipping invalid connection:", connection);
                return;
            }

            const connectionKey = `${source} -> ${target}`;
            const reverseKey = `${target} -> ${source}`;

            if (processedConnections.has(connectionKey) || processedConnections.has(reverseKey)) {
                return;
            }

            processedConnections.add(connectionKey);

            const sourceConnector = document.getElementById(source);
            const targetConnector = document.getElementById(target);
            
            if (sourceConnector && targetConnector) {
                startDrawingWire(sourceConnector.id);

                const targetRect = targetConnector.getBoundingClientRect();
                const x = targetRect.left + targetRect.width / 2;
                const y = targetRect.top + targetRect.height / 2;

                endDrawingWire(targetConnector.id, x, y);

            } else {
                console.warn(`Invalid connection: ${source} -> ${target}`);
            }
        });
        

        console.log("Circuit loaded successfully.");
        console.log(componentMap);
    } catch (error) {
        console.error("Error loading circuit data:", error);
    }
}

function getComponentClass(name) {
    if (name.startsWith("V")) return Volt;
    if (name.startsWith("R")) return Resistor;
    if (name.startsWith("I")) return Inductor;
    if (name.startsWith("C")) return Capacitor;
    if (name.startsWith("G")) return Gnd;
    // Diodes
    if (name.startsWith("D")) {
        if (name.includes("Zener")) return Zener;
        if (name.includes("LED")) return LED;
        return Diode;
    }
        
    return null;
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
    window.Volt.resetID();
    window.Resistor.resetID();
    window.Inductor.resetID();
    window.Gnd.resetID();
    window.Diode.resetID();
    window.Capacitor.resetID();
    window.Zener.resetID();
    window.LED.resetID();
    window.Thyristor.resetID();
    Connector.resetID();
    wireClass.resetID()

    console.log('Circuit cleared successfully.');
}



function SimulateCircuit() {
    let netlistString = generateNetlist(); // Generate netlist string
    netlistString = appendInfo(netlistString);
    console.log(netlistString);
    
    const netlistPath = './Files/netlist.cir'; // Relative path from the root directory
    
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

function appendInfo(netlistString) {
    // Define regex patterns and their corresponding values to append

    console.log("Component Map: ", componentMap)

    componentMap.forEach((componentData, componentId) => {
        const componentInstance = componentData.instance;
        let appendValue = componentInstance.info;
        
        netlistString = netlistString.replace(componentInstance.equation, componentInstance.equation + ' ' + appendValue);
    });
    netlistString = netlistString.replace(/null/g, '');
    netlistString = netlistString.replace(/[^\S\r\n]+/g, ' ');

    return netlistString;
}

function addDiodeModels() {
    
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

function placePosProbe(ConnectionID, connector) {
    //console.log(ConnectionID);
    return new VoltProbe(ConnectionID, connector, NegativeProbe);
}

function placeNegProbe(ConnectionID, connector) {
    //console.log(ConnectionID);
    return new VoltProbe(ConnectionID, connector, NegativeProbe);
}

function placeCurrentProbe(ConnectionID, connector) {
    //console.log(ConnectionID);
    return new CurrentProbe(ConnectionID, connector);
}

function extractComponentAndNode(probeName) {
    const parts = probeName.split('-');
    //console.log(parts.length);
    
    // Ensure we have at least three parts
    if (parts.length >= 3) {
        const componentId = parts[0]; // Component name (e.g., Resistor1)
        const node = parts[2] // Node number after "connector" (e.g., 1 from "connector-1")
        //console.log(componentId, node);
        
        return { componentId, node };
    } else {
        return { componentId: '', node: '' }; // Return empty values for unexpected format
    }
}
function extractStartEquation(probeName) {
    const parts = probeName.split('-');
    
    // Ensure we have at least three parts (component, connector, node)
    if (parts.length >= 3) {
        const componentId = parts[0]; // Component name (e.g., Resistor1)
        const node = parts[2]; // Node number (e.g., 1 from "connector-1")
        let string = `.probe vd(${componentId}:${node}, `;
        //console.log(string);
        
        // Return the equation in the desired format
        return string;
    } else {
        return ''; // Handle unexpected format
    }
}


// Function to update positive probe
function updatePosProbe(probe1, probe2) {
    //console.log("PosProbe Name:", probe1.name);
    const { componentId, node } = extractComponentAndNode(probe2.name);

    // Format the equation
    //console.log("PosProbe Equation:", probe);
    probe1.equation = probe1.equation + `${componentId}:${node})`; // Assuming Inductor1 is fixed for now
    console.log("PosProbe Equation:", probe1.equation);
}

// Function to update negative probe
function updateNegProbe(probe1, probe2) {
    //console.log("NegProbe Name:", probe.name);
    
    // Extract component and node from the probe.name
    const { componentId, node } = extractComponentAndNode(probe2.name);
    
    // Format the equation
    probe1.equation = probe1.equation + `${componentId}:${node})`; // Assuming Inductor1 is fixed for now
    //console.log("NegProbe Equation:", probe.equation);
}
function updateEquations(start, end, wire) {
    console.log("Updating equations:", start, end, wire.wireName);

    // Check if start or end is Ground and handle accordingly
    if (start.instance.name.includes("Ground") || end.instance.name.includes("Ground")) {
        if(start.instance.name.includes("Ground") && end.instance.name.includes("Ground")) {
            console.log("Both start and end are Ground. Skipping update.");
            return;
        }
        if (start.instance.name.includes("Ground")) {
            end.instance.equation = end.instance.equation + " 0"; // Append '0' for connection to Ground
            console.log(`Start is Ground. Appended '0' to end equation: ${end.instance.equation}`);
        } else if (end.instance.name.includes("Ground")) {
            start.instance.equation = start.instance.equation + " 0"; // Append '0' for connection to Ground
            console.log(`End is Ground. Appended '0' to start equation: ${start.instance.equation}`);
        }
        groundWire = true
        return;
    }
    if (groundWire) {
        wire.wireName--;
    }

    //console.log("Equations before update:", start.instance.equation, end.instance.equation);

    // Always append the wire name for non-ground wires
    start.instance.equation = start.instance.equation + " " + wire.wireName;
    end.instance.equation = end.instance.equation + " " + wire.wireName;

    //console.log("Equations after update:", start.instance.equation, end.instance.equation);
}