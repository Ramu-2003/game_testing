import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { profileAPI } from '../utils/api';

const ProtectedRoute = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        // Validate token by making an API call
        await profileAPI.getProfile();
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        } else {
          // A temporary backend or network failure does not invalidate a saved token.
          setIsAuthenticated(Boolean(token));
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: 'monospace'
      }}>
        Validating...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
