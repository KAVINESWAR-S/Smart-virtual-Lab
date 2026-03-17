import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const nodeStyles = "bg-white border-2 border-gray-800 rounded shadow-md p-2 min-w-[100px] text-center flex flex-col items-center justify-center relative";

// Battery Node
export const BatteryNode = memo(() => {
    return (
        <div className={`${nodeStyles} border-yellow-500`}>
            <Handle type="source" position={Position.Right} id="pos" style={{ top: '30%', background: 'red' }} />
            <div className="text-sm font-bold">Battery</div>
            <div className="text-xs text-gray-500">9V</div>
            <Handle type="target" position={Position.Right} id="neg" style={{ top: '70%', background: 'black' }} />
        </div>
    );
});

// LED Node
export const LEDNode = memo(({ data }) => {
    const state = data.ledState || (data.isOn ? 'on' : 'off');
    const intensity = data.ledIntensity !== undefined ? data.ledIntensity : (state === 'on' ? 0.8 : 0);

    // Default resting visuals based on state
    let bgClass = 'border-slate-400 bg-slate-50';
    let icon = '💡';

    // Default physics styling for 'off'
    let customStyle = {
        filter: 'grayscale(100%)',
        opacity: 0.5,
        boxShadow: 'none'
    };

    if (state === 'blast') {
        bgClass = 'border-red-500 bg-red-100 text-red-500';
        icon = '💥';
        customStyle = {
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)', // red shadow
            filter: 'none',
            opacity: 1
        };
    } else if (state === 'on') {
        bgClass = 'border-yellow-400 bg-yellow-50';

        // Physics mapped to visuals
        const glowRadius = Math.max(0, intensity * 20); // 0 to 20px
        const glowOpacity = Math.max(0, intensity * 0.8);
        const grayScale = Math.max(0, 100 - (intensity * 100)); // 100 off, 0 full brightness
        const opacity = Math.min(1, 0.5 + (intensity * 0.5));

        customStyle = {
            boxShadow: `0 0 ${glowRadius}px rgba(234, 179, 8, ${glowOpacity})`, // yellow-500 rgb
            filter: `grayscale(${grayScale}%)`,
            opacity: opacity
        };
    }

    return (
        <div className={`${nodeStyles} transition-all duration-300 ${bgClass}`} style={customStyle}>
            <Handle type="target" position={Position.Left} id="in" />
            <div className="text-3xl transition-all duration-300">{icon}</div>
            <div className="text-xs font-bold mt-1 text-slate-800">{data.label || 'LED'}</div>
            <Handle type="source" position={Position.Right} id="out" />
        </div>
    );
});

// Switch Node
export const SwitchNode = memo(({ data }) => {
    const [isOn, setIsOn] = React.useState(!!data.isOn);

    React.useEffect(() => {
        setIsOn(!!data.isOn);
    }, [data.isOn]);

    const toggleSwitch = () => {
        const newState = !isOn;
        setIsOn(newState);
        data.onChange && data.onChange({ isOn: newState }); // Callback to update simulation state
    };

    return (
        <div className={nodeStyles}>
            <Handle type="target" position={Position.Left} id="in" />
            <div
                className={`cursor-pointer w-10 h-6 rounded-full flex items-center p-1 transition-colors ${isOn ? 'bg-green-500' : 'bg-gray-300'}`}
                onClick={toggleSwitch}
            >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${isOn ? 'translate-x-4' : ''}`}></div>
            </div>
            <div className="text-xs mt-1">Switch</div>
            <Handle type="source" position={Position.Right} id="out" />
        </div>
    );
});

// Resistor Node
export const ResistorNode = memo(({ data }) => {
    const [resistance, setResistance] = React.useState(data.resistance !== undefined ? data.resistance : 350);

    const handleChange = (e) => {
        const val = parseInt(e.target.value, 10);
        // Allow empty string to temporarily show nothing while typing, but default to 0
        const finalVal = isNaN(val) ? 0 : val;
        setResistance(finalVal);
        data.onChange && data.onChange({ resistance: finalVal });
    };

    return (
        <div className={nodeStyles}>
            <Handle type="target" position={Position.Left} id="in" />
            <div className="text-xl font-bold tracking-widest text-orange-600">〰️</div>
            <input
                type="number"
                value={resistance}
                onChange={handleChange}
                className="nodrag w-16 text-center text-xs mt-1 border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-slate-900 bg-white"
                title="Resistance in Ohms"
            />
            <div className="text-[10px] text-gray-500 font-bold uppercase">Ohms Ω</div>
            <Handle type="source" position={Position.Right} id="out" />
        </div>
    );
});

// Diode Node (simple polarity enforcement)
export const DiodeNode = memo(({ data }) => {
    const forwardDrop = data.forwardDrop !== undefined ? data.forwardDrop : 0.7;

    return (
        <div className={`${nodeStyles} border-slate-500`}>
            <Handle type="target" position={Position.Left} id="in" />
            <div className="text-xl font-bold text-slate-700">⟶|</div>
            <div className="text-xs font-bold mt-1 text-slate-800">{data.label || 'Diode'}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">{forwardDrop}V drop</div>
            <Handle type="source" position={Position.Right} id="out" />
        </div>
    );
});

// Capacitor Node (DC open-circuit in simulator)
export const CapacitorNode = memo(({ data }) => {
    return (
        <div className={`${nodeStyles} border-cyan-500`}>
            <Handle type="target" position={Position.Left} id="in" />
            <div className="text-xl font-bold text-cyan-700">|‖|</div>
            <div className="text-xs font-bold mt-1 text-slate-800">{data.label || 'Capacitor'}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">DC block</div>
            <Handle type="source" position={Position.Right} id="out" />
        </div>
    );
});

// Inductor Node (DC short-circuit-ish)
export const InductorNode = memo(({ data }) => {
    return (
        <div className={`${nodeStyles} border-purple-500`}>
            <Handle type="target" position={Position.Left} id="in" />
            <div className="text-xl font-bold text-purple-700">∿∿∿</div>
            <div className="text-xs font-bold mt-1 text-slate-800">{data.label || 'Inductor'}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">DC short</div>
            <Handle type="source" position={Position.Right} id="out" />
        </div>
    );
});

// Logic Gate Template
const GateNode = ({ label, symbol }) => (
    <div className={`${nodeStyles} rounded-lg`}>
        <Handle type="target" position={Position.Left} id="a" style={{ top: '30%' }} />
        <Handle type="target" position={Position.Left} id="b" style={{ top: '70%' }} />
        <div className="text-lg font-bold">{symbol}</div>
        <div className="text-[10px] uppercase font-bold">{label}</div>
        <Handle type="source" position={Position.Right} id="out" />
    </div>
);

export const AndGateNode = memo(() => <GateNode label="AND" symbol="&" />);
export const OrGateNode = memo(() => <GateNode label="OR" symbol="≥1" />);
export const NotGateNode = memo(() => (
    <div className={`${nodeStyles} rounded-lg`}>
        <Handle type="target" position={Position.Left} id="in" />
        <div className="text-lg font-bold">!</div>
        <div className="text-[10px] uppercase font-bold">NOT</div>
        <Handle type="source" position={Position.Right} id="out" />
    </div>
));
