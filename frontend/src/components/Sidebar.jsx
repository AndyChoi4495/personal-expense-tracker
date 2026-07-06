// 사이드바 패널 내용. 위치/드로어 동작은 Layout이 담당하고, 여기서는 패널 UI만 그린다.
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ReceiptText } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ReceiptText },
];

const Sidebar = ({ userName, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (to) => {
    navigate(to);
    onNavigate?.(); // 모바일 드로어에서는 이동 후 닫는다
  };

  return (
    <div className="flex h-full flex-col bg-indigo-950 text-white p-6">
      <h1 className="text-lg font-bold tracking-tight text-indigo-200 mb-10">
        Finance Dashboard
      </h1>

      {/* User Profile */}
      <div className="mb-10 flex items-center gap-4 p-4 bg-indigo-900/40 rounded-2xl border border-indigo-800/50">
        <div className="w-11 h-11 shrink-0 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
          {userName ? userName[0].toUpperCase() : 'U'}
        </div>
        <div className="overflow-hidden">
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
            Welcome
          </p>
          <p className="text-base font-semibold text-white truncate">
            {userName || 'Guest'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <button
              key={to}
              onClick={() => go(to)}
              className={`flex items-center gap-3 w-full p-3.5 rounded-xl font-semibold transition-colors ${
                active
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-200 hover:bg-indigo-900/60 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
