import { useState } from 'react';
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';
import UserProfileModal from './profile/UserProfileModal';

const Header = () => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center z-50 relative">

        {/* Student/Teacher Info */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {user?.name || "User"}
          </h1>
          <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-bold">
            {user?.department || (user?.role === 'teacher' ? 'Faculty' : 'Student')}
          </p>
        </div>

        {/* Profile & Logout */}
        <div className="flex items-center gap-4">

          <FaUserCircle 
            size={36} 
            className="text-blue-600 cursor-pointer hover:text-blue-800 transition-colors drop-shadow-sm"
            onClick={() => setIsProfileOpen(true)}
            title="View Profile"
          />

          <button 
            onClick={logout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 text-white px-4 py-2 rounded-lg font-bold transition-all"
          >
            <FaSignOutAlt />
            Logout
          </button>

        </div>

      </div>

      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
};

export default Header;
