import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getDesignatedRoute } from '../../lib/auth-helpers.ts';

export const PortalDispatcher: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role) {
      navigate(getDesignatedRoute(user.role), { replace: true });
    } else {
      navigate('/login', { replace: true, state: { from: { pathname: '/portal' } } });
    }
  }, [navigate]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
    </div>
  );
};
