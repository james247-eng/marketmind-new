
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';


// Auth Pages
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import OAuthCallback from './components/OAuthCallback';

// App Pages
import WorkspaceSelector from './pages/app/WorkspaceSelector';
import Dashboard from './features/dashboard/Dashboard';
import WorkspaceList from './features/workspaces/WorkspaceList';
import CreateWorkspace from './features/workspaces/CreateWorkspace';
import EditWorkspace from './features/workspaces/EditWorkspace';
import ContentGenerator from './features/content/ContentGenerator';
import ContentHistory from './features/content/ContentHistory';
import PostScheduler from './features/calendar/PostScheduler';
import SocialAccounts from './features/social-connections/SocialAccounts';
import Settings from './features/settings/Settings';
import BrandOnboarding from './features/brand/BrandOnboarding';
import BrandProfile from './features/brand/BrandProfile';

// Public Pages
import LandingPage from './pages/marketing/LandingPage';
import FeaturesPage from './pages/marketing/Features';
import PricingPage from './pages/marketing/Pricing';
import BlogPage from './pages/marketing/Blog';
import PrivacyPage from './pages/legal/Privacy';
import TermsPage from './pages/legal/Terms';
import DataDeletion from './pages/legal/DataDeletion';
import NotFound from './pages/NotFound';
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
          <Route path="/data-deletion" element={<DataDeletion />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* OAuth Callback Routes for Social Media Platforms */}
          <Route path="/auth/:platform/callback" element={<OAuthCallback />} />

          {/* Compatibility Route */}
          <Route 
            path="/accounts" 
            element={
              <ProtectedRoute>
                <SocialAccounts />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={<Navigate to="/app" replace />} 
          />

          <Route 
            path="/app" 
            element={
              <ProtectedRoute>
                <WorkspaceSelector />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/workspaces" 
            element={
              <ProtectedRoute>
                <WorkspaceList />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/workspaces/create" 
            element={
              <ProtectedRoute>
                <CreateWorkspace />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/workspaces/:id/edit" 
            element={
              <ProtectedRoute>
                <EditWorkspace />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/:workspaceId/content" 
            element={
              <ProtectedRoute>
                <ContentGenerator />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/:workspaceId/content/history" 
            element={
              <ProtectedRoute>
                <ContentHistory />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/:workspaceId/calendar" 
            element={
              <ProtectedRoute>
                <PostScheduler />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/:workspaceId/social" 
            element={
              <ProtectedRoute>
                <SocialAccounts />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/:workspaceId/brand/setup" 
            element={
              <ProtectedRoute>
                <BrandOnboarding />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/:workspaceId/brand" 
            element={
              <ProtectedRoute>
                <BrandProfile />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/:workspaceId/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/app/:workspaceId/analytics" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
