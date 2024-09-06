import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './SecurityDashboard.css';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [faults, setFaults] = useState([]);

  useEffect(() => {
    const fetchFaults = async () => {
      try {
        const response = await api.getFaults();
        setFaults(response.data);
      } catch (error) {
        console.error('Error fetching faults:', error);
      }
    };

    fetchFaults();
  }, []);

  const handleReportFault = () => {
    navigate('/report-fault');
  };

  return (
    <div className="security-dashboard">
      <h1>Security Dashboard</h1>
      <table>
        <thead>
          <tr>
            <th>Site</th>
            <th>Severity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {faults.map((fault) => (
            <tr key={fault.id}>
              <td>{fault.siteName || 'N/A'}</td>
              <td>{fault.severity || 'N/A'}</td>
              <td>{fault.status || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleReportFault}>Report Fault</button>
    </div>
  );
};

export default SecurityDashboard;