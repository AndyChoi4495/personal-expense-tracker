import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  LayoutDashboard,
  Wallet,
  ReceiptText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import AIChatBox from '../components/AIChatBot';
import Sidebar from '../components/Sidebar';

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
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
  const [comparisonData, setComparisonData] = useState([]);
  const [userName, setUserName] = useState('');
  const [viewDate, setViewDate] = useState(new Date());
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();

  const handlePrevMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const resetToToday = () => setViewDate(new Date());

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const month = viewDate.getMonth() + 1;
        const year = viewDate.getFullYear();
        const [statsRes, transRes, compRes, userRes] = await Promise.all([
          api.get(`/transactions/stats/summary?month=${month}&year=${year}`),
          api.get(`/transactions/?month=${month}&year=${year}`),
          api.get(
            `/transactions/stats/category-comparison?month=${month}&year=${year}`
          ),
          api.get('/users/username'),
        ]);
        setStats(statsRes.data);
        setTransactions(transRes.data.data || []);
        setComparisonData(compRes.data || []);
        setUserName(userRes.data.name);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
      }
    };
    fetchAllData();
  }, [navigate, viewDate]);

  const COLORS = [
    '#4f46e5',
    '#1fcf6eff',
    '#db2777',
    '#e11d48',
    '#d97706',
    '#137dbbff',
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans overflow-x-hidden">
      {/* Sidebar - Fixed w-80 */}
      <Sidebar userName={userName} />

      {/* Main Content - ml-80, px-12 */}
      <main className="flex-1 ml-80 px-12 py-12 min-w-0">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-gray-500 font-medium mt-1">
                Analytics for your personal spending
              </p>
            </div>
            {/* Cards Section */}
            <div className="flex items-center gap-6 ml-10">
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={resetToToday}
                  className="px-4 text-xs font-black uppercase text-indigo-600"
                >
                  Current
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="flex gap-4">
                <div className="bg-white p-5 rounded-[24px] shadow-xl border border-gray-100 flex items-center space-x-5">
                  <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-100">
                    <Wallet />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Total Income
                    </p>
                    <p className="text-2xl font-black text-emerald-500">
                      ${data?.totalIncome?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-[24px] shadow-xl border border-gray-100 flex items-center space-x-5">
                  <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg shadow-rose-100">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Total Expense
                    </p>
                    <p className="text-2xl font-black text-rose-500">
                      ${data?.totalExpense?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <section className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-xl border border-gray-50 h-[450px]">
              <h3 className="text-2xl font-black text-gray-800 mb-8 tracking-tight">
                Spending Breakdown
              </h3>
              <div className="h-72">
                {data?.breakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={data?.breakdown}
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={8}
                        dataKey="amount"
                        nameKey="category"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(-1)}
                      >
                        {data?.breakdown?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none' }}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 italic font-bold text-center">
                    No transactions recorded for this period.
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-50 overflow-y-auto h-[450px]">
              <h3 className="text-2xl font-black text-gray-800 mb-8 tracking-tight">
                Recent Activity
              </h3>
              <div className="space-y-6">
                {transactions.slice(0, 6).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center group"
                  >
                    <div className="transition-transform group-hover:translate-x-1">
                      <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {tx.category}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p
                      className={`font-black text-lg ${
                        tx.type === 'EXPENSE' ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                    >
                      {tx.type === 'EXPENSE' ? '-' : '+'}$
                      {Math.abs(Number(tx.amount)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="lg:col-span-3 bg-white p-10 rounded-[40px] shadow-xl border border-gray-50 mb-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                    <BarChart3 size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                    Monthly Trends
                  </h3>
                </div>
                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-5 py-2 rounded-full uppercase tracking-tighter">
                  Comparison: Last vs. This Month
                </span>
              </div>
              <div className="h-80">
                {comparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{
                          borderRadius: '24px',
                          border: 'none',
                          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                          padding: '15px',
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '30px', fontWeight: 700 }}
                      />
                      <Bar
                        dataKey="lastMonth"
                        name="Previous Month"
                        fill="#cbd5e1"
                        radius={[10, 10, 0, 0]}
                        barSize={32}
                      />
                      <Bar
                        dataKey="thisMonth"
                        name="This Month"
                        fill="#4f46e5"
                        radius={[10, 10, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 italic font-bold">
                    Insufficient data for comparative analysis.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
        <AIChatBox />
      </main>
    </div>
  );
};

export default Dashboard;
