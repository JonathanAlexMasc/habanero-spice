// Wires.js

const GRID_SIZE = 10; // Define the size of the grid

let isDrawingWire = false;
let startConnection = null;
const connections = new Map();
const wires = [];
let componentInstances = [];
const wire = wireGrid(); // Create a new instance of the grid


let Grid = [];
let currentDraggingWire = null;
let initialPath = "";

// Function to start drawing a wire from a connection point
function startDrawingWire(connectionId) {
    if (connectionId) {
        //console.log(Started drawing wire from ${connectionId});
        isDrawingWire = true;
        startConnection = connectionId;
    }
}

// Function to end drawing a wire at a connection point
function endDrawingWire(connectionId,x,y) {
    //console.log(`Attempting to end wire drawing at ${connectionId}`);

    // Check if we're currently drawing and the connectionId is different from startConnection
    if (isDrawingWire &&  connectionId !== startConnection) {
        // Check if either startConnection or connectionId already has any connections
       
        // Create the wire and store the connection
        createWire(startConnection, connectionId, x, y);
        storeConnection(startConnection, connectionId);
    }
    
    else if(isDrawingWire && wire.isOccupied(x,y)) {
        // Create the wire and store the connection
        console.log("connectionId: " + connectionId);
        createWire(startConnection, connectionId, x, y);
        storeConnection(startConnection, connectionId);
   }

   // Reset drawing state
   resetDrawingState();
}

// Function to reset the wire drawing state
function resetDrawingState() {
    isDrawingWire = false;
    startConnection = null;
}

function hasAnyConnection(connectionId) {
    return connections.has(connectionId) && connections.get(connectionId).length > 0;
}
// Function to store a connection
function storeConnection(startConnectionId, endConnectionId) {
    if (!connections.has(startConnectionId)) {
        connections.set(startConnectionId, []);
    }
    connections.get(startConnectionId).push(endConnectionId);

    if (!connections.has(endConnectionId)) {
        connections.set(endConnectionId, []);
    }
    connections.get(endConnectionId).push(startConnectionId);
}

function getComponentId(fullId) {
    const parts = fullId.split('-');
    // Assuming the componentId is always the second part
    return parts[1] + '-' + parts[2];
}

function getConnectorDIR(className) {
    // Split the className string by spaces and return the second part
    let classes = className.split(' ');
    return classes[1];  // Default to an empty string if the second class does not exist
}

function ParseDirectionIntoInteger(direction) {
    switch (direction) {
        case 'left-connector':
            return 3;
        case 'right-connector':
            return 4;
        case 'bot-connector':
            return 2;
        case 'top-connector':
            return 1;
        default:
            return 0;
    }
}

// Function to create a wire between two connection points
function createWire(startConnectionId, endConnectionId, x, y) {
    let startConnection = document.getElementById(startConnectionId);
    let endConnection = document.getElementById(endConnectionId);

    // If the end connection is a wire, handle wire connection logic
    if (!endConnection && isWire(endConnectionId)) {
        let targetWire = getWireById(endConnectionId);
        if (!targetWire) {
            console.error('Target wire not found:', endConnectionId);
            return;
        }

        // Find the closest point on the wire to (x, y)
        let closestPoint = findClosestPointOnWire(targetWire, x, y);

        // Create a new wire connecting the start connection to the closest point
        createWireSegmentToWire(startConnection, closestPoint, targetWire);

        return;
    }

    if (!startConnection) {
        console.error('Start connection point not found:', startConnectionId);
        return;
    }
    if (!endConnection) {
        console.error('End connection point not found:', endConnectionId);
        return;
    }

    // Update images for the connection points
    startConnection.style.backgroundImage = `url('images/CONNECTOR-FULL.svg')`;
    endConnection.style.backgroundImage = `url('images/CONNECTOR-FULL.svg')`;

    // Extract component IDs
    let startComponentId = getComponentId(startConnectionId);
    let endComponentId = getComponentId(endConnectionId);

    // Create SVG wire
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('wire');
    svg.style.position = 'absolute';
    svg.style.zIndex = '1';
    svg.style.pointerEvents = 'none';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.setAttribute('id', `wire-${startConnectionId}-${endConnectionId}`);

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('stroke', 'red');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');

    svg.appendChild(path);
    document.body.appendChild(svg);

    // Add to wires array
    wires.push({ startConnectionId, endConnectionId, path });

    // Update the wire path
    let instances = getClassInstances();
    updateWirePosition(startConnection, endConnection, path, getConnectorDIR(startConnection.className), getConnectorDIR(endConnection.className), instances);

    // Update connections for both components
    updateWires(startComponentId);
    updateWires(endComponentId);
}

