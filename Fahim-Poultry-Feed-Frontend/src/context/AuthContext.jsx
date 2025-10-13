import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from '../firebase'; // Import auth from your firebase.js

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // onAuthStateChanged is the recommended way to get the current user.
        // It sets up a listener that runs whenever the user's sign-in state changes.
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // The login function now just stores the token for the API interceptor to use immediately.
    // The onAuthStateChanged listener will handle setting the user state.
    const login = (token) => {
        localStorage.setItem('firebaseIdToken', token);
    };

    const logout = async () => {
        await signOut(auth); // Use Firebase's sign out method
        localStorage.removeItem('firebaseIdToken');
        setUser(null);
    };

    const value = {
        user,
        isAuthenticated: !!user, // True if user object exists, false if null
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};