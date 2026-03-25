import React from 'react';

const ComponentPalette = () => {
    const onDragStart = (event, nodeType, label) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    const components = [
        { type: 'battery', label: 'Battery (9V)', icon: '🔋' },
        { type: 'led', label: 'LED (2V)', icon: '💡' },
        { type: 'led', label: 'LED (5V)', icon: '💡' },
        { type: 'switch', label: 'Switch', icon: '🔌' },
        { type: 'resistor', label: 'Resistor', icon: '〰️' },
        { type: 'diode', label: 'Diode', icon: '⟶|' },
        { type: 'capacitor', label: 'Capacitor', icon: '|‖|' },
        { type: 'inductor', label: 'Inductor', icon: '∿' },
        { type: 'ammeter', label: 'Ammeter', icon: 'Ⓐ' },
        { type: 'voltmeter', label: 'Voltmeter', icon: 'Ⓥ' },
        { type: 'rheostat', label: 'Rheostat', icon: '⦚' },
        { type: 'andGate', label: 'AND Gate', icon: 'AND' },
        { type: 'orGate', label: 'OR Gate', icon: 'OR' },
        { type: 'notGate', label: 'NOT Gate', icon: 'NOT' },
    ];

    return (
        <div className="w-48 bg-slate-900 border-r border-slate-700/50 p-4 flex flex-col gap-3 h-full overflow-y-auto">
            <h3 className="font-bold text-slate-400 mb-2 text-xs uppercase tracking-wider">Components</h3>
            <p className="text-xs text-slate-500 mb-4">Drag and drop to canvas</p>

            {components.map((comp) => (
                <div
                    key={comp.label}
                    className="bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-700 cursor-move hover:shadow-lg hover:shadow-blue-900/20 hover:border-blue-500/50 hover:bg-slate-750 transition-all flex items-center gap-3 group"
                    onDragStart={(event) => onDragStart(event, comp.type, comp.label)}
                    draggable
                >
                    <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity">{comp.icon}</span>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{comp.label}</span>
                </div>
            ))}
        </div>
    );
};

export default ComponentPalette;
