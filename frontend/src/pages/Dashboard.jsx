import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CreditCard, Activity } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ totalRevenue: 0, totalTransactions: 0, chartData: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching dashboard data:', error);
          return;
        }

        const rows = transactions || [];
        const totalRevenue = rows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalTransactions = rows.length;

        const revenueByDate = rows.reduce((acc, t) => {
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

        setData({ totalRevenue, totalTransactions, chartData });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your recent AI slip extractions and revenue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-4 bg-primary/20 rounded-xl neon-border">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(data.totalRevenue)}</h3>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4">
          <div className="p-4 bg-accent/20 rounded-xl shadow-[0_0_10px_theme('colors.accent.DEFAULT')]">
            <CreditCard className="w-8 h-8 text-accent" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Transactions</p>
            <h3 className="text-2xl font-bold text-white">{data.totalTransactions}</h3>
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

      <Card className="h-[450px] flex flex-col">
        <h3 className="text-lg font-bold text-white mb-6">Revenue Overview</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} tickLine={false} axisLine={false} tickFormatter={(value) => '฿' + value} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
