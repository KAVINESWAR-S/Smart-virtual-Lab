import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api, authHeaders } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { FaPlus, FaTimes, FaChalkboard, FaUsers, FaArrowRight, FaEdit, FaSave, FaClipboardList, FaUserPlus, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [submissions, setSubmissions] = useState([]); // New state for submissions
    const [experiments, setExperiments] = useState([]); // State for filter dropdown
    const [selectedExperiment, setSelectedExperiment] = useState(''); // Filter state
    const [activeTab, setActiveTab] = useState('students'); // 'students', 'teachers', 'marks'
    const [loading, setLoading] = useState(true);

    // Create Teacher State
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        fetchUsers();
        if (activeTab === 'marks') {
            fetchSubmissions();
            fetchClassrooms();
        }
    }, [activeTab, selectedExperiment]); // Fetch when tab or filter changes

    const fetchUsers = async () => {
        // ... (existing fetchUsers)
        try {
            const config = { headers: authHeaders(user.token) };
            const { data } = await api.get('/api/admin/users', config);
            setUsers(data);
            if (activeTab !== 'marks') setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const config = { headers: authHeaders(user.token) };
            const query = selectedExperiment ? `?experimentTitle=${encodeURIComponent(selectedExperiment)}` : '';
            const { data } = await api.get(`/api/submissions${query}`, config);
            setSubmissions(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchClassrooms = async () => {
        try {
            const config = { headers: authHeaders(user.token) };
            const { data } = await api.get('/api/classrooms', config);
            // Deduplicate experiment names just in case, though classrooms should have unique names usually
            const uniqueExperiments = [...new Set(data.map(c => c.name))];
            setExperiments(uniqueExperiments);
        } catch (error) {
            console.error(error);
        }
    };


    const createTeacher = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: authHeaders(user.token) };
            await api.post('/api/admin/users', { ...newTeacher, role: 'teacher' }, config);
            setNewTeacher({ name: '', email: '', password: '' });
            fetchUsers();
            toast.success('Teacher created');
        } catch (error) {
            console.error(error);
            toast.error('Error creating teacher');
        }
    };

    const deleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const config = { headers: authHeaders(user.token) };
                await api.delete(`/api/admin/users/${id}`, config);
                fetchUsers();
            } catch (error) {
                console.error(error);
                toast.error('Error deleting user');
            }
        }
    };


    const filteredUsers = users.filter(u => activeTab === 'students' ? u.role === 'student' : u.role === 'teacher');

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    Admin Dashboard
                </h1>
                <p className="text-slate-400">Manage users and system settings</p>
            </div>

            <div className="flex gap-4 mb-6 border-b border-gray-700 pb-4">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`px-4 py-2 rounded ${activeTab === 'students' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    Manage Students
                </button>
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`px-4 py-2 rounded ${activeTab === 'teachers' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    Manage Teachers
                </button>
                <button
                    onClick={() => setActiveTab('marks')}
                    className={`px-4 py-2 rounded ${activeTab === 'marks' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    Student Marks
                </button>
            </div>

            {/* Create Teacher Form (Only visible in Teachers tab) */}
            {activeTab === 'teachers' && (
                // ... (existing teacher form)
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 mb-8 border border-purple-500/30 relative overflow-hidden"
                >
                    {/* ... content ... */}
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <FaChalkboard size={100} />
                    </div>

                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                            <FaUserPlus />
                        </div>
                        Onboard New Instructor
                    </h2>

                    <form onSubmit={createTeacher} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                            <div className="relative">
                                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    className="glass-input w-full pl-10 focus:ring-purple-500/50"
                                    placeholder="Prof. John Doe"
                                    value={newTeacher.name}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    className="glass-input w-full pl-10 focus:ring-purple-500/50"
                                    placeholder="instructor@university.edu"
                                    value={newTeacher.email}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Temporary Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    className="glass-input w-full pl-10 focus:ring-purple-500/50"
                                    placeholder="••••••••"
                                    value={newTeacher.password}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="md:col-span-3 flex justify-end mt-4">
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-purple-900/20 transition-all transform hover:scale-[1.02] flex items-center gap-2"
                            >
                                <FaUserPlus />
                                Create Faculty Account
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Marks Table */}
            {activeTab === 'marks' ? (
                <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-4 bg-gray-700/50 border-b border-gray-600 flex justify-end">
                        <select
                            className="bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                            value={selectedExperiment}
                            onChange={(e) => setSelectedExperiment(e.target.value)}
                        >
                            <option value="">All Experiments</option>
                            {experiments.map((exp, index) => (
                                <option key={index} value={exp}>{exp}</option>
                            ))}
                        </select>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-700 text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Experiment</th>
                                <th className="p-4">Quiz Score</th>
                                <th className="p-4">Auto Sim Score</th>
                                <th className="p-4">Manual Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-4 text-center">Loading marks...</td></tr>
                            ) : submissions.length === 0 ? (
                                <tr><td colSpan="5" className="p-4 text-center text-gray-400">No marks recorded yet.</td></tr>
                            ) : (
                                submissions.map(sub => (
                                    <tr key={sub._id} className="hover:bg-gray-700/50 transition">
                                        <td className="p-4 font-medium text-white">{sub.student?.name || 'Unknown'}</td>
                                        <td className="p-4 text-blue-300">{sub.experimentTitle}</td>
                                        <td className="p-4 font-mono text-purple-300">{sub.quizScore != null ? sub.quizScore : 'N/A'}</td>
                                        <td className="p-4 font-mono text-emerald-300">{sub.simulationScore != null ? `${sub.simulationScore}/10` : 'N/A'}</td>
                                        <td className="p-4 font-mono text-green-300">{sub.grade ? `${sub.grade}/10` : 'Not Graded'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* User List */
                <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700 text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="4" className="p-4 text-center">Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="4" className="p-4 text-center text-gray-400">No users found.</td></tr>
                            ) : (
                                filteredUsers.map(u => (
                                    <tr key={u._id} className="hover:bg-gray-700/50 transition">
                                        <td className="p-4">{u.name}</td>
                                        <td className="p-4">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'teacher' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => deleteUser(u._id)}
                                                className="text-red-400 hover:text-red-300 font-bold text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
