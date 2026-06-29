import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';

const useVisitorTrack = () => {
  const location = useLocation();
  const lastPage = useRef('');

  useEffect(() => {
    const page = location.pathname;
    if (page === lastPage.current) return;
    lastPage.current = page;

    api.post('/visitors/track', {
      page,
      referrer: document.referrer || '',
    }).catch(() => {});
  }, [location.pathname]);
};

export default useVisitorTrack;