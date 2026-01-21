import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { LayoutDashboard, Wallet, ReceiptText, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'brightness(1.1) drop-shadow(0px 0px 8px rgba(0,0,0,0.2))' }}
      />
    </g>
  );
};

const Dashboard = () => {
  const [data, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [activeIndex, setActiveIndex] = useState(-1); 
  const navigate = useNavigate();
  const location = useLocation();

  const handlePrevMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const resetToToday = () => setViewDate(new Date());

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const month = viewDate.getMonth() + 1;
        const year = viewDate.getFullYear();

        // 백엔드 API에 월과 연도 쿼리 스트링 추가
        const [statsRes, transRes] = await Promise.all([
          api.get(`/transactions/stats/summary?month=${month}&year=${year}`),
          api.get(`/transactions/?month=${month}&year=${year}`) 
        ]);

        setStats(statsRes.data);
        setTransactions(transRes.data.data || []); 
      } catch (err) {
        console.error("Failed to fetch data", err);
        if (err.response?.status === 401) navigate('/login');
      }
    };
    fetchAllData();
  }, [navigate, viewDate]);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const COLORS = ['#4f46e5', '#1fcf6eff', '#db2777', '#e11d48', '#d97706', '#137dbbff'];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      
      {/* Sidebar Navigation - 최종 확정 스타일 */}
      <aside className="w-75 bg-indigo-950 text-white flex flex-col p-6 shadow-2xl fixed h-full z-20">
        <h1 className="text-xl font-black mb-10 tracking-tighter text-indigo-200 ">Finance Dashboard</h1>
        <nav className="flex-1 space-y-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`flex items-center space-x-3 w-full p-4 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 ${
              location.pathname === '/dashboard' ? 'bg-white text-indigo-700 font-bold' : 'bg-white text-black font-bold'
            }`}
          >
            <LayoutDashboard size={20} className={location.pathname === '/dashboard' ? 'text-indigo-700' : 'text-black'} />
            <span className="font-bold">Overview</span>
          </button>
          <button
            onClick={() => navigate('/transactions')} 
            className={`flex items-center space-x-3 w-full p-4 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 ${
              location.pathname === '/transactions' ? 'bg-white text-indigo-700 font-bold' : 'bg-white text-black font-bold'
            }`}
          >
            <ReceiptText size={20} className={location.pathname === '/transactions' ? 'text-indigo-700' : 'text-black'} />
            <span className="font-bold">Transactions</span>
          </button>
        </nav>
        <button onClick={handleLogout} className="flex items-center space-x-3 p-4 text-red-700 rounded-2xl transition-all font-bold hover:bg-red-700/10 hover:scale-105 active:scale-95 mt-auto">
          <LogOut size={20} />
          <span className="text-base">Logout</span>
        </button>
      </aside>

      <main className="flex-1 ml-75 pl-20 pr-12 py-12">
        <div className="max-w-5xl mx-auto">
          
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-gray-500 font-medium mt-1">Monthly Financial Overview</p>
            </div>

            <div className="flex items-center gap-6">
              {/* Month Switcher */}
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 ml-10">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 rounded-xl text-gray-600 transition-all"><ChevronLeft size={20} /></button>
                <button onClick={resetToToday} className="px-4 text-xs font-black uppercase text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">Today</button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 rounded-xl text-gray-600 transition-all"><ChevronRight size={20} /></button>
              </div>

              {/* Financial Summary Cards */}
              <div className="flex gap-4">
                {/* Total Income Card */}
                <div className="bg-white p-5 rounded-[24px] shadow-xl border border-gray-100 flex items-center space-x-5 hover:scale-105 transition-transform">
                  <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-100"><Wallet /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Income</p>
                    <p className="text-2xl font-black text-emerald-500">${data?.totalIncome?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {/* Total Expense Card */}
                <div className="bg-white p-5 rounded-[24px] shadow-xl border border-gray-100 flex items-center space-x-5 hover:scale-105 transition-transform">
                  <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg shadow-rose-100"><Wallet size={24} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Expense</p>
                    <p className="text-2xl font-black text-rose-500">${data?.totalExpense?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* 선택된 월에 따른 파이 차트 */}
            <section className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-xl border border-gray-50 min-h-[450px]">
              <h3 className="text-2xl font-black text-gray-800 mb-8">Expense Categories</h3>
              <div className="h-72">
                {data?.breakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape} 
                        data={data?.breakdown}
                        innerRadius={70} outerRadius={90} paddingAngle={8}
                        dataKey="amount" nameKey='category'
                        onMouseEnter={onPieEnter} onMouseLeave={() => setActiveIndex(-1)}
                      >
                        {data?.breakdown?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 font-bold italic">No data recorded for this month.</div>
                )}
              </div>
            </section>

            {/* 해당 월의 최근 활동 목록 */}
            <section className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-50">
              <h3 className="text-2xl font-black text-gray-800 mb-8">Recent Activity</h3>
              <div className="space-y-6">
                {transactions.length > 0 ? (
                  transactions.slice(0, 6).map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center group cursor-pointer">
                      <div className="transition-transform group-hover:translate-x-2">
                        <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{tx.category}</p>
                        <p className="text-xs text-gray-400 font-medium">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <p className={`font-black text-lg ${tx.type === 'EXPENSE' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {tx.type === 'EXPENSE' ? '-' : '+'}${Math.abs(Number(tx.amount)).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-10 italic">No activity for this month.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;