/**
 * Check if the given ID corresponds to a wire.
 */
function isWire(id) {
    return id.startsWith('wire-');
}

/**
 * Retrieve a wire object by its ID.
 */
function getWireById(id) {
    return wires.find(wire => wire.path.getAttribute('id') === id);
}

/**
 * Find the closest point on a wire to the given coordinates (x, y).
 */
function findClosestPointOnWire(wire, x, y) {
    let path = wire.path;
    let pathLength = path.getTotalLength();
    let closestPoint = null;
    let minDistance = Infinity;

    for (let i = 0; i <= pathLength; i += 1) {
        let point = path.getPointAtLength(i);
        let distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
        if (distance < minDistance) {
            minDistance = distance;
            closestPoint = { x: point.x, y: point.y };
        }
    }
    return closestPoint;
}

/**
 * Create a new wire segment connecting a start connection to a point on an existing wire.
 */
function createWireSegmentToWire(startConnection, closestPoint, targetWire) {
    // Create the new wire segment
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('wire');
    svg.style.position = 'absolute';
    svg.style.zIndex = '1';
    svg.style.pointerEvents = 'none';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.setAttribute('id', `wire-${startConnection.id}-${targetWire.path.getAttribute('id')}`);

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('stroke', 'blue');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');

    svg.appendChild(path);
    document.body.appendChild(svg);

    // Add the new wire segment to the wires array
    wires.push({ startConnectionId: startConnection.id, endConnectionId: `wire-${targetWire.path.getAttribute('id')}`, path });

    // Update the path for the new wire segment
    path.setAttribute('d', `M${startConnection.getBoundingClientRect().left},${startConnection.getBoundingClientRect().top} L${closestPoint.x},${closestPoint.y}`);
}


function updateWirePosition(startConnection, endConnection, path, startType, endType, instances) {
    const startRect = startConnection.getBoundingClientRect();
    const endRect = endConnection.getBoundingClientRect();

    const d = wirePathing(startRect, endRect, startType, endType, instances);
    path.setAttribute('d', d);

    //console.log('Updated wire path:', d);
}

function wirePathing(startRect, endRect, startType, endType, instances) {
        //console.log(instances);
    
        let pathData = [];
        //start coords
        let StartNorthX = startRect.left + startRect.width / 2;
        let StartNorthY = startRect.top;
    
        let StartSouthX = startRect.left + startRect.width / 2;
        let StartSouthY = startRect.bottom;
    
        let StartRightX = startRect.right;
        let StartRightY = startRect.top + startRect.height / 2;
    
        let StartLeftX = startRect.left;
        let StartLeftY = startRect.top + startRect.height / 2;
    
        //end coords
        let EndNorthX = endRect.left + endRect.width / 2;
        let EndNorthY = endRect.top;
    
        let EndSouthX = endRect.left + endRect.width / 2;
        let EndSouthY = endRect.bottom;
    
        let EndRightX = endRect.right;
        let EndRightY = endRect.top + endRect.height / 2;
    
        let EndLeftX = endRect.left;
        let EndLeftY = endRect.top + endRect.height / 2;
    
        let startx = 0;
        let starty = 0;
    
        let Endx = 0;
        let Endy = 0;
    
    
        // Draw according to startType
        if (startType === 1) {
            startx = StartNorthX;
            starty = StartNorthY;
        }
        if (startType === 2) {
            startx = StartSouthX;
            starty = StartSouthY;
        }
        if (startType === 3) {
            startx = StartLeftX;
            starty = StartLeftY;
        }
        if (startType === 4) {
            startx = StartRightX;
            starty = StartRightY;
        }
    
    
        // Draw according to endType
        if (endType === 1) {
            Endx = EndNorthX;
            Endy = EndNorthY;
    
        }
        if (endType === 2) {
            // Go down 10 pixels
            Endx = EndSouthX;
            Endy = EndSouthY;
        }
        if (endType === 3) {
            // Go left 10 pixels
            Endx = EndLeftX;
            Endy = EndLeftY;
        }
        if (endType === 4) {
            // Go right 10 pixels
            Endx = EndRightX;
            Endy = EndRightY;
        }

        startx = roundToNearestTen(startx);
        starty = roundToNearestTen(starty);
        Endx = roundToNearestTen(Endx);
        Endy = roundToNearestTen(Endy);

        wireTraversal(startx, starty, Endx, Endy, pathData, instances);
        return pathData;
}

