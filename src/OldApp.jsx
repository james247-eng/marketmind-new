import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import Dashboard from './features/dashboard/Dashboard';
import BusinessList from './features/business/BusinessList';
import CreateBusiness from './features/business/CreateBusiness';
import ContentGenerator from './features/content/ContentGenerator';
import ContentHistory from './features/content/ContentHistory';
import PostScheduler from './features/scheduling/PostScheduler';
import SocialAccounts from './features/social/SocialAccounts';
import Settings from './features/settings/Settings';
import Pricing from './features/pricing/Pricing';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pricing" element={<Pricing />} />

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
              path="/businesses" 
              element={
                <ProtectedRoute>
                  <BusinessList />
                </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/businesses/create" 
            element={
              <ProtectedRoute>
                <CreateBusiness />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/generate" 
            element={
              <ProtectedRoute>
                <ContentGenerator />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <ContentHistory />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/schedule" 
            element={
              <ProtectedRoute>
                <PostScheduler />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/accounts" 
            element={
              <ProtectedRoute>
                <SocialAccounts />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* 404 - Redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}


export default App;

