import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

const GuestRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
