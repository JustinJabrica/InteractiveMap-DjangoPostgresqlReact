import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Common Components
import Navbar from './components/common/Navbar';
import Dashboard from './components/common/Dashboard';
import ProtectedRoute from './components/common/ProtectedRoute';

// Profile Components
import Profile from './components/profile/Profile';

// Map Components
import MapList from './components/maps/MapList';
import MapCreate from './components/maps/MapCreate';
import MapView from './components/maps/MapView';
import MapEdit from './components/maps/MapEdit';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maps"
                element={
                  <ProtectedRoute>
                    <MapList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maps/new"
                element={
                  <ProtectedRoute>
                    <MapCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maps/:id"
                element={
                  <ProtectedRoute>
                    <MapView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maps/:id/edit"
                element={
                  <ProtectedRoute>
                    <MapEdit />
                  </ProtectedRoute>
                }
              />

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;