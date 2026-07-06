import { useEffect, useState } from 'react';
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
import { Wallet, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import Layout from '../components/Layout';
import useMonthNav from '../hooks/useMonthNav';

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
  const { viewDate, handlePrevMonth, handleNextMonth, resetToToday } =
    useMonthNav();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
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
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [viewDate]);

  const COLORS = [
    '#4f46e5',
    '#1fcf6eff',
    '#db2777',
    '#e11d48',
    '#d97706',
    '#137dbbff',
  ];

  return (
    <Layout userName={userName}>
      <header className="mb-8 lg:mb-12 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-gray-500 mt-1">
            Analytics for your personal spending
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 self-start">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-50 rounded-xl text-gray-600"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={resetToToday}
              className="px-4 text-xs font-bold uppercase tracking-wide text-indigo-600"
            >
              Current
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-50 rounded-xl text-gray-600"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-emerald-500 p-3 rounded-xl text-white shadow-sm shrink-0">
                <Wallet size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Income
                </p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-500 truncate">
                  ${data?.totalIncome?.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-rose-500 p-3 rounded-xl text-white shadow-sm shrink-0">
                <Wallet size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Expense
                </p>
                <p className="text-lg sm:text-2xl font-bold text-rose-500 truncate">
                  ${data?.totalExpense?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {loading && (
        <div className="mb-8 text-center text-gray-400 font-medium uppercase tracking-wide text-xs">
          Loading dashboard…
        </div>
      )}
      {error && (
        <div className="mb-8 p-5 rounded-2xl bg-rose-50 text-rose-600 font-semibold text-center border border-rose-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 h-[420px]">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 tracking-tight">
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
              <div className="flex items-center justify-center h-full text-gray-400 text-center">
                No transactions recorded for this period.
              </div>
            )}
          </div>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 overflow-y-auto h-[420px]">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 tracking-tight">
            Recent Activity
          </h3>
          <div className="space-y-5">
            {transactions.slice(0, 6).map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center gap-3 group"
              >
                <div className="transition-transform group-hover:translate-x-1 min-w-0">
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                    {tx.category}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
                <p
                  className={`font-bold shrink-0 ${
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

        <section className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight">
                Monthly Trends
              </h3>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-wide self-start sm:self-auto">
              Last vs. This Month
            </span>
          </div>
          <div className="h-72 sm:h-80">
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
                    tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                      padding: '15px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '30px', fontWeight: 600 }}
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
              <div className="flex items-center justify-center h-full text-gray-400">
                Insufficient data for comparative analysis.
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
