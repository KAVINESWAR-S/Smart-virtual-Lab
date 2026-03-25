import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api, authHeaders } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { FaPlus, FaTimes, FaChalkboard, FaUsers, FaArrowRight, FaEdit, FaSave, FaClipboardList, FaUserPlus, FaUser, FaEnvelope, FaLock, FaBuilding, FaKey, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [submissions, setSubmissions] = useState([]); // New state for submissions
    const [experiments, setExperiments] = useState([]); // State for filter dropdown
    const [selectedExperiment, setSelectedExperiment] = useState(''); // Filter state
    const [activeTab, setActiveTab] = useState('students'); // 'students', 'teachers', 'marks', 'requests'
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Teacher State
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', department: '' });

    // Password Reset State
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState(null);
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [requestToResolve, setRequestToResolve] = useState(null);

    useEffect(() => {
        fetchUsers();
        if (activeTab === 'marks') {
            fetchSubmissions();
            fetchClassrooms();
        }
        if (activeTab === 'requests') {
            fetchRequests();
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

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const config = { headers: authHeaders(user.token) };
            const { data } = await api.get('/api/admin/password-requests', config);
            setPendingRequests(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };



    const createTeacher = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: authHeaders(user.token) };
            await api.post('/api/admin/users', { ...newTeacher, role: 'teacher' }, config);
            setNewTeacher({ name: '', email: '', password: '', department: '' });
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

    const handleApproveRequest = async (id) => {
        try {
            const config = { headers: authHeaders(user.token) };
            await api.put(`/api/admin/password-requests/${id}`, { status: 'approved' }, config);
            toast.success('Request approved! Student can now change their password.');
            fetchRequests();
        } catch (error) {
            toast.error('Error approving request');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: authHeaders(user.token) };
            await api.put(`/api/admin/users/${userToReset._id}/password`, { newPassword: newAdminPassword }, config);
            toast.success('Password reset successfully');
            setResetModalOpen(false);
            setUserToReset(null);
            setNewAdminPassword('');
        } catch (error) {
            console.error(error);
            toast.error('Error resetting password');
        }
    };

    const handleRejectRequest = async (id) => {
        try {
            const config = { headers: authHeaders(user.token) };
            await api.put(`/api/admin/password-requests/${id}`, { status: 'rejected' }, config);
            toast.success('Request rejected');
            fetchRequests();
        } catch (error) {
            toast.error('Error rejecting request');
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
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded font-bold flex items-center gap-2 ${activeTab === 'requests' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <FaLock /> Password Requests
                    {pendingRequests.length > 0 && activeTab !== 'requests' && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                    )}
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

                    <form onSubmit={createTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
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

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Department</label>
                            <div className="relative">
                                <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    className="glass-input w-full pl-10 focus:ring-purple-500/50"
                                    placeholder="e.g. Computer Science"
                                    value={newTeacher.department}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end mt-4">
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
            {activeTab === 'marks' && (
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
                                        <td className="p-4 font-mono text-green-300">{sub.grade ? `${sub.grade}/10` : 'Not Graded'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* User List */}
            {(activeTab === 'students' || activeTab === 'teachers') && (
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
                                        <td className="p-4 flex justify-end gap-3 items-center min-h-[50px]">
                                            <button
                                                onClick={() => {
                                                    setUserToReset(u);
                                                    setNewAdminPassword('');
                                                    setResetModalOpen(true);
                                                }}
                                                className="text-blue-400 hover:text-blue-300 font-bold text-sm flex items-center gap-1"
                                                title="Force Reset Password"
                                            >
                                                <FaKey />
                                            </button>
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

            {/* Password Requests Tab */}
            {activeTab === 'requests' && (
                <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 border-b border-slate-700">
                            <tr>
                                <th className="p-4 text-slate-300 font-semibold">Student Name</th>
                                <th className="p-4 text-slate-300 font-semibold">Email</th>
                                <th className="p-4 text-slate-300 font-semibold text-center">Date Requested</th>
                                <th className="p-4 text-slate-300 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading requests...</td></tr>
                            ) : pendingRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-400">
                                        <FaCheckCircle className="mx-auto text-4xl mb-4 text-slate-600" />
                                        <p className="text-lg">No pending password requests. All clear!</p>
                                    </td>
                                </tr>
                            ) : (
                                pendingRequests.map(req => (
                                    <tr key={req._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                                        <td className="p-4 font-medium text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-xs shadow-md">
                                                {req.user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            {req.user?.name}
                                        </td>
                                        <td className="p-4 text-slate-300">{req.user?.email}</td>
                                        <td className="p-4 text-center text-slate-400 text-sm">
                                            {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="p-4 flex justify-end gap-2 items-center min-h-[50px]">
                                            <button
                                                onClick={() => handleApproveRequest(req._id)}
                                                className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 px-3 py-1.5 rounded-md font-bold text-sm flex items-center gap-1 transition-colors"
                                                title="Approve Request"
                                            >
                                                <FaCheckCircle /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req._id)}
                                                className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 px-3 py-1.5 rounded-md font-bold text-sm flex items-center gap-1 transition-colors"
                                                title="Reject Request"
                                            >
                                                <FaTimesCircle /> Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Password Reset Modal */}
            {resetModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-[200] p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 w-full max-w-md p-8 rounded-xl shadow-2xl border border-blue-500/30"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <FaKey className="text-blue-400" /> Reset Password
                        </h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Enter a new password for <strong className="text-white">{userToReset?.name}</strong>.
                        </p>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                                <input
                                    type="password"
                                    className="glass-input w-full focus:ring-blue-500/50"
                                    placeholder="••••••••"
                                    value={newAdminPassword}
                                    onChange={(e) => setNewAdminPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setResetModalOpen(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white font-medium"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary px-6 py-2 shadow-blue-500/25">
                                    Confirm Reset
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
