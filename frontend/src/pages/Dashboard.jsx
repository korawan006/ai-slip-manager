import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CreditCard, Activity, CalendarDays, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching dashboard data:', error);
          return;
        }

        setTransactions(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  // Derive filtered transactions + summary from date range
  const { filteredRows, totalRevenue, totalTransactions, chartData } = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const txDate = t.date; // YYYY-MM-DD
      const afterStart = !startDate || txDate >= startDate;
      const beforeEnd = !endDate || txDate <= endDate;
      return afterStart && beforeEnd;
    });

    const totalRevenue = filtered.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalTransactions = filtered.length;

    const revenueByDate = filtered.reduce((acc, t) => {
      const date = t.date;
      if (date) {
        acc[date] = (acc[date] || 0) + (Number(t.amount) || 0);
      }
      return acc;
    }, {});

    const chartData = Object.keys(revenueByDate).sort().map(date => ({
      name: date,
      revenue: revenueByDate[date]
    }));

    return { filteredRows: filtered, totalRevenue, totalTransactions, chartData };
  }, [transactions, startDate, endDate]);

  const hasDateFilter = startDate || endDate;

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
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
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Overview of your recent AI slip extractions and revenue.</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-white whitespace-nowrap">Filter by Date</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 pl-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-black/30 border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-colors text-sm [color-scheme:dark] w-full sm:w-auto"
              />
            </div>
            <span className="text-gray-500 text-sm mt-5">to</span>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 pl-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-black/30 border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-colors text-sm [color-scheme:dark] w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Clear button */}
          {hasDateFilter && (
            <button
              onClick={clearDateFilter}
              className="flex items-center gap-1 px-3 py-2 mt-auto text-xs text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-border hover:border-red-500/30 rounded-xl transition-all duration-200"
              title="Clear date filter"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}

          {/* Filter status */}
          {hasDateFilter && (
            <div className="mt-auto text-sm text-gray-400 sm:ml-auto">
              Showing <span className="text-primary font-semibold">{totalTransactions}</span> of{' '}
              <span className="text-white font-semibold">{transactions.length}</span> transactions
            </div>
          )}
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-4 bg-primary/20 rounded-xl neon-border">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</h3>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4">
          <div className="p-4 bg-accent/20 rounded-xl shadow-[0_0_10px_theme('colors.accent.DEFAULT')]">
            <CreditCard className="w-8 h-8 text-accent" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Transactions</p>
            <h3 className="text-2xl font-bold text-white">{totalTransactions}</h3>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4">
          <div className="p-4 bg-green-500/20 rounded-xl shadow-[0_0_10px_theme('colors.green.500')]">
            <Activity className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">System Status</p>
            <h3 className="text-2xl font-bold text-white">Online</h3>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="h-[450px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Revenue Overview</h3>
          {hasDateFilter && (
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-border">
              {startDate || '...'} → {endDate || '...'}
            </span>
          )}
        </div>
        <div className="flex-1 w-full min-h-0">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <p>No revenue data for the selected period.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} tickLine={false} axisLine={false} tickFormatter={(value) => '฿' + value.toLocaleString()} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value) => ['฿' + Number(value).toLocaleString(), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}
