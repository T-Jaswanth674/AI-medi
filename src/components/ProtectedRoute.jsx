import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

const ROLE_ROUTES = {
    admin: '/admin',
    doctor: '/doctor',
    nurse: '/nurse',
    patient: '/patient',
};

const LoadingScreen = () => (
    <div className="min-h-screen bg-hospital-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <Activity className="w-8 h-8 text-brand-400 animate-spin" />
            <p className="text-gray-400 text-sm">Loading...</p>
        </div>
    </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userProfile, loading } = useAuth();
    const [authWait, setAuthWait] = React.useState(true);

    // Give it a small timeout to make sure auth state fully settles before showing errors
    React.useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setAuthWait(false), 500);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    // Auth state still initializing
    if (loading || authWait) return <LoadingScreen />;

    // Not authenticated or profile fetch failed
    if (!currentUser || !userProfile) return <Navigate to="/login" replace />;

    // Authenticated but wrong role
    if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
        const redirectTo = ROLE_ROUTES[userProfile.role] || '/login';
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default ProtectedRoute;
