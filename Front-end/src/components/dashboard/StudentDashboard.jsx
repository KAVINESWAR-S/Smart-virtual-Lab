import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api, authHeaders } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFlask, FaChalkboardTeacher, FaCheckCircle, FaClock } from 'react-icons/fa';
//import simulator from '../simulator/Simulator';
// import Simulation from "../experiment/Simulator/Simulator";

const StudentDashboard = () => {
    const { user } = useAuth();
    const [classrooms, setClassrooms] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const [mySubmissions, setMySubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const config = { headers: authHeaders(user.token) };
            const classroomRes = await api.get('/api/classrooms', config);
            const submissionRes = await api.get('/api/submissions/my', config);

            setClassrooms(classroomRes.data);
            setMySubmissions(submissionRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const joinClassroom = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(user.token)
                },
            };
            await api.post('/api/classrooms/join', { code: joinCode }, config);
            setJoinCode('');
            fetchData(); // Refresh list
            toast.success('Joined classroom');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error joining classroom');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen p-6 pt-24 text-white">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-end mb-12"
                >
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">
                            Student Console
                        </h1>
                        <p className="text-slate-400 text-lg">Managing experiments for {user.name}</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Join & Actions */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div className="glass-panel p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <FaChalkboardTeacher className="text-blue-400" /> Join Classroom
                            </h2>
                            <form onSubmit={joinClassroom} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 block">Class Code</label>
                                    <input
                                        type="text"
                                        placeholder="EX: X7Y2Z9"
                                        className="glass-input w-full font-mono text-center text-lg tracking-widest uppercase"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn-primary w-full py-3">
                                    Join Class
                                </button>
                            </form>
                        </div>

                        {/* Quick Stats or Info could go here */}
                        <div className="glass-panel p-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
                            <h3 className="font-bold text-lg mb-2 text-blue-200">Ready to Experiment?</h3>
                            <p className="text-slate-400 text-sm mb-4">
                                Launch the simulator directly to practice building circuits without a specific assignment.
                            </p>
                            <Link
                                to="/experiment/simulator/simulation"
                                className="block w-full py-3 text-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
                            >
                                Open Simulator Studio
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right Col: Classrooms & Submissions */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Active Classrooms */}
                        <motion.section
                            variants={containerVariants}
                            animate="visible"
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-slate-700 pb-2">
                                <FaFlask className="text-cyan-400" /> Active Experiments
                            </h2>

                            {loading ? (
                                <div className="text-center p-8 text-slate-400">Loading experiments...</div>
                            ) : classrooms.filter(room => !mySubmissions.some(sub =>
                                (sub.classroom?._id === room._id || sub.classroom === room._id) ||
                                sub.experimentTitle === room.name
                            )).length === 0 ? (
                                <motion.div
                                    variants={itemVariants}
                                    className="glass-panel p-8 text-center text-slate-300 italic border border-slate-700/50"
                                >
                                    No active experiments available. You have completed all assigned tasks!
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {classrooms.filter(room => !mySubmissions.some(sub =>
                                        (sub.classroom?._id === room._id || sub.classroom === room._id) ||
                                        sub.experimentTitle === room.name
                                    )).map(room => (
                                        <motion.div
                                            key={room._id}
                                            variants={itemVariants}
                                            className="glass-panel p-5 hover:border-blue-500/50 transition-colors group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <FaFlask size={60} />
                                            </div>
                                            <h3 className="font-bold text-xl mb-1 text-white group-hover:text-blue-300 transition-colors">{room.name}</h3>
                                            <p className="text-slate-400 text-sm mb-4">Code: <span className="font-mono text-slate-300">{room.code}</span></p>
                                            {(room.dueAt || room.attemptLimit) && (
                                                <div className="text-xs text-slate-400 mb-4 space-y-1">
                                                    {room.dueAt && <div>Due: <span className="text-slate-200">{new Date(room.dueAt).toLocaleString()}</span></div>}
                                                    {room.attemptLimit && <div>Attempts: <span className="text-slate-200">{room.attemptLimit}</span></div>}
                                                </div>
                                            )}

                                            <Link
                                                to={`/experiment/${room._id}`}
                                                className="inline-block w-full text-center py-2 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white transition-all border border-blue-500/30"
                                            >
                                                Start Experiment &rarr;
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.section>

                        {/* Recent Activity / Submissions */}
                        <motion.section
                            variants={containerVariants}
                            animate="visible"
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-slate-700 pb-2">
                                <FaCheckCircle className="text-green-400" /> Recent Submissions
                            </h2>

                            <div className="space-y-3">
                                {loading ? (
                                    <div className="text-center p-4 text-slate-400">Loading submissions...</div>
                                ) : mySubmissions.length === 0 ? (
                                    <motion.div variants={itemVariants} className="glass-panel p-6 text-center text-slate-300 italic">
                                        No experiments submitted yet.
                                    </motion.div>
                                ) : (
                                    mySubmissions.map(sub => (
                                        <motion.div
                                            key={sub._id}
                                            variants={itemVariants}
                                            className="glass-panel p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-full ${sub.grade ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {sub.grade ? <FaCheckCircle /> : <FaClock />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white">{sub.experimentTitle}</h3>
                                                    <p className="text-xs text-slate-400">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                {sub.grade !== null ? (
                                                    <div className="text-2xl font-bold text-green-400">{sub.grade}<span className="text-sm text-slate-500">/10</span></div>
                                                ) : (
                                                    <div className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold border border-yellow-500/20">
                                                        PENDING
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
