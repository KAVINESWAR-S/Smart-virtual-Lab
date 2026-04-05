import React, { useState, useEffect, useRef } from 'react';
import Simulator from "./Simulator/Simulator";
import { useAuth } from "../../context/AuthContext";
import toast from 'react-hot-toast';
import { api, authHeaders } from '../../api/client';

const Simulation = ({ experiment }) => {
    const { user } = useAuth();
    const [submission, setSubmission] = useState(null);
    const simulatorRef = useRef(null);

    useEffect(() => {
        if (user && user.role === 'student' && experiment) {
            checkSubmission();
        }
    }, [user, experiment]);

    const checkSubmission = async () => {
        try {
            const config = {
                headers: authHeaders(user.token),
            };
            // Ideally we search by experiment ID or title. 
            // For now, fetching all and filtering (inefficient but works for MVP)
            // Or better, add a query param to the API. 
            // Let's assume the backend 'my' submissions returns everything and we filter here.

            const { data } = await api.get('/api/submissions/my', config);
            const existing = data.find(sub =>
                (sub.classroom?._id === experiment.id || sub.classroom === experiment.id) ||
                sub.experimentTitle === experiment.title
            );
            if (existing) {
                setSubmission(existing);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (circuitData) => {
        try {
            // Capture circuit screenshot before submitting
            let screenshot = null;
            if (simulatorRef.current?.getScreenshot) {
                screenshot = await simulatorRef.current.getScreenshot();
            }

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(user.token)
                },
            };

            const payload = {
                classroomId: experiment.id,
                experimentTitle: experiment.title,
                circuitData: { ...circuitData, screenshot }
            };

            const { data } = await api.post('/api/submissions', payload, config);
            setSubmission(data);
            toast.success('Submitted');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to submit');
        }
    };

    const [simulationStarted, setSimulationStarted] = useState(false);

    const handleStartSimulation = () => {
        setSimulationStarted(true);
    };

    return (
        <div className="glass-panel p-6 rounded-xl border border-slate-700/50 min-h-[600px]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Virtual Workbench</h2>
                {submission && (
                    <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg border border-green-500/30">
                        <span className="font-bold">Status: Submitted</span>
                        {submission.grade !== null && (
                            <span className="ml-4 font-bold text-lg">Grade: {submission.grade}/10</span>
                        )}
                        {submission.feedback && (
                            <div className="text-sm mt-1 text-slate-300">Feedback: {submission.feedback}</div>
                        )}
                    </div>
                )}
            </div>

            <p className="text-slate-400 mb-4">
                Drag components from the palette, connect them, and run the simulation.
                (Note: Connect Battery to LED to test. Ensure Switches are toggled ON).
            </p>

            {submission ? (
                <div className="p-8 text-center bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold text-slate-200 mb-2">Experiment Completed</h3>
                    <p className="text-slate-400">You have already submitted this experiment.</p>
                    {/* Optionally we could load the read-only view of the circuit here */}
                </div>
            ) : !simulationStarted ? (
                <div className="text-center py-20 space-y-6 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="text-6xl text-cyan-400 mb-4">⚡</div>
                    <h3 className="text-2xl font-bold text-white">Start Simulation Session</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                        You have <span className="text-white font-bold">30 minutes</span> to complete this experiment simulation.
                        The timer will start immediately when you click the button below.
                    </p>
                    <button
                        onClick={handleStartSimulation}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transform hover:scale-105 transition-all"
                    >
                        Start Simulation
                    </button>
                </div>
            ) : (
                <Simulator
                    ref={simulatorRef}
                    onSubmit={user?.role === 'student' ? handleSubmit : null}
                    timeLimit={30 * 60} // 30 minutes
                />
            )}
        </div>
    );
};

export default Simulation;
