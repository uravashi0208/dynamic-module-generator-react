import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useVisitorStore from '../context/visitorStore';
import api from '../utils/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const deviceIcon = (d) => ({ Mobile: 'ti-device-mobile', Tablet: 'ti-device-tablet', Desktop: 'ti-device-desktop', Bot: 'ti-robot' }[d] || 'ti-device-desktop');
const browserIcon = (b = '') => { const l = b.toLowerCase(); if (l.includes('chrome')) return 'ti-brand-chrome'; if (l.includes('firefox')) return 'ti-brand-firefox'; if (l.includes('safari')) return 'ti-brand-safari'; return 'ti-browser'; };
const flag = (code) => code ? String.fromCodePoint(...[...code.toUpperCase()].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)) : '🌐';
const timeAgo = (date) => { const d = (Date.now() - new Date(date)) / 1000; if (d < 60) return `${Math.floor(d)}s ago`; if (d < 3600) return `${Math.floor(d / 60)}m ago`; if (d < 86400) return `${Math.floor(d / 3600)}h ago`; return `${Math.floor(d / 86400)}d ago`; };
const fmtDate = (d) => new Date(d).toLocaleString();

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="col-sm-6 col-xl-3">
    <div className="visitor-stat-card">
      <div className={`visitor-stat-icon visitor-stat-icon--${color}`}><i className={`ti ${icon}`} /></div>
      <div>
        <p className="visitor-stat-label">{label}</p>
        <h4 className="visitor-stat-value">{value ?? '–'}</h4>
        {sub && <p style={{ fontSize: 11, color: 'var(--gray-400)', margin: 0 }}>{sub}</p>}
      </div>
    </div>
  </div>
);