function extractComponentId(id) {
    const parts = id.split('-');
    return parts.length > 1 ? parts.slice(1).join('-') : id; // Extract part after the first dash
}

function updateWires(componentId) {
    let instances = getClassInstances();
    
    wires.forEach(wire => {
        const startComponentId = extractComponentId(wire.startConnectionId);
        const endComponentId = extractComponentId(wire.endConnectionId);
        

        if (startComponentId === componentId || endComponentId === componentId) {
            const startConnection = document.getElementById(wire.startConnectionId);
            const endConnection = document.getElementById(wire.endConnectionId);
            const startConnectorType = getConnectorType(wire.startConnectionId);
            const endConnectorType = getConnectorType(wire.endConnectionId);
            if (startConnection && endConnection) {
                updateWirePosition(startConnection, endConnection, wire.path, startConnectorType, endConnectorType, instances);
            } else {
                console.error('Missing connection points for wire:', wire);
            }
        }
    });
}

function updateAllWires() {
    wires.forEach(wire => {
        const startConnection = document.getElementById(wire.startConnectionId);
        const endConnection = document.getElementById(wire.endConnectionId);
        const startConnectorType = getConnectorType(wire.startConnectionId);
        const endConnectorType = getConnectorType(wire.endConnectionId);
        if (startConnection && endConnection) {
            updateWirePosition(startConnection, endConnection, wire.path, startConnectorType, endConnectorType);
        } else {
            console.error('Missing connection points for wire:', wire);
        }
    });
}

function wireTraversal(startx, starty, endx, endy, pathInfo, instances) {

    // Initialize the open and closed lists
    const openList = [];
    const closedList = new Set();
    const cameFrom = new Map();

    // Helper functions
    const heuristic = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);
    const isInBounds = (x, y) => x >= 0 && y >= 0 && x <= 2000 && y <= 2000;

    // Add starting point to open list
    openList.push({ x: startx, y: starty, g: 0, h: heuristic(startx, starty, endx, endy) });
    cameFrom.set(`${startx},${starty}`, null);

    while (openList.length > 0) {
        // Sort openList by f cost and remove the node with the lowest f cost
        openList.sort((a, b) => (a.g + a.h) - (b.g + b.h));
        const current = openList.shift();
        const { x: currentX, y: currentY } = current;

        // If we reached the goal, reconstruct the path and return
        if (currentX === endx && currentY === endy) {
            reconstructPath(cameFrom, endx, endy, pathInfo);
            return;
        }

        closedList.add(`${currentX},${currentY}`);

        // Evaluate neighbors
        const neighbors = [
            { x: currentX + 10, y: currentY }, // Right
            { x: currentX - 10, y: currentY }, // Left
            { x: currentX, y: currentY + 10 }, // Down
            { x: currentX, y: currentY - 10 }  // Up
        ];

        for (const { x: newX, y: newY } of neighbors) {
            if (!isInBounds(newX, newY) || isBlocked(newX, newY, instances) || closedList.has(`${newX},${newY}`)) {
                continue;
            }

            const gScore = current.g + 10; // Cost to move to neighbor
            const hScore = heuristic(newX, newY, endx, endy);
            const fScore = gScore + hScore;

            const existingNode = openList.find(node => node.x === newX && node.y === newY);

            if (!existingNode || fScore < (existingNode.g + existingNode.h)) {
                openList.push({ x: newX, y: newY, g: gScore, h: hScore });
                cameFrom.set(`${newX},${newY}`, { x: currentX, y: currentY });
            }
        }
    }

    console.log("Failed to find a path!");
}

