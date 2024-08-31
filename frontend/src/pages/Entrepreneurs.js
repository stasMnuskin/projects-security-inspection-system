import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './Login';
import Dashboard from './Dashboard';
import Inspections from './Inspections';
import Sites from './Sites';
import Entrepreneurs from './Entrepreneurs';
import Navigation from '../components/Navigation';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? (
    <>
      <Navigation />
      {children}
    </>
  ) : (
    <Navigate to="/login" />
  );
}

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/inspections" 
            element={
              <PrivateRoute>
                <Inspections />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/sites" 
            element={
              <PrivateRoute>
                <Sites />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/entrepreneurs" 
            element={
              <PrivateRoute>
                <Entrepreneurs />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;