import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/ui/LoadingScreen";
import AccessDenied from "./AccessDenied";

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <AccessDenied allowedRoles={allowedRoles} />;
    }

    return children;
};

export default RoleBasedRoute;