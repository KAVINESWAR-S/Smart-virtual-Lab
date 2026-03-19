import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FaTimes, FaUser, FaLock, FaCheckCircle, FaClock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { api, authHeaders } from '../../api/client';
import toast from 'react-hot-toast';

const UserProfileModal = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRequestingReset, setIsRequestingReset] = useState(false);
    const [requestStatus, setRequestStatus] = useState('none');

    useEffect(() => {
        if (isOpen && user?.role === 'student') {
            if (activeTab === 'marks') fetchSubmissions();
            if (activeTab === 'security') fetchRequestStatus();
        }
    }, [isOpen, activeTab, user]);

    const fetchRequestStatus = async () => {
        try {
            const config = { headers: authHeaders(user.token) };
            const { data } = await api.get('/api/auth/password-request/status', config);
            setRequestStatus(data.status);
            if (data.status === 'pending') setIsRequestingReset(true);
            else setIsRequestingReset(false);
        } catch (error) {
            console.error('Error fetching request status', error);
        }
    };

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const config = { headers: authHeaders(user.token) };
            const { data } = await api.get('/api/submissions/my', config);
            setSubmissions(data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error('New passwords do not match');
        }
        try {
            const config = {
                headers: { 'Content-Type': 'application/json', ...authHeaders(user.token) },
            };
            await api.post('/api/auth/change-password', { currentPassword, newPassword }, config);
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setRequestStatus('none');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        }
    };

    const handleRequestReset = async () => {
        setIsRequestingReset(true);
        setRequestStatus('pending');
        try {
            const config = { headers: authHeaders(user.token) };
            await api.post('/api/auth/password-request', {}, config);
            toast.success('Password reset request sent to Administrator!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
            setIsRequestingReset(false);
            setRequestStatus('none');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700"
            >
                <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/30">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FaUser className="text-blue-400" /> My Profile
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="flex border-b border-slate-700/50">
                    <button
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'details' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800/30'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                    {user?.role === 'student' && (
                        <button
                            className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'marks' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800/30'}`}
                            onClick={() => setActiveTab('marks')}
                        >
                            Recent Marks
                        </button>
                    )}
                    <button
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'security' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800/30'}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Security
                    </button>
                </div>

                <div className="p-6 h-[400px] overflow-y-auto">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-white">{user?.name}</h3>
                                    <p className="text-emerald-400 font-medium uppercase tracking-wider text-sm">{user?.role}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Email</p>
                                    <p className="text-white font-medium">{user?.email}</p>
                                </div>
                                {user?.department && (
                                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Department</p>
                                        <p className="text-white font-medium">{user?.department}</p>
                                    </div>
                                )}
                                {user?.year && (
                                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Year</p>
                                        <p className="text-white font-medium">{user?.year}</p>
                                    </div>
                                )}
                            </div>
                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        onClose();
                                        logout();
                                    }}
                                    className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/20 font-bold transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'marks' && user?.role === 'student' && (
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Recent Test Marks</h3>
                            {loading ? (
                                <p className="text-slate-400 text-center py-8">Loading marks...</p>
                            ) : submissions.length === 0 ? (
                                <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
                                    <FaClock size={40} className="mx-auto text-slate-600 mb-3" />
                                    <p className="text-slate-400">No recent submissions found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {submissions.map(sub => (
                                        <div key={sub._id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${sub.grade ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {sub.grade ? <FaCheckCircle /> : <FaClock />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white">{sub.experimentTitle}</h4>
                                                    <p className="text-xs text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {sub.grade !== null ? (
                                                    <div className="text-xl font-bold text-green-400">{sub.grade}<span className="text-sm text-slate-500">/10</span></div>
                                                ) : (
                                                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider px-2 py-1 bg-yellow-500/10 rounded-md border border-yellow-500/20">Pending</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-md mx-auto py-4">
                            {user?.role === 'student' && requestStatus !== 'approved' ? (
                                <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                                    <FaLock className="mx-auto text-blue-400 mb-4" size={40} />
                                    <h3 className="text-xl font-bold text-white mb-2">Password Management</h3>
                                    <p className="text-slate-400 leading-relaxed mb-6">
                                        For security reasons, students cannot modify their passwords directly. Please securely request a password reset from your Administrator.
                                    </p>
                                    <button
                                        onClick={handleRequestReset}
                                        disabled={requestStatus === 'pending'}
                                        className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                                            requestStatus === 'pending'
                                                ? 'bg-slate-600 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/25 hover:scale-[1.02]'
                                        }`}
                                    >
                                        {requestStatus === 'pending' ? 'Request Pending...' : 'Request Password Reset'}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handlePasswordChange} className="space-y-5">
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <FaLock className="text-blue-400" /> Change Password
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            className="glass-input w-full"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            className="glass-input w-full"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="glass-input w-full"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full btn-primary py-3"
                                    >
                                        Update Password
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default UserProfileModal;
