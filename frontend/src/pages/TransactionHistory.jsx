import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { Search, Download, Trash2, CalendarDays, X, Columns3, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';

// Column definitions for CSV export
const CSV_COLUMNS = [
  { key: 'date',         label: 'Date',          getValue: (tx) => tx.date },
  { key: 'time',         label: 'Time',          getValue: (tx) => tx.time },
  { key: 'amount',       label: 'Amount (THB)',   getValue: (tx) => tx.amount },
  { key: 'senderName',   label: 'Sender Name',    getValue: (tx) => `"${(tx.senderName || '-').replace(/"/g, '""')}"` },
  { key: 'senderBank',   label: 'Sender Bank',    getValue: (tx) => `"${(tx.senderBank || '-').replace(/"/g, '""')}"` },
  { key: 'receiverBank', label: 'Receiver Bank',   getValue: (tx) => `"${(tx.receiverBank || '-').replace(/"/g, '""')}"` },
  { key: 'referenceNo',  label: 'Reference No',   getValue: (tx) => `"${(tx.referenceNo || '-').replace(/"/g, '""')}"` },
];

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState(() => CSV_COLUMNS.map(c => c.key));
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target)) {
        setShowColumnPicker(false);
      }
    };
    if (showColumnPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnPicker]);

  const toggleColumn = (key) => {
    setSelectedColumns(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const toggleAllColumns = () => {
    setSelectedColumns(prev =>
      prev.length === CSV_COLUMNS.length ? [] : CSV_COLUMNS.map(c => c.key)
    );
  };

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

  // CSV export — dynamically builds columns based on user selection
  const exportToCSV = () => {
    if (filtered.length === 0 || selectedColumns.length === 0) return;

    const activeCols = CSV_COLUMNS.filter(c => selectedColumns.includes(c.key));
    const headers = activeCols.map(c => c.label);
    const csvRows = [
      headers.join(','),
      ...filtered.map(tx =>
        activeCols.map(c => c.getValue(tx)).join(',')
      ),
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Transaction History</h1>
          <p className="text-gray-400 text-sm md:text-base">View and search all extracted slip records.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Select Columns dropdown */}
          <div className="relative" ref={columnPickerRef}>
            <button
              id="select-columns-btn"
              onClick={() => setShowColumnPicker(prev => !prev)}
              className={`group flex items-center gap-2 px-3 md:px-4 py-2 border rounded-xl text-sm md:text-base font-medium transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer ${
                showColumnPicker
                  ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'bg-card/60 border-border text-gray-300 hover:text-white hover:border-gray-500'
              }`}
            >
              <Columns3 className="w-4 h-4" />
              <span className="hidden sm:inline">Columns</span>
              {selectedColumns.length < CSV_COLUMNS.length && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                  {selectedColumns.length}/{CSV_COLUMNS.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showColumnPicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel */}
            {showColumnPicker && (
              <div
                className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_15px_rgba(99,102,241,0.15)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {/* Select All header */}
                <button
                  onClick={toggleAllColumns}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 border-b border-border/60 transition-colors cursor-pointer"
                >
                  <span>{selectedColumns.length === CSV_COLUMNS.length ? 'Deselect All' : 'Select All'}</span>
                  <span className="text-primary font-bold normal-case text-xs">
                    {selectedColumns.length}/{CSV_COLUMNS.length}
                  </span>
                </button>

                {/* Column checkboxes */}
                <div className="py-1 max-h-60 overflow-y-auto">
                  {CSV_COLUMNS.map((col) => {
                    const isChecked = selectedColumns.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 cursor-pointer ${
                          isChecked
                            ? 'text-white hover:bg-white/5'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          isChecked
                            ? 'bg-primary border-primary shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                            : 'border-gray-600 bg-transparent'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span>{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Export CSV button */}
          <button
            id="export-csv-btn"
            onClick={exportToCSV}
            disabled={filtered.length === 0 || selectedColumns.length === 0}
            title={selectedColumns.length === 0 ? 'Select at least one column' : 'Export to CSV'}
            className="group flex items-center gap-2 px-4 md:px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.03] active:scale-95 text-sm md:text-base cursor-pointer"
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
      </div>

      {/* Filters Bar */}
      <Card className="p-3 md:p-4">
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start lg:items-center">
          {/* Search input */}
          <div className="relative flex-1 w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, bank, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 md:pl-10 pr-4 py-2 md:py-2.5 bg-black/30 border border-border rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary transition-colors w-full placeholder:text-gray-500"
            />
          </div>

          {/* Date range separator */}
          <div className="hidden lg:block w-px h-8 bg-border"></div>

          {/* Date range inputs */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-gray-400">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Date Range</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 md:px-3 py-1.5 md:py-2 bg-black/30 border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-colors text-xs md:text-sm [color-scheme:dark] w-full sm:w-auto min-w-0"
                title="Start Date"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 md:px-3 py-1.5 md:py-2 bg-black/30 border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-colors text-xs md:text-sm [color-scheme:dark] w-full sm:w-auto min-w-0"
                title="End Date"
              />
            </div>

            {/* Clear date filter button */}
            {hasDateFilter && (
              <button
                onClick={clearDateFilter}
                className="flex items-center gap-1 px-3 py-1.5 md:py-2 text-xs text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-border hover:border-red-500/30 rounded-xl transition-all duration-200"
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
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs md:text-sm text-gray-400">
            <span>
              Showing <span className="text-primary font-semibold">{filtered.length}</span> of{' '}
              <span className="text-white font-semibold">{transactions.length}</span> transactions
            </span>
          </div>
        )}
      </Card>

      {/* --- Desktop Table (hidden on mobile) --- */}
      <Card className="p-0 overflow-hidden hidden md:block">
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

      {/* --- Mobile Card List (visible only on mobile) --- */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-8 text-gray-500">
              <Search className="w-8 h-8 text-gray-600" />
              <p className="text-sm">No transactions found.</p>
              {(searchTerm || hasDateFilter) && (
                <p className="text-xs text-gray-600">Try adjusting your search or date filters.</p>
              )}
            </div>
          </Card>
        ) : (
          filtered.map((tx) => (
            <Card
              key={tx.id}
              className={`p-4 transition-all duration-200 ${
                deletingId === tx.id ? 'opacity-50 scale-95' : ''
              }`}
            >
              {/* Top row: amount + delete */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-primary">฿{tx.amount.toLocaleString()}</span>
                <button
                  onClick={() => handleDelete(tx.id, tx.senderName)}
                  disabled={deletingId === tx.id}
                  title="Delete transaction"
                  className="group p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-white">{tx.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-gray-300">{tx.time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sender</p>
                  <p className="text-white truncate">{tx.senderName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sender Bank</p>
                  <p className="text-white truncate">{tx.senderBank}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Receiver Bank</p>
                  <p className="text-white truncate">{tx.receiverBank}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ref No</p>
                  <p className="text-gray-400 font-mono text-xs break-all">{tx.referenceNo}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
