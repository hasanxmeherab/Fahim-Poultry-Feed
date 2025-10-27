import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from '../firebase'; // Import auth from your firebase.js

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // State for role
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => { // Make async
            setUser(currentUser);
            if (currentUser) {
                try {
                    // Force refresh to get latest claims after potential backend update
                    const idTokenResult = await currentUser.getIdTokenResult(true);
                    // Assuming your custom claim is named 'role'
                    setUserRole(idTokenResult.claims.role || null);
                    console.log("User Claims:", idTokenResult.claims); // For debugging
                } catch (error) {
                    console.error("Error fetching user token/claims:", error);
                    setUserRole(null); // Reset role on error
                }
            } else {
                setUserRole(null); // Clear role on logout
            }
            setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Function to manually refresh user data including claims (optional)
    const refreshUserData = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh
                setUserRole(idTokenResult.claims.role || null);
                // Force a re-render by updating the user state slightly if needed,
                // though usually onAuthStateChanged should trigger eventually.
                // setUser({...currentUser}); // Example if direct state update needed
            } catch (error) {
                console.error("Error refreshing user data:", error);
            }
        }
    };


    const login = (token) => {
        // Storing token might not be strictly necessary if relying solely on onAuthStateChanged
        // localStorage.setItem('firebaseIdToken', token);
        // onAuthStateChanged will handle setting the user and role
    };

    const logout = async () => {
        await signOut(auth);
        // localStorage.removeItem('firebaseIdToken'); // Remove if you were setting it
        setUser(null);
        setUserRole(null); // Ensure role is cleared
    };

    const value = {
        user,
        userRole, // Expose role
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUserData // Expose refresh function
    };

    // Render children only when loading is complete
    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};