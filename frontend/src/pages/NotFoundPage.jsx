import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <div className="text-center animate-slide-up" style={{ maxWidth: 400 }}>
        <div className="not-found__number">404</div>
        <h1 className="fs-4 fw-bold mb-2">Page Not Found</h1>
        <p className="text-muted small mb-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="d-flex gap-3 justify-content-center">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
          >
            <i className="ti ti-arrow-left" /> Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <i className="ti ti-home" /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
