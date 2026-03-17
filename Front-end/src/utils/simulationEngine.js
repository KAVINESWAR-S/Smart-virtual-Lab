export const runSimulation = (nodes, edges, setNodes, setMetrics) => {
    // 1. Digital Logic State Map (for backward compatibility with logic gates)
    const state = {};
    nodes.forEach(node => {
        state[node.id] = { inputs: {}, outputs: {} };
        if (node.type === 'battery') {
            state[node.id].outputs['pos'] = 1;
            state[node.id].outputs['neg'] = 0;
        }
    });

    let hasChanges = true;
    let iterations = 0;
    while (hasChanges && iterations < 15) {
        hasChanges = false;
        iterations++;
        edges.forEach(edge => {
            const sourceVal = state[edge.source]?.outputs[edge.sourceHandle] || 0;
            if (state[edge.target]) {
                if (state[edge.target].inputs[edge.targetHandle] !== sourceVal) {
                    state[edge.target].inputs[edge.targetHandle] = sourceVal;
                    hasChanges = true;
                }
            }
        });
        nodes.forEach(node => {
            const nodeState = state[node.id];
            if (!nodeState) return;
            let newOutputs = { ...nodeState.outputs };
            const type = node.type;
            if (type === 'battery') newOutputs['pos'] = 1;
            else if (type === 'switch') {
                newOutputs['out'] = node.data?.isOn ? (nodeState.inputs['in'] || 0) : 0;
            }
            else if (type === 'led' || type === 'resistor') {
                newOutputs['out'] = nodeState.inputs['in'] || 0;
            }
            else if (type === 'diode' || type === 'capacitor' || type === 'inductor') {
                newOutputs['out'] = nodeState.inputs['in'] || 0;
            }
            else if (type === 'andGate') {
                newOutputs['out'] = (nodeState.inputs['a'] && nodeState.inputs['b']) ? 1 : 0;
            }
            else if (type === 'orGate') {
                newOutputs['out'] = (nodeState.inputs['a'] || nodeState.inputs['b']) ? 1 : 0;
            }
            else if (type === 'notGate') {
                newOutputs['out'] = nodeState.inputs['in'] ? 0 : 1;
            }
            Object.keys(newOutputs).forEach(key => {
                if (nodeState.outputs[key] !== newOutputs[key]) {
                    nodeState.outputs[key] = newOutputs[key];
                    hasChanges = true;
                }
            });
        });
    }

    // 2. Analog Circuit Evaluation
    // Find paths from Battery 'pos' to Battery 'neg'
    const adjacencyList = {}; // from NodeID -> [{ targetNodeId, targetHandle }]
    edges.forEach(edge => {
        if (!adjacencyList[edge.source]) adjacencyList[edge.source] = [];
        adjacencyList[edge.source].push({ targetNodeId: edge.target, targetHandle: edge.targetHandle, sourceHandle: edge.sourceHandle });
    });

    const batteryNodes = nodes.filter(n => n.type === 'battery');

    const metrics = {
        analog: {
            batteryVoltage: 9,
            hasClosedLoop: false,
            hasShortCircuit: false,
            maxCurrentA: 0,
            minResistanceOhm: null,
            paths: []
        },
        logic: {
            signals: []
        },
        validation: {
            hasBattery: batteryNodes.length > 0,
            hasResistor: nodes.some(n => n.type === 'resistor'),
            hasLED: nodes.some(n => n.type === 'led'),
            hasSwitch: nodes.some(n => n.type === 'switch'),
            hasClosedLoop: false,
            hasShortCircuit: false
        }
    };

    // We will accumulate states for analog components based on whether they are in a closed loop
    const newComponentStates = {}; // nodeId -> ledState

    batteryNodes.forEach(battery => {
        // DFS to find paths
        const paths = [];
        const dfs = (currentNodeId, currentPath, visited) => {
            if (currentNodeId === battery.id && currentPath.length > 0) {
                // Check if the last edge entered 'neg'
                const lastEdge = currentPath[currentPath.length - 1];
                if (lastEdge.targetHandle === 'neg') {
                    paths.push([...currentPath]);
                }
                return;
            }

            if (visited.has(currentNodeId) && currentNodeId !== battery.id) return;

            const node = nodes.find(n => n.id === currentNodeId);
            if (!node) return;

            // If switch is open, stop path
            if (node.type === 'switch' && !node.data?.isOn) return;
            // Capacitor blocks DC in this simulator
            if (node.type === 'capacitor') return;

            // Follow outgoing edges
            const outgoingEdges = adjacencyList[currentNodeId] || [];
            // For battery, only leave from 'pos' initially
            const validEdges = outgoingEdges.filter(e => {
                if (currentNodeId === battery.id && currentPath.length === 0) return e.sourceHandle === 'pos';
                return true;
            });

            validEdges.forEach(edge => {
                visited.add(currentNodeId);
                dfs(edge.targetNodeId, [...currentPath, edge], visited);
                visited.delete(currentNodeId);
            });
        };

        dfs(battery.id, [], new Set());

        // Process found paths
        paths.forEach(path => {
            metrics.analog.hasClosedLoop = true;
            metrics.validation.hasClosedLoop = true;
            let totalResistance = 0;
            let totalLEDVoltage = 0;
            let totalDiodeDrop = 0;
            let diodeReverse = false;

            const pathNodeIds = path.map(e => e.targetNodeId);
            // pathNodeIds includes the final battery node.

            pathNodeIds.forEach(id => {
                const node = nodes.find(n => n.id === id);
                if (!node) return;

                if (node.type === 'resistor') {
                    totalResistance += (node.data?.resistance !== undefined ? node.data.resistance : 350);
                } else if (node.type === 'led') {
                    const is5V = node.data?.label === 'LED (5V)';
                    totalLEDVoltage += is5V ? 5 : 2;
                } else if (node.type === 'diode') {
                    totalDiodeDrop += (node.data?.forwardDrop !== undefined ? Number(node.data.forwardDrop) : 0.7);
                } else if (node.type === 'inductor') {
                    totalResistance += 0; // DC short approximation
                }
            });

            // Check diode polarity along this path using handle directions:
            // diode should be entered via targetHandle 'in' and exited via sourceHandle 'out'
            path.forEach(edge => {
                const srcNode = nodes.find(n => n.id === edge.source);
                const tgtNode = nodes.find(n => n.id === edge.target);
                if (tgtNode?.type === 'diode' && edge.targetHandle && edge.targetHandle !== 'in') diodeReverse = true;
                if (srcNode?.type === 'diode' && edge.sourceHandle && edge.sourceHandle !== 'out') diodeReverse = true;
            });

            const batteryVoltage = metrics.analog.batteryVoltage;
            let current = 0;

            if (diodeReverse) {
                current = 0;
            } else
            if (totalResistance === 0) {
                // Short circuit if voltage > 0
                current = (batteryVoltage > (totalLEDVoltage + totalDiodeDrop)) ? Infinity : 0;
            } else {
                current = (batteryVoltage - totalLEDVoltage - totalDiodeDrop) / totalResistance;
            }

            // If negative current (LEDs blocking reverse or not enough voltage), current is 0
            if (current <= 0) current = 0;

            metrics.analog.paths.push({
                totalResistanceOhm: totalResistance,
                totalLEDVoltage,
                currentA: current
            });
            if (current === Infinity) {
                metrics.analog.hasShortCircuit = true;
                metrics.validation.hasShortCircuit = true;
            } else {
                metrics.analog.maxCurrentA = Math.max(metrics.analog.maxCurrentA, current);
            }
            if (totalResistance !== 0) {
                metrics.analog.minResistanceOhm = metrics.analog.minResistanceOhm == null
                    ? totalResistance
                    : Math.min(metrics.analog.minResistanceOhm, totalResistance);
            }

            // Determine LED states in this path
            pathNodeIds.forEach(id => {
                const node = nodes.find(n => n.id === id);
                if (node && node.type === 'led') {
                    let ledState = 'off';
                    let ledIntensity = 0;

                    if (current > 0.040) {
                        ledState = 'blast';
                        ledIntensity = 1;
                    } else if (current > 0.001) {
                        ledState = 'on';
                        // Physics: Brightness is proportional to current.
                        // A 5V LED with 9V battery and 350 ohm resistor gets (9-5)/350 = 0.011A (11mA).
                        // A 2V LED with 350 ohm resistor gets (9-2)/350 = 0.020A (20mA).
                        // Let's map typical operating current (10mA - 20mA) to 50%-100% brightness.
                        // Formula: base 0.2 + (current / 0.020) * 0.8
                        ledIntensity = Math.min(1, 0.2 + (current / 0.020) * 0.8);
                    }

                    // If multiple paths contain the same LED, take the 'worst' or 'max' state
                    const precedence = { 'off': 0, 'on': 1, 'blast': 2 };
                    const currentStateObj = newComponentStates[id] || { state: 'off', intensity: 0 };

                    if (precedence[ledState] > precedence[currentStateObj.state] ||
                        (ledState === currentStateObj.state && ledIntensity > currentStateObj.intensity)) {
                        newComponentStates[id] = { state: ledState, intensity: ledIntensity };
                    }
                }
            });
        });
    });

    // 3. Update Visuals
    const newNodes = nodes.map(node => {
        if (node.type === 'led') {
            // Analog state
            const stateObj = newComponentStates[node.id] || { state: 'off', intensity: 0 };
            let newState = stateObj.state;
            let newIntensity = stateObj.intensity;

            // Fallback to logic state if not in an analog circuit path
            if (newState === 'off' && state[node.id]?.inputs['in']) {
                // Backward trace to ensure this digital signal came from a logic gate,
                // NOT an unclosed analog battery circuit.
                let isDigital = false;
                const checkDigital = (currentNodeId, visited = new Set()) => {
                    if (visited.has(currentNodeId)) return;
                    visited.add(currentNodeId);

                    const incomingEdges = edges.filter(e => e.target === currentNodeId);
                    for (let edge of incomingEdges) {
                        const sourceNode = nodes.find(n => n.id === edge.source);
                        if (!sourceNode) continue;

                        if (['andGate', 'orGate', 'notGate'].includes(sourceNode.type)) {
                            isDigital = true;
                            return;
                        }
                        if (['switch', 'resistor'].includes(sourceNode.type)) {
                            checkDigital(sourceNode.id, visited);
                        }
                    }
                };

                checkDigital(node.id);

                if (isDigital) {
                    newState = 'on'; // fallback for digital logic gates connected to LED
                    newIntensity = 0.8;
                }
            }

            if (node.data.ledState !== newState || node.data.ledIntensity !== newIntensity) {
                return { ...node, data: { ...node.data, ledState: newState, ledIntensity: newIntensity } };
            }
        }
        return node;
    });

    const nodesChanged = JSON.stringify(newNodes) !== JSON.stringify(nodes);
    if (nodesChanged) {
        setNodes(newNodes);
    }

    // 4. Expose digital logic signals for UI
    metrics.logic.signals = nodes
        .filter(n => ['andGate', 'orGate', 'notGate', 'switch', 'battery', 'led'].includes(n.type))
        .map(n => ({
            id: n.id,
            type: n.type,
            label: n.data?.label || n.type,
            inputs: state[n.id]?.inputs || {},
            outputs: state[n.id]?.outputs || {}
        }));

    if (typeof setMetrics === 'function') {
        setMetrics(metrics);
    }
};
