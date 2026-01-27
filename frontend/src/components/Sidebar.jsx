import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, LogOut } from 'lucide-react';

const Sidebar = ({ userName }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="w-80 bg-indigo-950 text-white flex flex-col p-6 shadow-2xl fixed h-full z-20">
      <h1 className="text-xl font-black mb-10 tracking-tighter text-indigo-200 ">
        Finance Dashboard
      </h1>

      {/* User Profile Section */}
      <div className="mb-10 flex items-center space-x-4 p-4 bg-indigo-900/40 rounded-[24px] border border-indigo-800/50">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg text-lg">
          {userName ? userName[0].toUpperCase() : 'U'}
        </div>
        <div className="overflow-hidden">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
            Welcome
          </p>
          <p className="text-base font-black text-white truncate uppercase">
            {userName || 'Guest'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-4">
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex items-center space-x-3 w-full p-4 rounded-2xl transition-all shadow-md ${
            location.pathname === '/dashboard'
              ? 'bg-white text-indigo-700 font-bold'
              : 'bg-black/20 text-black font-bold hover:bg-black/40'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="uppercase tracking-tight">Overview</span>
        </button>
        <button
          onClick={() => navigate('/transactions')}
          className={`flex items-center space-x-3 w-full p-4 rounded-2xl transition-all shadow-md ${
            location.pathname === '/transactions'
              ? 'bg-white text-indigo-700 font-bold'
              : 'bg-black/20 text-black font-bold hover:bg-black/40'
          }`}
        >
          <ReceiptText size={20} />
          <span className="uppercase tracking-tight">Transactions</span>
        </button>
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center space-x-3 p-4 text-red-600 font-bold hover:bg-red-600/10 rounded-2xl mt-auto transition-all active:scale-95"
      >
        <LogOut size={20} />
        <span className="uppercase tracking-tight">Sign Out</span>
      </button>
    </aside>
  );
};

export default Sidebar;
