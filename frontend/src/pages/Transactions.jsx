import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import {
  LayoutDashboard,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Plus,
  X,
  Search,
} from 'lucide-react';
import AIChatBox from '../components/AIChatBot';
import Sidebar from '../components/Sidebar';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Restaurant',
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const fetchTransactions = async () => {
    try {
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();

      const [transRes, userRes] = await Promise.all([
        api.get(`/transactions/?month=${month}&year=${year}`),
        api.get('/users/username'),
      ]);

      setTransactions(transRes.data.data || []);
      setUserName(userRes.data.name);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [viewDate, navigate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const searchStr = searchTerm.toLowerCase();

      const isSameMonth =
        txDate.getMonth() === viewDate.getMonth() &&
        txDate.getFullYear() === viewDate.getFullYear();

      const matchesSearch =
        tx.category.toLowerCase().includes(searchStr) ||
        (tx.note && tx.note.toLowerCase().includes(searchStr));

      return isSameMonth && matchesSearch;
    });
  }, [searchTerm, transactions, viewDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setIsModalOpen(false);
      fetchTransactions();
      setFormData({
        amount: '',
        category: 'Restaurant',
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        note: '',
      });
    } catch (err) {
      console.error('Failed to add transaction', err);
    }
  };

  const handlePrevMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const resetToToday = () => setViewDate(new Date());

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans overflow-x-hidden text-black">
      {/* Sidebar Navigation */}
      <Sidebar userName={userName} />

      {/* Main Content Area */}
      <main className="flex-1 ml-80 px-12 py-12 min-w-0">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 flex items-start justify-between">
            <div>
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter">
                {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mt-6 w-fit">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-50 rounded-xl text-black transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={resetToToday}
                  className="px-6 text-[11px] font-black uppercase text-indigo-600 tracking-widest"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-50 rounded-xl text-black transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-indigo-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus size={20} /> Add Transaction
              </button>

              <div className="flex items-center bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-sm w-72 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <Search size={18} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="SEARCH..."
                  className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-full text-black placeholder:text-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </header>

          <section className="bg-white rounded-[40px] shadow-xl border border-gray-50 overflow-hidden mb-10">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">
                Records for this period{' '}
                <span className="text-indigo-600 ml-2">
                  ({filteredTransactions.length})
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-50">
                    <th className="px-10 py-6 text-black">Date</th>
                    <th className="px-10 py-6 text-black">Details</th>
                    <th className="px-10 py-6 text-right text-black">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-indigo-50/30 transition-all group"
                      >
                        <td className="px-10 py-6 text-black font-bold">
                          {new Date(tx.date).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-indigo-100">
                              {tx.category}
                            </span>
                            {tx.note && (
                              <span className="text-sm text-black font-bold italic">
                                {tx.note}
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          className={`px-10 py-6 text-right font-black text-lg ${
                            tx.type === 'EXPENSE'
                              ? 'text-rose-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {tx.type === 'EXPENSE' ? '−' : '+'} $
                          {Number(tx.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="py-24 text-center text-gray-400 font-bold italic uppercase tracking-widest text-[11px]"
                      >
                        No transactions found for{' '}
                        {viewDate.toLocaleString('en-US', { month: 'long' })}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md p-10 rounded-[40px] shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter">
                New Transaction
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    formData.type === 'EXPENSE'
                      ? 'bg-white text-rose-500 shadow-sm'
                      : 'text-gray-400'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    formData.type === 'INCOME'
                      ? 'bg-white text-emerald-500 shadow-sm'
                      : 'text-gray-400'
                  }`}
                >
                  Income
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 ml-1">
                  Date
                </label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-black text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 ml-1">
                  Amount (CAD)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-lg text-black"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 ml-1">
                  Category
                </label>
                <div className="relative group">
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-black text-sm appearance-none cursor-pointer pr-12"
                  >
                    <option>Restaurant</option>
                    <option>Rent</option>
                    <option>Shopping</option>
                    <option>Salary</option>
                    <option>Groceries</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                    <ChevronDown size={22} strokeWidth={3} />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-indigo-600 text-indigo-600 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
              >
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}
      <AIChatBox />
    </div>
  );
};

export default Transactions;
