// 앱 공용 레이아웃. 데스크톱은 고정 사이드바, 모바일은 햄버거 + 오프캔버스 드로어.
// 본문 여백/최대폭과 AI 챗봇도 여기서 한 번만 렌더해 페이지 중복을 없앤다.
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import AIChatBox from './AIChatBot';

const Layout = ({ userName, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Desktop sidebar (lg+, fixed) */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 z-30 shadow-xl">
        <Sidebar userName={userName} />
      </aside>

      {/* Mobile drawer + overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          sidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-indigo-950/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[80%] shadow-2xl transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-5 right-4 z-10 p-1 text-indigo-300 hover:text-white"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
          <Sidebar userName={userName} onNavigate={() => setSidebarOpen(false)} />
        </aside>
      </div>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 h-14 px-4 bg-white/90 backdrop-blur border-b border-gray-100">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-gray-700 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="font-bold tracking-tight text-indigo-950">
          Finance Dashboard
        </span>
      </header>

      <main className="lg:ml-72 px-4 sm:px-6 lg:px-12 py-6 lg:py-12">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      <AIChatBox />
    </div>
  );
};

export default Layout;
