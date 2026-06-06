import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const FinancingContext = createContext();

export const FinancingProvider = ({ children }) => {
  const [applications, setApplications] = useState([]);

  const { isAuthenticated, role } = useAuth();
  
  const fetchApplications = async () => {
    if (!isAuthenticated) return;
    // Only Admin and Manager are authorized to fetch all applications
    if (role?.toUpperCase() !== 'ADMIN' && role?.toUpperCase() !== 'MANAGER') return;

    try {
      const res = await api.get('/financing');
      setApplications(res.data.map(app => ({
        ...app,
        id: `FIN-${app.id.toString().padStart(3, '0')}`,
        customerName: app.customer?.name || 'Unknown',
        date: new Date(app.createdAt).toLocaleDateString()
      })));
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Failed to fetch financing applications:', error);
      }
    }
  };

  const [providers, setProviders] = useState([]);

  const fetchProviders = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/financing/providers');
      setProviders(res.data);
    } catch (e) {
      if (e.response?.status !== 401) {
        console.error('Failed to fetch financing providers:', e);
      }
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchProviders();
  }, [isAuthenticated, role]);
  const applyForFinancing = async (data) => {
    try {
      const res = await api.post('/financing', data);
      fetchApplications();
      return res.data;
    } catch (error) {
      toast.error('Failed to submit application');
      throw error;
    }
  };

  const updateApplicationStatus = async (id, status) => {
    try {
      const realId = id.replace('FIN-', '');
      await api.patch(`/financing/${realId}/status`, { status });
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <FinancingContext.Provider value={{
      applications,
      providers,
      applyForFinancing,
      updateApplicationStatus
    }}>
      {children}
    </FinancingContext.Provider>
  );
};

export const useFinancing = () => {
  const context = useContext(FinancingContext);
  if (!context) {
    throw new Error('useFinancing must be used within a FinancingProvider');
  }
  return context;
};