function reconstructPath(cameFrom, x, y, pathInfo) {
    const path = [];
    let isPathBlocked = false; // Track if any part of the path is blocked

    // Traverse the cameFrom map to reconstruct the path
    while (cameFrom.has(`${x},${y}`)) {
        // Check if the point is already occupied

        path.push(`L ${x} ${y}`);
        const prev = cameFrom.get(`${x},${y}`);
        if (prev) {
            x = prev.x;
            y = prev.y;
        } else {
            break;
        }
    }
    // Reverse the path to go from the start to the end
    path.reverse();

    console.log("Points to be marked as wire:");
    // Mark each point along the path as occupied
    path.forEach(point => {
        const [command, pointX, pointY] = point.split(' ');
        const xCoord = parseInt(pointX, 10);
        const yCoord = parseInt(pointY, 10);

        console.log(`(${xCoord}, ${yCoord})`); // Log the point

        // Mark this point as occupied in the grid
        wire.markOccupied(xCoord, yCoord, true);

        // Add the point to pathInfo
        pathInfo.push(point);
    });

    // Start path with the initial point
    if (path.length > 0) {
        pathInfo.unshift(`M ${path[0].slice(2)}`); // M command for the starting point
    }
}




function generateSVGPathData(path, pathInfo) {
    path.forEach((point, index) => {
        if (index === 0) {
            pathInfo.push(`M ${point[0]} ${point[1]}`);
        } else {
            pathInfo.push(`L ${point[0]} ${point[1]}`);
        }
    });
}

function isBlocked(x, y, instances) {
    //console.log(instances);
    for (let i = 0; i < instances.length; i++) {
        let component = instances[i];
        for (let j = 0; j < component.blockedNodes.length; j++) {
            let blockedNode = component.blockedNodes[j];
            let xVal = blockedNode[0];
            let yVal = blockedNode[1];
            if (x === xVal && y === yVal) {
                return true;
            }
        }
    }
    return false;
}

function getConnectorType(connectionId) {
    if(connectionId.startsWith('VoltA') || connectionId.startsWith('Ground')) {
        return 1;
        //top
    }
    if(connectionId.startsWith('VoltB')) {
        return 2;
        //bottom
    }
    if(connectionId.startsWith('StdA')) {
        return 3;
        //Left
    }
    if(connectionId.startsWith('StdB')) {
        return 4;
        //Right
    }

}

function getComponentFromButton(button) {
    const componentId = button.dataset.componentId;
    return componentMap.get(componentId);
}

function getClassInstances() {
    const componentInstancesArray = Array.from(componentMap.values()).map(entry => entry.Button);
    return componentInstancesArray;
}

function roundToNearestTen(value) {
    return Math.round(value / 10) * 10;
}

function wireGrid() {
    const internalGrid = []; // Array to store grid points

    // Populate the grid
    for (let x = 220; x <= 1500; x += 10) {
        for (let y = 90; y <= 1500; y += 10) {
            internalGrid.push({
                x: x,
                y: y,
                occupied: false  // Tracks if the point is occupied
            });
        }
    }

    // Method to check if a specific grid point is occupied
    function isOccupied(x, y) {
        const point = internalGrid.find(p => p.x === x && p.y === y);
        return point ? point.occupied : false;
    }

    // Method to mark a grid point as occupied or unoccupied
    function markOccupied(x, y, status) {
        const point = internalGrid.find(p => p.x === x && p.y === y);
        if (point) {
            point.occupied = status;
        }
    }

    // Method to find the closest grid point to arbitrary coordinates
    function findClosestGridPoint(targetX, targetY) {
        let closestPoint = null;
        let minDistance = Infinity;

        internalGrid.forEach(point => {
            const distance = Math.hypot(point.x - targetX, point.y - targetY);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        });

        return closestPoint;
    }

    // Method to get available neighboring grid points around a given point
    function getAvailableNeighbors(x, y) {
        const neighbors = [
            { x: x + 10, y: y },
            { x: x - 10, y: y },
            { x: x, y: y + 10 },
            { x: x, y: y - 10 }
        ];

        return neighbors.filter(point => {
            return !isOccupied(point.x, point.y);
        });
    }

    return {
        isOccupied,
        markOccupied,
        findClosestGridPoint,
        getAvailableNeighbors,
        internalGrid  // Expose the grid array if needed for debugging
    };
}