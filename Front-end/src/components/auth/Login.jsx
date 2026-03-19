import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../api/client';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await login(email, password);
            if (data.role === 'teacher') {
                navigate('/teacher-dashboard');
            } else if (data.role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            setError(err);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-panel w-full max-w-md p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-slate-400">
                        Access your virtual laboratory
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2"
                    >
                        <span>⚠️</span> {error}
                    </motion.div>
                )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            className="glass-input w-full"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <input
                            type="password"
                            className="glass-input w-full"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                        <button
                            type="submit"
                            className="btn-primary w-full py-3 text-lg shadow-blue-500/25"
                        >
                            Sign In
                        </button>
                        <div className="text-center mt-4">
                            <p className="text-slate-500 text-sm">
                                Forgot Password? <span className="text-blue-400">Contact your Administrator.</span>
                            </p>
                        </div>
                    </form>

                <div className="mt-8 text-center text-slate-400 text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
                        Create Account
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
