import React, { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Simulator from "../components/experiment/Simulator/Simulator";
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { api, authHeaders } from '../api/client';

const FreeSimulator = () => {
    const { user } = useAuth();
    const simulatorRef = useRef(null);
    const [title, setTitle] = useState('');
    const [myCircuits, setMyCircuits] = useState([]);
    const [selectedCircuitId, setSelectedCircuitId] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const authConfig = useMemo(() => ({
        headers: authHeaders(user?.token)
    }), [user?.token]);

    const loadMyCircuits = async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const { data } = await api.get('/api/circuits/my', authConfig);
            setMyCircuits(data);
            if (!selectedCircuitId && data?.[0]?._id) setSelectedCircuitId(data[0]._id);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.token) return;
        const circuit = simulatorRef.current?.getCircuit?.();
        if (!circuit) return;

        setLoading(true);
        setShareUrl('');
        try {
            const payload = {
                title: title?.trim() || 'Untitled circuit',
                circuitData: circuit,
            };
            const { data } = await api.post('/api/circuits', payload, {
                ...authConfig,
                headers: { ...authConfig.headers, 'Content-Type': 'application/json' },
            });
            setSelectedCircuitId(data._id);
            toast.success('Saved');
            await loadMyCircuits();
        } finally {
            setLoading(false);
        }
    };

    const handleLoadSelected = async () => {
        if (!user?.token || !selectedCircuitId) return;
        setLoading(true);
        setShareUrl('');
        try {
            const { data } = await api.get(`/api/circuits/${selectedCircuitId}`, authConfig);
            simulatorRef.current?.setCircuit?.(data?.circuitData);
            setTitle(data?.title || '');
            toast.success('Loaded');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!user?.token || !selectedCircuitId) return;
        setLoading(true);
        try {
            const { data } = await api.post(
                `/api/circuits/${selectedCircuitId}/share`,
                { enabled: true },
                { ...authConfig, headers: { ...authConfig.headers, 'Content-Type': 'application/json' } }
            );
            const url = `${window.location.origin}/share/circuit/${data.shareId}`;
            setShareUrl(url);
            await navigator.clipboard.writeText(url);
            toast.success('Share link copied');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center">
            <div className="w-full max-w-7xl mb-6 flex justify-between items-center gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <Link to="/student-dashboard" className="text-slate-400 hover:text-white transition-colors">
                        <FaArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                            Circuit Simulator Playground
                        </h1>
                        <p className="text-slate-400 text-sm">Build, save, load, and share circuits.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-end">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Circuit title"
                        className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 min-w-[220px]"
                    />

                    <button
                        onClick={loadMyCircuits}
                        disabled={loading}
                        className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 disabled:opacity-60"
                    >
                        {loading ? '…' : 'Refresh'}
                    </button>

                    <select
                        value={selectedCircuitId}
                        onChange={(e) => setSelectedCircuitId(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 min-w-[260px]"
                    >
                        <option value="">Select saved circuit…</option>
                        {myCircuits.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.title || 'Untitled'} ({new Date(c.updatedAt).toLocaleString()})
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white border border-blue-500 hover:bg-blue-500 font-bold disabled:opacity-60"
                    >
                        Save
                    </button>

                    <button
                        onClick={handleLoadSelected}
                        disabled={loading || !selectedCircuitId}
                        className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 font-bold disabled:opacity-60"
                    >
                        Load
                    </button>

                    <button
                        onClick={handleShare}
                        disabled={loading || !selectedCircuitId}
                        className="px-4 py-2 rounded-lg bg-cyan-600 text-white border border-cyan-500 hover:bg-cyan-500 font-bold disabled:opacity-60"
                    >
                        Share
                    </button>
                </div>
            </div>

            {shareUrl && (
                <div className="w-full max-w-7xl mb-4 px-4 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 flex items-center justify-between gap-3">
                    <div className="text-sm break-all">
                        Shared link (copied): <span className="font-mono">{shareUrl}</span>
                    </div>
                    <a
                        className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 hover:border-cyan-500 text-sm"
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Open
                    </a>
                </div>
            )}

            <div className="w-full max-w-7xl flex-grow bg-slate-900/50 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 backdrop-blur-sm p-4">
                <Simulator ref={simulatorRef} readOnly={false} />
            </div>
        </div>
    );
};

export default FreeSimulator;
