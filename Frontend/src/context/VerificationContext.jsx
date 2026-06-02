import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from './AuthContext'

const VerificationContext = createContext()

export const VerificationProvider = ({ children }) => {
  const [requests, setRequests] = useState([])
  const { isAuthenticated, user } = useAuth()

  const fetchRequests = async () => {
    if (!isAuthenticated) return;
    try {
      const userRole = user?.role?.toLowerCase();
      if (userRole === 'admin' || userRole === 'manager') {
        const res = await api.get('/verification');
        setRequests(res.data);
      } else if (userRole === 'technician') {
        const res = await api.get('/verification/my');
        if (res.data && res.data.status !== 'NOT_SUBMITTED') {
          setRequests([res.data]);
        } else {
          setRequests([]);
        }
      }
    } catch (e) {
      if (e.response && e.response.status !== 404) {
        console.error('Failed to fetch verification status', e);
      }
    }
  }

  useEffect(() => {
    fetchRequests();
  }, [isAuthenticated, user?.role]);

  const urltoFile = (dataurl, filename, mimeType) => {
    return fetch(dataurl)
      .then(res => res.arrayBuffer())
      .then(buf => new File([buf], filename, { type: mimeType }));
  }

  const submitVerification = async (data) => {
    try {
      let idUrlString = data.idPhotoUrl;
      let selfieUrlString = data.selfieUrl;

      if (idUrlString && idUrlString.startsWith('data:')) {
        const file = await urltoFile(idUrlString, 'idphoto.png', 'image/png');
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        idUrlString = res.data.file.filename;
      }

      if (selfieUrlString && selfieUrlString.startsWith('data:')) {
        const file = await urltoFile(selfieUrlString, 'selfie.png', 'image/png');
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        selfieUrlString = res.data.file.filename;
      }

      await api.post('/verification', {
        idPhotoUrl: idUrlString,
        selfieUrl: selfieUrlString
      });

      fetchRequests();
      toast.success('Verification submitted for review')
    } catch (e) {
      toast.error('Failed to submit verification request')
      console.error(e)
    }
  }

  const approveRequest = async (requestId) => {
    try {
      await api.patch(`/verification/${requestId}/status`, { status: 'Approved' });
      fetchRequests();
      toast.success('Identity Verified successfully');
    } catch (e) {
      toast.error('Failed to approve request');
    }
  }

  const rejectRequest = async (requestId, reason) => {
    try {
      await api.patch(`/verification/${requestId}/status`, { status: 'Rejected', reason });
      fetchRequests();
      toast.error(`Verification rejected: ${reason}`);
    } catch (e) {
      toast.error('Failed to reject request');
    }
  }

  return (
    <VerificationContext.Provider value={{
      requests,
      submitVerification,
      approveRequest,
      rejectRequest
    }}>
      {children}
    </VerificationContext.Provider>
  )
}

export const useVerification = () => useContext(VerificationContext)
