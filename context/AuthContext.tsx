import { deleteAuthToken, User, validateToken } from '@/services/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (user: User, token: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            const [storedToken, storedUserData] = await Promise.all([
                AsyncStorage.getItem(AUTH_TOKEN_KEY),
                AsyncStorage.getItem(USER_DATA_KEY),
            ]);

            if (storedToken) {
                const result = await validateToken(storedToken);
                if (result.valid && result.user) {
                    setUser(result.user);
                    setToken(storedToken);
                } else {
                    // Token invalid or expired, clear storage
                    await clearStorage();
                }
            } else if (storedUserData) {
                // Fallback to stored user data if token validation fails
                await clearStorage();
            }
        } catch (error) {
            console.error('Failed to load session:', error);
            await clearStorage();
        } finally {
            setIsLoading(false);
        }
    };

    const clearStorage = async () => {
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
        setToken(null);
        setUser(null);
    };

    const login = async (userData: User, authToken: string) => {
        try {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            setToken(authToken);
            setUser(userData);
        } catch (error) {
            console.error('Failed to save session:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            if (token) {
                await deleteAuthToken(token);
            }
            await clearStorage();
        } catch (error) {
            console.error('Failed to logout:', error);
            await clearStorage();
        }
    };

    const updateUser = async (userData: User) => {
        try {
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            isAuthenticated: !!user && !!token,
            login,
            logout,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
