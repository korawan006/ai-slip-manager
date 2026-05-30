import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { Search, Download } from 'lucide-react';

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filtered = transactions.filter(t => 
    (t.senderName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.senderBank || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.receiverBank || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.referenceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.amount || '').toString().includes(searchTerm)
  );

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
          <p className="text-gray-400">View and search all extracted slip records.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-colors w-full sm:w-64"
            />
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
          </button>
        </div>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4 text-gray-300">{tx.time}</td>
                    <td className="px-6 py-4 text-primary font-bold">฿{tx.amount}</td>
                    <td className="px-6 py-4 text-white">{tx.senderName || '-'}</td>
                    <td className="px-6 py-4 text-white">{tx.senderBank}</td>
                    <td className="px-6 py-4 text-white">{tx.receiverBank}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-sm break-all">{tx.referenceNo}</td>
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
