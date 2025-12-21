import { useAppSelector } from './redux';
import { selectUser, selectAuthStatus } from '../features/auth/authSelectors';

export const useAuth = () => {
  const user = useAppSelector(selectUser);
  const authStatus = useAppSelector(selectAuthStatus);
  
  return {
    user,
    isAuthenticated: authStatus === 'authenticated',
    authStatus,
  };
};
