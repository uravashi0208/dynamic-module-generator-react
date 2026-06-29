import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import usePageVisitStore from '../context/pageVisitStore';

// ── Sub-components ─────────────────────────────────────────────────────────────
const RateCell = ({ rate, up }) => (
  <span className={`pv-rate ${up ? 'pv-rate--up' : 'pv-rate--down'}`}>
    <i className={`ti ${up ? 'ti-arrow-up' : 'ti-arrow-down'} pv-rate-icon`} />
    {(rate || 0).toFixed(2)}%
  </span>
);

const TableRow = ({ page }) => (
  <tr className="pv-row">
    <td className="pv-td pv-td--name">
      <span className="fw-semibold d-block">{page.label || page.path}</span>
      {page.label && <span className="text-muted" style={{ fontSize: 11 }}>{page.path}</span>}
    </td>
    <td className="pv-td pv-td--num">{(page.views || 0).toLocaleString()}</td>
    <td className="pv-td pv-td--rate">
      <RateCell rate={page.bounceRate} up={page.bounceUp} />
    </td>
  </tr>
);

// ── Page component ─────────────────────────────────────────────────────────────
const PageVisitsPage = () => {
  const { visits, summary, total, isLoading, fetchVisits, fetchSummary } = usePageVisitStore();
  const navigate = useNavigate();
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState('views');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchSummary();
    fetchVisits({ sortBy: sortKey, sortOrder: sortDir, search });
  }, []);

  // Re-fetch on sort/search change
  useEffect(() => {
    fetchVisits({ sortBy: sortKey, sortOrder: sortDir, search });
  }, [sortKey, sortDir, search]);

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (col !== sortKey) return <i className="ti ti-selector sort-icon--idle ms-1" />;
    return <i className={`ti ${sortDir === 'asc' ? 'ti-chevron-up' : 'ti-chevron-down'} sort-icon--active ms-1`} />;
  };

  return (
    <div className="animate-slide-up">
      {/* ── Header ── */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button onClick={() => navigate('/dashboard')} className="pv-back-btn" title="Back to dashboard">
          <i className="ti ti-arrow-left" />
        </button>
        <div>
          <h1 className="fs-4 fw-bold mb-0">Page Visits</h1>
          <p className="text-muted small mb-0">Detailed analytics for all tracked pages</p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6">
          <div className="pv-summary-card">
            <div className="pv-summary-icon pv-summary-icon--blue">
              <i className="ti ti-eye" />
            </div>
            <div>
              <p className="pv-summary-label">Total Views</p>
              <h4 className="pv-summary-value">
                {summary ? summary.totalViews.toLocaleString() : '–'}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="pv-summary-card">
            <div className="pv-summary-icon pv-summary-icon--orange">
              <i className="ti ti-bounce-right" />
            </div>
            <div>
              <p className="pv-summary-label">Avg Bounce Rate</p>
              <h4 className="pv-summary-value">
                {summary ? `${summary.avgBounce}%` : '–'}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="card p-0 overflow-hidden">
        {/* toolbar */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
          <h6 className="fw-semibold mb-0 fs-13px d-flex align-items-center gap-2">
            <i className="ti ti-table text-primary" />
            All Pages
            <span className="badge rounded-pill text-bg-light border fs-10px">
              {total} pages
            </span>
          </h6>
          <div className="search-bar">
            <i className="ti ti-search search-bar__icon" />
            <input
              className="form-control form-control-sm search-bar__input"
              placeholder="Filter by path…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* table */}
        <div className="table-responsive">
          <table className="table data-table mb-0">
            <thead>
              <tr>
                <th className="pv-th sortable" onClick={() => handleSort('path')}>
                  PAGE NAME <SortIcon col="path" />
                </th>
                <th className="pv-th sortable" onClick={() => handleSort('views')}>
                  PAGE VIEWS <SortIcon col="views" />
                </th>
                <th className="pv-th sortable" onClick={() => handleSort('bounceRate')}>
                  BOUNCE RATE <SortIcon col="bounceRate" />
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="table-skeleton">
                    <td><div className="skeleton-cell" style={{ width: '60%' }} /></td>
                    <td><div className="skeleton-cell" style={{ width: '40%' }} /></td>
                    <td><div className="skeleton-cell" style={{ width: '50%' }} /></td>
                  </tr>
                ))
              ) : visits.length > 0 ? (
                visits.map((page) => <TableRow key={page._id} page={page} />)
              ) : (
                <tr>
                  <td colSpan={3}>
                    <div className="empty-state py-4">
                      <div className="empty-state__icon mx-auto">
                        <i className="ti ti-chart-bar text-primary" />
                      </div>
                      <p className="empty-state__title">
                        {search ? 'No pages match' : 'No page visit data yet'}
                      </p>
                      <p className="empty-state__sub">
                        {search ? 'Try a different search term' : 'Use POST /api/page-visits/track to start recording'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        {visits.length > 0 && (
          <div className="pagination-wrap">
            <p className="pagination-text text-muted mb-0">
              Showing <strong>{visits.length}</strong> of <strong>{total}</strong> pages
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageVisitsPage;