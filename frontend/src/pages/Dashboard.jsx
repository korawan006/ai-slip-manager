import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock, CalendarDays, X } from 'lucide-react';

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
  const { filteredRows, totalRevenue, growthPercentage, isPositiveGrowth, peakHourString, chartData } = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const txDate = t.date; // YYYY-MM-DD
      const afterStart = !startDate || txDate >= startDate;
      const beforeEnd = !endDate || txDate <= endDate;
      return afterStart && beforeEnd;
    });

    const totalRevenue = filtered.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // --- Revenue Growth (MoM) ---
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-indexed
    const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
    const prevYear = curMonth === 0 ? curYear - 1 : curYear;

    const revenueForMonth = (y, m) =>
      transactions
        .filter((t) => {
          const d = new Date(t.date || t.created_at);
          return d.getFullYear() === y && d.getMonth() === m;
        })
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const curMonthRevenue = revenueForMonth(curYear, curMonth);
    const prevMonthRevenue = revenueForMonth(prevYear, prevMonth);

    let growthPercentage = 0;
    let isPositiveGrowth = true;
    if (prevMonthRevenue > 0) {
      growthPercentage = ((curMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
      isPositiveGrowth = growthPercentage >= 0;
    } else if (curMonthRevenue > 0) {
      growthPercentage = 100;
      isPositiveGrowth = true;
    }

    // --- Peak Hour ---
    const hourCounts = {};
    filtered.forEach((t) => {
      const timeStr = t.time || t.created_at;
      if (!timeStr) return;
      let hour;
      if (t.time) {
        hour = parseInt(t.time.split(':')[0], 10);
      } else {
        hour = new Date(t.created_at).getHours();
      }
      if (!isNaN(hour)) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    let peakHourString = 'N/A';
    const hourEntries = Object.entries(hourCounts);
    if (hourEntries.length > 0) {
      const peakHour = hourEntries.reduce((a, b) => (Number(b[1]) > Number(a[1]) ? b : a))[0];
      const h = parseInt(peakHour, 10);
      const nextH = (h + 1) % 24;
      peakHourString = `${String(h).padStart(2, '0')}:00 - ${String(nextH).padStart(2, '0')}:00`;
    }

    // --- Revenue by Date (Chart) ---
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

    return { filteredRows: filtered, totalRevenue, growthPercentage, isPositiveGrowth, peakHourString, chartData };
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
    /* 💡 แก้ไข: เพิ่ม min-w-0 และ overflow-x-hidden ป้องกันหน้าจอทะลุ */
    <div className="space-y-5 md:space-y-6 w-full min-w-0 overflow-x-hidden md:overflow-visible">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm md:text-base">Overview of your recent AI slip extractions and revenue.</p>
      </div>

      {/* Date Range Filter — full width */}
      <Card className="p-4 w-full min-w-0">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <CalendarDays className="w-5 h-5 text-primary drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
            <span className="text-sm font-semibold text-white whitespace-nowrap">Filter by Date</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
            <div className="flex flex-col gap-1 flex-1 sm:flex-initial min-w-0">
              <label className="text-xs text-gray-500 pl-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-black/30 border border-border rounded-xl text-white focus:outline-none focus:border-primary focus:shadow-[0_0_8px_rgba(99,102,241,0.25)] transition-all text-sm [color-scheme:dark] w-full sm:w-auto"
              />
            </div>
            <span className="text-gray-500 text-sm mt-5">to</span>
            <div className="flex flex-col gap-1 flex-1 sm:flex-initial min-w-0">
              <label className="text-xs text-gray-500 pl-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-black/30 border border-border rounded-xl text-white focus:outline-none focus:border-primary focus:shadow-[0_0_8px_rgba(99,102,241,0.25)] transition-all text-sm [color-scheme:dark] w-full sm:w-auto"
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
              Showing <span className="text-primary font-semibold">{filteredRows.length}</span> of{' '}
              <span className="text-white font-semibold">{transactions.length}</span> transactions
            </div>
          )}
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
        {/* Total Revenue */}
        <Card className="flex items-center gap-4 w-full">
          <div className="p-3.5 lg:p-4 bg-primary/15 rounded-xl shadow-[0_0_16px_rgba(99,102,241,0.3),inset_0_0_12px_rgba(99,102,241,0.15)]">
            <TrendingUp className="w-7 h-7 lg:w-8 lg:h-8 text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-400 font-medium tracking-wide">Total Revenue</p>
            <h3 className="text-xl lg:text-2xl font-bold text-white truncate">{formatCurrency(totalRevenue)}</h3>
          </div>
        </Card>

        {/* Revenue Growth */}
        <Card className="flex items-center gap-4 w-full">
          <div className={`p-3.5 lg:p-4 rounded-xl ${
            isPositiveGrowth
              ? 'bg-emerald-500/15 shadow-[0_0_16px_rgba(16,185,129,0.3),inset_0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-rose-500/15 shadow-[0_0_16px_rgba(244,63,94,0.3),inset_0_0_12px_rgba(244,63,94,0.15)]'
          }`}>
            {isPositiveGrowth ? (
              <TrendingUp className="w-7 h-7 lg:w-8 lg:h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            ) : (
              <TrendingDown className="w-7 h-7 lg:w-8 lg:h-8 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-400 font-medium tracking-wide">Revenue Growth</p>
            <h3 className={`text-xl lg:text-2xl font-bold ${
              isPositiveGrowth ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isPositiveGrowth ? '+' : ''}{growthPercentage.toFixed(1)}%
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">vs. last month</p>
          </div>
        </Card>

        {/* Peak Hour */}
        <Card className="flex items-center gap-4 w-full">
          <div className="p-3.5 lg:p-4 bg-amber-500/15 rounded-xl shadow-[0_0_16px_rgba(245,158,11,0.3),inset_0_0_12px_rgba(245,158,11,0.15)]">
            <Clock className="w-7 h-7 lg:w-8 lg:h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-400 font-medium tracking-wide">Peak Hour</p>
            <h3 className="text-xl lg:text-2xl font-bold text-amber-400">{peakHourString}</h3>
            <p className="text-xs text-gray-500 mt-0.5">busiest transaction window</p>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="w-full flex flex-col p-4 md:p-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5 md:mb-6">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white">Revenue Overview</h3>
            <p className="text-xs text-gray-500 mt-0.5">Daily revenue trend across your filtered period</p>
          </div>
          {hasDateFilter && (
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-border">
              {startDate || '...'} → {endDate || '...'}
            </span>
          )}
        </div>
        <div className="w-full min-h-0 relative" style={{ height: 'clamp(260px, 40vw, 480px)' }}>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <p>No revenue data for the selected period.</p>
              </div>
            </div>
          ) : (
            /* 💡 แก้ไข: เปลี่ยน width จาก 100% เป็น 99% เพื่อแก้บัคกราฟถ่างหน้าจอของ Recharts */
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => '฿' + value.toLocaleString()}
                  width={70}
                  dx={-4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 12px rgba(99,102,241,0.15)',
                  }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value) => ['฿' + Number(value).toLocaleString(), 'Revenue']}
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: '#6366f1',
                    stroke: '#fff',
                    strokeWidth: 2,
                    style: { filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.7))' }
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}