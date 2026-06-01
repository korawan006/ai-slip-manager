import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { Search, Download, Trash2, CalendarDays, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching transactions:', error);
        } else {
          // Map Supabase column names to frontend-friendly format
          const mapped = (data || []).map((row) => ({
            id: row.id,
            date: row.date || '',
            time: row.time || '',
            amount: row.amount ? Number(row.amount) : 0,
            senderName: row.name || '',
            senderBank: row.sender_bank || '',
            receiverBank: row.receiver_bank || '',
            referenceNo: row.reference_no || '',
          }));
          setTransactions(mapped);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  // Combined filter: search term + date range
  const filtered = transactions.filter((t) => {
    // Text search filter
    const matchesSearch =
      searchTerm === '' ||
      (t.senderName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.senderBank || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.receiverBank || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.referenceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.amount || '').toString().includes(searchTerm);

    // Date range filter
    const txDate = t.date; // format: YYYY-MM-DD
    const matchesStartDate = !startDate || txDate >= startDate;
    const matchesEndDate = !endDate || txDate <= endDate;

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasDateFilter = startDate || endDate;

  // Delete transaction
  const handleDelete = async (id, senderName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this transaction from "${senderName || 'Unknown'}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    // Optimistic UI update — remove from state immediately
    setDeletingId(id);
    const previousTransactions = [...transactions];
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        // Rollback on failure
        console.error('Error deleting transaction:', error);
        setTransactions(previousTransactions);
        toast.error('Failed to delete transaction.');
      } else {
        toast.success('Transaction deleted successfully.');
      }
    } catch (error) {
      console.error(error);
      setTransactions(previousTransactions);
      toast.error('Something went wrong.');
    } finally {
      setDeletingId(null);
    }
  };

  // CSV export — only exports the currently filtered/visible data
  const exportToCSV = () => {
    if (filtered.length === 0) return;

    const headers = ['Date', 'Time', 'Amount (THB)', 'Sender Name', 'Sender Bank', 'Receiver Bank', 'Reference No'];
    const csvRows = [
      headers.join(','),
      ...filtered.map(tx => [
        tx.date,
        tx.time,
        tx.amount,
        `"${(tx.senderName || '-').replace(/"/g, '""')}"`,
        `"${(tx.senderBank || '-').replace(/"/g, '""')}"`,
        `"${(tx.receiverBank || '-').replace(/"/g, '""')}"`,
        `"${(tx.referenceNo || '-').replace(/"/g, '""')}"`,
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
          <p className="text-gray-400">View and search all extracted slip records.</p>
        </div>

        <button
          id="export-csv-btn"
          onClick={exportToCSV}
          disabled={filtered.length === 0}
          title="Export to CSV"
          className="group flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.03] active:scale-95"
        >
          <Download className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          <span className="hidden sm:inline">Export CSV</span>
          {filtered.length !== transactions.length && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {filtered.length} rows
            </span>
          )}
        </button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search input */}
          <div className="relative flex-1 w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, bank, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-black/30 border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-colors w-full placeholder:text-gray-500"
            />
          </div>

          {/* Date range separator */}
          <div className="hidden lg:block w-px h-8 bg-border"></div>

          {/* Date range inputs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-gray-400">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium whitespace-nowrap">Date Range</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-black/30 border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-colors text-sm [color-scheme:dark] w-full sm:w-auto"
                title="Start Date"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-black/30 border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-colors text-sm [color-scheme:dark] w-full sm:w-auto"
                title="End Date"
              />
            </div>

            {/* Clear date filter button */}
            {hasDateFilter && (
              <button
                onClick={clearDateFilter}
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-border hover:border-red-500/30 rounded-xl transition-all duration-200"
                title="Clear date filter"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Active filter indicator */}
        {(searchTerm || hasDateFilter) && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-sm text-gray-400">
            <span>
              Showing <span className="text-primary font-semibold">{filtered.length}</span> of{' '}
              <span className="text-white font-semibold">{transactions.length}</span> transactions
            </span>
          </div>
        )}
      </Card>

      {/* Transactions Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-black/20 text-gray-400 text-sm">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Sender Name</th>
                <th className="px-6 py-4 font-medium">Sender Bank</th>
                <th className="px-6 py-4 font-medium">Receiver Bank</th>
                <th className="px-6 py-4 font-medium">Ref No</th>
                <th className="px-4 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-600" />
                      <p>No transactions found.</p>
                      {(searchTerm || hasDateFilter) && (
                        <p className="text-sm text-gray-600">Try adjusting your search or date filters.</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`border-b border-border/50 hover:bg-white/5 transition-all duration-200 ${
                      deletingId === tx.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-white whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4 text-gray-300">{tx.time}</td>
                    <td className="px-6 py-4 text-primary font-bold">฿{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-white">{tx.senderName || '-'}</td>
                    <td className="px-6 py-4 text-white">{tx.senderBank}</td>
                    <td className="px-6 py-4 text-white">{tx.receiverBank}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-sm break-all">{tx.referenceNo}</td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleDelete(tx.id, tx.senderName)}
                        disabled={deletingId === tx.id}
                        title="Delete transaction"
                        className="group p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
