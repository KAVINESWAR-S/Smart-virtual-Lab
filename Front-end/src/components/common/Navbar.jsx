import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserProfileModal from '../profile/UserProfileModal';
import { FaUserCircle } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Hide navbar on login/register pages AND experiment pages (which have their own sidebar/layout)
    if (['/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/experiment/')) return null;

    if (!user) return null;

    return (
        <nav className="glass-panel sticky top-4 z-50 mx-6 mb-8 px-6 py-4 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                ⚡ Smart Virtual Lab
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
                {user.role === 'student' && (
                    <Link to="/student-dashboard" className={`nav-link ${location.pathname === '/student-dashboard' ? 'bg-slate-800 text-white' : ''}`}>
                        Dashboard
                    </Link>
                )}
                {user.role === 'teacher' && (
                    <Link to="/teacher-dashboard" className={`nav-link ${location.pathname === '/teacher-dashboard' ? 'bg-slate-800 text-white' : ''}`}>
                        Dashboard
                    </Link>
                )}
                {user.role === 'admin' && (
                    <Link to="/admin-dashboard" className={`nav-link ${location.pathname === '/admin-dashboard' ? 'bg-slate-800 text-white' : ''}`}>
                        Dashboard
                    </Link>
                )}

                {/* User Profile & Logout */}
                <div className="flex items-center gap-4 border-l border-slate-700 pl-6 ml-2">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-semibold text-white">{user.name}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">{user.role}</div>
                    </div>

                    <FaUserCircle 
                        size={32} 
                        className="text-blue-400 cursor-pointer hover:text-blue-300 transition-colors drop-shadow-sm"
                        onClick={() => setIsProfileOpen(true)}
                        title="View Profile"
                    />

                    <button
                        onClick={logout}
                        className="btn-danger text-sm py-1.5 px-3 ml-2"
                    >
                        Logout
                    </button>
                </div>
            </div>
            
            <UserProfileModal 
                isOpen={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)} 
            />
        </nav>
    );
};

export default Navbar;
