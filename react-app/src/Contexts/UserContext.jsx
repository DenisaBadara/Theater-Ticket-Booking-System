// src/Contexts/UserContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        token: localStorage.getItem('token') || null,
        Username: localStorage.getItem('username') || null,
    });

    useEffect(() => {
        if (user.token) {
            localStorage.setItem('token', user.token);
            localStorage.setItem('username', user.Username);
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
        }
    }, [user.token, user.Username]);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};
