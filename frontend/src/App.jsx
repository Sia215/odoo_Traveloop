import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { UserProvider } from './context/UserContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateTrip from './pages/CreateTrip'
import ItineraryBuilder from './pages/ItineraryBuilder'
import Profile from './pages/Profile'
import MyTrips from './pages/MyTrips'
import Community from './pages/Community'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UserProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-trip" element={<ProtectedRoute><CreateTrip /></ProtectedRoute>} />
          <Route path="/itinerary-builder/:tripId" element={<ProtectedRoute><ItineraryBuilder /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  )
}
