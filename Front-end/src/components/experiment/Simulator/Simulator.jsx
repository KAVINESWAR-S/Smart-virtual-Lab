import React, {
    useState,
    useCallback,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ComponentPalette from './ComponentPalette';
import {
    BatteryNode,
    LEDNode,
    SwitchNode,
    ResistorNode,
    DiodeNode,
    CapacitorNode,
    InductorNode,
    AndGateNode,
    OrGateNode,
    NotGateNode
} from './CustomNodes';
import { runSimulation } from "../../../utils/simulationEngine";

const nodeTypes = {
    battery: BatteryNode,
    led: LEDNode,
    switch: SwitchNode,
    resistor: ResistorNode,
    diode: DiodeNode,
    capacitor: CapacitorNode,
    inductor: InductorNode,
    andGate: AndGateNode,
    orGate: OrGateNode,
    notGate: NotGateNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const DEFAULT_NODES = [];
const DEFAULT_EDGES = [];

const Simulator = forwardRef(
    (
        { onSubmit, initialNodes = DEFAULT_NODES, initialEdges = DEFAULT_EDGES, readOnly = false, timeLimit },
        ref
    ) => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [metrics, setMetrics] = useState(null);
    const [showMetrics, setShowMetrics] = useState(true);

    // Timer state
    const [timeLeft, setTimeLeft] = useState(timeLimit || null);

    // Simulation Loop
    const handleNodeDataChange = useCallback(
        (id, data) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === id) {
                        return { ...node, data: { ...node.data, ...data } };
                    }
                    return node;
                })
            );
            setIsRunning(true);
        },
        [setNodes]
    );

    const hydrateNodes = useCallback(
        (nodesToHydrate) =>
            (nodesToHydrate || []).map((node) => ({
                ...node,
                data: {
                    ...(node.data || {}),
                    onChange: (data) => handleNodeDataChange(node.id, data),
                },
            })),
        [handleNodeDataChange]
    );

    // Sync state with props when they change
    useEffect(() => {
        // Hydrate nodes with onChange handler which is lost in JSON serialization
        setNodes(hydrateNodes(initialNodes));
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]); // Fixed dependency array

    useImperativeHandle(
        ref,
        () => ({
            getCircuit: () => ({ nodes, edges }),
            setCircuit: (circuit) => {
                const newNodes = hydrateNodes(circuit?.nodes || []);
                const newEdges = circuit?.edges || [];
                setNodes(newNodes);
                setEdges(newEdges);
            },
            clearCircuit: () => {
                setNodes([]);
                setEdges([]);
            },
        }),
        [edges, hydrateNodes, nodes, setEdges, setNodes]
    );

    // Timer Logic
    useEffect(() => {
        let timer;
        if (timeLimit && timeLeft > 0 && !readOnly) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && !readOnly && onSubmit) {
            onSubmit({ nodes, edges }); // Auto-submit
        }
        return () => clearInterval(timer);
    }, [timeLeft, timeLimit, readOnly, onSubmit, nodes, edges]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Handle Drag & Drop
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            if (readOnly) return; // Disable drop in readOnly mode
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow/type');
            const label = event.dataTransfer.getData('application/reactflow/label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type,
                position,
                data: { label, onChange: (data) => handleNodeDataChange(newNode.id, data) },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [handleNodeDataChange, reactFlowInstance, readOnly, setNodes], // Added readOnly dependency
    );

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const toggleSimulation = () => {
        if (!isRunning) {
            setIsRunning(true);
            runSimulation(nodes, edges, setNodes, setMetrics);
        } else {
            setIsRunning(false);
        }
    };

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                runSimulation(nodes, edges, setNodes, setMetrics);
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isRunning, nodes, edges]);


    const deleteSelected = useCallback(() => {
        setNodes((nds) => nds.filter((node) => !node.selected));
        setEdges((eds) => eds.filter((edge) => !edge.selected));
    }, [setNodes, setEdges]);

    return (
        <div className="flex h-[600px] w-full border border-slate-700/50 rounded-xl overflow-hidden bg-slate-950">
            <ReactFlowProvider>
                {!readOnly && <ComponentPalette />}

                <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                    <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur p-2 rounded-xl shadow-xl border border-slate-700 flex gap-2 items-center">

                        {/* Timer Display */}
                        {timeLeft !== null && !readOnly && (
                            <div className={`mr-2 font-mono font-bold px-3 py-2 rounded-lg border ${timeLeft < 60 ? 'text-red-500 border-red-500/50 animate-pulse' : 'text-blue-400 border-blue-500/30'}`}>
                                ⏱ {formatTime(timeLeft)}
                            </div>
                        )}

                        <button
                            onClick={toggleSimulation}
                            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${isRunning
                                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                                : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                                }`}
                        >
                            {isRunning ? '⏹ Stop' : '▶ Run'}
                        </button>
                        <button
                            onClick={() => setShowMetrics((v) => !v)}
                            className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors"
                            title="Toggle Measurements"
                        >
                            📊
                        </button>
                        {!readOnly && (
                            <>
                                <button
                                    onClick={deleteSelected}
                                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors"
                                    title="Delete Selected (Backspace)"
                                >
                                    🗑
                                </button>
                                <button
                                    onClick={() => { setNodes([]); setEdges([]); }}
                                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors"
                                    title="Clear All"
                                >
                                    Clear
                                </button>
                            </>
                        )}
                        {onSubmit && !readOnly && (
                            <button
                                onClick={() => onSubmit({ nodes, edges })}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white border border-blue-500 hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/20"
                            >
                                💾 Submit
                            </button>
                        )}
                    </div>

                    {showMetrics && metrics && (
                        <div className="absolute bottom-4 right-4 z-10 w-[360px] max-w-[90vw] bg-slate-900/90 backdrop-blur p-4 rounded-xl shadow-xl border border-slate-700">
                            <div className="flex items-center justify-between mb-3">
                                <div className="font-bold text-slate-200">Measurements</div>
                                <div className="text-xs text-slate-400 font-mono">
                                    Imax: {metrics.analog?.maxCurrentA === Infinity ? '∞' : (metrics.analog?.maxCurrentA ?? 0).toFixed(4)}A
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-2">
                                    <div className="text-slate-400 text-xs">Loop</div>
                                    <div className={`font-bold ${metrics.validation?.hasClosedLoop ? 'text-emerald-300' : 'text-slate-200'}`}>
                                        {metrics.validation?.hasClosedLoop ? 'Closed' : 'Open'}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-2">
                                    <div className="text-slate-400 text-xs">Short</div>
                                    <div className={`font-bold ${metrics.validation?.hasShortCircuit ? 'text-red-300' : 'text-emerald-300'}`}>
                                        {metrics.validation?.hasShortCircuit ? 'Detected' : 'No'}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-2">
                                    <div className="text-slate-400 text-xs">R(min)</div>
                                    <div className="font-bold text-slate-200">
                                        {metrics.analog?.minResistanceOhm == null ? '—' : `${Math.round(metrics.analog.minResistanceOhm)}Ω`}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-2">
                                    <div className="text-slate-400 text-xs">V(batt)</div>
                                    <div className="font-bold text-slate-200">{metrics.analog?.batteryVoltage ?? 9}V</div>
                                </div>
                            </div>

                            {metrics.logic?.signals?.length > 0 && (
                                <div className="mt-3">
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Logic signals</div>
                                    <div className="max-h-40 overflow-auto rounded-lg border border-slate-700">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-800/70 text-slate-300">
                                                <tr>
                                                    <th className="text-left p-2">Node</th>
                                                    <th className="text-left p-2">In</th>
                                                    <th className="text-left p-2">Out</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {metrics.logic.signals.slice(0, 20).map((s) => (
                                                    <tr key={s.id} className="text-slate-200">
                                                        <td className="p-2 font-mono">{s.type}</td>
                                                        <td className="p-2 font-mono">{JSON.stringify(s.inputs)}</td>
                                                        <td className="p-2 font-mono">{JSON.stringify(s.outputs)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={readOnly ? null : onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={readOnly ? null : onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        nodesDraggable={!readOnly}
                        nodesConnectable={!readOnly}
                        elementsSelectable={true}
                        fitView
                        className="bg-slate-950"
                    >
                        <Controls className="bg-slate-800 border-slate-700 fill-slate-300 [&>button]:border-slate-700 [&>button]:bg-slate-800 [&>button:hover]:bg-slate-700 [&>button__svg]:fill-slate-300" />
                        <Background variant="dots" gap={12} size={1} color="#334155" />
                    </ReactFlow>
                </div>
            </ReactFlowProvider>
        </div>
    );
    }
);

export default Simulator;
