import { useEffect, useState } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';

const ROUTES = [
  { path: '/', name: 'channel_directory' },
  { path: ':username', name: 'channel' },
  { path: 'feed', name: 'feed' },
  { path: 'following', name: 'following' },
  { path: 'settings', name: 'settings' },
  { path: 'manager', name: 'stream_manager' },
  {
    path: '/health',
    name: 'stream_health',
    children: [{ index: true }, { path: ':streamId' }]
  },
  { path: 'login', name: 'login' },
  { path: 'register', name: 'register' },
  { path: 'reset', name: 'reset' }
];

const useCurrentPage = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState();

  useEffect(() => {
    const [match] = matchRoutes(ROUTES, location) || [];

    if (match) setCurrentPage(match.route.name);
  }, [location]);

  return currentPage;
};

export default useCurrentPage;