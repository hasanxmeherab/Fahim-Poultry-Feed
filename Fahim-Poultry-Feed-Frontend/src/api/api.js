import axios from 'axios';
import { auth } from '../firebase'; // Assuming firebase.js is in the src directory

// Create a new instance of axios
const api = axios.create({
    // --- IMPROVEMENT: Use environment variable for baseURL ---
    // Reads from VITE_API_BASE_URL defined in your .env file (or deployment environment)
    // Falls back to localhost if the variable is not set (useful for local dev)
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    // --- END IMPROVEMENT ---
});

// Axios request interceptor to add the Firebase ID token
api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            try {
                // getIdToken(true) forces a refresh if the token is near expiration
                const token = await user.getIdToken(true);
                config.headers['Authorization'] = `Bearer ${token}`;
            } catch (error) {
                console.error("Error getting Firebase ID token:", error);
                // Optional: Handle token refresh errors (e.g., trigger logout)
            }
        }
        return config;
    },
    (error) => {
        // Handle request errors (e.g., network issues)
        console.error("Axios request error:", error);
        return Promise.reject(error);
    }
);

// Optional: Add response interceptor for handling common errors (like 401/403)
api.interceptors.response.use(
    (response) => response, // Directly return successful responses
    (error) => {
        console.error("Axios response error:", error.response || error.message);
        // Example: Handle unauthorized errors globally
        // if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        //   // Trigger logout or redirect to login
        //   console.error("Unauthorized access detected. Logging out.");
        //   // Potentially call logout function from AuthContext here
        // }
        return Promise.reject(error); // Reject the promise so component catch blocks work
    }
);


export default api;
