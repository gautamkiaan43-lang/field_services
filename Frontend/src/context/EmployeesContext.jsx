import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useJobs } from './JobsContext';
const EmployeesContext = createContext();

export const EmployeesProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const { isAuthenticated, user } = useAuth();
  const jobsCtx = useJobs();

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      const mapped = res.data.map(emp => ({ ...emp, email: emp.user?.email || emp.email }));
      setEmployees(mapped);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchTimesheets = async () => {
    try {
      const res = await api.get('/employees/timesheets');
        setTimesheets(res.data.map(ts => ({
          id: ts.id,
          employeeId: ts.employeeId,
          name: ts.employee?.name || 'Unknown',
          date: ts.date.split('T')[0],
          clockIn: new Date(ts.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          clockOut: ts.clockOut ? new Date(ts.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Work in Progress',
          totalHours: ts.totalHours || '0.0',
          status: ts.status
        })));
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && ['admin', 'manager'].includes(user?.role)) {
      fetchEmployees();
      fetchTimesheets();
    }
  }, [isAuthenticated, user?.role]);

  const addEmployee = async (employee) => {
    try {
      const res = await api.post('/employees', employee);
      const newEmp = { ...res.data, email: res.data.user?.email || res.data.email || employee.email };
      setEmployees(prev => [newEmp, ...prev]);
      if (typeof jobsCtx?.fetchJobs === 'function') await jobsCtx.fetchJobs();
    } catch (error) {
      toast.error('Failed to add employee');
      throw error;
    }
  };

  const updateEmployee = async (id, updatedData) => {
    try {
      const res = await api.put(`/employees/${id}`, updatedData);
      const updatedEmp = { ...res.data, email: res.data.user?.email || res.data.email || updatedData.email };
      setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmp : emp));
      if (typeof jobsCtx?.fetchJobs === 'function') await jobsCtx.fetchJobs();
    } catch (error) {
      toast.error('Failed to update employee');
      throw error;
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await api.delete(`/employees/${id}`);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      if (typeof jobsCtx?.fetchJobs === 'function') await jobsCtx.fetchJobs();
    } catch (error) {
      toast.error('Failed to delete employee');
      throw error;
    }
  };

  const updateTimesheetStatus = async (id, newStatus) => {
    try {
      await api.patch(`/employees/timesheets/${id}/status`, { status: newStatus });
      setTimesheets(prev => prev.map(ts => 
        ts.id === id ? { ...ts, status: newStatus } : ts
      ));
      toast.success(`Timesheet ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error('Failed to update timesheet status');
    }
  };

  return (
    <EmployeesContext.Provider value={{ 
        employees, 
        timesheets, 
        addEmployee, 
        updateEmployee, 
        deleteEmployee,
        updateTimesheetStatus,
        fetchEmployees
    }}>
      {children}
    </EmployeesContext.Provider>
  );
};

export const useEmployees = () => {
  const context = useContext(EmployeesContext);
  if (!context) {
    throw new Error('useEmployees must be used within an EmployeesProvider');
  }
  return context;
};
