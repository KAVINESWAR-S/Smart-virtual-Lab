import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useParams, Link } from 'react-router-dom';
import Simulator from '../components/experiment/Simulator/Simulator';

const ShareCircuit = () => {
    const { shareId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [circuit, setCircuit] = useState(null);

    const initialCircuit = useMemo(() => {
        const data = circuit?.circuitData || {};
        return {
            nodes: data.nodes || [],
            edges: data.edges || [],
        };
    }, [circuit]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const { data } = await api.get(`/api/circuits/share/${shareId}`);
                setCircuit(data);
            } catch (e) {
                setError(e?.response?.data?.message || e.message || 'Failed to load shared circuit');
            } finally {
                setLoading(false);
            }
        };
        if (shareId) load();
    }, [shareId]);

    if (loading) return <div className="min-h-screen bg-slate-950 p-10 text-slate-200">Loading…</div>;
    if (error) return <div className="min-h-screen bg-slate-950 p-10 text-red-400">{error}</div>;
    if (!circuit) return <div className="min-h-screen bg-slate-950 p-10 text-slate-200">Not found</div>;

    return (
        <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center">
            <div className="w-full max-w-7xl mb-6 flex justify-between items-center gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-white">{circuit.title || 'Shared circuit'}</h1>
                    <p className="text-slate-400 text-sm">Read-only preview.</p>
                </div>
                <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 font-bold"
                >
                    Log in to save your own
                </Link>
            </div>

            <div className="w-full max-w-7xl flex-grow bg-slate-900/50 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 backdrop-blur-sm p-4">
                <Simulator
                    readOnly={true}
                    initialNodes={initialCircuit.nodes}
                    initialEdges={initialCircuit.edges}
                />
            </div>
        </div>
    );
};

export default ShareCircuit;

