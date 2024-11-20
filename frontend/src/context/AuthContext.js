import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, logoutUser } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      const token = localStorage.getItem('token');
      console.log('Checking authentication, token exists:', !!token);
      
      if (token) {
        try {
          const response = await getCurrentUser();
          console.log('Current user data:', response);
          // Parse permissions if they're a string
          if (response && typeof response.permissions === 'string') {
            response.permissions = JSON.parse(response.permissions);
          }
          setUser({
            ...response,
            hasPermission: (permission) => {
              if (!response.permissions) return false;
              return response.permissions.includes(permission);
            }
          });
          setLoading(false);
        } catch (error) {
          console.error('Error loading user data:', error);
          
          // If we haven't exceeded max retries and it's a network error or 5xx error
          if (retryCount < MAX_RETRIES && 
              (error.message === 'Network Error' || 
               (error.response && error.response.status >= 500))) {
            console.log(`Retrying authentication (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return checkAuth(retryCount + 1);
          }
          
          // If we've exhausted retries or it's a different type of error (e.g., 401)
          await logout();
          setLoading(false);
        }
      } else {
        console.log('No token found, user is not authenticated');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    console.log('Logging in user:', userData);
    // Parse permissions if they're a string
    if (userData && typeof userData.permissions === 'string') {
      userData.permissions = JSON.parse(userData.permissions);
    }
    // Add hasPermission function to user object
    const userWithPermissions = {
      ...userData,
      hasPermission: (permission) => {
        if (!userData.permissions) return false;
        return userData.permissions.includes(permission);
      }
    };
    setUser(userWithPermissions);
    localStorage.setItem('token', userData.token);
  };

  const logout = async () => {
    console.log('Logging out user');
    try {
      await logoutUser();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
