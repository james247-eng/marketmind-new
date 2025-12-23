
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';

// Dashboard Pages
import Dashboard from './features/dashboard/Dashboard';
import BusinessList from './features/business/BusinessList';
import CreateBusiness from './features/business/CreateBusiness';
import ContentGenerator from './features/content/ContentGenerator';
import ContentHistory from './features/content/ContentHistory';
import PostScheduler from './features/scheduling/PostScheduler';
import SocialAccounts from './features/social/SocialAccounts';
import Settings from './features/settings/Settings';

// Public Pages
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/Features';
import PricingPage from './pages/Pricing';
import BlogPage from './pages/Blog';
import PrivacyPage from './pages/Privacy';
import TermsPage from './pages/Terms';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Dashboard Routes */}
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

          {/* 404 - Redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;