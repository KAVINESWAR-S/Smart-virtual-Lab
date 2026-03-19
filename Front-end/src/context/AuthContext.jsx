import React, { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const { data } = await api.post(
                '/api/auth/login',
                { email, password },
                config
            );

            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            toast.success('Logged in');
            return data;
        } catch (error) {
            const msg = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(msg);
            throw msg;
        }
    };

    const register = async (name, email, password, role, department, year) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const { data } = await api.post(
                '/api/auth/register',
                { name, email, password, role, department, year },
                config
            );

            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            toast.success('Account created');
            return data;
        } catch (error) {
            const msg = error.response && error.response.data.message
                ? error.response.data.message
                : error.message;
            toast.error(msg);
            throw msg;
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
        toast('Logged out');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
