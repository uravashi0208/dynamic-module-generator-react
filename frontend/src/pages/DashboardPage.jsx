import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useModuleStore from '../context/moduleStore';
import useAuthStore from '../context/authStore';
import { formatDistanceToNow } from '../utils/dateUtils';

const COLORS = ['#E66239','#f08155','#f5a07c','#f7b99c','#fad0be'];

/* ── Stat Card — matches the screenshot design exactly ── */
const StatCard = ({ icon, label, value, sub, cardBg, iconBg, iconColor, subColor }) => (
  <div className="col-xl-3 col-sm-6">
    <div className="rounded-3 p-4 d-flex align-items-center gap-3"
      style={{ background: cardBg, border: `1.5px solid ${cardBg === '#fff8e6' ? '#fde68a' : cardBg === '#e6f9f0' ? '#6ee7b7' : cardBg === '#e6f0fd' ? '#93c5fd' : '#fecaca'}` }}>
      {/* Icon box */}
      <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 48, height: 48, background: iconBg }}>
        <i className={`ti ${icon}`} style={{ fontSize: 22, color: iconColor }} />
      </div>
      {/* Text */}
      <div>
        <p className="mb-1 fw-semibold" style={{ fontSize: 13, color: '#555' }}>{label}</p>
        <h3 className="fw-bold mb-1" style={{ fontSize: 26, color: '#1a1a1a', lineHeight: 1 }}>
          {value ?? '–'}
        </h3>
        <p className="mb-0 fw-semibold" style={{ fontSize: 12, color: subColor }}>{sub}</p>
      </div>
    </div>
  </div>
);

const STAT_CARDS = [
  {
    icon: 'ti-clipboard-list',
    label: 'Total Modules',
    sub: '+5% since last month',
    cardBg: '#fef2f2',
    iconBg: '#E66239',
    iconColor: '#fff',
    subColor: '#E66239',
    key: 'total',
  },
  {
    icon: 'ti-refresh',
    label: 'Active Modules',
    sub: '+22% since last month',
    cardBg: '#e6f9f0',
    iconBg: '#10b981',
    iconColor: '#fff',
    subColor: '#10b981',
    key: 'active',
  },
  {
    icon: 'ti-currency-dollar',
    label: 'Inactive Modules',
    sub: '+10% since last month',
    cardBg: '#e6f0fd',
    iconBg: '#3b82f6',
    iconColor: '#fff',
    subColor: '#3b82f6',
    key: 'inactive',
  },
  {
    icon: 'ti-file-invoice',
    label: 'Total Fields',
    sub: '+35% since last month',
    cardBg: '#fff8e6',
    iconBg: '#f59e0b',
    iconColor: '#fff',
    subColor: '#f59e0b',
    key: 'fields',
  },
];

const DashboardPage = () => {
  const { stats, fetchStats, modules, fetchModules, isLoading } = useModuleStore();
  const { user }   = useAuthStore();
  const navigate   = useNavigate();

  useEffect(() => { fetchStats(); fetchModules(); }, []);

  const recentModules = modules.slice(0, 5);
  const chartData     = stats?.fieldTypeCounts?.slice(0, 6).map((item) => ({ name: item._id, count: item.count })) || [];
  const hour          = new Date().getHours();
  const greeting      = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // compute total fields across all modules
  const totalFields = modules.reduce((acc, m) => acc + (m.fields?.length || 0), 0);

  const statValues = {
    total:    stats?.stats?.total    ?? '–',
    active:   stats?.stats?.active   ?? '–',
    inactive: stats?.stats?.inactive ?? '–',
    fields:   totalFields || '–',
  };

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1">
            Good {greeting}, <span className="text-primary">{user?.name}</span> 👋
          </h1>
          <p className="text-muted small mb-0">Here's what's happening with your modules.</p>
        </div>
        <button onClick={() => navigate('/modules/new')} className="btn btn-primary d-flex align-items-center gap-2">
          <i className="ti ti-plus" /> New Module
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="row g-3 mb-4">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={statValues[card.key]}
            sub={card.sub}
            cardBg={card.cardBg}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
            subColor={card.subColor}
          />
        ))}
      </div>

      {/* ── Charts + Recent ── */}
      <div className="row g-4">
        {/* Bar Chart */}
        <div className="col-lg-7">
          <div className="card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="ti ti-chart-bar text-primary" />
                <h6 className="fw-semibold mb-0" style={{ fontSize: 13 }}>Field Type Distribution</h6>
              </div>
              <span className="badge rounded-pill text-bg-light border" style={{ fontSize: 10 }}>This month</span>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#a3a3a3' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e5e5', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                    cursor={{ fill: '#fafafa' }}
                  />
                  <Bar dataKey="count" name="Fields" radius={[5, 5, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: 220 }}>
                <i className="ti ti-chart-bar fs-1 opacity-25 mb-2" />
                <p style={{ fontSize: 13 }}>No field data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Modules */}
        <div className="col-lg-5">
          <div className="card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="ti ti-trending-up text-primary" />
                <h6 className="fw-semibold mb-0" style={{ fontSize: 13 }}>Recent Modules</h6>
              </div>
              <button
                onClick={() => navigate('/modules')}
                className="btn btn-link btn-sm p-0 text-decoration-none"
                style={{ fontSize: 12, color: 'var(--primary)' }}
              >
                View all <i className="ti ti-arrow-right" />
              </button>
            </div>

            <div className="d-flex flex-column gap-1">
              {isLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-3 p-3 d-flex align-items-center gap-3" style={{ background: '#f9f9f9' }}>
                    <div className="rounded-3 flex-shrink-0" style={{ width: 36, height: 36, background: '#eee' }} />
                    <div className="flex-grow-1">
                      <div className="rounded mb-1" style={{ height: 11, background: '#eee', width: '60%' }} />
                      <div className="rounded" style={{ height: 9, background: '#f3f3f3', width: '40%' }} />
                    </div>
                  </div>
                ))
              ) : recentModules.length > 0 ? recentModules.map((m) => (
                <button
                  key={m._id}
                  onClick={() => navigate(`/modules/${m._id}`)}
                  className="w-100 d-flex align-items-center gap-3 p-2 rounded-3 text-start border-0 bg-transparent"
                  style={{ transition: 'background .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 36, height: 36, background: 'rgba(230,98,57,.12)' }}>
                    <i className="ti ti-box" style={{ color: 'var(--primary)', fontSize: 16 }} />
                  </div>
                  <div className="flex-grow-1 text-truncate">
                    <p className="fw-semibold mb-0 text-truncate" style={{ fontSize: 13, color: '#1a1a1a' }}>{m.moduleName}</p>
                    <p className="text-muted mb-0" style={{ fontSize: 11 }}>
                      {m.fields?.length || 0} fields · {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span
                    className="rounded-pill px-2 py-1"
                    style={{
                      fontSize: 10, fontWeight: 600,
                      background: m.isActive ? '#e6f9f0' : '#f5f5f5',
                      color: m.isActive ? '#10b981' : '#737373',
                    }}
                  >
                    {m.isActive ? 'Active' : 'Off'}
                  </span>
                </button>
              )) : (
                <div className="text-center py-4 text-muted">
                  <i className="ti ti-box-seam fs-1 d-block mb-2 opacity-25" />
                  <p style={{ fontSize: 13 }} className="mb-2">No modules yet</p>
                  <button onClick={() => navigate('/modules/new')} className="btn btn-sm btn-primary">
                    <i className="ti ti-plus me-1" />Create Module
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
