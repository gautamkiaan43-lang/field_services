import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from './AuthContext'

const ReviewsContext = createContext()

export const ReviewsProvider = ({ children }) => {
  const [reviews, setReviews] = useState([])
  const { isAuthenticated, user } = useAuth()

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews')
      setReviews(res.data)
    } catch (error) {
      console.error('Failed to fetch reviews', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchReviews()
    }
  }, [isAuthenticated, user])

  const addReview = async (reviewData) => {
    try {
      const res = await api.post('/reviews', reviewData)
      setReviews(prev => [res.data, ...prev])
      toast.success('Thank you for your feedback!')
      return res.data
    } catch (error) {
      toast.error('Failed to submit review')
      throw error
    }
  }

  return (
    <ReviewsContext.Provider value={{ reviews, addReview, fetchReviews }}>
      {children}
    </ReviewsContext.Provider>
  )
}

export const useReviews = () => useContext(ReviewsContext)
