import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so only authenticated users with the required role can access it.
 * - If still loading auth state, shows a loading indicator.
 * - If not logged in, redirects to /.
 * - If logged in but wrong role, redirects to /.
 *
 * Usage:
 *   <ProtectedRoute roles={['Manager', 'SuperAdmin']}>
 *     <MyPage />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="page-loading">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
