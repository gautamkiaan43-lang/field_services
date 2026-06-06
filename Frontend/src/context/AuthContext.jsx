import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'

const AuthContext = createContext({
  user: null,
  role: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  })
  const [role, setRole] = useState(localStorage.getItem('userRole') || null)
  const navigate = useNavigate()

  useEffect(() => {
    const verifyToken = async () => {
      if (localStorage.getItem('token')) {
        try {
          const res = await api.get('/auth/me');
          const normalizedRole = res.data.role.toLowerCase();
          const normalizedUser = { ...res.data, role: normalizedRole };
          setUser(normalizedUser);
          setRole(normalizedRole);
          localStorage.setItem('userRole', normalizedRole);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
        } catch (error) {
          logout();
        }
      }
    };
    verifyToken();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      const { token, user: userData } = response.data
      const normalizedRole = userData.role.toLowerCase()
      const normalizedUser = { ...userData, role: normalizedRole }
      
      localStorage.setItem('token', token)
      localStorage.setItem('userRole', normalizedRole)
      localStorage.setItem('user', JSON.stringify(normalizedUser))
      
      setUser(normalizedUser)
      setRole(normalizedRole)
      
      toast.success(`Welcome back, ${normalizedUser.name || normalizedUser.email}!`)
      if (normalizedRole === 'manager') {
        navigate('/dashboard/manager')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error;
      const displayMsg = typeof errorMsg === 'object' ? errorMsg.message || JSON.stringify(errorMsg) : errorMsg || 'Invalid credentials';
      toast.error(displayMsg);
    }
  }

  const logout = () => {
    setUser(null)
    setRole(null)
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isAuthenticated: !!role }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    return {
      user: null,
      role: null,
      isAuthenticated: false,
      login: () => {},
      logout: () => {}
    }
  }
  return context
}
