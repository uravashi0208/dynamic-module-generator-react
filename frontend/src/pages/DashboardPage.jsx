import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import useModuleStore from '../context/moduleStore';
import useAuthStore from '../context/authStore';
import { formatDistanceToNow } from '../utils/dateUtils';

const COLORS = ['#E66239', '#f08155', '#f5a07c', '#f7b99c', '#fad0be'];

const STAT_CARDS = [
  {
    key: 'total',
    icon: 'ti-clipboard-list',
    label: 'Total Modules',
    sub: '+5% since last month',
    cardClass: 'stat-card--red',
    iconClass: 'stat-icon--orange',
    subClass: 'stat-sub--orange',
  },
  {
    key: 'active',
    icon: 'ti-refresh',
    label: 'Active Modules',
    sub: '+22% since last month',
    cardClass: 'stat-card--green',
    iconClass: 'stat-icon--green',
    subClass: 'stat-sub--green',
  },
  {
    key: 'inactive',
    icon: 'ti-currency-dollar',
    label: 'Inactive Modules',
    sub: '+10% since last month',
    cardClass: 'stat-card--blue',
    iconClass: 'stat-icon--blue',
    subClass: 'stat-sub--blue',
  },
  {
    key: 'fields',
    icon: 'ti-file-invoice',
    label: 'Total Fields',
    sub: '+35% since last month',
    cardClass: 'stat-card--yellow',
    iconClass: 'stat-icon--yellow',
    subClass: 'stat-sub--yellow',
  },
];

const StatCard = ({ icon, label, value, sub, cardClass, iconClass, subClass }) => (
  <div className="col-xl-3 col-sm-6">
    <div className={`stat-card ${cardClass}`}>
      <div className={`stat-icon ${iconClass}`}>
        <i className={`ti ${icon} text-white`} className="fs-22px" />
      </div>
      <div>
        <p className="stat-label mb-0">{label}</p>
        <h3 className="stat-value">{value ?? '–'}</h3>
        <p className={`stat-sub mb-0 ${subClass}`}>{sub}</p>
      </div>
    </div>
  </div>
);

const SkeletonRow = () => (
  <div className="skeleton-row">
    <div className="skeleton-icon" />
    <div className="flex-grow-1">
      <div className="skeleton-line skeleton-line--title" />
      <div className="skeleton-line skeleton-line--sub" />
    </div>
  </div>
);

const DashboardPage = () => {
  const { stats, fetchStats, modules, fetchModules, isLoading } = useModuleStore();
  const { user }    = useAuthStore();
  const navigate    = useNavigate();

  useEffect(() => { fetchStats(); fetchModules(); }, []);

  const recentModules = modules.slice(0, 5);
  const chartData     = stats?.fieldTypeCounts?.slice(0, 6).map((item) => ({
    name: item._id, count: item.count,
  })) || [];
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const totalFields = modules.reduce((acc, m) => acc + (m.fields?.length || 0), 0);

  const statValues = {
    total:    stats?.stats?.total    ?? '–',
    active:   stats?.stats?.active   ?? '–',
    inactive: stats?.stats?.inactive ?? '–',
    fields:   totalFields || '–',
  };

  return (
    <div className="animate-slide-up">
      {/* ── Header ── */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1">
            Good {greeting}, <span className="text-primary">{user?.name}</span> 👋
          </h1>
          <p className="text-muted small mb-0">Here's what's happening with your modules.</p>
        </div>
        <button
          onClick={() => navigate('/modules/new')}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <i className="ti ti-plus" /> New Module
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="row g-3 mb-4">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.key}
            {...card}
            value={statValues[card.key]}
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
                <h6 className="fw-semibold mb-0 fs-13px">Field Type Distribution</h6>
              </div>
              <span className="badge rounded-pill text-bg-light border chart-month-badge">This month</span>
            </div>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  barSize={28}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#a3a3a3' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#a3a3a3' }}
                    axisLine={false} tickLine={false} allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 13, borderRadius: 8,
                      border: '1px solid #e5e5e5',
                      boxShadow: '0 4px 12px rgba(0,0,0,.08)',
                    }}
                    cursor={{ fill: '#fafafa' }}
                  />
                  <Bar dataKey="count" name="Fields" radius={[5, 5, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty text-muted" style={{ height: 220 }}>
                <i className="ti ti-chart-bar fs-1 opacity-25 mb-2" />
                <p className="fs-13px">No field data yet</p>
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
                <h6 className="fw-semibold mb-0 fs-13px">Recent Modules</h6>
              </div>
              <button
                onClick={() => navigate('/modules')}
                className="btn btn-link btn-sm p-0 text-decoration-none link-primary fs-12px"
              >
                View all <i className="ti ti-arrow-right" />
              </button>
            </div>

            <div className="d-flex flex-column gap-1">
              {isLoading ? (
                [1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)
              ) : recentModules.length > 0 ? (
                recentModules.map((m) => (
                  <button
                    key={m._id}
                    onClick={() => navigate(`/modules/${m._id}`)}
                    className="module-list-item"
                  >
                    <div className="module-list-icon">
                      <i className="ti ti-box text-primary fs-16px" />
                    </div>
                    <div className="flex-grow-1 text-truncate">
                      <p className="fw-semibold mb-0 text-truncate fs-13px text-gray-900">
                        {m.moduleName}
                      </p>
                      <p className="text-muted mb-0 fs-11px">
                        {m.fields?.length || 0} fields ·{' '}
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`module-status-pill ${m.isActive ? 'module-status-pill--active' : 'module-status-pill--inactive'}`}>
                      {m.isActive ? 'Active' : 'Off'}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="ti ti-box-seam fs-1 d-block mb-2 opacity-25" />
                  <p className="mb-2 fs-13px">No modules yet</p>
                  <button
                    onClick={() => navigate('/modules/new')}
                    className="btn btn-sm btn-primary"
                  >
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