// ── Pages drawer (slide-over) ─────────────────────────────────────────────────
const PagesDrawer = ({ visitor, onClose }) => {
  const [pages, setPages] = useState(null);

  useEffect(() => {
    api.get(`/visitors/${visitor._id}/pages`)
      .then(({ data }) => setPages(data.data.pages))
      .catch(() => setPages([]));
  }, [visitor._id]);

  return (
    <div className="vd-overlay" onClick={onClose}>
      <div className="vd-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="vd-drawer-header">
          <div>
            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <span className="visitor-ip">{visitor.ip}</span>
              <span className="badge rounded-pill" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 11 }}>
                {visitor.visitCount} visit{visitor.visitCount !== 1 ? 's' : ''}
              </span>
            </h6>
            <p className="text-muted mb-0" style={{ fontSize: 12 }}>
              {flag(visitor.countryCode)} {visitor.city !== 'Unknown' ? `${visitor.city}, ` : ''}{visitor.country}
              &nbsp;·&nbsp;
              <i className={`ti ${deviceIcon(visitor.device)} me-1`} />{visitor.device} · {visitor.browser}
            </p>
          </div>
          <button className="vd-close-btn" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div className="vd-meta-row">
          <span><i className="ti ti-clock-play me-1 text-muted" />First: {fmtDate(visitor.firstSeenAt)}</span>
          <span><i className="ti ti-clock me-1 text-muted" />Last: {fmtDate(visitor.lastSeenAt)}</span>
        </div>

        <h6 className="fw-semibold fs-13px px-4 pt-3 pb-1 mb-0 border-top">Page History</h6>
        <div className="vd-pages-list">
          {pages === null ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="vd-page-row">
                <div className="skeleton-cell" style={{ width: '60%', height: 12, borderRadius: 4 }} />
                <div className="skeleton-cell" style={{ width: '25%', height: 10, borderRadius: 4 }} />
              </div>
            ))
          ) : pages.length === 0 ? (
            <p className="text-muted text-center py-3" style={{ fontSize: 13 }}>No page history found</p>
          ) : pages.map((p, i) => (
            <div key={i} className="vd-page-row">
              <div className="vd-page-path">
                <i className="ti ti-file-description me-2 text-muted" style={{ fontSize: 13 }} />
                {p.page}
              </div>
              <div className="vd-page-time">{timeAgo(p.visitedAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const VisitorsPage = () => {
  const { stats, visitors, total, isLoading, fetchStats, fetchVisitors } = useVisitorStore();
  const navigate = useNavigate();
  const [search,       setSearch]       = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [page,         setPage]         = useState(1);
  const [selected,     setSelected]     = useState(null);
  const LIMIT = 15;

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchVisitors({ page, limit: LIMIT, search, device: filterDevice }); }, [page, search, filterDevice]);

  const totalPages    = Math.ceil(total / LIMIT);
  const deviceTotal   = stats?.byDevice?.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div className="animate-slide-up">
      {selected && <PagesDrawer visitor={selected} onClose={() => setSelected(null)} />}

      {/* ── Header ── */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button onClick={() => navigate('/dashboard')} className="pv-back-btn"><i className="ti ti-arrow-left" /></button>
        <div>
          <h1 className="fs-4 fw-bold mb-0">Visitors</h1>
          <p className="text-muted small mb-0">Each row = one unique IP · click a row to see full page history</p>
        </div>
        <button
          className="btn btn-sm ms-auto"
          style={{ background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-md)' }}
          onClick={() => { fetchStats(); fetchVisitors({ page, limit: LIMIT, search, device: filterDevice }); }}
        >
          <i className="ti ti-refresh me-1" /> Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="row g-3 mb-4">
        <StatCard icon="ti-users"         label="Unique Visitors" value={stats?.total?.toLocaleString()}      sub={`${stats?.totalHits?.toLocaleString() || 0} total hits`} color="blue"   />
        <StatCard icon="ti-calendar-today" label="New Today"      value={stats?.today?.toLocaleString()}      color="green"  />
        <StatCard icon="ti-calendar-week"  label="New This Week"  value={stats?.thisWeek?.toLocaleString()}   color="orange" />
        <StatCard icon="ti-calendar"       label="New This Month" value={stats?.thisMonth?.toLocaleString()}  color="purple" />
      </div>

      {/* ── Charts row ── */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card h-100">
            <h6 className="fw-semibold fs-13px mb-3 d-flex align-items-center gap-2"><i className="ti ti-world text-primary" /> Top Countries</h6>
            {stats?.byCountry?.length > 0 ? (
              <div className="visitor-country-list">
                {stats.byCountry.map((c) => (
                  <div key={c.country} className="visitor-country-row">
                    <span className="visitor-country-flag">{flag(c.countryCode)}</span>
                    <span className="visitor-country-name flex-grow-1">{c.country}</span>
                    <div className="visitor-country-bar-wrap">
                      <div className="visitor-country-bar" style={{ width: `${Math.round((c.count / stats.byCountry[0].count) * 100)}%` }} />
                    </div>
                    <span className="visitor-country-count">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted small text-center py-3">No data yet</p>}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <h6 className="fw-semibold fs-13px mb-3 d-flex align-items-center gap-2"><i className="ti ti-device-desktop text-primary" /> Devices</h6>
            <div className="visitor-device-list">
              {(stats?.byDevice || []).map((d) => (
                <div key={d.device} className="visitor-device-row">
                  <div className="visitor-device-icon"><i className={`ti ${deviceIcon(d.device)}`} /></div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-semibold" style={{ fontSize: 13 }}>{d.device}</span>
                      <span className="text-muted" style={{ fontSize: 12 }}>{Math.round((d.count / deviceTotal) * 100)}% · {d.count}</span>
                    </div>
                    <div className="visitor-progress-track">
                      <div className="visitor-progress-fill" style={{ width: `${Math.round((d.count / deviceTotal) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {!stats?.byDevice?.length && <p className="text-muted small text-center py-3">No data yet</p>}
            </div>
            <h6 className="fw-semibold fs-13px mt-4 mb-2 d-flex align-items-center gap-2"><i className="ti ti-browser text-primary" /> Browsers</h6>
            <div className="d-flex flex-wrap gap-2">
              {(stats?.byBrowser || []).map((b) => (
                <span key={b.browser} className="visitor-browser-badge">
                  <i className={`ti ${browserIcon(b.browser)} me-1`} />{b.browser} <strong>{b.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Visitors table ── */}
      <div className="card p-0 overflow-hidden">
        <div className="d-flex flex-wrap align-items-center gap-2 px-4 py-3 border-bottom">
          <h6 className="fw-semibold mb-0 fs-13px d-flex align-items-center gap-2 me-auto">
            <i className="ti ti-list text-primary" /> Unique IPs
            <span className="badge rounded-pill text-bg-light border fs-10px">{total}</span>
          </h6>
          <select className="form-select form-select-sm" style={{ width: 130 }} value={filterDevice} onChange={(e) => { setFilterDevice(e.target.value); setPage(1); }}>
            <option value="">All Devices</option>
            <option value="Desktop">Desktop</option>
            <option value="Mobile">Mobile</option>
            <option value="Tablet">Tablet</option>
            <option value="Bot">Bot</option>
          </select>
          <div className="search-bar">
            <i className="ti ti-search search-bar__icon" />
            <input className="form-control form-control-sm search-bar__input" placeholder="Search IP, country…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table data-table mb-0">
            <thead>
              <tr>
                <th className="pv-th">IP ADDRESS</th>
                <th className="pv-th">LOCATION</th>
                <th className="pv-th">DEVICE / BROWSER</th>
                <th className="pv-th">OS</th>
                <th className="pv-th" style={{ textAlign: 'center' }}>VISITS</th>
                <th className="pv-th">FIRST SEEN</th>
                <th className="pv-th">LAST SEEN</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}><div className="skeleton-cell" style={{ width: `${50 + j * 6}%` }} /></td>
                  ))}</tr>
                ))
              ) : visitors.length > 0 ? (
                visitors.map((v) => (
                  <tr
                    key={v._id}
                    className="pv-row visitor-clickable-row"
                    onClick={() => setSelected(v)}
                    title="Click to see page history"
                  >
                    <td className="pv-td"><span className="visitor-ip">{v.ip}</span></td>
                    <td className="pv-td" style={{ fontSize: 12 }}>
                      <span className="me-1">{flag(v.countryCode)}</span>
                      {v.city !== 'Unknown' ? `${v.city}, ` : ''}{v.country}
                    </td>
                    <td className="pv-td">
                      <span className="visitor-device-badge">
                        <i className={`ti ${deviceIcon(v.device)} me-1`} />{v.device}
                      </span>
                      <span className="text-muted ms-2" style={{ fontSize: 12 }}>
                        <i className={`ti ${browserIcon(v.browser)} me-1`} />{v.browser}
                      </span>
                    </td>
                    <td className="pv-td" style={{ fontSize: 12, color: 'var(--gray-500)' }}>{v.os}</td>
                    <td className="pv-td" style={{ textAlign: 'center' }}>
                      <span className="visit-count-badge">{v.visitCount}</span>
                    </td>
                    <td className="pv-td" style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{timeAgo(v.firstSeenAt)}</td>
                    <td className="pv-td" style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{timeAgo(v.lastSeenAt)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7}>
                  <div className="empty-state py-5">
                    <div className="empty-state__icon mx-auto"><i className="ti ti-user-search text-primary" /></div>
                    <p className="empty-state__title">No visitors yet</p>
                    <p className="empty-state__sub">Visitors appear as soon as someone opens your site</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-wrap d-flex align-items-center justify-content-between">
            <p className="pagination-text text-muted mb-0">Page <strong>{page}</strong> of <strong>{totalPages}</strong> · {total} unique IPs</p>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><i className="ti ti-chevron-left" /></button>
              <button className="btn btn-sm btn-light" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><i className="ti ti-chevron-right" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorsPage;