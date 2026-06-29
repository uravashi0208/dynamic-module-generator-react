import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import useModuleStore from '../context/moduleStore';
import useAuthStore from '../context/authStore';
import usePageVisitStore from '../context/pageVisitStore';
import useVisitorStore   from '../context/visitorStore';
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
        <i className={`ti ${icon} text-white fs-22px`} />
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
  const { visits: pageVisits, fetchTop, isLoading: pvLoading } = usePageVisitStore();
  const { stats: visitorStats, visitors: recentVisitors, fetchStats: fetchVStats, fetchVisitors } = useVisitorStore();
  const { user }    = useAuthStore();
  const navigate    = useNavigate();

  useEffect(() => { fetchStats(); fetchModules(); fetchTop(5); fetchVStats(); fetchVisitors({ limit: 5 }); }, []);

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
      {/* ── Page Visits ── */}
      <div className="row g-4 mt-0">
        <div className="col-4">
          <div className="card pv-card">
            {/* header */}
            <div className="pv-card-header">
              <h6 className="pv-card-title">Page visits</h6>
              <button onClick={() => navigate('/page-visits')} className="pv-view-all-btn">
                View All
              </button>
            </div>

            {/* list */}
            <div className="pv-list">
              {pvLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="pv-item">
                    <div className="pv-item-icon skeleton-icon" />
                    <div className="flex-grow-1">
                      <div className="skeleton-line skeleton-line--title" />
                      <div className="skeleton-line skeleton-line--sub" />
                    </div>
                    <div style={{ width: 40, textAlign: 'right' }}>
                      <div className="skeleton-line" style={{ height: 14, width: 36, marginLeft: 'auto', marginBottom: 4 }} />
                      <div className="skeleton-line" style={{ height: 10, width: 48, marginLeft: 'auto' }} />
                    </div>
                  </div>
                ))
              ) : pageVisits.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="ti ti-chart-bar fs-1 d-block mb-2 opacity-25" />
                  <p className="fs-13px mb-0">No page visit data yet</p>
                  <p className="fs-11px text-muted">Data will appear as pages are tracked</p>
                </div>
              ) : (
                pageVisits.map((page, i) => (
                  <div key={page._id || i} className={`pv-item${i < pageVisits.length - 1 ? ' pv-item--border' : ''}`}>
                    {/* icon */}
                    <div className="pv-item-icon">
                      <i className="ti ti-file-analytics" />
                    </div>
                    {/* name + views */}
                    <div className="pv-item-info">
                      <p className="pv-item-name">{page.label || page.path}</p>
                      <p className="pv-item-views">{page.path} &nbsp;·&nbsp; {(page.views || 0).toLocaleString()} views</p>
                    </div>
                    {/* bounce rate */}
                    <div className="pv-item-stat">
                      <p className={`pv-item-rate ${page.bounceUp ? 'pv-item-rate--up' : 'pv-item-rate--down'}`}>
                        {String(Math.round(page.bounceRate || 0)).padStart(2, '0')}
                      </p>
                      <p className="pv-item-rate-label">
                        <i className={`ti ${page.bounceUp ? 'ti-trending-up' : 'ti-trending-down'} me-1`} />
                        Bounce Rate
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
{/* Visitor counts */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="pv-card-header mb-3">
              <h6 className="pv-card-title d-flex align-items-center gap-2">
                <i className="ti ti-users text-primary" /> Visitors
              </h6>
              <button onClick={() => navigate('/visitors')} className="pv-view-all-btn">View All</button>
            </div>
            <div className="row g-2 m-2">
              {[
                { label: 'Total',      val: visitorStats?.total,     icon: 'ti-users',          color: '#e6f0fd', ic: '#3b82f6' },
                { label: 'Today',      val: visitorStats?.today,     icon: 'ti-calendar-today', color: '#e6f9f0', ic: '#10b981' },
                { label: 'This Week',  val: visitorStats?.thisWeek,  icon: 'ti-calendar-week',  color: '#fff8e6', ic: '#f59e0b' },
                { label: 'This Month', val: visitorStats?.thisMonth, icon: 'ti-calendar',       color: '#fef2f2', ic: '#ef4444' },
              ].map(({ label, val, icon, color, ic }) => (
                <div key={label} className="col-6">
                  <div style={{ background: color, borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                    <i className={`ti ${icon} d-block mb-1`} style={{ color: ic, fontSize: 18 }} />
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>
                      {val?.toLocaleString() ?? '\u2013'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
            {visitorStats?.byDevice?.length > 0 && (
              <div className="mt-3 mx-3">
                <p className="text-muted mb-2" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>By Device</p>
                <div className="d-flex gap-2 flex-wrap">
                  {visitorStats.byDevice.map((d) => (
                    <span key={d.device} className="visitor-browser-badge">
                      <i className={`ti ${{ Mobile: 'ti-device-mobile', Tablet: 'ti-device-tablet', Desktop: 'ti-device-desktop', Bot: 'ti-robot' }[d.device] || 'ti-device-desktop'} me-1`} />
                      {d.device} <strong>{d.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent visitor list */}
        <div className="col-lg-4">
          <div className="card p-0 overflow-hidden h-100">
            <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="fw-semibold mb-0 fs-13px d-flex align-items-center gap-2">
                <i className="ti ti-activity text-primary" /> Recent Visitors
              </h6>
              <button onClick={() => navigate('/visitors')} className="pv-view-all-btn">View All</button>
            </div>
            <div className="table-responsive">
              <table className="table data-table mb-0">
                <thead>
                  <tr>
                    <th className="pv-th">IP</th>
                    <th className="pv-th">LOCATION</th>
                    <th className="pv-th">DEVICE</th>
                    <th className="pv-th">PAGE</th>
                    <th className="pv-th">WHEN</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisitors.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                      No visitors recorded yet
                    </td></tr>
                  ) : recentVisitors.map((v) => {
                    const dIcon = { Mobile: 'ti-device-mobile', Tablet: 'ti-device-tablet', Desktop: 'ti-device-desktop', Bot: 'ti-robot' }[v.device] || 'ti-device-desktop';
                    const diff  = (Date.now() - new Date(v.visitedAt)) / 1000;
                    const ago   = diff < 60 ? `${Math.floor(diff)}s ago` : diff < 3600 ? `${Math.floor(diff/60)}m ago` : `${Math.floor(diff/3600)}h ago`;
                    const flag  = v.countryCode ? String.fromCodePoint(...[...v.countryCode.toUpperCase()].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)) : '\uD83C\uDF10';
                    return (
                      <tr key={v._id} className="pv-row">
                        <td className="pv-td"><span className="visitor-ip">{v.ip}</span></td>
                        <td className="pv-td" style={{ fontSize: 12 }}>{flag} {v.country}</td>
                        <td className="pv-td">
                          <span className="visitor-device-badge">
                            <i className={`ti ${dIcon} me-1`} />{v.device}
                          </span>
                        </td>
                        <td className="pv-td pv-td--name" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{v.page}</td>
                        <td className="pv-td" style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{ago}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;