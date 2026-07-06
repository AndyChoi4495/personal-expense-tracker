import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import Layout from '../components/Layout';
import useMonthNav from '../hooks/useMonthNav';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { viewDate, handlePrevMonth, handleNextMonth, resetToToday } =
    useMonthNav();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Restaurant',
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
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
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [viewDate]);

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

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      amount: '',
      category: 'Restaurant',
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) };
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      closeModal();
      fetchTransactions();
    } catch (err) {
      console.error('Failed to save transaction', err);
    }
  };

  const handleEdit = (tx) => {
    setEditingId(tx.id);
    setFormData({
      amount: String(tx.amount),
      category: tx.category,
      type: tx.type,
      date: new Date(tx.date).toISOString().split('T')[0],
      note: tx.note || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      console.error('Failed to delete transaction', err);
    }
  };

  return (
    <Layout userName={userName}>
      <header className="mb-8 lg:mb-12 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mt-4 w-fit">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={resetToToday}
              className="px-5 text-xs font-bold uppercase text-indigo-600 tracking-wide"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end gap-3">
          <button
            onClick={openAddModal}
            className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-semibold shadow-sm hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add Transaction
          </button>

          <div className="flex items-center bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-sm w-full sm:w-72 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <Search size={18} className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm w-full text-gray-900 placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 uppercase tracking-wide text-sm">
            Records for this period
            <span className="text-indigo-600 ml-2">
              ({filteredTransactions.length})
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-white text-gray-400 text-[11px] font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 sm:px-8 py-5">Date</th>
                <th className="px-5 sm:px-8 py-5">Details</th>
                <th className="px-5 sm:px-8 py-5 text-right">Amount</th>
                <th className="px-5 sm:px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-24 text-center text-gray-400 font-medium uppercase tracking-wide text-xs"
                  >
                    Loading transactions…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-24 text-center text-rose-500 font-medium uppercase tracking-wide text-xs"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-indigo-50/30 transition-all group"
                  >
                    <td className="px-5 sm:px-8 py-5 text-gray-900 font-medium whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-5 sm:px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-semibold uppercase tracking-wide border border-indigo-100 whitespace-nowrap">
                          {tx.category}
                        </span>
                        {tx.note && (
                          <span className="text-sm text-gray-500 truncate max-w-[220px]">
                            {tx.note}
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={`px-5 sm:px-8 py-5 text-right font-bold whitespace-nowrap ${
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
                    <td className="px-5 sm:px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          aria-label="Edit transaction"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="py-24 text-center text-gray-400 font-medium uppercase tracking-wide text-xs"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                {editingId ? 'Edit Transaction' : 'New Transaction'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-900"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
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
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    formData.type === 'INCOME'
                      ? 'bg-white text-emerald-500 shadow-sm'
                      : 'text-gray-400'
                  }`}
                >
                  Income
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                  Date
                </label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
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
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-lg text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 text-sm appearance-none cursor-pointer pr-12"
                  >
                    <option>Restaurant</option>
                    <option>Rent</option>
                    <option>Shopping</option>
                    <option>Salary</option>
                    <option>Groceries</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
              >
                {editingId ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Transactions;
