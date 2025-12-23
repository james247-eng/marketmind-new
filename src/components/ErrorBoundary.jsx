// ErrorBoundary.jsx
// Global error boundary to catch React errors

import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h1>Oops! Something went wrong</h1>
            <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="error-details">
                <h3>Error Details (Development Only)</h3>
                <pre>{this.state.error?.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </div>
            )}

            <button 
              className="error-button"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            
            <button 
              className="error-button secondary"
              onClick={() => window.location.href = '/'}
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
