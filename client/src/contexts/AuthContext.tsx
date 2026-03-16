import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'RECEPTION' | 'SECTOR';
    sectorName?: string;
    sectorId?: string;
}

interface AuthContextData {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('@RecepcaoSesa:token');
        if (storedToken) {
            try {
                const decoded = jwtDecode<User & { exp: number }>(storedToken);
                
                // Check if token is already expired
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    console.warn('[Auth] Token expired on initialization');
                    logout();
                } else {
                    setToken(storedToken);
                    setUser(decoded);
                }
            } catch (e) {
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    // Global interceptor for fetch errors (401/403)
    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);

            if (response.status === 401 || response.status === 403) {
                // If we get an auth error, we might be expired or invalid
                console.error(`[Auth] interceptor: Caught ${response.status}. Forcing logout.`);
                
                // Only toast and logout if we were previously "authenticated"
                if (localStorage.getItem('@RecepcaoSesa:token')) {
                    toast.error('Sessão expirada. Por favor, faça login novamente.');
                    logout();
                }
            }

            return response;
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    const login = (newToken: string, userData: User) => {
        localStorage.setItem('@RecepcaoSesa:token', newToken);
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('@RecepcaoSesa:token');
        setToken(null);
        setUser(null);
    };

    if (isLoading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>;
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
