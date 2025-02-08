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
        ////console.log(Started drawing wire from ${connectionId});
        isDrawingWire = true;
        startConnection = connectionId;
    }
}

// Function to end drawing a wire at a connection point
function endDrawingWire(connectionId,x,y) {
    ////console.log(`Attempting to end wire drawing at ${connectionId}`);
    let firstId = getComponentId(startConnection);
    let secondId = getComponentId(connectionId);
    //console.log(wire.isOccupied(x,y));
    // Check if we're currently drawing and the connectionId is different from startConnection
    if (isDrawingWire &&  secondId !== firstId) {
        // Check if either startConnection or connectionId already has any connections
       
        // Create the wire and store the connection
        //console.log("startConnection: " + startConnection);
        //console.log("endConnection: " + connectionId);
        createWire(startConnection, connectionId, x, y);
        let wire = new wireClass(startConnection, connectionId);
        storeConnection(startConnection, connectionId, wire);
    }
    else if(isDrawingWire && wire.isOccupied(x,y)) {
        // Create the wire and store the connection
        createWire(startConnection, connectionId, x, y);
        wire = new wireClass(startConnection, connectionId);
        //console.log("wire: " + wire);
        storeConnection(startConnection, connectionId, wire);
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
function storeConnection(startConnection, connectionId, wire) {
    // Get the component IDs based on the connector IDs
    const startComponentId = getComponentIdByConnector(startConnection);
    const targetComponentId = getComponentIdByConnector(connectionId);

    // Ensure both components exist in the map
    if (!startComponentId || !targetComponentId) {
        console.error("One or both connectors not found.");
        return;
    }

    const startComponent = componentMap.get(startComponentId);
    const targetComponent = componentMap.get(targetComponentId);

    // Ensure the components themselves are valid
    if (!startComponent || !targetComponent) {
        console.error("One or both components not found in the component map.");
        return;
    }

    // Update the connectors array in each component (ensure uniqueness)
    if (!startComponent.connections.includes(connectionId)) {
        startComponent.connections.push(connectionId); // Store the connection ID in connections array
    }

    if (!targetComponent.connections.includes(startConnection)) {
        targetComponent.connections.push(startConnection); // Store the connection ID in reverse direction
    }

    updateEquations(startComponent, targetComponent, wire);

    // Optionally, log the connection
    ////console.log(`Connected connector ${startConnection} to connector ${connectionId}`);
}

function getComponentIdByConnector(connectorId) {
    // Iterate over each component in the map
    for (let [componentId, componentData] of componentMap.entries()) {
        // Check if the connectorId exists in the component's connectors array
        if (componentData.connectors.some(connector => connector.id === connectorId)) {
            return componentId;
        }
    }
    return null;  // If no component has the connectorId
}

function getComponentId(fullId) {
    const parts = fullId.split('-');
    // Assuming the componentId is always the second part
    return parts[0];
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
    //console.log("componentID" + endComponentId)

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
    updateWirePosition(startConnection, endConnection, path, instances);

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

function updateWiresDuringDrag(componentId) {
    const instances = getClassInstances();

    wires.forEach(wired => {
        const startComponentId = getComponentId(wired.startConnectionId);
        const endComponentId = getComponentId(wired.endConnectionId);

        if (startComponentId === componentId || endComponentId === componentId) {
            const startConnection = document.getElementById(wired.startConnectionId);
            const endConnection = document.getElementById(wired.endConnectionId);

            if (startConnection && endConnection) {
                updateWirePosition(startConnection, endConnection, wired.path, instances);
            }
        }
    });
}

function updateWirePosition(startConnection, endConnection, path, instances) {
    // Validate inputs
    if (!startConnection || !endConnection) {
        console.error('Invalid connections passed to updateWirePosition:', { startConnection, endConnection });
        return;
    }

    if (!path) {
        console.error('Invalid path passed to updateWirePosition:', path);
        return;
    }

    if (!(path instanceof SVGPathElement)) {
        console.error('Path is not an SVGPathElement:', path);
        return;
    }

    // Trigger reflow to ensure bounding rect is updated
    startConnection.offsetHeight;
    endConnection.offsetHeight;

    // Get bounding rectangles
    const startRect = startConnection.getBoundingClientRect();
    const endRect = endConnection.getBoundingClientRect();
    //console.log('Start Rect:', startRect, 'End Rect:', endRect);

    // Generate path using wirePathing
    const d = wirePathing(
        startRect,
        endRect,
        getComponentId(startConnection.id),
        getComponentId(endConnection.id),
        instances
    );

    //console.log('Generated Path:', d);

    // Update path attribute
    if (d) {
        path.setAttribute('d', d); // Ensure this is an SVG path
    } else {
        console.warn('Path calculation failed!');
    }
}



function determineSide(rect, id, instances) {
    if (!instances || !Array.isArray(instances)) {
        console.error("Invalid instances array:", instances);
        return null;
    }

    let i = 0;
    let closestSide = null;
    let minDistance = Infinity;

    while (i < instances.length) {
        const instance = instances[i];
        if (!instance || !instance.name) {
            console.error(`Invalid instance at index ${i}:`, instance);
            break;
        }

        if (instance.name === id) {
            const blockedNodes = instance.blockedNodes || [];
            // Right Connector
            let [xVal, yVal] = blockedNodes[0];
            const rightDistance = 
                Math.abs(roundToNearestTen(rect.right) - roundToNearestTen(xVal))

            if (rightDistance < minDistance) {
                minDistance = rightDistance;
                closestSide = 3; // Right Connector
            }

            // Bottom Connector
            const bottomDistance = Math.abs(roundToNearestTen(rect.bottom) - roundToNearestTen(yVal))
            if (bottomDistance < minDistance) {
                minDistance = bottomDistance;
                closestSide = 1; // Bottom Connector
            }

            // Left Connector
            [xVal, yVal] = blockedNodes[48];
            const leftDistance = Math.abs(roundToNearestTen(rect.left) - roundToNearestTen(xVal))
            if (leftDistance < minDistance) {
                minDistance = leftDistance;
                closestSide = 4; // Left Connector
            }

            // Top Connector
            const topDistance = Math.abs(roundToNearestTen(rect.top) - roundToNearestTen(yVal))
            if (topDistance < minDistance) {
                minDistance = topDistance;
                closestSide = 2; // Top Connector
            }
        }
        i++;
    }

    if (closestSide !== null) {
        return closestSide;
    }

    console.warn(`No matching side found for ID: ${id}`);
    return null;
}



function wirePathing(startRect, endRect, startComponentId, endComponentId, instances) {
    let pathData = [];

    // Determine sides
    let startType = determineSide(startRect, startComponentId, instances);
    let endType = determineSide(endRect, endComponentId, instances);

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

// Create a single worker instance
const wireTraversalWorker = new Worker('wirePathing.js');

// Worker queue for efficient task management
const workerQueue = [];
let workerBusy = false;

function processNextWorkerTask() {
    if (workerBusy || workerQueue.length === 0) return;

    workerBusy = true;
    const { data, resolve } = workerQueue.shift();

    wireTraversalWorker.postMessage(data);

    wireTraversalWorker.onmessage = function (e) {
        resolve(e.data);
        workerBusy = false;
        processNextWorkerTask();
    };
}

function enqueueWorkerTask(data) {
    return new Promise(resolve => {
        workerQueue.push({ data, resolve });
        processNextWorkerTask();
    });
}

async function updateWires(componentId) {
    const instances = getClassInstances();

    for (const wired of wires) {
        const startComponentId = getComponentId(wired.startConnectionId);
        const endComponentId = getComponentId(wired.endConnectionId);

        if (startComponentId === componentId || endComponentId === componentId) {
            const startConnection = document.getElementById(wired.startConnectionId);
            const endConnection = document.getElementById(wired.endConnectionId);

            if (startConnection && endConnection) {
                const startRect = startConnection.getBoundingClientRect();
                const endRect = endConnection.getBoundingClientRect();

                const grid = generateGrid(); // Your existing grid logic

                try {
                    const path = await enqueueWorkerTask({
                        startX: startRect.left,
                        startY: startRect.top,
                        endX: endRect.left,
                        endY: endRect.top,
                        grid
                    });
                    updateWirePosition(startConnection, endConnection, path, instances);
                } catch (error) {
                    console.error('Worker task failed:', error);
                }
            } else {
                console.error('Missing connection points for wire:', wired);
            }
        }
    }
}

// Terminate the worker when no longer needed (e.g., during cleanup)
window.addEventListener('beforeunload', () => {
    wireTraversalWorker.terminate();
});



function updateAllWires() {
    wires.forEach(wired => {
        const startConnection = document.getElementById(wired.startConnectionId);
        const endConnection = document.getElementById(wired.endConnectionId);
        if (startConnection && endConnection) {
            updateWirePosition(startConnection, endConnection, wired.path);
        } else {
            console.error('Missing connection points for wire:', wired);
        }
    });
}

function wireTraversal(startX, startY, endX, endY, pathInfo, instances) {
    const openList = [];
    const closedList = new Set();
    const cameFrom = new Map();

    // Heuristic function for A* (Manhattan distance)
    const heuristic = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

    // Check grid boundaries (modify if grid bounds are dynamic)
    const isInBounds = (x, y) => x >= 0 && y >= 0 && x <= 2000 && y <= 2000;

    // Add starting point to open list
    openList.push({ x: startX, y: startY, g: 0, h: heuristic(startX, startY, endX, endY) });
    cameFrom.set(`${startX},${startY}`, null);

    while (openList.length > 0) {
        // Sort openList by f cost and remove the node with the lowest f cost
        openList.sort((a, b) => (a.g + a.h) - (b.g + b.h));
        const current = openList.shift();
        const { x: currentX, y: currentY } = current;

        // If we reach the goal, reconstruct the path
        if (currentX === endX && currentY === endY) {
            reconstructPath(cameFrom, endX, endY, pathInfo);
            return;
        }

        closedList.add(`${currentX},${currentY}`);

        // Evaluate neighbors (4-way movement: up, down, left, right)
        const neighbors = [
            { x: currentX + 10, y: currentY },
            { x: currentX - 10, y: currentY },
            { x: currentX, y: currentY + 10 },
            { x: currentX, y: currentY - 10 }
        ];

        for (const neighbor of neighbors) {
            const { x: neighborX, y: neighborY } = neighbor;

            // Skip blocked or out-of-bound nodes
            if (
                !isInBounds(neighborX, neighborY) ||
                isBlocked(neighborX, neighborY, instances) ||
                closedList.has(`${neighborX},${neighborY}`)
            ) {
                continue;
            }

            // Calculate g, h, and f scores
            const gScore = current.g + 10; // Constant movement cost (10 units)
            const hScore = heuristic(neighborX, neighborY, endX, endY);
            const fScore = gScore + hScore;

            // Check if the node is already in the open list with a better score
            const existingNode = openList.find(node => node.x === neighborX && node.y === neighborY);

            if (!existingNode || fScore < (existingNode.g + existingNode.h)) {
                openList.push({ x: neighborX, y: neighborY, g: gScore, h: hScore });
                cameFrom.set(`${neighborX},${neighborY}`, { x: currentX, y: currentY });
            }
        }
    }

    console.warn("Path not found!");
}



function reconstructPath(cameFrom, x, y, pathInfo) {
    const path = [];
    const visitedNodes = new Set(); // Tracks nodes already in the path

    while (cameFrom.has(`${x},${y}`)) {
        const nodeKey = `${x},${y}`;
        if (visitedNodes.has(nodeKey)) {
            console.error("Cycle detected in path reconstruction!");
            break;
        }

        path.push(`L ${x} ${y}`);
        visitedNodes.add(nodeKey);

        const prev = cameFrom.get(nodeKey);
        if (prev) {
            x = prev.x;
            y = prev.y;
        } else {
            break;
        }
    }

    path.reverse();

    path.forEach(point => {
        const [_, pointX, pointY] = point.split(' ');
        const xCoord = parseInt(pointX, 10);
        const yCoord = parseInt(pointY, 10);

        wire.markOccupied(xCoord, yCoord, true); // Mark points as occupied
        pathInfo.push(point);
    });

    if (path.length > 0) {
        pathInfo.unshift(`M ${path[0].slice(2)}`); // Start path with 'M'
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
    for (let i = 0; i < instances.length; i++) {
        let component = instances[i];
        ////console.log(`Checking component ${i} with blocked nodes:`, component.blockedNodes);
        for (let j = 0; j < component.blockedNodes.length; j++) {
            let blockedNode = component.blockedNodes[j];
            let xVal = roundToNearestTen(blockedNode[0]);
            let yVal = roundToNearestTen(blockedNode[1]);
            if (x === xVal && y === yVal) {
                ////console.log(`Blocked at (${x}, ${y})`);
                return true;
            }
        }
    }
    return false;
}


function getComponentFromButton(button) {
    const componentId = button.dataset.componentId;
    return componentMap.get(componentId);
}

function getClassInstances() {
    const componentInstancesArray = Array.from(componentMap.values()).map(entry => {
        return entry.instance;
    });
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