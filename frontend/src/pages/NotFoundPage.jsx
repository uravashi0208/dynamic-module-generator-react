import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'var(--gray-50)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div className="text-center animate-slide-up" style={{ maxWidth:400 }}>
        <div style={{ fontSize:'6rem', fontWeight:900, color:'#e5e5e5', lineHeight:1, userSelect:'none' }}>404</div>
        <h1 className="fs-4 fw-bold mb-2">Page Not Found</h1>
        <p className="text-muted small mb-4">The page you're looking for doesn't exist or has been moved.</p>
        <div className="d-flex gap-3 justify-content-center">
          <button onClick={() => navigate(-1)} className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <i className="ti ti-arrow-left" /> Go Back
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary d-flex align-items-center gap-2">
            <i className="ti ti-home" /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
