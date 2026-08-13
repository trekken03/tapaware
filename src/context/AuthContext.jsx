import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Rehydrate the session from the httpOnly auth cookie on mount.
    useEffect(() => {
        (async () => {
            try {
                const res = await API.get('/auth/me');
                setUser(res.data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const updateUser = (partial) => {
        setUser((prev) => (prev ? { ...prev, ...partial } : prev));
    };

    const logout = async () => {
        try {
            await API.post('/auth/logout');
        } catch {
            // best-effort — clear local state regardless
        }
        setUser(null);
    };

    const isAuthenticated = !!user;

    const hasRole = (requiredRole) => {
        return user && user.role === requiredRole;
    };

    const hasAnyRole = (...requiredRoles) => {
        return user && requiredRoles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            login,
            logout,
            updateUser,
            hasRole,
            hasAnyRole
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
