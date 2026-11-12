import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center loading-screen">
        <Loader2 className="spinner icon-primary" size={40} />
        <p className="loading-text">Loading application state...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If not authenticated, let App router show login/register view
    return null;
  }

  return children;
}
