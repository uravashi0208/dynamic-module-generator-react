import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, TrendingUp, CheckCircle, XCircle, Plus, ArrowRight, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useModuleStore from '../context/moduleStore';
import useAuthStore from '../context/authStore';
import { formatDistanceToNow } from '../utils/dateUtils';
import clsx from 'clsx';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

const StatCard = ({ icon: Icon, label, value, change, color }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value ?? '–'}</p>
      </div>
      <div className={clsx('p-2.5 rounded-xl', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { stats, fetchStats, modules, fetchModules, isLoading } = useModuleStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchModules();
  }, []);

  const recentModules = modules.slice(0, 5);

  const chartData = stats?.fieldTypeCounts?.slice(0, 6).map((item) => ({
    name: item._id,
    count: item.count,
  })) || [];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-brand-600">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's what's happening with your modules.</p>
        </div>
        <button onClick={() => navigate('/modules/new')} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Module
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Layers} label="Total Modules" value={stats?.stats?.total} color="bg-brand-600" />
        <StatCard icon={CheckCircle} label="Active" value={stats?.stats?.active} color="bg-emerald-500" />
        <StatCard icon={XCircle} label="Inactive" value={stats?.stats?.inactive} color="bg-slate-400" />
      </div>

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar Chart */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-brand-600" size={18} />
            <h2 className="text-sm font-semibold text-slate-800">Field Type Distribution</h2>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="count" name="Fields" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Recent Modules */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-brand-600" size={18} />
              <h2 className="text-sm font-semibold text-slate-800">Recent Modules</h2>
            </div>
            <button onClick={() => navigate('/modules')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))
            ) : recentModules.length > 0 ? (
              recentModules.map((m) => (
                <button
                  key={m._id}
                  onClick={() => navigate(`/modules/${m._id}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors text-left group"
                >
                  <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
                    <Layers className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.moduleName}</p>
                    <p className="text-xs text-slate-400">
                      {m.fields?.length || 0} fields · {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={clsx('badge', m.isActive ? 'badge-success' : 'badge-danger')}>
                    {m.isActive ? 'Active' : 'Off'}
                  </span>
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No modules yet</p>
                <button onClick={() => navigate('/modules/new')} className="mt-2 text-xs text-brand-600 hover:underline">
                  Create your first module
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
