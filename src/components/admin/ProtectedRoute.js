// ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div  className="loader-container">
    <svg className="load" viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>
    </div>
  }

  return isAuthenticated ? children : <Navigate to="/admin-login" />;
};

export default ProtectedRoute;
