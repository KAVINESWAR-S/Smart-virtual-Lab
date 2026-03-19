import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        year: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const { name, email, password, confirmPassword, department, year } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        try {
            await register(name, email, password, 'student', department, year);
            navigate('/student-dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed'); // Assuming err is an object or string
            console.error('Registration Error:', err);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
                {error && <p className="text-red-500 mb-4 text-sm bg-red-900/50 p-2 rounded">{error}</p>}
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                            value={name}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Year</label>
                        <input
                            type="text"
                            name="year"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                            value={year}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Department</label>
                        <input
                            type="text"
                            name="department"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                            value={department}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                            value={password}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                            value={confirmPassword}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                    >
                        Register
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
