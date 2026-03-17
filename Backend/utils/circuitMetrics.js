function buildAdjacency(edges) {
    const adjacency = {};
    for (const edge of edges || []) {
        if (!adjacency[edge.source]) adjacency[edge.source] = [];
        adjacency[edge.source].push({
            targetNodeId: edge.target,
            targetHandle: edge.targetHandle,
            sourceHandle: edge.sourceHandle,
        });
    }
    return adjacency;
}

function findNode(nodes, id) {
    return (nodes || []).find((n) => n.id === id);
}

function computeCircuitMetrics(circuitData) {
    const nodes = circuitData?.nodes || [];
    const edges = circuitData?.edges || [];

    const adjacency = buildAdjacency(edges);
    const batteryNodes = nodes.filter((n) => n.type === 'battery');

    const analog = {
        batteryVoltage: 9,
        hasClosedLoop: false,
        hasShortCircuit: false,
        maxCurrentA: 0,
        minResistanceOhm: null,
        paths: [],
    };

    for (const battery of batteryNodes) {
        const paths = [];

        const dfs = (currentNodeId, currentPath, visited) => {
            if (currentNodeId === battery.id && currentPath.length > 0) {
                const lastEdge = currentPath[currentPath.length - 1];
                if (lastEdge.targetHandle === 'neg') paths.push([...currentPath]);
                return;
            }

            if (visited.has(currentNodeId) && currentNodeId !== battery.id) return;

            const node = findNode(nodes, currentNodeId);
            if (!node) return;

            if (node.type === 'switch' && !node.data?.isOn) return;

            const outgoing = adjacency[currentNodeId] || [];
            const validEdges = outgoing.filter((e) => {
                if (currentNodeId === battery.id && currentPath.length === 0) return e.sourceHandle === 'pos';
                return true;
            });

            for (const edge of validEdges) {
                visited.add(currentNodeId);
                dfs(edge.targetNodeId, [...currentPath, edge], visited);
                visited.delete(currentNodeId);
            }
        };

        dfs(battery.id, [], new Set());

        for (const path of paths) {
            analog.hasClosedLoop = true;

            const pathNodeIds = path.map((e) => e.targetNodeId);
            let totalResistance = 0;
            let totalLEDVoltage = 0;

            for (const id of pathNodeIds) {
                const node = findNode(nodes, id);
                if (!node) continue;
                if (node.type === 'resistor') {
                    totalResistance += (node.data?.resistance !== undefined ? Number(node.data.resistance) : 350);
                } else if (node.type === 'led') {
                    const is5V = node.data?.label === 'LED (5V)';
                    totalLEDVoltage += is5V ? 5 : 2;
                }
            }

            let currentA = 0;
            if (totalResistance === 0) {
                currentA = (analog.batteryVoltage > totalLEDVoltage) ? Infinity : 0;
            } else {
                currentA = (analog.batteryVoltage - totalLEDVoltage) / totalResistance;
            }
            if (currentA <= 0) currentA = 0;

            if (currentA === Infinity) analog.hasShortCircuit = true;
            if (currentA !== Infinity && currentA > analog.maxCurrentA) analog.maxCurrentA = currentA;
            if (totalResistance !== 0) {
                analog.minResistanceOhm = analog.minResistanceOhm == null ? totalResistance : Math.min(analog.minResistanceOhm, totalResistance);
            }

            analog.paths.push({
                totalResistanceOhm: totalResistance,
                totalLEDVoltage,
                currentA,
            });
        }
    }

    const validation = {
        hasBattery: batteryNodes.length > 0,
        hasResistor: nodes.some((n) => n.type === 'resistor'),
        hasLED: nodes.some((n) => n.type === 'led'),
        hasSwitch: nodes.some((n) => n.type === 'switch'),
        hasClosedLoop: analog.hasClosedLoop,
        hasShortCircuit: analog.hasShortCircuit,
    };

    return { analog, validation };
}

function gradeCircuit({ metrics, rubric }) {
    const breakdown = {
        closedLoop: 0,
        noShortCircuit: 0,
        hasResistor: 0,
        hasLED: 0,
        withinTargetCurrent: 0,
    };

    if (metrics?.validation?.hasClosedLoop) breakdown.closedLoop = 5;
    if (!metrics?.validation?.hasShortCircuit) breakdown.noShortCircuit = 2;
    if (metrics?.validation?.hasResistor) breakdown.hasResistor = 1;
    if (metrics?.validation?.hasLED) breakdown.hasLED = 1;

    const targetMin = rubric?.targetCurrentMinA;
    const targetMax = rubric?.targetCurrentMaxA;
    if (typeof targetMin === 'number' && typeof targetMax === 'number') {
        const current = metrics?.analog?.maxCurrentA ?? 0;
        if (current >= targetMin && current <= targetMax) breakdown.withinTargetCurrent = 1;
    } else {
        // Default “reasonable” current window for simple LED/resistor circuits
        const current = metrics?.analog?.maxCurrentA ?? 0;
        if (current >= 0.001 && current <= 0.03) breakdown.withinTargetCurrent = 1;
    }

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { simulationScore: total, scoreBreakdown: breakdown };
}

module.exports = { computeCircuitMetrics, gradeCircuit };

