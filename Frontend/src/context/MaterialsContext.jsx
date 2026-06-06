import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from './AuthContext';

const MaterialsContext = createContext();

export const MaterialsProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    if (!isAuthenticated) return;
    try {
      let res;
      if (user?.role === 'admin' || user?.role === 'manager') {
        res = await api.get('/material-requests');
      } else if (user?.role === 'technician') {
        res = await api.get('/material-requests/my');
      } else {
        return;
      }
      setRequests(res.data.map(req => ({
        id: `REQ-${req.id}`,
        backendId: req.id,
        name: req.name,
        qty: req.quantity,
        priority: req.priority || 'Normal',
        status: req.status || 'Pending',
        date: new Date(req.createdAt).toLocaleDateString()
      })));
    } catch (e) {
      console.error('Failed to fetch material requests', e);
    }
  };

  const fetchMaterials = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/materials');
      setMaterials(res.data);
    } catch (e) {
      console.error('Failed to fetch materials', e);
    }
  };

  const fetchSuppliers = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/materials/suppliers');
      setSuppliers(res.data);
    } catch (e) {
      console.error('Failed to fetch suppliers', e);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchMaterials();
    fetchSuppliers();
  }, [isAuthenticated, user?.role]);

  // API Search (Integrated with real backend)
  const searchSupplierAPI = async (query) => {
    if (!query) return [];
    try {
      // Hits the pricing endpoint which compares Lowe's/HD
      const res = await api.get(`/materials/pricing?q=${query}`);
      return res.data;
    } catch (e) {
      return [];
    }
  };

  const syncAllPrices = async () => {
    try {
      toast.loading('Syncing latest prices from suppliers...');
      await fetchMaterials();
      toast.success('Prices synced successfully');
    } catch (e) {
      toast.error('Failed to sync prices');
    }
  };

  const updateStock = async (id, delta) => {
    // In a real app, this would be a PATCH to update quantity
    toast.error('Stock updates should be done via purchase orders/requests');
  };

  const requestPart = async (request) => {
    try {
      await api.post('/material-requests', {
        name: request.name,
        qty: request.qty,
        sku: request.sku || 'N/A'
      });
      fetchRequests();
      toast.success('Part request submitted successfully');
    } catch (error) {
      toast.error('Failed to submit material request');
    }
  };

  const updateRequestStatus = async (id, newStatus) => {
    try {
      const req = requests.find(r => r.id === id);
      if (!req) return;
      await api.patch(`/material-requests/${req.backendId}/status`, { status: newStatus });
      fetchRequests();
      toast.success(`Request status updated to ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update request status');
    }
  };

  return (
    <MaterialsContext.Provider value={{
      materials,
      suppliers,
      requests,
      searchSupplierAPI,
      syncAllPrices,
      updateStock,
      requestPart,
      updateRequestStatus
    }}>
      {children}
    </MaterialsContext.Provider>
  );
};

export const useMaterials = () => {
  const context = useContext(MaterialsContext);
  if (!context) {
    throw new Error('useMaterials must be used within a MaterialsProvider');
  }
  return context;
};
