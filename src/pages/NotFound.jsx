import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" style={{ color: '#4f46e5', textDecoration: 'underline' }}>
        Return to the homepage
      </Link>
    </div>
  );
}

export default NotFound;
