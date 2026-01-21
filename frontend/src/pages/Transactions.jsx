import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { LayoutDashboard, ReceiptText, ChevronLeft, ChevronRight, Calendar, LogOut, Plus, X } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Restaurant',
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  const fetchTransactions = async () => {
    try {
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();
      // Fetch specifically for the target month
      const res = await api.get(`/transactions/?month=${month}&year=${year}`);
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      if (err.response?.status === 401) navigate('/login');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [viewDate, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', formData);
      setIsModalOpen(false);
      fetchTransactions();
      setFormData({ 
        amount: '', 
        category: 'Restaurant', 
        type: 'EXPENSE', 
        date: new Date().toISOString().split('T')[0], 
        note: '' 
      });
    } catch (err) {
      console.error("Failed to add transaction", err);
    }
  };

  const handlePrevMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const resetToToday = () => setViewDate(new Date());

  // 1. Filter specifically for the month/year displayed in the UI
  const filteredTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      txDate.getMonth() === viewDate.getMonth() &&
      txDate.getFullYear() === viewDate.getFullYear()
    );
  });

  // 2. Group the filtered transactions
  const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
    const date = new Date(tx.date);
    const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) groups[monthYear] = [];
    groups[monthYear].push(tx);
    return groups;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-75 bg-indigo-950 text-white flex flex-col p-6 shadow-2xl fixed h-full z-20">
        <h1 className="text-xl font-black mb-10 tracking-tighter text-indigo-200">Finance Dashboard</h1>
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
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="flex items-center space-x-3 p-4 text-red-700 rounded-2xl transition-all font-bold hover:bg-red-700/10 hover:scale-105 active:scale-95 mt-auto">
          <LogOut size={20} />
          <span className="text-base">Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 pl-20 pr-12 py-12">
        <div className="max-w-5xl mx-auto">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 flex items-center gap-2 bg-indigo-600 text-black px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-500 transition-all hover:scale-105"
              >
                <Plus size={20} /> Add Transaction
              </button>
            </div>

            <div className="flex items-center ml-10 gap-4">
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mr-6">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-600"><ChevronLeft size={20} /></button>
                <button onClick={resetToToday} className="px-4 text-xs font-black uppercase text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">Today</button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-600"><ChevronRight size={20} /></button>
              </div>
              
              <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 text-gray-500 font-bold">
                <Calendar size={20} className="text-indigo-600" />
                <span className="text-sm">{filteredTransactions.length} Logs</span>
              </div>
            </div>
          </header>

          <div className="space-y-16">
            {filteredTransactions.length > 0 ? (
              Object.keys(groupedTransactions).map((monthKey) => (
                <div key={monthKey} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-2xl font-black text-indigo-600 mb-6 flex items-center gap-3">
                    <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
                    {monthKey}
                  </h3>
                  <div className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                          <th className="px-10 py-5">Date</th>
                          <th className="px-10 py-5">Details</th>
                          <th className="px-10 py-5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {groupedTransactions[monthKey].map((tx) => (
                          <tr key={tx.id} className="hover:bg-indigo-50/30 transition-all group">
                            <td className="px-10 py-6">
                              <p className="text-sm font-bold text-gray-900">{new Date(tx.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                              <p className="text-[10px] text-gray-400 uppercase font-black">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-tighter">{tx.category}</span>
                                {tx.note && <span className="text-sm text-gray-400 font-medium italic border-l-2 border-gray-100 pl-4">{tx.note}</span>}
                              </div>
                            </td>
                            <td className={`px-10 py-6 text-right font-black text-lg ${tx.type === 'EXPENSE' ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {tx.type === 'EXPENSE' ? '-' : '+'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-200 shadow-sm animate-in fade-in duration-700">
                <p className="text-gray-400 font-black text-2xl tracking-tight italic">No records found for this month.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md p-10 rounded-[40px] shadow-2xl border border-indigo-50 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900">New Transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded-2xl">
                <button type="button" onClick={() => setFormData({...formData, type: 'EXPENSE'})} className={`py-3 rounded-xl font-bold transition-all ${formData.type === 'EXPENSE' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400'}`}>Expense</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'INCOME'})} className={`py-3 rounded-xl font-bold transition-all ${formData.type === 'INCOME' ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-400'}`}>Income</button>
              </div>
              <div>
                <label className="block text-xs font-black text-black-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-black text-black-400 uppercase tracking-widest mb-2 ml-1">Amount (CAD)</label>
                <input required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-lg" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-black text-black-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold">
                  <option>Restaurant</option><option>Rent</option><option>Shopping</option><option>Salary</option><option>Groceries</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-black-400 uppercase tracking-widest mb-2 ml-1">Note</label>
                <input type="text" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Additional details..." />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-black rounded-[24px] font-black text-lg shadow-xl hover:bg-indigo-700 transition-all hover:scale-[1.02]">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;